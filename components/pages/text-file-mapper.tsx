"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, FileText, X, AlertCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload"

interface TextSection {
  id: string
  index: number
  content: string
  charCount: number
  wordCount: number
  isCopied: boolean
  isExpanded: boolean
}

const SEPARATOR_PATTERNS = [
  /\n__SEP__\n/g,
  /__SEP__/g,
  /\n\n<!-- __SEP__ -->\n\n/g,
  /<!-- __SEP__ -->/g,
]

const parseTextSections = (content: string): string[] => {
  let sections = [content]

  for (const pattern of SEPARATOR_PATTERNS) {
    const newSections: string[] = []
    for (const section of sections) {
      const parts = section.split(pattern)
      newSections.push(...parts)
    }
    sections = newSections
  }

  return sections
    .map((section) => section.trim())
    .filter((section) => section.length > 0)
}

const getWordCount = (text: string): number => {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

const truncateText = (text: string, maxLength: number = 200): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export default function TextFileMapper() {
  const [textSections, setTextSections] = useState<TextSection[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const maxSize = 10 * 1024 * 1024 // 10MB

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)

    try {
      const content = await file.text()
      const sections = parseTextSections(content)

      if (sections.length === 0) {
        toast.error("No text sections found in the file")
        setIsProcessing(false)
        return
      }

      const mappedSections: TextSection[] = sections.map((section, index) => ({
        id: `section-${index}-${Date.now()}`,
        index: index + 1,
        content: section,
        charCount: section.length,
        wordCount: getWordCount(section),
        isCopied: false,
        isExpanded: false,
      }))

      setTextSections(mappedSections)
      setFileName(file.name)
      toast.success(`Found ${mappedSections.length} text section(s)`)
    } catch (error) {
      toast.error("Failed to process file")
    }

    setIsProcessing(false)
  }, [])

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: false,
    maxSize,
    accept: ".txt",
    onFilesChange: (newFiles) => {
      if (newFiles.length > 0) {
        const fileWrapper = newFiles[0]
        const file = fileWrapper.file instanceof File ? fileWrapper.file : null
        if (file) {
          processFile(file)
        }
      }
    },
  })

  const handleCopySection = async (sectionId: string) => {
    const section = textSections.find((s) => s.id === sectionId)
    if (!section) return

    try {
      await navigator.clipboard.writeText(section.content)

      setTextSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, isCopied: true } : s
        )
      )

      toast.success(`Section ${section.index} copied to clipboard`)

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setTextSections((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, isCopied: false } : s
          )
        )
      }, 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleToggleExpand = (sectionId: string) => {
    setTextSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      )
    )
  }

  const handleCopyAll = async () => {
    try {
      const allContent = textSections.map((s) => s.content).join("\n\n---\n\n")
      await navigator.clipboard.writeText(allContent)
      toast.success("All sections copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleClearAll = () => {
    clearFiles()
    setTextSections([])
    setFileName("")
    toast.success("File cleared")
  }

  const getTotalStats = () => {
    const totalChars = textSections.reduce((sum, s) => sum + s.charCount, 0)
    const totalWords = textSections.reduce((sum, s) => sum + s.wordCount, 0)
    return { totalChars, totalWords, sectionCount: textSections.length }
  }

  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Text File Mapper</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Upload a merged text file (with __SEP__ separators) and view each text section with copy functionality
          </p>
        </div>

        {/* Upload Area */}
        <div
          role="button"
          tabIndex={0}
          onClick={openFileDialog}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              openFileDialog()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          aria-label="Upload text file"
          className="flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 cursor-pointer"
        >
          <input {...getInputProps()} className="sr-only" aria-label="Upload file input" />
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              aria-hidden="true"
            >
              <Upload className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Upload a merged text file</p>
            <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
            <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
              <span>.txt files only</span>
              <span>∙</span>
              <span>Up to {formatBytes(maxSize)}</span>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-destructive" role="alert">
            <AlertCircle className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}

        {/* File Info & Actions */}
        {textSections.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-xs text-muted-foreground">
                ({textSections.length} section{textSections.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleCopyAll}
                aria-label="Copy all sections"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAll}
                aria-label="Clear file"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        {textSections.length > 0 && (
          <Card className="bg-muted/30 border-border">
            <div className="p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.sectionCount}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
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

        {/* Text Sections */}
        {textSections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Text Sections</h2>
            <div className="space-y-3">
              {textSections.map((section) => (
                <Card key={section.id} className="overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {section.index}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{section.charCount.toLocaleString()} chars</span>
                          <span>∙</span>
                          <span>{section.wordCount.toLocaleString()} words</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleExpand(section.id)}
                          aria-label={section.isExpanded ? "Collapse section" : "Expand section"}
                          aria-expanded={section.isExpanded}
                        >
                          {section.isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant={section.isCopied ? "default" : "outline"}
                          onClick={() => handleCopySection(section.id)}
                          aria-label={`Copy section ${section.index}`}
                          className="min-w-[80px]"
                        >
                          {section.isCopied ? (
                            <>
                              <Check className="size-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Section Content */}
                    <div
                      className={`bg-muted/50 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap break-words ${
                        section.isExpanded ? "max-h-none" : "max-h-32 overflow-hidden"
                      }`}
                    >
                      {section.isExpanded
                        ? section.content
                        : truncateText(section.content, 300)}
                    </div>

                    {/* Show expand hint if content is truncated */}
                    {!section.isExpanded && section.content.length > 300 && (
                      <button
                        onClick={() => handleToggleExpand(section.id)}
                        className="text-xs text-primary hover:underline cursor-pointer"
                        aria-label={`Expand section ${section.index} to see full content`}
                      >
                        Click to see full content ({section.content.length - 300} more characters)
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        {textSections.length === 0 && !isProcessing && (
          <Card className="bg-muted/30 border-border p-6">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="size-4" />
                How it works
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Upload a text file generated by the EML Content Extractor tool</li>
                <li>The file should contain text sections separated by &apos;__SEP__&apos; tags</li>
                <li>Each section will be displayed in a separate card</li>
                <li>Use the Copy button to copy individual sections to clipboard</li>
                <li>Use &quot;Copy All&quot; to copy all sections at once</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
