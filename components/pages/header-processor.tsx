"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Copy,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  FileText,
  Trash2,
  Zap,
  Code2,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Settings2,
  Save,
  Pencil,
  FileArchive,
  Loader2,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import JSZip from "jszip"
import { AppGuide } from "./app-guide"
import { DialogSkeleton } from "@/components/skeletons"

interface FileItem {
  id: string
  name: string
  originalContent: string
  processedContent: string
  status: "pending" | "processing" | "completed" | "error"
}

interface HeaderParameter {
  id: string
  name: string
  placeholder: string
  description: string | null
  isNew?: boolean
  isEditing?: boolean
}

// Default header parameters
const DEFAULT_PARAMETERS: HeaderParameter[] = [
  {
    id: "default-1",
    name: "To Address",
    placeholder: "[*to]",
    description: "Recipient email address placeholder",
  },
  {
    id: "default-2",
    name: "Return Path Domain",
    placeholder: "[P_RPATH]",
    description: "Return path domain placeholder",
  },
  {
    id: "default-3",
    name: "Email ID",
    placeholder: "[EID]",
    description: "Unique email identifier placeholder",
  },
  {
    id: "default-4",
    name: "Random String",
    placeholder: "[RNDS]",
    description: "Random string placeholder for Message-ID domain",
  },
]

const MAX_INDIVIDUAL_DOWNLOADS = 20

