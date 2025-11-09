"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Download, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload"

interface ProcessedFile {
  id: string
  name: string
  plainText: string
  size: number
  status: "pending" | "processing" | "completed" | "error"
  error?: string
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

const cleanText = (value: string): string => {
  if (!value.trim()) {
    return ""
  }

  let cleaned = value
    .replace(/<[^>]*>/g, "")
    .replace(/^--[a-zA-Z0-9\-_=]+$/gm, "")
    .replace(/Content-Transfer-Encoding:[^\n]*\n?/gi, "")
    .replace(/Content-Type:[^\n]*\n?/gi, "")
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, "")
    .replace(/\r/g, "\n")

  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#x3D;/g, "=")

  cleaned = cleaned
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return cleaned
}

const collectPlainTextSections = (section: EmailSection, collectedSections: string[]): void => {
  const contentType = getHeaderValue(section.headers, "content-type").toLowerCase()
  const transferEncoding = getHeaderValue(section.headers, "content-transfer-encoding").toLowerCase()

  if (contentType.startsWith("multipart/")) {
    const boundary = getBoundary(section.headers)
    const childSections = splitMultipartBody(section.body, boundary)
    if (childSections.length === 0) {
      return
    }

    for (const childSection of childSections) {
      collectPlainTextSections(childSection, collectedSections)
    }
    return
  }

  const isPlainText = !contentType || contentType.includes("text/plain")
  if (!isPlainText) {
    return
  }

  if (transferEncoding.includes("base64")) {
    return
  }

  let resolvedBody = section.body
  if (transferEncoding.includes("quoted-printable")) {
    resolvedBody = decodeQuotedPrintable(resolvedBody)
  }

  const cleaned = cleanText(resolvedBody)
  if (!cleaned) {
    return
  }

  collectedSections.push(cleaned)
}

const extractPlainText = (rawEmailContent: string): string => {
  const normalizedContent = normalizeEmailContent(rawEmailContent)
  const rootSection = splitHeadersAndBody(normalizedContent)
  const collectedSections: string[] = []

  collectPlainTextSections(rootSection, collectedSections)

  if (collectedSections.length === 0 && !getHeaderValue(rootSection.headers, "content-type")) {
    const fallback = cleanText(rootSection.body)
    if (fallback) {
      collectedSections.push(fallback)
    }
  }

  return collectedSections.join("\n\n")
}

export default function EmlTextExtractor() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const maxSize = 10 * 1024 * 1024 // 10MB
  const maxFiles = 50

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
        plainText: "",
        size: file.size,
        status: "processing",
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
        const plainText = extractPlainText(emailContent)

        setProcessedFiles((prev) =>
          prev.map((pf) =>
            pf.id === fileWrapper.id
              ? {
                  ...pf,
                  plainText,
                  status: plainText.trim() ? "completed" : "error",
                  error: plainText.trim() ? undefined : "No plain text content found",
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

  const handleDownloadCombined = () => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed" && f.plainText.trim())

    if (completedFiles.length === 0) {
      toast.error("No processed files to download")
      return
    }

    // Combine all plain texts with __SEP__ separator
    const combinedText = completedFiles.map((file) => file.plainText.trim()).join("\n__SEP__\n")

    const timestamp = new Date().toISOString().split("T")[0]
    const blob = new Blob([combinedText], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `extracted-texts_${timestamp}.txt`
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${completedFiles.length} email(s) as combined text file`)
  }

  const handleClearAll = () => {
    clearFiles()
    setProcessedFiles([])
    toast.success("All files have been removed")
  }

  const getTotalStats = () => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed")
    const totalChars = completedFiles.reduce((sum, f) => sum + f.plainText.length, 0)
    const totalWords = completedFiles.reduce(
      (sum, f) => sum + (f.plainText.trim() ? f.plainText.trim().split(/\s+/).length : 0),
      0,
    )

    return { totalChars, totalWords, fileCount: completedFiles.length }
  }

  const stats = getTotalStats()

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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">EML Text Extractor</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Extract plain text from multiple email files and combine them into a single file
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
                  onClick={handleDownloadCombined}
                  disabled={stats.fileCount === 0 || isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Combined ({stats.fileCount})
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {processedFiles.map((file) => (
                <Card key={file.id} className="flex items-center justify-between gap-2 p-4">
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
                            <span>{file.plainText.length.toLocaleString()} chars</span>
                            <span>∙</span>
                            <span>{file.plainText.trim() ? file.plainText.trim().split(/\s+/).length : 0} words</span>
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

                  <div className="flex items-center gap-2">
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
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats.fileCount > 0 && (
          <Card className="bg-muted/30 border-border">
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.fileCount}</p>
                <p className="text-xs text-muted-foreground">Files Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalChars.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Characters</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Words</p>
              </div>
            </div>
          </Card>
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
                <li>Upload up to 50 .eml email files</li>
                <li>Each email is processed to extract plain text content</li>
                <li>Headers and HTML are automatically removed</li>
                <li>All extracted texts are combined with "__SEP__" separator</li>
                <li>Download the combined text file</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
