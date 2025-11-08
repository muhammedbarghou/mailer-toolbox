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

// Extract plain text from email content
const extractPlainText = (emailContent: string): string => {
  const lines = emailContent.split("\n")
  let inHeader = true
  let boundary = ""
  let foundPlainText = false
  const plainTextContent: string[] = []
  let currentPart: string[] = []
  let inPart = false
  let partContentType = ""

  // Find main boundary
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()

    if (lowerLine.startsWith("content-type:")) {
      const boundaryMatch = line.match(/boundary=["']?([^"'\s]+)["']?/i)
      if (boundaryMatch && !boundary) {
        boundary = boundaryMatch[1]
      }
    }

    // Detect end of headers
    if (inHeader && line.trim() === "") {
      inHeader = false
      continue
    }

    // Skip headers
    if (inHeader) {
      continue
    }

    // Handle multipart messages
    if (boundary) {
      // Check for boundary markers
      if (line.includes(`--${boundary}`)) {
        // If we were in a part, process it
        if (inPart && currentPart.length > 0) {
          const partText = currentPart.join("\n")
          // Check if this part is plain text
          if (partContentType.includes("text/plain") || !partContentType.includes("text/html")) {
            const cleaned = cleanText(partText)
            if (cleaned.trim()) {
              plainTextContent.push(cleaned)
              foundPlainText = true
            }
          }
          currentPart = []
          partContentType = ""
        }

        // Check if this is the end boundary
        if (line.includes(`--${boundary}--`)) {
          break
        }

        inPart = true
        continue
      }

      // If we're in a part, check for content-type
      if (inPart && lowerLine.startsWith("content-type:")) {
        partContentType = lowerLine
        // Skip until empty line (end of part headers)
        while (i + 1 < lines.length && lines[i + 1].trim() !== "") {
          i++
        }
        continue
      }

      // Collect part content
      if (inPart) {
        currentPart.push(line)
      }
    } else {
      // Simple email without multipart - collect all body content
      plainTextContent.push(line)
    }
  }

  // Process last part if exists
  if (inPart && currentPart.length > 0) {
    const partText = currentPart.join("\n")
    if (partContentType.includes("text/plain") || !partContentType.includes("text/html")) {
      const cleaned = cleanText(partText)
      if (cleaned.trim()) {
        plainTextContent.push(cleaned)
        foundPlainText = true
      }
    }
  }

  // If no plain text found in multipart, use all body content
  if (!foundPlainText && plainTextContent.length === 0) {
    // Fallback: extract from simple body
    let bodyStart = false
    for (let i = 0; i < lines.length; i++) {
      if (!inHeader && bodyStart) {
        plainTextContent.push(lines[i])
      }
      if (inHeader && lines[i].trim() === "") {
        inHeader = false
        bodyStart = true
      }
      if (inHeader) continue
    }
  }

  const combinedText = plainTextContent.join("\n")
  return cleanText(combinedText)
}

// Clean and process text content
const cleanText = (text: string): string => {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, "")

  // Matches lines starting with -- followed by any alphanumeric characters, hyphens, or underscores
  cleaned = cleaned.replace(/^--[a-zA-Z0-9\-_=]+$/gm, "")

  // Remove Content-Transfer-Encoding headers (with or without surrounding text)
  cleaned = cleaned.replace(/Content-Transfer-Encoding:\s*quoted-printable/gi, "")
  cleaned = cleaned.replace(/Content-Transfer-Encoding:\s*quoted-printable\s*/gi, "")

  // Remove Content-Type headers for text/plain with charset utf-8
  cleaned = cleaned.replace(/Content-Type:\s*text\/plain[^;]*;?\s*charset=["']?utf-8["']?/gi, "")
  cleaned = cleaned.replace(/Content-Type:\s*text\/plain[^;]*;?\s*charset=["']?UTF-8["']?/gi, "")

  // Decode HTML entities
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

  // Remove base64 encoded content (long strings of base64)
  cleaned = cleaned.replace(/[A-Za-z0-9+/]{80,}={0,2}/g, "")

  // Remove quoted-printable encoding markers
  cleaned = cleaned.replace(/=\r?\n/g, "").replace(/=[0-9A-F]{2}/g, "")

  // Clean up whitespace
  cleaned = cleaned
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // Multiple newlines to double
    .replace(/[ \t]+/g, " ") // Multiple spaces/tabs to single space
    .replace(/[ \t]+\n/g, "\n") // Remove trailing spaces
    .replace(/\n[ \t]+/g, "\n") // Remove leading spaces after newline
    .replace(/^\s*$/gm, "") // Remove empty lines
    .replace(/\n{3,}/g, "\n\n") // Clean up multiple newlines again after removing empty lines
    .trim()

  return cleaned
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

    // Combine all plain texts with _SPT_ separator
    const combinedText = completedFiles.map((file) => file.plainText.trim()).join("\n__SPT__\n")

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
                <li>All extracted texts are combined with "_SPT_" separator</li>
                <li>Download the combined text file</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
