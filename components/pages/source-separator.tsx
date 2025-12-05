"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import JSZip from "jszip"
import {
  Upload,
  Download,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react"
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload"

// Helper function to safely check if a value is a File instance
// This prevents "Right-hand side of 'instanceof' is not callable" errors
// when File is not available or not callable in certain contexts (e.g., SSR, bundling)
const isFile = (value: unknown): value is File => {
  if (typeof value !== "object" || value === null) {
    return false
  }
  // Check if File constructor exists and is callable before using instanceof
  if (typeof File === "undefined" || typeof File !== "function") {
    return false
  }
  try {
    return value instanceof File
  } catch {
    // Fallback: check using constructor name if instanceof fails
    return value.constructor?.name === "File"
  }
}

interface ProcessedFile {
  id: string
  name: string
  originalContent: string
  header: string
  plainText: string
  html: string
  size: number
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  keepHeader: boolean
  keepPlainText: boolean
  keepHtml: boolean
  selected: boolean
}

type ParsedHeaders = Record<string, string>

interface EmailSection {
  headers: ParsedHeaders
  body: string
}

const normalizeEmailContent = (value: string): string => value.replace(/\r\n?/g, "\n")

const parseHeaders = (rawHeaders: string[]): ParsedHeaders => {
  const headerMap: ParsedHeaders = {}
  let currentKey = ""

  for (const rawLine of rawHeaders) {
    if (rawLine.trim() === "") {
      continue
    }

    // Handle folded headers (RFC 2822): lines starting with whitespace continue the previous header
    if (/^[\s\t]/.test(rawLine) && currentKey) {
      // Preserve the folding whitespace but normalize it
      headerMap[currentKey] = `${headerMap[currentKey]}${rawLine.replace(/^[\s\t]+/, " ")}`
      continue
    }

    const separatorIndex = rawLine.indexOf(":")
    if (separatorIndex === -1) {
      // If no colon and not a continuation, skip this line
      continue
    }

    currentKey = rawLine.slice(0, separatorIndex).trim().toLowerCase()
    const value = rawLine.slice(separatorIndex + 1).trim()
    headerMap[currentKey] = value
  }

  return headerMap
}

const splitHeadersAndBody = (emailContent: string): EmailSection => {
  const lines = emailContent.split("\n")
  const headerLines: string[] = []
  let bodyStartIndex = lines.length

  // More precise header/body separation
  // Headers end with an empty line (RFC 2822)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Empty line marks end of headers
    if (line.trim() === "" || (line === "\r" && i > 0)) {
      bodyStartIndex = i + 1
      break
    }
    headerLines.push(line)
  }

  if (bodyStartIndex === lines.length) {
    return { headers: {}, body: emailContent }
  }

  const headers = parseHeaders(headerLines)
  const body = lines.slice(bodyStartIndex).join("\n")

  return { headers, body }
}

const getHeaderValue = (headers: ParsedHeaders, key: string): string => headers[key.toLowerCase()] ?? ""

const getBoundary = (headers: ParsedHeaders): string => {
  const contentType = getHeaderValue(headers, "content-type").toLowerCase()
  if (!contentType.includes("boundary=")) {
    return ""
  }

  // More precise boundary extraction: handle quoted and unquoted boundaries
  // Also handle boundaries with semicolons and other parameters
  const boundaryMatch = contentType.match(/boundary\s*=\s*(?:"([^"]+)"|([^;\s]+))/i)
  if (!boundaryMatch) {
    return ""
  }

  let boundary = (boundaryMatch[1] ?? boundaryMatch[2] ?? "").trim()
  // Remove trailing semicolons or commas that might be part of the boundary
  boundary = boundary.replace(/[;,]+$/, "")
  
  return boundary
}