const EmailHeaderProcessor = () => {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Custom parameters state
  const [parameters, setParameters] = useState<HeaderParameter[]>(DEFAULT_PARAMETERS)
  const [showParametersDialog, setShowParametersDialog] = useState(false)
  const [editingParameter, setEditingParameter] = useState<HeaderParameter | null>(null)
  const [newParameterName, setNewParameterName] = useState("")
  const [newParameterPlaceholder, setNewParameterPlaceholder] = useState("")
  const [newParameterDescription, setNewParameterDescription] = useState("")
  const [loadingParameters, setLoadingParameters] = useState(false)
  const [savingParameters, setSavingParameters] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Paste mode state
  const [pasteMode, setPasteMode] = useState(false)
  const [pastedContent, setPastedContent] = useState("")
  const [pastedProcessedContent, setPastedProcessedContent] = useState("")
  const [pastedProcessing, setPastedProcessing] = useState(false)

  // Custom headers state
  const [customHeaders, setCustomHeaders] = useState<string[]>([])
  const [editingCustomHeader, setEditingCustomHeader] = useState<{ index: number; value: string } | null>(null)
  const [newCustomHeader, setNewCustomHeader] = useState("")

  // X-header removal state
  const [removeXHeaders, setRemoveXHeaders] = useState<boolean>(true)
  
  // List-Unsubscribe headers state
  const [addListUnsubscribe, setAddListUnsubscribe] = useState<boolean>(true)
  
  // Date header replacement state
  const [replaceDateHeader, setReplaceDateHeader] = useState<boolean>(false)

  // Profile state
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string; description: string | null; is_default: boolean }>>([])
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [showProfilesDialog, setShowProfilesDialog] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDescription, setNewProfileDescription] = useState("")

  // Guide dialog state
  const [showGuideDialog, setShowGuideDialog] = useState(false)

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId)
  }, [files, selectedFileId])

  // Load parameters from user profile
  useEffect(() => {
    const loadParameters = async () => {
      if (!user) {
        setParameters(DEFAULT_PARAMETERS)
        return
      }

      setLoadingParameters(true)
      try {
        const response = await fetch("/api/header-parameters")
        if (response.ok) {
          const data = await response.json()
          if (data.parameters && data.parameters.length > 0) {
            setParameters(
              data.parameters.map((p: HeaderParameter) => ({
                id: p.id,
                name: p.name,
                placeholder: p.placeholder,
                description: p.description,
              }))
            )
          } else {
            setParameters(DEFAULT_PARAMETERS)
          }
        } else if (response.status === 401) {
          // Not authenticated, use defaults
          setParameters(DEFAULT_PARAMETERS)
        }
      } catch (error) {
        console.error("Failed to load parameters:", error)
        setParameters(DEFAULT_PARAMETERS)
      } finally {
        setLoadingParameters(false)
      }
    }

    loadParameters()
  }, [user])

  // Profile management handlers
  const handleApplyProfile = useCallback(async (profileId: string) => {
    if (!user) {
      toast.error("Please sign in to use profiles")
      return
    }

    try {
      const response = await fetch(`/api/header-profiles/${profileId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        toast.error(`Failed to apply profile: ${response.status} ${response.statusText}`)
        return
      }

      let data
      try {
        const text = await response.text()
        if (!text || text.trim().length === 0) {
          console.error("Empty response from server")
          toast.error("Failed to apply profile: Empty response from server")
          return
        }
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError)
        toast.error("Failed to apply profile: Invalid response from server")
        return
      }
      
      if (response.ok && data.config) {
        // Use default parameters if profile has none, otherwise use profile parameters
        const profileParams = data.config.parameters && data.config.parameters.length > 0
          ? data.config.parameters
          : DEFAULT_PARAMETERS
        
        setParameters(profileParams)
        setCustomHeaders(data.config.customHeaders || [])
        // Load X-header removal setting from processing config (default to true if not set)
        setRemoveXHeaders(
          data.config.processingConfig?.removeXHeaders !== undefined
            ? (data.config.processingConfig.removeXHeaders as boolean)
            : true
        )
        // Load List-Unsubscribe setting from processing config (default to true if not set)
        setAddListUnsubscribe(
          data.config.processingConfig?.addListUnsubscribe !== undefined
            ? (data.config.processingConfig.addListUnsubscribe as boolean)
            : true
        )
        // Load Date header replacement setting from processing config (default to false if not set)
        setReplaceDateHeader(
          data.config.processingConfig?.replaceDateHeader !== undefined
            ? (data.config.processingConfig.replaceDateHeader as boolean)
            : false
        )
        setCurrentProfileId(profileId)
        setHasUnsavedChanges(false)
        toast.success("Profile applied successfully")
      } else {
        const errorMessage = data?.error || `Failed to apply profile: ${response.status} ${response.statusText}`
        console.error("Failed to apply profile:", errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Failed to apply profile:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to apply profile"
      toast.error(errorMessage)
    }
  }, [user])

  // Load profiles from user profile
  useEffect(() => {
    const loadProfiles = async () => {
      if (!user) {
        setProfiles([])
        return
      }

      setLoadingProfiles(true)
      try {
        const response = await fetch("/api/header-profiles")
        if (response.ok) {
          const data = await response.json()
          if (data.profiles && data.profiles.length > 0) {
            setProfiles(data.profiles)
            // Load default profile if exists
            const defaultProfile = data.profiles.find((p: { is_default: boolean }) => p.is_default)
            if (defaultProfile) {
              handleApplyProfile(defaultProfile.id)
            }
          }
        } else if (response.status === 401) {
          setProfiles([])
        }
      } catch (error) {
        console.error("Failed to load profiles:", error)
        setProfiles([])
      } finally {
        setLoadingProfiles(false)
      }
    }

    loadProfiles()
  }, [user, handleApplyProfile])

  // Process email with custom parameters
  const processEmail = useCallback(
    (input: string): string => {
      const lines = input.split("\n")
      const outputLines: string[] = []
      let inHeader = true
      let boundary = ""

      const contentTypeMatch = input.match(/boundary=["']?([^"'\s]+)["']?/i)
      if (contentTypeMatch) {
        boundary = contentTypeMatch[1]
      }

      // Headers to remove: DKIM, SPF, ARC, Return-Path, and delivery params
      const fieldsToRemove = [
        "DKIM-Signature:",
        "Received-SPF:",
        "Authentication-Results:",
        "ARC-Seal:",
        "ARC-Message-Signature:",
        "ARC-Authentication-Results:",
        "Return-Path:",
        "Delivered-To:",
        "Received: by",
      ]

      // Conditionally add X-headers to removal list
      if (removeXHeaders) {
        fieldsToRemove.push("X-Received:", "X-original-To")
      }

      // Headers to skip (will be replaced with new ones)
      const headersToSkip = ["List-Unsubscribe:", "List-Unsubscribe-Post:"]

      // Get placeholder values from parameters
      const toPlaceholder = parameters.find((p) => p.name === "To Address")?.placeholder || "[*to]"
      const rpathPlaceholder =
        parameters.find((p) => p.name === "Return Path Domain")?.placeholder || "[P_RPATH]"
      const eidPlaceholder = parameters.find((p) => p.name === "Email ID")?.placeholder || "[EID]"
      const rndsPlaceholder =
        parameters.find((p) => p.name === "Random String")?.placeholder || "[RNDS]"

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
          // Check if this is an X-header that should be removed
          if (removeXHeaders && /^X-/i.test(line.trim())) {
            // Skip continuation lines
            while (
              i + 1 < lines.length &&
              (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
            ) {
              i++
            }
            continue
          }

          // Skip headers that should be removed (including continuation lines)
          if (
            fieldsToRemove.some((field) => line.toLowerCase().startsWith(field.toLowerCase()))
          ) {
            // Skip continuation lines
            while (
              i + 1 < lines.length &&
              (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
            ) {
              i++
            }
            continue
          }

          // Skip headers that will be replaced (including continuation lines)
          if (
            headersToSkip.some((field) => line.toLowerCase().startsWith(field.toLowerCase()))
          ) {
            // Skip continuation lines
            while (
              i + 1 < lines.length &&
              (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
            ) {
              i++
            }
            continue
          }

          if (line.startsWith("Received: from")) {
            outputLines.push(line)
            while (
              i + 1 < lines.length &&
              (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
            ) {
              i++
              outputLines.push(lines[i].trimEnd())
            }
          } else if (line.startsWith("To:")) {
            // Always modify To: to use the placeholder
            outputLines.push(`To: ${toPlaceholder}`)
          } else if (line.startsWith("From:")) {
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

              outputLines.push(`From: "${cleanName}" <${localPart}@${rpathPlaceholder}>`)
            } else {
              outputLines.push(`From: <noreply@${rpathPlaceholder}>`)
            }
          } else if (line.toLowerCase().startsWith("message-id:")) {
            const m = line.match(/^Message-Id:\s*(<)?([^>]+?)(>)?\s*$/i)
            let idVal = m ? m[2] : line.replace(/Message-Id:/i, "").trim()
            idVal = idVal.trim()

            let domain = rndsPlaceholder
            let localPart = idVal

            if (idVal.includes("@")) {
              const parts = idVal.split("@")
              localPart = parts[0]
              domain = parts[1]
            }

            if (!localPart.includes(eidPlaceholder)) {
              const mid = Math.floor(localPart.length / 2) || 0
              localPart = localPart.slice(0, mid) + eidPlaceholder + localPart.slice(mid)
            }

            const newMsgId = `<${localPart}@${domain}>`
            outputLines.push(`Message-ID: ${newMsgId}`)
          } else if (line.startsWith("Content-Type:")) {
            outputLines.push(line)
            while (
              i + 1 < lines.length &&
              (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
            ) {
              i++
              outputLines.push(lines[i].trimEnd())
            }
          } else if (line.startsWith("Date:")) {
            // Handle Date header based on replaceDateHeader setting
            if (replaceDateHeader) {
              // Replace with placeholder
              outputLines.push("Date: [*date]")
              // Skip continuation lines if any
              while (
                i + 1 < lines.length &&
                (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
              ) {
                i++
              }
            } else {
              // Keep original Date header with continuation lines
              outputLines.push(line)
              while (
                i + 1 < lines.length &&
                (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))
              ) {
                i++
                outputLines.push(lines[i].trimEnd())
              }
            }
          } else if (
            line.startsWith("MIME-Version:") ||
            line.startsWith("Subject:") ||
            line.startsWith("Reply-To:") ||
            line.startsWith("Content-Transfer-Encoding:")
          ) {
            outputLines.push(line)
          } else if (!line.startsWith("Cc:")) {
            // Keep other headers except Cc (which we skip)
            outputLines.push(line)
          }
        } else {
          outputLines.push(line)
        }
      }

      // Find insertion point after From: header
      const fromIndex = outputLines.findIndex((line) => line.startsWith("From:"))
      const insertIndex =
        fromIndex !== -1
          ? fromIndex + 1
          : outputLines.findIndex((line) => line === "") !== -1
            ? outputLines.findIndex((line) => line === "")
            : outputLines.length

      // Add List-Unsubscribe headers if enabled
      const headersToInsert: string[] = []
      if (addListUnsubscribe) {
        headersToInsert.push(
          `List-Unsubscribe: <mailto:unsubscribe@${rpathPlaceholder}>, <http://${rpathPlaceholder}/unsubscribe?email=abuse@${rpathPlaceholder}>`,
          "List-Unsubscribe-Post: List-Unsubscribe=One-Click"
        )
      }

      // Process and add custom headers
      const processedCustomHeaders = customHeaders.map((header) => {
        let processedHeader = header
        // Replace all parameter placeholders with their values
        parameters.forEach((param) => {
          processedHeader = processedHeader.replace(
            new RegExp(param.placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            param.placeholder
          )
        })
        // Also replace the default placeholders if they're not in parameters
        processedHeader = processedHeader.replace(/\[\*to\]/g, toPlaceholder)
        processedHeader = processedHeader.replace(/\[P_RPATH\]/g, rpathPlaceholder)
        processedHeader = processedHeader.replace(/\[EID\]/g, eidPlaceholder)
        processedHeader = processedHeader.replace(/\[RNDS\]/g, rndsPlaceholder)
        return processedHeader
      })

      // Combine standard headers and custom headers
      const allHeadersToInsert = [...headersToInsert, ...processedCustomHeaders]

      if (insertIndex !== -1) {
        outputLines.splice(insertIndex, 0, ...allHeadersToInsert)
      }

      return outputLines.join("\n")
    },
    [parameters, customHeaders, removeXHeaders, addListUnsubscribe, replaceDateHeader]
  )

  const handleFilesUpload = useCallback(
    async (fileList: FileList) => {
      // Accept text-based files (.eml, .txt, and other text files)
      const textFileExtensions = [".eml", ".txt", ".text", ".msg", ".email"]
      const fileArray = Array.from(fileList).filter((file) => {
        const fileName = file.name.toLowerCase()
        return (
          textFileExtensions.some((ext) => fileName.endsWith(ext)) ||
          file.type.startsWith("text/")
        )
      })

      if (fileArray.length === 0) {
        toast.error("Please upload text-based files (.eml, .txt, etc.)")
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

          newFiles.push({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            originalContent: content,
            processedContent: "",
            status: "pending",
          })
        } catch {
          console.error(`Failed to read ${file.name}`)
        }
      }

      setFiles((prev) => [...prev, ...newFiles])
      if (newFiles.length > 0 && !selectedFileId) {
        setSelectedFileId(newFiles[0].id)
      }
    },
    [selectedFileId]
  )

  const handleProcessAll = useCallback(async () => {
    if (files.length === 0) {
      toast.error("Please upload files first")
      return
    }

    setProcessing(true)

    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === "completed") continue

      updatedFiles[i].status = "processing"
      setFiles([...updatedFiles])

      await new Promise((resolve) => setTimeout(resolve, 50))

      try {
        const processed = processEmail(updatedFiles[i].originalContent)
        updatedFiles[i].processedContent = processed
        updatedFiles[i].status = "completed"
      } catch {
        updatedFiles[i].status = "error"
      }

      setFiles([...updatedFiles])
    }

    setProcessing(false)
    toast.success("All files processed successfully!")
  }, [files, processEmail])

  const handleDownloadAll = useCallback(async () => {
    const completedFiles = files.filter((f) => f.status === "completed")

    if (completedFiles.length === 0) {
      toast.error("No processed files to download")
      return
    }

    try {
      const zip = new JSZip()

      // Add all processed files to the zip
      completedFiles.forEach((file) => {
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
        const fileName = `processed-${baseName}.txt`
        zip.file(fileName, file.processedContent)
      })

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" })

      // Create download link
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `processed-headers-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${completedFiles.length} files as ZIP`)
    } catch (error) {
      console.error("Failed to create zip file:", error)
      toast.error("Failed to create zip file. Please try again.")
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
      // Extract file extension and replace with .txt
      const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
      a.download = `processed-${baseName}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded: ${file.name}`)
    },
    [files]
  )

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      if (selectedFileId === fileId) {
        const remainingFiles = files.filter((f) => f.id !== fileId)
        setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null)
      }
    },
    [files, selectedFileId]
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
    [handleFilesUpload]
  )

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  // Parameter management handlers
  const handleAddParameter = useCallback(() => {
    if (!newParameterName.trim() || !newParameterPlaceholder.trim()) {
      toast.error("Please enter parameter name and placeholder")
      return
    }

    const newParam: HeaderParameter = {
      id: `new-${Date.now()}`,
      name: newParameterName.trim(),
      placeholder: newParameterPlaceholder.trim(),
      description: newParameterDescription.trim() || null,
      isNew: true,
    }

    setParameters((prev) => [...prev, newParam])
    setNewParameterName("")
    setNewParameterPlaceholder("")
    setNewParameterDescription("")
    setHasUnsavedChanges(true)
    toast.success("Parameter added")
  }, [newParameterName, newParameterPlaceholder, newParameterDescription])

  const handleEditParameter = useCallback((param: HeaderParameter) => {
    setEditingParameter({ ...param })
  }, [])

  const handleUpdateParameter = useCallback(() => {
    if (!editingParameter) return

    if (!editingParameter.name.trim() || !editingParameter.placeholder.trim()) {
      toast.error("Please enter parameter name and placeholder")
      return
    }

    setParameters((prev) =>
      prev.map((p) =>
        p.id === editingParameter.id
          ? {
              ...editingParameter,
              name: editingParameter.name.trim(),
              placeholder: editingParameter.placeholder.trim(),
              description: editingParameter.description?.trim() || null,
            }
          : p
      )
    )
    setEditingParameter(null)
    setHasUnsavedChanges(true)
    toast.success("Parameter updated")
  }, [editingParameter])

  const handleDeleteParameter = useCallback((paramId: string) => {
    setParameters((prev) => prev.filter((p) => p.id !== paramId))
    setHasUnsavedChanges(true)
    toast.success("Parameter removed")
  }, [])

  const handleSaveParameters = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to save parameters to your profile")
      return
    }

    setSavingParameters(true)

    try {
      // First, delete all existing parameters
      const existingResponse = await fetch("/api/header-parameters")
      if (existingResponse.ok) {
        const existingData = await existingResponse.json()
        for (const param of existingData.parameters || []) {
          await fetch(`/api/header-parameters/${param.id}`, {
            method: "DELETE",
          })
        }
      }

      // Then, create all current parameters
      for (const param of parameters) {
        await fetch("/api/header-parameters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: param.name,
            placeholder: param.placeholder,
            description: param.description,
          }),
        })
      }

      setHasUnsavedChanges(false)
      toast.success("Parameters saved to your profile!")
    } catch (error) {
      console.error("Failed to save parameters:", error)
      toast.error("Failed to save parameters. Please try again.")
    } finally {
      setSavingParameters(false)
    }
  }, [user, parameters])

  const handleResetToDefaults = useCallback(() => {
    setParameters(DEFAULT_PARAMETERS)
    setCustomHeaders([])
    setRemoveXHeaders(true)
    setAddListUnsubscribe(true)
    setReplaceDateHeader(false)
    setHasUnsavedChanges(true)
    toast.success("Reset to default parameters")
  }, [])

  const handleSaveAsProfile = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to save profiles")
      return
    }

    if (!newProfileName.trim()) {
      toast.error("Please enter a profile name")
      return
    }

    setSavingProfile(true)
    try {
      const parameterIds = parameters.map((p) => p.id).filter((id) => !id.startsWith("default-") && !id.startsWith("new-"))
      
      const response = await fetch("/api/header-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName.trim(),
          description: newProfileDescription.trim() || null,
          custom_headers: customHeaders,
          processing_config: {
            removeXHeaders: removeXHeaders,
            addListUnsubscribe: addListUnsubscribe,
            replaceDateHeader: replaceDateHeader,
          },
          parameter_ids: parameterIds,
          is_default: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfiles((prev) => [...prev, data.profile])
        setNewProfileName("")
        setNewProfileDescription("")
        setShowProfilesDialog(false)
        setHasUnsavedChanges(false)
        toast.success("Profile saved successfully!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to save profile")
      }
    } catch (error) {
      console.error("Failed to save profile:", error)
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setSavingProfile(false)
    }
  }, [user, parameters, customHeaders, removeXHeaders, addListUnsubscribe, replaceDateHeader, newProfileName, newProfileDescription])

  const handleDeleteProfile = useCallback(async (profileId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/header-profiles/${profileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId))
        if (currentProfileId === profileId) {
          setCurrentProfileId(null)
          setParameters(DEFAULT_PARAMETERS)
          setCustomHeaders([])
        }
        toast.success("Profile deleted successfully")
      } else {
        toast.error("Failed to delete profile")
      }
    } catch (error) {
      console.error("Failed to delete profile:", error)
      toast.error("Failed to delete profile")
    }
  }, [user, currentProfileId])

  const stats = useMemo(() => {
    const total = files.length
    const completed = files.filter((f) => f.status === "completed").length
    const pending = files.filter((f) => f.status === "pending").length
    const processingCount = files.filter((f) => f.status === "processing").length
    const error = files.filter((f) => f.status === "error").length

    return { total, completed, pending, processing: processingCount, error }
  }, [files])

  // Determine if individual downloads should be disabled
  const disableIndividualDownloads = stats.completed > MAX_INDIVIDUAL_DOWNLOADS

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg border border-border">
              <FileText className="text-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Email Header Processor - Batch Mode
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Process unlimited text-based files at once (.eml, .txt, etc.)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {user && profiles.length > 0 && (
              <Select
                value={currentProfileId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setCurrentProfileId(null)
                    setParameters(DEFAULT_PARAMETERS)
                    setCustomHeaders([])
                  } else if (value === "manage") {
                    setShowProfilesDialog(true)
                  } else {
                    handleApplyProfile(value)
                  }
                }}
              >
                <SelectTrigger className="w-[180px] gap-2">
                  <Bookmark size={14} />
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Profile</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                      {profile.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                  <SelectItem value="manage">Manage Profiles...</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              onClick={() => setShowParametersDialog(true)}
              className="gap-2"
              aria-label="Configure header parameters"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">Parameters</span>
              {hasUnsavedChanges && (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </Button>
            {user && (
              <Button
                variant="outline"
                onClick={() => setShowProfilesDialog(true)}
                className="gap-2"
                aria-label="Manage profiles"
              >
                <BookmarkCheck size={16} />
                <span className="hidden sm:inline">Profiles</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowGuideDialog(true)}
              className="gap-2"
              aria-label="View guide"
            >
              <HelpCircle size={16} />
              <span className="hidden sm:inline">Guide</span>
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <Card className="mb-4 p-4 border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 text-sm">
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
              </div>
              {disableIndividualDownloads && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <FileArchive size={14} />
                  <span>
                    More than {MAX_INDIVIDUAL_DOWNLOADS} files — download as ZIP only
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FolderOpen size={20} />
                Files ({files.length})
              </h2>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    asChild
                  >
                    <span>
                      <Upload size={16} />
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".eml,.txt,.text,.msg,.email,text/*"
                    multiple
                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                    className="hidden"
                    aria-label="Upload files"
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={files.length === 0}
                  aria-label="Clear all files"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
              role="region"
              aria-label="Drop zone for file upload"
            >
              <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium mb-1">Drop text files here</p>
              <p className="text-xs text-muted-foreground">(.eml, .txt, .text, .msg, .email)</p>
              <p className="text-xs text-muted-foreground mt-1">or click the upload button above</p>
              <p className="text-xs text-muted-foreground mt-2">
                Upload as many files as you want
              </p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {files.map((file) => (
                <Card
                  key={file.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedFileId === file.id
                      ? "border-primary bg-accent"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => setSelectedFileId(file.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedFileId(file.id)
                    }
                  }}
                  role="button"
                  aria-label={`Select file ${file.name}`}
                  aria-pressed={selectedFileId === file.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.status === "completed" && (
                        <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                      )}
                      {file.status === "pending" && (
                        <Clock size={16} className="text-yellow-400 shrink-0" />
                      )}
                      {file.status === "processing" && (
                        <RefreshCw size={16} className="text-blue-400 animate-spin shrink-0" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle size={16} className="text-red-400 shrink-0" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {file.status === "completed" && !disableIndividualDownloads && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadSingle(file.id)
                          }}
                          className="h-7 w-7 p-0"
                          aria-label={`Download ${file.name}`}
                        >
                          <Download size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile(file.id)
                        }}
                        className="h-7 w-7 p-0"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Button
                  onClick={handleProcessAll}
                  disabled={processing || stats.pending === 0}
                  className="w-full gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Process All Files
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownloadAll}
                  disabled={stats.completed === 0}
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                >
                  <FileArchive size={16} />
                  Download All as ZIP ({stats.completed})
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Code2 size={20} />
                {pasteMode ? "Paste & Process" : selectedFile ? selectedFile.name : "Preview"}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={pasteMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPasteMode(!pasteMode)
                    if (pasteMode) {
                      setPastedContent("")
                      setPastedProcessedContent("")
                    }
                  }}
                  className="gap-2"
                  aria-label={pasteMode ? "Switch to file mode" : "Switch to paste mode"}
                >
                  {pasteMode ? <FileText size={16} /> : <FileText size={16} />}
                  <span className="hidden sm:inline">{pasteMode ? "File Mode" : "Paste Mode"}</span>
                </Button>
                {pasteMode && pastedProcessedContent && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(pastedProcessedContent)}
                      className="gap-2"
                      aria-label="Copy processed content to clipboard"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([pastedProcessedContent], { type: "text/plain" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `processed-paste-${Date.now()}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        toast.success("Downloaded processed content")
                      }}
                      className="gap-2"
                      aria-label="Download processed content"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </>
                )}
                {!pasteMode && selectedFile && selectedFile.status === "completed" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedFile.processedContent)}
                      className="gap-2"
                      aria-label="Copy processed content to clipboard"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    {!disableIndividualDownloads && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSingle(selectedFile.id)}
                        className="gap-2"
                        aria-label="Download processed file"
                      >
                        <Download size={16} />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {pasteMode ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Paste Email Content</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPastedContent("")
                        setPastedProcessedContent("")
                      }}
                      disabled={!pastedContent && !pastedProcessedContent}
                      aria-label="Clear pasted content"
                    >
                      <Trash2 size={14} />
                      <span className="ml-1">Clear</span>
                    </Button>
                  </div>
                  <textarea
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder="Paste your email content here..."
                    className="w-full h-[300px] p-4 font-mono text-xs bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Paste email content"
                  />
                  <Button
                    onClick={async () => {
                      if (!pastedContent.trim()) {
                        toast.error("Please paste some content first")
                        return
                      }
                      setPastedProcessing(true)
                      try {
                        await new Promise((resolve) => setTimeout(resolve, 50))
                        const processed = processEmail(pastedContent)
                        setPastedProcessedContent(processed)
                        toast.success("Content processed successfully!")
                      } catch (error) {
                        console.error("Processing error:", error)
                        toast.error("Failed to process content")
                      } finally {
                        setPastedProcessing(false)
                      }
                    }}
                    disabled={!pastedContent.trim() || pastedProcessing}
                    className="w-full mt-2 gap-2"
                  >
                    {pastedProcessing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Process Pasted Content
                      </>
                    )}
                  </Button>
                </div>
                {pastedProcessedContent && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Processed Result</h3>
                    <pre className="w-full h-[300px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap wrap-break-word">
                      <code className="text-foreground">{pastedProcessedContent}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Original</h3>
                  <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap wrap-break-word">
                    {selectedFile ? (
                      <code className="text-foreground">{selectedFile.originalContent}</code>
                    ) : (
                      <code className="text-muted-foreground">No file selected</code>
                    )}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Processed</h3>
                  <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap wrap-break-word">
                    {selectedFile ? (
                      <code className="text-foreground">{selectedFile.processedContent}</code>
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

      {/* Parameters Dialog */}
      <Dialog open={showParametersDialog} onOpenChange={setShowParametersDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 size={20} />
              Header Parameters
            </DialogTitle>
            <DialogDescription>
              Configure custom placeholders used when processing email headers.
              {user
                ? " Parameters will be saved to your profile."
                : " Sign in to save parameters to your profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing Parameters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Parameters</Label>
              {loadingParameters ? (
                <DialogSkeleton />
              ) : (
                <div className="space-y-2">
                  {parameters.map((param) => (
                    <div
                      key={param.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                    >
                      {editingParameter?.id === param.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Parameter name"
                              value={editingParameter.name}
                              onChange={(e) =>
                                setEditingParameter({
                                  ...editingParameter,
                                  name: e.target.value,
                                })
                              }
                              aria-label="Parameter name"
                            />
                            <Input
                              placeholder="Placeholder e.g., [*to]"
                              value={editingParameter.placeholder}
                              onChange={(e) =>
                                setEditingParameter({
                                  ...editingParameter,
                                  placeholder: e.target.value,
                                })
                              }
                              aria-label="Placeholder value"
                            />
                          </div>
                          <Input
                            placeholder="Description (optional)"
                            value={editingParameter.description || ""}
                            onChange={(e) =>
                              setEditingParameter({
                                ...editingParameter,
                                description: e.target.value,
                              })
                            }
                            aria-label="Parameter description"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleUpdateParameter}
                              aria-label="Save changes"
                            >
                              <Check size={14} className="mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingParameter(null)}
                              aria-label="Cancel editing"
                            >
                              <X size={14} className="mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{param.name}</span>
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                                {param.placeholder}
                              </code>
                            </div>
                            {param.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {param.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditParameter(param)}
                              className="h-7 w-7 p-0"
                              aria-label={`Edit ${param.name}`}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParameter(param.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              aria-label={`Delete ${param.name}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {parameters.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No parameters defined. Add one below or reset to defaults.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add New Parameter */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium">Add New Parameter</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Parameter name"
                  value={newParameterName}
                  onChange={(e) => setNewParameterName(e.target.value)}
                  aria-label="New parameter name"
                />
                <Input
                  placeholder="Placeholder e.g., [CUSTOM]"
                  value={newParameterPlaceholder}
                  onChange={(e) => setNewParameterPlaceholder(e.target.value)}
                  aria-label="New placeholder value"
                />
              </div>
              <Input
                placeholder="Description (optional)"
                value={newParameterDescription}
                onChange={(e) => setNewParameterDescription(e.target.value)}
                aria-label="New parameter description"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                disabled={!newParameterName.trim() || !newParameterPlaceholder.trim()}
                className="w-full gap-2"
              >
                <Plus size={14} />
                Add Parameter
              </Button>
            </div>

            {/* Processing Options */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium">Processing Options</Label>
              
              {/* X-Header Removal Option */}
              <div className="flex items-center space-x-2 rounded-lg border bg-card p-3">
                <Checkbox
                  id="remove-x-headers"
                  checked={removeXHeaders}
                  onChange={(e) => {
                    setRemoveXHeaders(e.target.checked)
                    setHasUnsavedChanges(true)
                  }}
                  label="Remove all X-headers"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                When enabled, all headers starting with "X-" (e.g., X-Received, X-Original-To, X-Mailer) will be removed during processing.
              </p>
              
              {/* List-Unsubscribe Option */}
              <div className="flex items-center space-x-2 rounded-lg border bg-card p-3">
                <Checkbox
                  id="add-list-unsubscribe"
                  checked={addListUnsubscribe}
                  onChange={(e) => {
                    setAddListUnsubscribe(e.target.checked)
                    setHasUnsavedChanges(true)
                  }}
                  label="Add List-Unsubscribe headers"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                When enabled, List-Unsubscribe and List-Unsubscribe-Post headers will be added to processed emails.
              </p>
              
              {/* Date Header Replacement Option */}
              <div className="flex items-center space-x-2 rounded-lg border bg-card p-3">
                <Checkbox
                  id="replace-date-header"
                  checked={replaceDateHeader}
                  onChange={(e) => {
                    setReplaceDateHeader(e.target.checked)
                    setHasUnsavedChanges(true)
                  }}
                  label="Replace Date header with [*date]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, the original Date header will be replaced with "Date: [*date]". When disabled, the original Date header is kept.
              </p>
            </div>

            {/* Custom Headers Section */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-medium">Custom Headers</Label>
              <p className="text-xs text-muted-foreground">
                Add custom headers that will be inserted into processed emails. You can use placeholders like [*to], [P_RPATH], etc.
              </p>
              <div className="space-y-2">
                {customHeaders.map((header, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    {editingCustomHeader?.index === index ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editingCustomHeader.value}
                          onChange={(e) =>
                            setEditingCustomHeader({
                              index,
                              value: e.target.value,
                            })
                          }
                          placeholder="e.g., Cc: [*to]"
                          className="flex-1"
                          aria-label="Edit custom header"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (editingCustomHeader.value.trim()) {
                              const updated = [...customHeaders]
                              updated[index] = editingCustomHeader.value.trim()
                              setCustomHeaders(updated)
                              setHasUnsavedChanges(true)
                              setEditingCustomHeader(null)
                              toast.success("Custom header updated")
                            }
                          }}
                          aria-label="Save custom header"
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCustomHeader(null)}
                          aria-label="Cancel editing"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono">
                          {header}
                        </code>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCustomHeader({ index, value: header })}
                            className="h-7 w-7 p-0"
                            aria-label={`Edit ${header}`}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomHeaders(customHeaders.filter((_, i) => i !== index))
                              setHasUnsavedChanges(true)
                              toast.success("Custom header removed")
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            aria-label={`Delete ${header}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {customHeaders.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No custom headers. Add one below.
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Cc: [*to]"
                  value={newCustomHeader}
                  onChange={(e) => setNewCustomHeader(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCustomHeader.trim()) {
                      setCustomHeaders([...customHeaders, newCustomHeader.trim()])
                      setNewCustomHeader("")
                      setHasUnsavedChanges(true)
                      toast.success("Custom header added")
                    }
                  }}
                  aria-label="New custom header"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newCustomHeader.trim()) {
                      setCustomHeaders([...customHeaders, newCustomHeader.trim()])
                      setNewCustomHeader("")
                      setHasUnsavedChanges(true)
                      toast.success("Custom header added")
                    }
                  }}
                  disabled={!newCustomHeader.trim()}
                  className="gap-2"
                >
                  <Plus size={14} />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              className="gap-2"
            >
              <RefreshCw size={14} />
              Reset to Defaults
            </Button>
            <div className="flex-1" />
            {user && (
              <Button
                onClick={handleSaveParameters}
                disabled={savingParameters || !hasUnsavedChanges}
                className="gap-2"
              >
                {savingParameters ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save to Profile
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profiles Dialog */}
      <Dialog open={showProfilesDialog} onOpenChange={setShowProfilesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkCheck size={20} />
              Header Processing Profiles
            </DialogTitle>
            <DialogDescription>
              Save and manage different header processing configurations as profiles.
              {!user && " Sign in to create and manage profiles."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing Profiles */}
            {user && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Saved Profiles</Label>
                {loadingProfiles ? (
                  <DialogSkeleton />
                ) : (
                  <div className="space-y-2">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{profile.name}</span>
                            {profile.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          {profile.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {profile.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleApplyProfile(profile.id)
                              setShowProfilesDialog(false)
                            }}
                            className="h-7 px-2"
                            aria-label={`Apply ${profile.name}`}
                          >
                            Apply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            aria-label={`Delete ${profile.name}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {profiles.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No profiles saved. Create one below.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Save Current Configuration as Profile */}
            {user && (
              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-medium">Save Current Configuration as Profile</Label>
                <Input
                  placeholder="Profile name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  aria-label="New profile name"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  aria-label="New profile description"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAsProfile}
                  disabled={!newProfileName.trim() || savingProfile}
                  className="w-full gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            )}

            {!user && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Please sign in to create and manage profiles.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfilesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* App Guide Dialog */}
      <AppGuide open={showGuideDialog} onOpenChange={setShowGuideDialog} />
    </div>
  )
}

export default EmailHeaderProcessor
