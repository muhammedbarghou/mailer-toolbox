"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import {
  Copy,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  Settings,
  FileText,
  Trash2,
  Zap,
  Code2,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Undo2,
  Redo2,
  Save,
  Archive,
  ArrowUpDown,
  Eye,
  Info,
  ChevronUp,
  ChevronDown,
  Play,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface FileItem {
  id: string
  name: string
  originalContent: string
  processedContent: string
  status: "pending" | "processing" | "completed" | "error"
  originalSize: number
  processedSize: number
  processingTime?: number
  changesSummary?: {
    headersRemoved: number
    headersModified: number
    headersAdded: number
    removedHeaders: string[]
  }
  errorDetails?: string
  selected?: boolean
  history?: Array<{ content: string; timestamp: number }>
}

interface ProcessingStats {
  totalHeadersRemoved: number
  totalSizeReduction: number
  averageProcessingTime: number
  filesProcessed: number
}

type SortOption = "name" | "size" | "status" | "time"
type ViewMode = "side-by-side" | "diff" | "preview"

const PRESETS = {
  standard: {
    name: "Standard",
    description: "Remove common tracking and authentication headers",
    fieldsToRemove: {
      "Delivered-To:": true,
      "Received: by": true,
      "X-Google-Smtp-Source:": true,
      "X-Received:": true,
      "X-original-To": true,
      "ARC-Seal:": true,
      "ARC-Message-Signature:": true,
      "ARC-Authentication-Results:": true,
      "Return-Path:": true,
      "Received-SPF:": true,
      References: true,
      "Authentication-Results:": true,
      "DKIM-Signature:": true,
      "X-SG-EID:": true,
      "Cc:": false,
      "X-Entity-ID:": true,
    },
  },
  minimal: {
    name: "Minimal",
    description: "Keep only essential headers",
    fieldsToRemove: {
      "Delivered-To:": true,
      "Received: by": true,
      "X-Google-Smtp-Source:": true,
      "X-Received:": true,
      "X-original-To": true,
      "ARC-Seal:": true,
      "ARC-Message-Signature:": true,
      "ARC-Authentication-Results:": true,
      "Return-Path:": true,
      "Received-SPF:": true,
      References: true,
      "Authentication-Results:": true,
      "DKIM-Signature:": true,
      "X-SG-EID:": true,
      "Cc:": true,
      "X-Entity-ID:": true,
    },
  },
  custom: {
    name: "Custom",
    description: "Configure your own settings",
    fieldsToRemove: {},
  },
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const analyzeChanges = (original: string, processed: string, config: any) => {
  const originalLines = original.split("\n")
  const processedLines = processed.split("\n")
  const originalHeaders = new Set(
    originalLines
      .filter((line) => line.includes(":") && line.trim() !== "")
      .map((line) => line.split(":")[0].trim())
  )
  const processedHeaders = new Set(
    processedLines
      .filter((line) => line.includes(":") && line.trim() !== "")
      .map((line) => line.split(":")[0].trim())
  )

  const removedHeaders: string[] = []
  originalHeaders.forEach((header) => {
    if (!processedHeaders.has(header)) {
      removedHeaders.push(header)
    }
  })

  const addedHeaders: string[] = []
  processedHeaders.forEach((header) => {
    if (!originalHeaders.has(header)) {
      addedHeaders.push(header)
    }
  })

  const modifiedHeaders: string[] = []
  originalHeaders.forEach((header) => {
    if (processedHeaders.has(header)) {
      const origLine = originalLines.find((l) => l.startsWith(header + ":"))
      const procLine = processedLines.find((l) => l.startsWith(header + ":"))
      if (origLine && procLine && origLine !== procLine) {
        modifiedHeaders.push(header)
      }
    }
  })

  return {
    headersRemoved: removedHeaders.length,
    headersModified: modifiedHeaders.length,
    headersAdded: addedHeaders.length,
    removedHeaders,
    modifiedHeaders,
    addedHeaders,
  }
}

const generateDiff = (original: string, processed: string): Array<{ type: "removed" | "added" | "modified" | "unchanged"; line: string; originalLine?: string }> => {
  const originalLines = original.split("\n")
  const processedLines = processed.split("\n")
  const diff: Array<{ type: "removed" | "added" | "modified" | "unchanged"; line: string; originalLine?: string }> = []
  const maxLines = Math.max(originalLines.length, processedLines.length)

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || ""
    const procLine = processedLines[i] || ""

    if (origLine === procLine) {
      diff.push({ type: "unchanged", line: procLine })
    } else if (origLine && !procLine) {
      diff.push({ type: "removed", line: origLine })
    } else if (!origLine && procLine) {
      diff.push({ type: "added", line: procLine })
    } else {
      diff.push({ type: "modified", line: procLine, originalLine: origLine })
    }
  }

  return diff
}