const splitMultipartBody = (body: string, boundary: string): EmailSection[] => {
  if (!boundary) {
    return []
  }

  // More precise boundary splitting
  // RFC 2046: boundaries are preceded by CRLF or just LF, and may have trailing dashes
  const boundaryMarker = `--${boundary}`
  const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const boundaryPattern = new RegExp(`(?:^|\\r?\\n)--${escapedBoundary}(?:--)?(?:\\r?\\n|$)`, "gm")
  
  const parts: string[] = []
  const matches: Array<{ index: number; length: number }> = []
  
  // Find all boundary positions
  let match: RegExpExecArray | null
  while ((match = boundaryPattern.exec(body)) !== null) {
    matches.push({ index: match.index, length: match[0].length })
  }
  
  if (matches.length === 0) {
    return []
  }
  
  // Extract parts between boundaries
  for (let i = 0; i < matches.length - 1; i++) {
    const start = matches[i].index + matches[i].length
    const end = matches[i + 1].index
    const part = body.slice(start, end).trim()
    if (part && !part.startsWith("--")) {
      parts.push(part)
    }
  }
  
  // Handle last part (after final boundary)
  const lastMatch = matches[matches.length - 1]
  const lastPart = body.slice(lastMatch.index + lastMatch.length).trim()
  if (lastPart && !lastPart.startsWith("--")) {
    parts.push(lastPart)
  }

  return parts
    .filter((part) => part && part !== "--")
    .map((part) => splitHeadersAndBody(part))
}

const decodeQuotedPrintable = (value: string): string => {
  // More precise quoted-printable decoding
  // Remove soft line breaks (=\r\n or =\n)
  let normalized = value.replace(/=\r?\n/g, "")
  
  // Decode hex sequences (=XX)
  normalized = normalized.replace(/=([0-9A-F]{2})/gi, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16))
    } catch {
      return `=${hex}`
    }
  })
  
  // Handle spaces at end of line (should be encoded as =20)
  normalized = normalized.replace(/= /g, " ")
  
  return normalized
}

const decodeBase64 = (value: string): string => {
  try {
    // Remove all whitespace for base64 decoding
    const cleaned = value.replace(/[\s\r\n]/g, "")
    // Validate base64 string
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
      return value
    }
    return atob(cleaned)
  } catch {
    return value
  }
}

const extractTextContent = (section: EmailSection, collectedSections: string[]): void => {
  const contentType = getHeaderValue(section.headers, "content-type").toLowerCase()
  const transferEncoding = getHeaderValue(section.headers, "content-transfer-encoding").toLowerCase()
  const contentDisposition = getHeaderValue(section.headers, "content-disposition").toLowerCase()

  // Skip attachments
  if (contentDisposition.includes("attachment")) {
    return
  }

  if (contentType.startsWith("multipart/")) {
    const boundary = getBoundary(section.headers)
    const childSections = splitMultipartBody(section.body, boundary)
    if (childSections.length === 0) {
      return
    }

    for (const childSection of childSections) {
      extractTextContent(childSection, collectedSections)
    }
    return
  }

  // More precise plain text detection
  const isPlainText = 
    !contentType || 
    contentType.includes("text/plain") ||
    (contentType.includes("text/") && !contentType.includes("text/html"))

  if (!isPlainText) {
    return
  }

  let resolvedBody = section.body
  if (transferEncoding.includes("quoted-printable")) {
    resolvedBody = decodeQuotedPrintable(resolvedBody)
  } else if (transferEncoding.includes("base64")) {
    resolvedBody = decodeBase64(resolvedBody)
  } else if (transferEncoding.includes("7bit") || transferEncoding.includes("8bit")) {
    // 7bit and 8bit are already decoded, just use as-is
    resolvedBody = section.body
  }

  if (resolvedBody.trim()) {
    collectedSections.push(resolvedBody)
  }
}

const extractHtmlContent = (section: EmailSection, collectedSections: string[]): void => {
  const contentType = getHeaderValue(section.headers, "content-type").toLowerCase()
  const transferEncoding = getHeaderValue(section.headers, "content-transfer-encoding").toLowerCase()
  const contentDisposition = getHeaderValue(section.headers, "content-disposition").toLowerCase()

  // Skip attachments
  if (contentDisposition.includes("attachment")) {
    return
  }

  if (contentType.startsWith("multipart/")) {
    const boundary = getBoundary(section.headers)
    const childSections = splitMultipartBody(section.body, boundary)
    if (childSections.length === 0) {
      return
    }

    for (const childSection of childSections) {
      extractHtmlContent(childSection, collectedSections)
    }
    return
  }

  // More precise HTML detection
  const isHtml = contentType.includes("text/html")

  if (!isHtml) {
    return
  }

  let resolvedBody = section.body
  if (transferEncoding.includes("quoted-printable")) {
    resolvedBody = decodeQuotedPrintable(resolvedBody)
  } else if (transferEncoding.includes("base64")) {
    resolvedBody = decodeBase64(resolvedBody)
  } else if (transferEncoding.includes("7bit") || transferEncoding.includes("8bit")) {
    // 7bit and 8bit are already decoded, just use as-is
    resolvedBody = section.body
  }

  if (resolvedBody.trim()) {
    collectedSections.push(resolvedBody)
  }
}

