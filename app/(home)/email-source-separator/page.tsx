"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
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
} from "lucide-react"
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload"

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

    if (/^\s/.test(rawLine) && currentKey) {
      headerMap[currentKey] = `${headerMap[currentKey]} ${rawLine.trim()}`
      continue
    }

    const separatorIndex = rawLine.indexOf(":")
    if (separatorIndex === -1) {
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === "") {
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

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
  if (!boundaryMatch) {
    return ""
  }

  return (boundaryMatch[1] ?? boundaryMatch[2] ?? "").trim()
}

const splitMultipartBody = (body: string, boundary: string): EmailSection[] => {
  if (!boundary) {
    return []
  }

  const boundaryMarker = `--${boundary}`
  const rawParts = body.split(boundaryMarker)
  rawParts.shift()

  return rawParts
    .map((part) => part.replace(/^\s*--/, "").trim())
    .filter((part) => part && part !== "--")
    .map((part) => splitHeadersAndBody(part))
}

const decodeQuotedPrintable = (value: string): string => {
  const normalized = value.replace(/=\r?\n/g, "")
  return normalized.replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

const decodeBase64 = (value: string): string => {
  try {
    return atob(value.replace(/\s/g, ""))
  } catch {
    return value
  }
}

const extractTextContent = (section: EmailSection, collectedSections: string[]): void => {
  const contentType = getHeaderValue(section.headers, "content-type").toLowerCase()
  const transferEncoding = getHeaderValue(section.headers, "content-transfer-encoding").toLowerCase()

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

  const isPlainText = !contentType || contentType.includes("text/plain")
  if (!isPlainText) {
    return
  }

  let resolvedBody = section.body
  if (transferEncoding.includes("quoted-printable")) {
    resolvedBody = decodeQuotedPrintable(resolvedBody)
  } else if (transferEncoding.includes("base64")) {
    resolvedBody = decodeBase64(resolvedBody)
  }

  if (resolvedBody.trim()) {
    collectedSections.push(resolvedBody)
  }
}

const extractHtmlContent = (section: EmailSection, collectedSections: string[]): void => {
  const contentType = getHeaderValue(section.headers, "content-type").toLowerCase()
  const transferEncoding = getHeaderValue(section.headers, "content-transfer-encoding").toLowerCase()

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

  const isHtml = contentType.includes("text/html")
  if (!isHtml) {
    return
  }

  let resolvedBody = section.body
  if (transferEncoding.includes("quoted-printable")) {
    resolvedBody = decodeQuotedPrintable(resolvedBody)
  } else if (transferEncoding.includes("base64")) {
    resolvedBody = decodeBase64(resolvedBody)
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

export default function EmailSourceSeparator() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const maxSize = 10 * 1024 * 1024 // 10MB
  const maxFiles = 20

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
      const file = fileWrapper.file instanceof File ? fileWrapper.file : null
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
      }

      newProcessedFiles.push(processedFile)
    }

    setProcessedFiles(newProcessedFiles)

    // Process each file
    for (let i = 0; i < filesToProcess.length; i++) {
      const fileWrapper = filesToProcess[i]
      const file = fileWrapper.file instanceof File ? fileWrapper.file : null
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

  const handleDownloadAll = useCallback(() => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed")

    if (completedFiles.length === 0) {
      toast.error("No processed files to download")
      return
    }

    const timestamp = new Date().toISOString().split("T")[0]

    completedFiles.forEach((file, index) => {
      setTimeout(() => {
        const reconstructed = reconstructEmail(
          file.header,
          file.plainText,
          file.html,
          file.keepHeader,
          file.keepPlainText,
          file.keepHtml,
        )

        if (reconstructed.trim()) {
          const blob = new Blob([reconstructed], {
            type: "text/plain;charset=utf-8",
          })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${file.name}_${timestamp}.txt`
          link.click()
          URL.revokeObjectURL(url)
        }
      }, index * 200)
    })

    toast.success(`Downloaded ${completedFiles.length} file(s)`)
  }, [processedFiles])

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
              <h2 className="text-lg font-semibold">Processed Files ({processedFiles.length})</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleDownloadAll}
                  disabled={completedCount === 0 || isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All ({completedCount})
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {processedFiles.map((file) => (
                <Card key={file.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                        {getStatusIcon(file.status)}
                      </div>
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
                <li>Use checkboxes to select which parts you want to keep</li>
                <li>Download individual files or all files at once</li>
                <li>The modified email source is saved as a text file</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