const validateEmail = (content: string): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = []
  const hasFrom = /^From:/im.test(content)
  const hasTo = /^To:/im.test(content)
  const hasSubject = /^Subject:/im.test(content)
  const hasDate = /^Date:/im.test(content)

  if (!hasFrom) warnings.push("Missing From header")
  if (!hasTo) warnings.push("Missing To header")
  if (!hasSubject) warnings.push("Missing Subject header")
  if (!hasDate) warnings.push("Missing Date header")

  return {
    valid: hasFrom && hasTo && hasSubject && hasDate,
    warnings,
  }
}

function processEmail(input: string, config: any): { result: string; metadata: any } {
  const lines = input.split("\n")
  const outputLines: string[] = []
  let inHeader = true
  let boundary = ""
  let currentHeader: string[] = []
  let hasListUnsubscribe = false
  let originalDomain = "[P_RPATH]" // Default fallback

  // Extract original domain from email headers (predictive detection)
  // Try From: header first
  const fromHeaderMatch = input.match(/^From:\s*(?:"([^"]*)"|([^<]*))\s*<(.+?)>/im)
  if (fromHeaderMatch) {
    const emailPart = fromHeaderMatch[3]
    if (emailPart.includes("@")) {
      const domainPart = emailPart.split("@")[1]
      if (domainPart) {
        originalDomain = domainPart.trim()
      }
    }
  } else {
    // Try alternative From: format without angle brackets
    const fromAltMatch = input.match(/^From:\s*([^\s<>]+@[^\s<>]+)/im)
    if (fromAltMatch && fromAltMatch[1].includes("@")) {
      const domainPart = fromAltMatch[1].split("@")[1]
      if (domainPart) {
        originalDomain = domainPart.trim()
      }
    }
  }

  // Fallback to Return-Path if From: didn't yield a domain
  if (originalDomain === "[P_RPATH]") {
    const returnPathMatch = input.match(/^Return-Path:\s*<(.+?)>/im)
    if (returnPathMatch && returnPathMatch[1].includes("@")) {
      const domainPart = returnPathMatch[1].split("@")[1]
      if (domainPart) {
        originalDomain = domainPart.trim()
      }
    }
  }

  // Fallback to Reply-To if still no domain found
  if (originalDomain === "[P_RPATH]") {
    const replyToMatch = input.match(/^Reply-To:\s*(?:"([^"]*)"|([^<]*))\s*<(.+?)>/im)
    if (replyToMatch) {
      const emailPart = replyToMatch[3]
      if (emailPart && emailPart.includes("@")) {
        const domainPart = emailPart.split("@")[1]
        if (domainPart) {
          originalDomain = domainPart.trim()
        }
      }
    }
  }

  // Fallback to Sender header if still no domain found
  if (originalDomain === "[P_RPATH]") {
    const senderMatch = input.match(/^Sender:\s*(?:"([^"]*)"|([^<]*))\s*<(.+?)>/im)
    if (senderMatch) {
      const emailPart = senderMatch[3]
      if (emailPart && emailPart.includes("@")) {
        const domainPart = emailPart.split("@")[1]
        if (domainPart) {
          originalDomain = domainPart.trim()
        }
      }
    }
  }

  const contentTypeMatch = input.match(/boundary=["']?([^"'\s]+)["']?/i)
  if (contentTypeMatch) {
    boundary = contentTypeMatch[1]
  }

  const fieldsToRemove = [
    "Delivered-To:",
    "Received: by",
    "X-Google-Smtp-Source:",
    "X-Received:",
    "X-original-To",
    "ARC-Seal:",
    "ARC-Message-Signature:",
    "ARC-Authentication-Results:",
    "Return-Path:",
    "Received-SPF:",
    "References",
    "Authentication-Results:",
    "DKIM-Signature:",
    "X-SG-EID:",
    "Cc:",
    "X-Entity-ID:",
  ].filter((field) => config.fieldsToRemove[field])

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trimEnd()

    if (boundary && line.startsWith("--") && line.includes(boundary)) {
      inHeader = false
      outputLines.push(line)
      continue
    }

    if (inHeader && line === "" && outputLines.length > 0) {
      inHeader = false
      outputLines.push("")
      continue
    }

    if (inHeader) {
      if (fieldsToRemove.some((field) => line.startsWith(field))) {
        continue
      }

      if (line.startsWith("Received: from")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        currentHeader.push(line)
        while (i + 1 < lines.length && (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))) {
          i++
          currentHeader.push(lines[i].trimEnd())
        }
      } else if (line.startsWith("Date:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("To:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push("To: [*to]")
        outputLines.push("Cc: [*to]")
      } else if (line.startsWith("From:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        const fromMatch = line.match(/From:\s*(?:"([^"]*)"|([^<]*))\s*<(.+?)>/i)
        if (fromMatch) {
          const namePart = (fromMatch[1] || fromMatch[2] || "").trim()
          let cleanName = namePart

          if (namePart.includes("@")) {
            const domainPart = namePart.split("@")[1] || ""
            if (domainPart.includes(".")) {
              const domainParts = domainPart.split(".")
              cleanName = domainParts[domainParts.length - 2]
            } else {
              cleanName = domainPart
            }
          } else if (namePart.includes(".")) {
            const domainParts = namePart.split(".")
            cleanName = domainParts[domainParts.length - 2]
          }

          if (cleanName) {
            cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
          }

          const emailPart = fromMatch[3]
          let localPart = emailPart
          if (emailPart.includes("@")) {
            localPart = emailPart.split("@")[0]
          }

          outputLines.push(`From: "${cleanName}" <${localPart}@${originalDomain}>`)
        } else {
          outputLines.push(`From: <noreply@${originalDomain}>`)
        }
      } else if (line.toLowerCase().startsWith("message-id:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        const m = line.match(/^Message-Id:\s*(<)?([^>]+?)(>)?\s*$/i)
        let idVal = m ? m[2] : line.replace(/Message-Id:/i, "").trim()
        idVal = idVal.trim()

        let domain = "[RNDS]"
        let localPart = idVal

        if (idVal.includes("@")) {
          const parts = idVal.split("@")
          localPart = parts[0]
          domain = parts[1]
        }

        if (!localPart.includes("[EID]")) {
          const mid = Math.floor(localPart.length / 2) || 0
          localPart = localPart.slice(0, mid) + "[EID]" + localPart.slice(mid)
        }

        const newMsgId = `<${localPart}@${domain}>`
        outputLines.push(`Message-ID: ${newMsgId}`)
      } else if (line.startsWith("List-Unsubscribe:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(`List-Unsubscribe: <mailto:unsubscribe@${originalDomain}>, <http://${originalDomain}/[OPTDOWN]>`)
        hasListUnsubscribe = true
      } else if (line.startsWith("Content-Type:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
        while (i + 1 < lines.length && (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))) {
          i++
          outputLines.push(lines[i].trimEnd())
        }
      } else if (line.startsWith("MIME-Version:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("Subject:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("List-Unsubscribe-Post:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
      } else if (
        line.startsWith("Reply-To:") ||
        line.startsWith("Feedback-ID:") ||
        line.startsWith("X-SES-Outgoing:")
      ) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("Content-Transfer-Encoding:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      }
    } else {
      outputLines.push(line)
    }
  }

  if (currentHeader.length > 0) {
    outputLines.push(...currentHeader)
  }

  const fromIndex = outputLines.findIndex((line) => line.startsWith("From:"))

  if (!hasListUnsubscribe) {
    const senderIndex = outputLines.findIndex((line) => line.startsWith("Sender:"))
    const insertIndex = senderIndex !== -1 ? senderIndex + 1 : fromIndex !== -1 ? fromIndex + 1 : outputLines.length
    outputLines.splice(
      insertIndex,
      0,
      `List-Unsubscribe: <mailto:unsubscribe@${originalDomain}>, <http://${originalDomain}/[OPTDOWN]>`,
      "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
    )
  } else {
    const listUnsubIndex = outputLines.findIndex((line) => line.startsWith("List-Unsubscribe:"))
    if (listUnsubIndex !== -1) {
      outputLines.splice(listUnsubIndex + 1, 0, "List-Unsubscribe-Post: List-Unsubscribe=One-Click")
    }
  }

  const result = outputLines.join("\n")
  return { result, metadata: { originalDomain } }
}

export default function EmailHeaderProcessor() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>("standard")
  const [config, setConfig] = useState(PRESETS.standard)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "completed" | "error">("all")
  const [sortOption, setSortOption] = useState<SortOption>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side")
  const [showPreview, setShowPreview] = useState(false)
  const [processingCancelled, setProcessingCancelled] = useState(false)
  const [customPresets, setCustomPresets] = useState<Record<string, any>>({})
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState("")
  const processingRef = useRef(false)
  const cancelRef = useRef(false)

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId)
  }, [files, selectedFileId])

  const handleFilesUpload = useCallback(
    async (fileList: FileList) => {
      const fileArray = Array.from(fileList).filter(
        (file) => file.name.endsWith(".eml") || file.name.endsWith(".txt")
      )

      if (fileArray.length === 0) {
        alert("Please upload .eml or .txt files only")
        return
      }

      if (files.length + fileArray.length > 50) {
        alert("Maximum 20 files allowed")
        return
      }

      const newFiles: FileItem[] = []

      for (const file of fileArray) {
        try {
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = () => reject(new Error("Failed to read file"))
            reader.readAsText(file)
          })

          const originalSize = new Blob([content]).size
          newFiles.push({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            originalContent: content,
            processedContent: "",
            status: "pending",
            originalSize,
            processedSize: 0,
            selected: false,
            history: [{ content, timestamp: Date.now() }],
          })
        } catch (err) {
          console.error(`Failed to read ${file.name}`)
        }
      }

      setFiles((prev) => [...prev, ...newFiles])
      if (newFiles.length > 0 && !selectedFileId) {
        setSelectedFileId(newFiles[0].id)
      }
    },
    [files.length, selectedFileId],
  )

  const handleProcessAll = useCallback(async () => {
    if (files.length === 0) {
      alert("Please upload files first")
      return
    }

    setProcessing(true)
    setProcessingCancelled(false)
    cancelRef.current = false
    processingRef.current = true

    const updatedFiles = [...files]
    const filesToProcess = updatedFiles.filter((f) => f.status !== "completed")

    for (let i = 0; i < filesToProcess.length; i++) {
      if (cancelRef.current) {
        setProcessingCancelled(true)
        break
      }

      const fileIndex = updatedFiles.findIndex((f) => f.id === filesToProcess[i].id)
      if (fileIndex === -1) continue

      updatedFiles[fileIndex].status = "processing"
      setFiles([...updatedFiles])

      await new Promise((resolve) => setTimeout(resolve, 50))

      try {
        const startTime = Date.now()
        const { result, metadata } = processEmail(updatedFiles[fileIndex].originalContent, config)
        const processingTime = Date.now() - startTime
        const processedSize = new Blob([result]).size

        const changesSummary = analyzeChanges(updatedFiles[fileIndex].originalContent, result, config)
        const validation = validateEmail(result)

        updatedFiles[fileIndex].processedContent = result
        updatedFiles[fileIndex].processedSize = processedSize
        updatedFiles[fileIndex].processingTime = processingTime
        updatedFiles[fileIndex].changesSummary = changesSummary
        updatedFiles[fileIndex].status = "completed"
        if (!validation.valid) {
          updatedFiles[fileIndex].errorDetails = validation.warnings.join(", ")
        }

        // Add to history
        if (!updatedFiles[fileIndex].history) {
          updatedFiles[fileIndex].history = []
        }
        updatedFiles[fileIndex].history!.push({
          content: result,
          timestamp: Date.now(),
        })
      } catch (err: any) {
        updatedFiles[fileIndex].status = "error"
        updatedFiles[fileIndex].errorDetails = err?.message || "Processing failed"
      }

      setFiles([...updatedFiles])
    }

    processingRef.current = false
    setProcessing(false)
  }, [files, config])

  const handleProcessSingle = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId)
      if (!file || file.status === "completed") return

      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "processing" as const } : f))
      )

      try {
        const startTime = Date.now()
        const { result, metadata } = processEmail(file.originalContent, config)
        const processingTime = Date.now() - startTime
        const processedSize = new Blob([result]).size

        const changesSummary = analyzeChanges(file.originalContent, result, config)
        const validation = validateEmail(result)

        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId) {
              const history = f.history || []
              return {
                ...f,
                processedContent: result,
                processedSize,
                processingTime,
                changesSummary,
                status: "completed" as const,
                errorDetails: !validation.valid ? validation.warnings.join(", ") : undefined,
                history: [...history, { content: result, timestamp: Date.now() }],
              }
            }
            return f
          })
        )
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: "error" as const, errorDetails: err?.message || "Processing failed" }
              : f
          )
        )
      }
    },
    [files, config]
  )

  const handleCancelProcessing = useCallback(() => {
    cancelRef.current = true
    setProcessing(false)
    setProcessingCancelled(true)
  }, [])

  const handleUndo = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId && f.history && f.history.length > 1) {
          const previousContent = f.history[f.history.length - 2]
          return {
            ...f,
            processedContent: previousContent.content,
            history: f.history.slice(0, -1),
          }
        }
        return f
      })
    )
  }, [])

  const handleToggleSelect = useCallback((fileId: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, selected: !f.selected } : f)))
  }, [])

  const handleSelectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: true })))
  }, [])

  const handleDeselectAll = useCallback(() => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })))
  }, [])

  const handleDeleteSelected = useCallback(() => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => !f.selected)
      if (selectedFileId && prev.find((f) => f.id === selectedFileId)?.selected) {
        setSelectedFileId(remaining.length > 0 ? remaining[0].id : null)
      }
      return remaining
    })
  }, [selectedFileId])

  const handleDownloadSelected = useCallback(async () => {
    const selectedFiles = files.filter((f) => f.selected && f.status === "completed")
    if (selectedFiles.length === 0) {
      alert("No selected files to download")
      return
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const blob = new Blob([file.processedContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const originalExt = file.name.endsWith(".eml") ? ".eml" : ".txt"
      a.download = `processed-${file.name.replace(originalExt, ".txt")}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (i < selectedFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }, [files])

  const handleDownloadAsZip = useCallback(async () => {
    const completedFiles = files.filter((f) => f.status === "completed")
    if (completedFiles.length === 0) {
      alert("No processed files to download")
      return
    }

    // Simple zip implementation using JSZip would require the library
    // For now, we'll download as individual files
    alert("ZIP download requires JSZip library. Downloading as individual files instead.")
    handleDownloadAll()
  }, [files])

  const handleDownloadAll = useCallback(async () => {
    const completedFiles = files.filter((f) => f.status === "completed")

    if (completedFiles.length === 0) {
      alert("No processed files to download")
      return
    }

    for (let i = 0; i < completedFiles.length; i++) {
      const file = completedFiles[i]
      const blob = new Blob([file.processedContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const originalExt = file.name.endsWith(".eml") ? ".eml" : ".txt"
      a.download = `processed-${file.name.replace(originalExt, ".txt")}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Add 500ms delay between downloads (except for the last one)
      if (i < completedFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }, [files])

  const handleDownloadSingle = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId)
      if (!file || file.status !== "completed") {
        return
      }

      const blob = new Blob([file.processedContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const originalExt = file.name.endsWith(".eml") ? ".eml" : ".txt"
      a.download = `processed-${file.name.replace(originalExt, ".txt")}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [files],
  )

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      if (selectedFileId === fileId) {
        const remainingFiles = files.filter((f) => f.id !== fileId)
        setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null)
      }
    },
    [files, selectedFileId],
  )

  const handleClearAll = useCallback(() => {
    setFiles([])
    setSelectedFileId(null)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files) {
        handleFilesUpload(e.dataTransfer.files)
      }
    },
    [handleFilesUpload],
  )

  const handlePresetChange = useCallback((preset: keyof typeof PRESETS) => {
    setSelectedPreset(preset)
    setConfig(PRESETS[preset] as any)
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy")
    }
  }, [])

  const stats = useMemo(() => {
    const total = files.length
    const completed = files.filter((f) => f.status === "completed").length
    const pending = files.filter((f) => f.status === "pending").length
    const processingCount = files.filter((f) => f.status === "processing").length
    const error = files.filter((f) => f.status === "error").length
    const selected = files.filter((f) => f.selected).length

    const processingStats: ProcessingStats = {
      totalHeadersRemoved: files.reduce((sum, f) => sum + (f.changesSummary?.headersRemoved || 0), 0),
      totalSizeReduction: files.reduce((sum, f) => sum + (f.originalSize - f.processedSize), 0),
      averageProcessingTime:
        files.filter((f) => f.processingTime).length > 0
          ? files.reduce((sum, f) => sum + (f.processingTime || 0), 0) /
            files.filter((f) => f.processingTime).length
          : 0,
      filesProcessed: completed,
    }

    return { total, completed, pending, processing: processingCount, error, selected, processingStats }
  }, [files])

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortOption) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "size":
          comparison = a.originalSize - b.originalSize
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "time":
          comparison = (a.processingTime || 0) - (b.processingTime || 0)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    return sorted
  }, [files, searchQuery, statusFilter, sortOption, sortDirection])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "p":
            e.preventDefault()
            if (!processing && stats.pending > 0) {
              handleProcessAll()
            }
            break
          case "a":
            e.preventDefault()
            handleSelectAll()
            break
          case "d":
            e.preventDefault()
            if (stats.selected > 0) {
              handleDownloadSelected()
            }
            break
        }
      } else {
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault()
            if (selectedFileId) {
              const currentIndex = filteredAndSortedFiles.findIndex((f) => f.id === selectedFileId)
              if (currentIndex > 0) {
                setSelectedFileId(filteredAndSortedFiles[currentIndex - 1].id)
              }
            }
            break
          case "ArrowDown":
            e.preventDefault()
            if (selectedFileId) {
              const currentIndex = filteredAndSortedFiles.findIndex((f) => f.id === selectedFileId)
              if (currentIndex < filteredAndSortedFiles.length - 1) {
                setSelectedFileId(filteredAndSortedFiles[currentIndex + 1].id)
              }
            }
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [processing, stats, selectedFileId, filteredAndSortedFiles, handleProcessAll, handleSelectAll, handleDownloadSelected])

  // Load saved settings
  useEffect(() => {
    const savedPreset = localStorage.getItem("header-processor-preset")
    const savedConfig = localStorage.getItem("header-processor-config")
    if (savedPreset && PRESETS[savedPreset as keyof typeof PRESETS]) {
      setSelectedPreset(savedPreset as keyof typeof PRESETS)
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig))
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [])

  // Save settings
  useEffect(() => {
    localStorage.setItem("header-processor-preset", selectedPreset)
    localStorage.setItem("header-processor-config", JSON.stringify(config))
  }, [selectedPreset, config])

  // Load custom presets
  useEffect(() => {
    const savedPresets = localStorage.getItem("header-processor-custom-presets")
    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets))
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  // Save custom preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      alert("Please enter a preset name")
      return
    }

    const newPresets = {
      ...customPresets,
      [presetName]: {
        name: presetName,
        description: "Custom preset",
        fieldsToRemove: config.fieldsToRemove,
      },
    }
    setCustomPresets(newPresets)
    localStorage.setItem("header-processor-custom-presets", JSON.stringify(newPresets))
    setPresetName("")
    setShowSavePreset(false)
    alert(`Preset "${presetName}" saved successfully!`)
  }, [presetName, config, customPresets])

  const handleLoadCustomPreset = useCallback((presetKey: string) => {
    const preset = customPresets[presetKey]
    if (preset) {
      setConfig(preset)
      setSelectedPreset("custom")
    }
  }, [customPresets])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg border border-border">
              <FileText className="text-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Email Header Processor - Batch Mode</h1>
              <p className="text-sm text-muted-foreground mt-1">Process up to 20 email files at once</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2">
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        {showSettings && (
          <Card className="mb-6 p-6 border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Processing Configuration</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Presets</label>
                {selectedPreset === "custom" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavePreset(!showSavePreset)}
                    className="gap-2"
                  >
                    <Save size={14} />
                    Save Preset
                  </Button>
                )}
              </div>
              {showSavePreset && (
                <div className="mb-3 p-3 bg-accent rounded-lg border border-border">
                  <Input
                    type="text"
                    placeholder="Enter preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSavePreset} className="flex-1">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowSavePreset(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key as keyof typeof PRESETS)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedPreset === key
                        ? "border-primary bg-accent"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className={selectedPreset === key ? "text-primary" : "text-muted-foreground"} />
                      <span className="font-semibold text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
              {Object.keys(customPresets).length > 0 && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-2 block">Saved Custom Presets</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(customPresets).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => handleLoadCustomPreset(key)}
                        className="p-2 rounded border border-border hover:border-primary text-left text-sm"
                      >
                        <div className="font-medium text-foreground">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">Custom preset</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedPreset === "custom" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Fields to Remove</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.keys(PRESETS.standard.fieldsToRemove).map((field) => {
                    const fieldDescriptions: Record<string, string> = {
                      "Delivered-To:": "Email delivery routing information",
                      "Received: by": "Mail server receipt information",
                      "X-Google-Smtp-Source:": "Google SMTP source identifier",
                      "X-Received:": "Email routing path information",
                      "X-original-To": "Original recipient information",
                      "ARC-Seal:": "ARC authentication seal",
                      "ARC-Message-Signature:": "ARC message signature",
                      "ARC-Authentication-Results:": "ARC authentication results",
                      "Return-Path:": "Email return path",
                      "Received-SPF:": "SPF authentication results",
                      References: "Email thread references",
                      "Authentication-Results:": "Email authentication results",
                      "DKIM-Signature:": "DomainKeys Identified Mail signature",
                      "X-SG-EID:": "SendGrid event identifier",
                      "Cc:": "Carbon copy recipients",
                      "X-Entity-ID:": "Entity identifier",
                    }
                    return (
                      <TooltipProvider key={field}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer p-2 rounded hover:bg-accent">
                              <input
                                type="checkbox"
                                checked={config.fieldsToRemove[field as keyof typeof config.fieldsToRemove]}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    fieldsToRemove: { ...config.fieldsToRemove, [field]: e.target.checked },
                                  })
                                }
                                className="rounded"
                              />
                              <span className="text-xs">{field}</span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{fieldDescriptions[field] || "Email header field"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {files.length > 0 && (
          <Card className="mb-4 p-4 border-border">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="flex gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total:</span>
                  <strong className="text-foreground">{stats.total} files</strong>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <strong className="text-green-400">{stats.completed} completed</strong>
                </div>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    <strong className="text-yellow-400">{stats.pending} pending</strong>
                  </div>
                )}
                {stats.processing > 0 && (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="text-blue-400 animate-spin" />
                    <strong className="text-blue-400">{stats.processing} processing</strong>
                  </div>
                )}
                {stats.error > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <strong className="text-red-400">{stats.error} errors</strong>
                  </div>
                )}
                {stats.selected > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    <strong className="text-primary">{stats.selected} selected</strong>
                  </div>
                )}
              </div>
            </div>
            {stats.completed > 0 && stats.processingStats.filesProcessed > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Headers Removed</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stats.processingStats.totalHeadersRemoved}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Size Reduction</div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatFileSize(stats.processingStats.totalSizeReduction)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Avg Processing Time</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stats.processingStats.averageProcessingTime.toFixed(0)}ms
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Files Processed</div>
                  <div className="text-lg font-semibold text-foreground">
                    {stats.processingStats.filesProcessed}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FolderOpen size={20} />
                Files ({files.length}/20)
              </h2>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                          <span>
                            <Upload size={16} />
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upload .eml or .txt files (Ctrl+U)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <input
                    type="file"
                    accept=".eml,.txt"
                    multiple
                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleClearAll} disabled={files.length === 0}>
                        <Trash2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear all files</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="error">Error</option>
                  </select>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="size">Sort by Size</option>
                    <option value="status">Sort by Status</option>
                    <option value="time">Sort by Time</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  >
                    {sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
                {stats.selected > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadSelected} className="flex-1">
                      <Download size={14} className="mr-2" />
                      Download Selected ({stats.selected})
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium mb-1">Drop .eml or .txt files here</p>
              <p className="text-xs text-muted-foreground">or click the upload button above</p>
              <p className="text-xs text-muted-foreground mt-2">Maximum 20 files</p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery || statusFilter !== "all" ? "No files match your filters" : "No files uploaded"}
                </div>
              ) : (
                filteredAndSortedFiles.map((file) => (
                  <Card
                    key={file.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedFileId === file.id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleSelect(file.id)
                        }}
                        className="mt-0.5 shrink-0"
                      >
                        <Checkbox checked={file.selected || false} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {file.status === "completed" && (
                              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                            )}
                            {file.status === "pending" && <Clock size={16} className="text-yellow-400 shrink-0" />}
                            {file.status === "processing" && (
                              <RefreshCw size={16} className="text-blue-400 animate-spin shrink-0" />
                            )}
                            {file.status === "error" && <AlertCircle size={16} className="text-red-400 shrink-0" />}
                            <span className="text-sm truncate font-medium">{file.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{formatFileSize(file.originalSize)}</span>
                          {file.status === "completed" && (
                            <>
                              <span>→</span>
                              <span>{formatFileSize(file.processedSize)}</span>
                              {file.processingTime && <span>• {file.processingTime}ms</span>}
                            </>
                          )}
                        </div>
                        {file.status === "processing" && (
                          <Progress value={50} className="h-1 mb-2" />
                        )}
                        {file.status === "error" && file.errorDetails && (
                          <div className="text-xs text-red-400 mb-1">{file.errorDetails}</div>
                        )}
                        {file.status === "completed" && file.changesSummary && (
                          <div className="text-xs text-muted-foreground">
                            {file.changesSummary.headersRemoved} removed, {file.changesSummary.headersModified} modified
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {file.status === "pending" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleProcessSingle(file.id)
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Play size={12} className="mr-1" />
                                    Process
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Process this file individually</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {file.status === "completed" && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadSingle(file.id)
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Download size={12} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {file.history && file.history.length > 1 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleUndo(file.id)
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Undo2 size={12} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Undo</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveFile(file.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X size={12} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcessAll}
                    disabled={processing || stats.pending === 0}
                    className="flex-1 gap-2"
                  >
                    {processing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Process All
                      </>
                    )}
                  </Button>
                  {processing && (
                    <Button onClick={handleCancelProcessing} variant="outline" className="gap-2">
                      <Square size={16} />
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadAll}
                    disabled={stats.completed === 0}
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                  >
                    <Download size={16} />
                    Download All ({stats.completed})
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleDownloadAsZip}
                          disabled={stats.completed === 0}
                          variant="outline"
                          className="gap-2 bg-transparent"
                        >
                          <Archive size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download as ZIP</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSelectAll} variant="outline" size="sm" className="flex-1">
                    Select All
                  </Button>
                  <Button onClick={handleDeselectAll} variant="outline" size="sm" className="flex-1">
                    Deselect All
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Code2 size={20} />
                {selectedFile ? selectedFile.name : "Preview"}
              </h2>
              <div className="flex items-center gap-2">
                {selectedFile && (
                  <>
                    <div className="flex gap-1 border border-border rounded-md p-1">
                      <Button
                        variant={viewMode === "side-by-side" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("side-by-side")}
                        className="h-7 px-2 text-xs"
                      >
                        Side-by-Side
                      </Button>
                      <Button
                        variant={viewMode === "diff" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("diff")}
                        className="h-7 px-2 text-xs"
                      >
                        Diff
                      </Button>
                      <Button
                        variant={viewMode === "preview" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("preview")}
                        className="h-7 px-2 text-xs"
                      >
                        Preview
                      </Button>
                    </div>
                    {selectedFile.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedFile.processedContent)}
                        className="gap-2"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {selectedFile && selectedFile.status === "completed" && selectedFile.changesSummary && (
              <Card className="p-4 border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Changes Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Headers Removed</div>
                    <div className="text-lg font-semibold text-red-400">
                      {selectedFile.changesSummary.headersRemoved}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Headers Modified</div>
                    <div className="text-lg font-semibold text-yellow-400">
                      {selectedFile.changesSummary.headersModified}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Headers Added</div>
                    <div className="text-lg font-semibold text-green-400">
                      {selectedFile.changesSummary.headersAdded}
                    </div>
                  </div>
                </div>
                {selectedFile.changesSummary.removedHeaders.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Removed Headers:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedFile.changesSummary.removedHeaders.slice(0, 10).map((header, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-400/10 text-red-400 rounded text-xs"
                        >
                          {header}
                        </span>
                      ))}
                      {selectedFile.changesSummary.removedHeaders.length > 10 && (
                        <span className="px-2 py-1 text-muted-foreground rounded text-xs">
                          +{selectedFile.changesSummary.removedHeaders.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {selectedFile && selectedFile.status === "completed" && selectedFile.errorDetails && (
              <Card className="p-4 border-yellow-400 bg-yellow-400/10">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-yellow-400 mb-1">Validation Warnings</div>
                    <div className="text-xs text-yellow-400/80">{selectedFile.errorDetails}</div>
                  </div>
                </div>
              </Card>
            )}

            {viewMode === "diff" && selectedFile && selectedFile.status === "completed" ? (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Diff View</h3>
                <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto">
                  {generateDiff(selectedFile.originalContent, selectedFile.processedContent).map(
                    (diffLine, idx) => {
                      const bgColor =
                        diffLine.type === "removed"
                          ? "bg-red-400/20"
                          : diffLine.type === "added"
                            ? "bg-green-400/20"
                            : diffLine.type === "modified"
                              ? "bg-yellow-400/20"
                              : ""
                      const textColor =
                        diffLine.type === "removed"
                          ? "text-red-400"
                          : diffLine.type === "added"
                            ? "text-green-400"
                            : diffLine.type === "modified"
                              ? "text-yellow-400"
                              : "text-foreground"
                      return (
                        <div key={idx} className={`${bgColor} ${textColor} px-2 py-0.5`}>
                          {diffLine.type === "removed" && <span className="mr-2">-</span>}
                          {diffLine.type === "added" && <span className="mr-2">+</span>}
                          {diffLine.type === "modified" && <span className="mr-2">~</span>}
                          {diffLine.type === "unchanged" && <span className="mr-2"> </span>}
                          <code>{diffLine.line || diffLine.originalLine}</code>
                        </div>
                      )
                    }
                  )}
                </pre>
              </div>
            ) : viewMode === "preview" && selectedFile && selectedFile.status === "completed" ? (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Processed Preview</h3>
                <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap">
                  <code className="text-foreground">{selectedFile.processedContent}</code>
                </pre>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Original</h3>
                  <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap">
                    {selectedFile ? (
                      <code className="text-foreground">{selectedFile.originalContent}</code>
                    ) : (
                      <code className="text-muted-foreground">No file selected</code>
                    )}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Processed</h3>
                  <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap">
                    {selectedFile ? (
                      selectedFile.status === "completed" ? (
                        <code className="text-foreground">{selectedFile.processedContent}</code>
                      ) : (
                        <code className="text-muted-foreground">
                          {selectedFile.status === "processing"
                            ? "Processing..."
                            : selectedFile.status === "error"
                              ? `Error: ${selectedFile.errorDetails || "Unknown error"}`
                              : "Not processed yet"}
                        </code>
                      )
                    ) : (
                      <code className="text-muted-foreground">No file selected</code>
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
