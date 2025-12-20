"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Upload, Download, FileText, X, AlertCircle, CheckCircle2, Loader2, Code, FileCode, File as FileIcon } from "lucide-react"
import { useFileUpload, formatBytes, type FileWithPreview } from "@/hooks/use-file-upload"

type TabType = "text" | "html" | "header" | "source"

interface ProcessedFile {
  id: string
  name: string
  content: string
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

const decodeBase64 = (value: string): string => {
  try {
    return atob(value.replace(/\s/g, ""))
  } catch {
    return value
  }
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

const collectHtmlSections = (section: EmailSection, collectedSections: string[]): void => {
  const contentType = getHeaderValue(section.headers, "content-type").toLowerCase()
  const transferEncoding = getHeaderValue(section.headers, "content-transfer-encoding").toLowerCase()

  if (contentType.startsWith("multipart/")) {
    const boundary = getBoundary(section.headers)
    const childSections = splitMultipartBody(section.body, boundary)
    if (childSections.length === 0) {
      return
    }

    for (const childSection of childSections) {
      collectHtmlSections(childSection, collectedSections)
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

  if (!resolvedBody.trim()) {
    return
  }

  collectedSections.push(resolvedBody.trim())
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

const extractHtml = (rawEmailContent: string): string => {
  const normalizedContent = normalizeEmailContent(rawEmailContent)
  const rootSection = splitHeadersAndBody(normalizedContent)
  const collectedSections: string[] = []

  collectHtmlSections(rootSection, collectedSections)

  return collectedSections.join("\n\n")
}

const extractHeaders = (rawEmailContent: string): string => {
  const normalizedContent = normalizeEmailContent(rawEmailContent)
  const rootSection = splitHeadersAndBody(normalizedContent)

  const headerLines: string[] = []
  for (const [key, value] of Object.entries(rootSection.headers)) {
    const formattedKey = key
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("-")
    headerLines.push(`${formattedKey}: ${value}`)
  }

  return headerLines.join("\n")
}

const extractSource = (rawEmailContent: string): string => {
  return normalizeEmailContent(rawEmailContent)
}

export default function EmlTextExtractor() {
  const [activeTab, setActiveTab] = useState<TabType>("text")
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const activeTabRef = useRef(activeTab)

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const maxSize = 10 * 1024 * 1024 // 10MB
  const maxFiles = 50

  const processFiles = useCallback(
    async (filesToProcess: FileWithPreview[], tabType: TabType) => {
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
          content: "",
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
          let extractedContent = ""

          switch (tabType) {
            case "text":
              extractedContent = extractPlainText(emailContent)
              break
            case "html":
              extractedContent = extractHtml(emailContent)
              break
            case "header":
              extractedContent = extractHeaders(emailContent)
              break
            case "source":
              extractedContent = extractSource(emailContent)
              break
          }

          setProcessedFiles((prev) =>
            prev.map((pf) =>
              pf.id === fileWrapper.id
                ? {
                    ...pf,
                    content: extractedContent,
                    status: extractedContent.trim() ? "completed" : "error",
                    error: extractedContent.trim() ? undefined : `No ${tabType} content found`,
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
    },
    [],
  )

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
    accept: ".eml,.txt,message/rfc822", // Accept .eml, .txt, and message/rfc822
    onFilesChange: (newFiles) => {
      processFiles(newFiles, activeTabRef.current)
    },
  })

  const handleTabChange = async (value: string) => {
    const newTab = value as TabType
    setActiveTab(newTab)
    
    // If there are files, reprocess them for the new tab
    if (files.length > 0) {
      setProcessedFiles([])
      await processFiles(files, newTab)
    }
  }

  const handleDownloadCombined = () => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed" && f.content.trim())

    if (completedFiles.length === 0) {
      toast.error("No processed files to download")
      return
    }

    const timestamp = new Date().toISOString().split("T")[0]
    let combinedContent = ""
    let fileExtension = ""
    let mimeType = ""

    switch (activeTab) {
      case "text":
        combinedContent = completedFiles.map((file) => file.content.trim()).join("\n__SEP__\n")
        fileExtension = "txt"
        mimeType = "text/plain;charset=utf-8"
        break
      case "html":
        combinedContent = completedFiles.map((file) => file.content.trim()).join("\n\n<!-- __SEP__ -->\n\n")
        fileExtension = "txt"
        mimeType = "text/plain;charset=utf-8"
        break
      case "header":
        combinedContent = completedFiles.map((file) => file.content.trim()).join("\n\n__SEP__\n\n")
        fileExtension = "txt"
        mimeType = "text/plain;charset=utf-8"
        break
      case "source":
        combinedContent = completedFiles.map((file) => file.content).join("\n\n__SEP__\n\n")
        fileExtension = "txt"
        mimeType = "text/plain;charset=utf-8"
        break
    }

    const blob = new Blob([combinedContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `extracted-${activeTab}_${timestamp}.${fileExtension}`
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${completedFiles.length} email(s) as combined ${activeTab} file`)
  }

  const handleClearAll = () => {
    clearFiles()
    setProcessedFiles([])
    toast.success("All files have been removed")
  }

  const getTotalStats = () => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed")
    const totalChars = completedFiles.reduce((sum, f) => sum + f.content.length, 0)
    const totalWords =
      activeTab === "text"
        ? completedFiles.reduce(
            (sum, f) => sum + (f.content.trim() ? f.content.trim().split(/\s+/).length : 0),
            0,
          )
        : 0

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

  const getTabDescription = () => {
    switch (activeTab) {
      case "text":
        return "Extract plain text from multiple email files and combine them into a single file"
      case "html":
        return "Extract HTML content from multiple email files and combine them into a single file"
      case "header":
        return "Extract headers from multiple email files and combine them into a single file"
      case "source":
        return "Merge the full source of multiple email files into a single file"
    }
  }

  const getTabInfo = () => {
    switch (activeTab) {
      case "text":
        return {
          title: "How it works - Plain Text",
          items: [
            "Upload up to 50 .eml or .txt files",
            "Each file is processed to extract plain text content",
            "Headers and HTML are automatically removed",
            "All extracted texts are combined with '__SEP__' separator",
            "Download the combined text file",
          ],
        }
      case "html":
        return {
          title: "How it works - HTML",
          items: [
            "Upload up to 50 .eml or .txt files",
            "Each file is processed to extract HTML content (where available)",
            "Only HTML parts are extracted from multipart emails",
            "All extracted HTML are combined with '<!-- __SEP__ -->' separator",
            "Download the combined HTML file",
          ],
        }
      case "header":
        return {
          title: "How it works - Headers",
          items: [
            "Upload up to 50 .eml or .txt files",
            "Each file's headers are extracted and formatted",
            "Headers are formatted with proper capitalization",
            "All extracted headers are combined with '__SEP__' separator",
            "Download the combined headers file",
          ],
        }
      case "source":
        return {
          title: "How it works - Full Source",
          items: [
            "Upload up to 50 .eml or .txt files",
            "Each file's complete source is preserved as-is",
            "No processing or modification is applied",
            "All email sources are combined with '__SEP__' separator",
            "Download the combined source file",
          ],
        }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">EML Content Extractor</h1>
          <p className="text-muted-foreground text-sm md:text-base">{getTabDescription()}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="size-4" />
              <span className="hidden sm:inline">Merge Text Plain</span>
              <span className="sm:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code className="size-4" />
              <span className="hidden sm:inline">Merge HTML</span>
              <span className="sm:hidden">HTML</span>
            </TabsTrigger>
            <TabsTrigger value="header" className="flex items-center gap-2">
              <FileCode className="size-4" />
              <span className="hidden sm:inline">Merge Header</span>
              <span className="sm:hidden">Header</span>
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center gap-2">
              <FileIcon className="size-4" />
              <span className="hidden sm:inline">Merge Source</span>
              <span className="sm:hidden">Source</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-6 mt-6">
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
                <p className="mb-1.5 text-sm font-medium">Upload EML or TXT files</p>
                <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>.eml or .txt files</span>
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
                                <span>{file.content.length.toLocaleString()} chars</span>
                                <span>∙</span>
                                <span>{file.content.trim() ? file.content.trim().split(/\s+/).length : 0} words</span>
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
                    {getTabInfo().title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {getTabInfo().items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="html" className="space-y-6 mt-6">
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
                <p className="mb-1.5 text-sm font-medium">Upload EML or TXT files</p>
                <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>.eml or .txt files</span>
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
                                <span>{file.content.length.toLocaleString()} chars</span>
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
                </div>
              </Card>
            )}

            {/* Info Card */}
            {processedFiles.length === 0 && (
              <Card className="bg-muted/30 border-border p-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Code className="size-4" />
                    {getTabInfo().title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {getTabInfo().items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="header" className="space-y-6 mt-6">
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
                <p className="mb-1.5 text-sm font-medium">Upload EML or TXT files</p>
                <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>.eml or .txt files</span>
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
                                <span>{file.content.length.toLocaleString()} chars</span>
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
                </div>
              </Card>
            )}

            {/* Info Card */}
            {processedFiles.length === 0 && (
              <Card className="bg-muted/30 border-border p-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileCode className="size-4" />
                    {getTabInfo().title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {getTabInfo().items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="source" className="space-y-6 mt-6">
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
                <p className="mb-1.5 text-sm font-medium">Upload EML or TXT files</p>
                <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
                  <span>.eml or .txt files</span>
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
                                <span>{file.content.length.toLocaleString()} chars</span>
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
                </div>
              </Card>
            )}

            {/* Info Card */}
            {processedFiles.length === 0 && (
              <Card className="bg-muted/30 border-border p-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileIcon className="size-4" />
                    {getTabInfo().title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {getTabInfo().items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