const parseEmail = (emailContent: string): { header: string; plainText: string; html: string } => {
  const normalizedContent = normalizeEmailContent(emailContent)
  const rootSection = splitHeadersAndBody(normalizedContent)

  // Extract headers
  const headerLines: string[] = []
  const lines = normalizedContent.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") {
      break
    }
    headerLines.push(line)
  }
  const header = headerLines.join("\n")

  // Extract plain text
  const plainTextSections: string[] = []
  extractTextContent(rootSection, plainTextSections)
  const plainText = plainTextSections.join("\n\n")

  // Extract HTML
  const htmlSections: string[] = []
  extractHtmlContent(rootSection, htmlSections)
  const html = htmlSections.join("\n\n")

  return { header, plainText, html }
}

const reconstructEmail = (
  header: string,
  plainText: string,
  html: string,
  keepHeader: boolean,
  keepPlainText: boolean,
  keepHtml: boolean,
): string => {
  const parts: string[] = []

  if (keepHeader && header.trim()) {
    parts.push(header)
  }

  if (keepPlainText && plainText.trim()) {
    if (keepHeader && header.trim()) {
      parts.push("")
    }
    parts.push(plainText)
  }

  if (keepHtml && html.trim()) {
    if (parts.length > 0) {
      parts.push("")
    }
    parts.push(html)
  }

  return parts.join("\n")
}

const EmailSourceSeparator = () => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const maxSize = 10 * 1024 * 1024 // 10MB
  const maxFiles = 100

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles,
    maxSize,
    accept: ".eml,message/rfc822",
    onFilesChange: (newFiles) => {
      processFiles(newFiles)
    },
  })

  const processFiles = useCallback(async (filesToProcess: typeof files) => {
    if (filesToProcess.length === 0) return

    setIsProcessing(true)
    const newProcessedFiles: ProcessedFile[] = []

    // Initialize files
    for (const fileWrapper of filesToProcess) {
      const file = isFile(fileWrapper.file) ? fileWrapper.file : null
      if (!file) continue

      const processedFile: ProcessedFile = {
        id: fileWrapper.id,
        name: file.name.replace(/\.eml$/i, ""),
        originalContent: "",
        header: "",
        plainText: "",
        html: "",
        size: file.size,
        status: "processing",
        keepHeader: true,
        keepPlainText: true,
        keepHtml: true,
        selected: true,
      }

      newProcessedFiles.push(processedFile)
    }

    setProcessedFiles(newProcessedFiles)

    // Process each file
    for (let i = 0; i < filesToProcess.length; i++) {
      const fileWrapper = filesToProcess[i]
      const file = isFile(fileWrapper.file) ? fileWrapper.file : null
      if (!file) continue

      try {
        const emailContent = await file.text()
        const { header, plainText, html } = parseEmail(emailContent)

        setProcessedFiles((prev) =>
          prev.map((pf) =>
            pf.id === fileWrapper.id
              ? {
                  ...pf,
                  originalContent: emailContent,
                  header,
                  plainText,
                  html,
                  status: "completed",
                }
              : pf,
          ),
        )
      } catch (error) {
        setProcessedFiles((prev) =>
          prev.map((pf) =>
            pf.id === fileWrapper.id
              ? {
                  ...pf,
                  status: "error",
                  error: "Failed to process file",
                }
              : pf,
          ),
        )
      }
    }

    setIsProcessing(false)

    const completedCount = newProcessedFiles.length
    if (completedCount > 0) {
      toast.success(`${completedCount} file(s) processed successfully`)
    }
  }, [])

  const handleTogglePart = useCallback((fileId: string, part: "keepHeader" | "keepPlainText" | "keepHtml") => {
    setProcessedFiles((prev) =>
      prev.map((pf) => (pf.id === fileId ? { ...pf, [part]: !pf[part] } : pf)),
    )
  }, [])

  const handleToggleFileSelection = useCallback((fileId: string) => {
    setProcessedFiles((prev) =>
      prev.map((pf) => (pf.id === fileId ? { ...pf, selected: !pf.selected } : pf)),
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    const allSelected = processedFiles.every((f) => f.selected)
    setProcessedFiles((prev) => prev.map((pf) => ({ ...pf, selected: !allSelected })))
  }, [processedFiles])

  const handleBulkTogglePart = useCallback((part: "keepHeader" | "keepPlainText" | "keepHtml") => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed")
    if (completedFiles.length === 0) return

    // Check if all completed files have this part enabled
    const allEnabled = completedFiles.every((f) => f[part])
    
    // Toggle: if all enabled, disable all; otherwise enable all
    setProcessedFiles((prev) =>
      prev.map((pf) =>
        pf.status === "completed" ? { ...pf, [part]: !allEnabled } : pf,
      ),
    )
  }, [processedFiles])

  const getBulkPartState = useCallback((part: "keepHeader" | "keepPlainText" | "keepHtml") => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed")
    if (completedFiles.length === 0) return { checked: false, indeterminate: false }
    
    const enabledCount = completedFiles.filter((f) => f[part]).length
    const allEnabled = enabledCount === completedFiles.length
    const someEnabled = enabledCount > 0 && enabledCount < completedFiles.length
    
    return {
      checked: allEnabled,
      indeterminate: someEnabled,
    }
  }, [processedFiles])

  const selectedFiles = useMemo(
    () => processedFiles.filter((f) => f.selected && f.status === "completed"),
    [processedFiles],
  )

  const handleDownloadSingle = useCallback(
    (processedFile: ProcessedFile) => {
      const reconstructed = reconstructEmail(
        processedFile.header,
        processedFile.plainText,
        processedFile.html,
        processedFile.keepHeader,
        processedFile.keepPlainText,
        processedFile.keepHtml,
      )

      if (!reconstructed.trim()) {
        toast.error("No content to download. Please select at least one part to keep.")
        return
      }

      const timestamp = new Date().toISOString().split("T")[0]
      const blob = new Blob([reconstructed], {
        type: "text/plain;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${processedFile.name}_${timestamp}.txt`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${processedFile.name}.txt`)
    },
    [],
  )

  const handleDownloadAll = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error("No selected files to download. Please select at least one file.")
      return
    }

    try {
      const zip = new JSZip()
      const timestamp = new Date().toISOString().split("T")[0]

      for (const file of selectedFiles) {
        const reconstructed = reconstructEmail(
          file.header,
          file.plainText,
          file.html,
          file.keepHeader,
          file.keepPlainText,
          file.keepHtml,
        )

        if (reconstructed.trim()) {
          zip.file(`${file.name}_${timestamp}.txt`, reconstructed)
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `emails_${timestamp}.zip`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${selectedFiles.length} file(s) as ZIP`)
    } catch (error) {
      console.error("Error creating zip file:", error)
      toast.error("Failed to create zip file. Please try again.")
    }
  }, [selectedFiles])

  const handleClearAll = () => {
    clearFiles()
    setProcessedFiles([])
    toast.success("All files have been removed")
  }

  const getStatusIcon = (status: ProcessedFile["status"]) => {
    switch (status) {
      case "processing":
        return <Loader2 className="size-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle2 className="size-4 text-green-500" />
      case "error":
        return <AlertCircle className="size-4 text-red-500" />
      default:
        return <FileText className="size-4 text-muted-foreground" />
    }
  }

  const completedCount = processedFiles.filter((f) => f.status === "completed").length

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Email Source Separator</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Separate email headers, plain text, and HTML parts. Select which parts to keep and download the modified
            source.
          </p>
        </div>

        {/* Upload Area */}
        <div
          role="button"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 cursor-pointer"
        >
          <input {...getInputProps()} className="sr-only" aria-label="Upload files" />

          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              aria-hidden="true"
            >
              <Upload className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Upload EML files</p>
            <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
            <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
              <span>.eml files only</span>
              <span>∙</span>
              <span>Max {maxFiles} files</span>
              <span>∙</span>
              <span>Up to {formatBytes(maxSize)} per file</span>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-destructive" role="alert">
            <AlertCircle className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}

        {/* File List */}
        {processedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Processed Files ({processedFiles.length}){" "}
                {selectedFiles.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({selectedFiles.length} selected)
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                {processedFiles.length > 1 && (
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    {processedFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleDownloadAll}
                  disabled={selectedFiles.length === 0 || isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected ({selectedFiles.length})
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            {completedCount > 0 && (
              <Card className="p-4 bg-muted/30 border-border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Bulk Actions:
                  </span>
                  <div className="flex flex-wrap gap-4 flex-1">
                    <button
                      type="button"
                      onClick={() => handleBulkTogglePart("keepHeader")}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      aria-label="Toggle header for all files"
                    >
                      {(() => {
                        const state = getBulkPartState("keepHeader")
                        if (state.indeterminate) {
                          return <Minus className="size-4 text-primary" />
                        }
                        return state.checked ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )
                      })()}
                      <span className="text-sm font-medium">Header</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkTogglePart("keepPlainText")}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      aria-label="Toggle plain text for all files"
                    >
                      {(() => {
                        const state = getBulkPartState("keepPlainText")
                        if (state.indeterminate) {
                          return <Minus className="size-4 text-primary" />
                        }
                        return state.checked ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )
                      })()}
                      <span className="text-sm font-medium">Plain Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkTogglePart("keepHtml")}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      aria-label="Toggle HTML for all files"
                    >
                      {(() => {
                        const state = getBulkPartState("keepHtml")
                        if (state.indeterminate) {
                          return <Minus className="size-4 text-primary" />
                        }
                        return state.checked ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )
                      })()}
                      <span className="text-sm font-medium">HTML</span>
                    </button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {processedFiles.map((file) => (
                <Card key={file.id} className={`p-4 space-y-3 ${file.selected ? "ring-2 ring-primary/20" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      {file.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => handleToggleFileSelection(file.id)}
                          className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border hover:bg-accent transition-colors"
                          aria-label={file.selected ? "Deselect file" : "Select file"}
                        >
                          {file.selected ? (
                            <CheckSquare className="size-5 text-primary" />
                          ) : (
                            <Square className="size-5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      {file.status !== "completed" && (
                        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                          {getStatusIcon(file.status)}
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                        <p className="truncate text-[13px] font-medium">{file.name}.eml</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(file.size)}</span>
                          {file.status === "completed" && (
                            <>
                              <span>∙</span>
                              <span>
                                Header: {file.header.length.toLocaleString()} chars
                                {file.plainText && ` • Plain: ${file.plainText.length.toLocaleString()} chars`}
                                {file.html && ` • HTML: ${file.html.length.toLocaleString()} chars`}
                              </span>
                            </>
                          )}
                          {file.error && (
                            <>
                              <span>∙</span>
                              <span className="text-destructive">{file.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {file.status === "completed" && (
                      <Button size="sm" variant="default" onClick={() => handleDownloadSingle(file)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                      onClick={() => {
                        removeFile(file.id)
                        setProcessedFiles((prev) => prev.filter((f) => f.id !== file.id))
                      }}
                      aria-label="Remove file"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>

                  {file.status === "completed" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/50">
                        <button
                          type="button"
                          onClick={() => handleTogglePart(file.id, "keepHeader")}
                          className="flex items-center justify-center"
                          aria-label="Toggle header"
                        >
                          {file.keepHeader ? (
                            <CheckSquare className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Header</span>
                          <span className="text-xs text-muted-foreground">
                            {file.header.length.toLocaleString()} chars
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/50">
                        <button
                          type="button"
                          onClick={() => handleTogglePart(file.id, "keepPlainText")}
                          className="flex items-center justify-center"
                          aria-label="Toggle plain text"
                        >
                          {file.keepPlainText ? (
                            <CheckSquare className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Plain Text</span>
                          <span className="text-xs text-muted-foreground">
                            {file.plainText.length.toLocaleString()} chars
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/50">
                        <button
                          type="button"
                          onClick={() => handleTogglePart(file.id, "keepHtml")}
                          className="flex items-center justify-center"
                          aria-label="Toggle HTML"
                        >
                          {file.keepHtml ? (
                            <CheckSquare className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">HTML</span>
                          <span className="text-xs text-muted-foreground">
                            {file.html.length.toLocaleString()} chars
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        {processedFiles.length === 0 && (
          <Card className="bg-muted/30 border-border p-6">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="size-4" />
                How it works
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Upload up to {maxFiles} .eml email files</li>
                <li>Each email is automatically separated into headers, plain text, and HTML parts</li>
                <li>Select/deselect files using the checkboxes on the left</li>
                <li>Use checkboxes to select which parts (header, plain text, HTML) you want to keep for each email</li>
                <li>Download individual files or download all selected files as a ZIP archive</li>
                <li>The modified email source is saved as a text file</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default EmailSourceSeparator