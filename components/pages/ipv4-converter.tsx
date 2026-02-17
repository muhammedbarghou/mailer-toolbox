"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Network, Copy, Check, ClipboardList, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface ConversionResult {
  original: string
  valid: boolean
  ipv4: string
  integer: string
  hex: string
  ipv6Short: string
  ipv6Long: string
}

type CopyState = Record<string, boolean>

const validateIPv4 = (ip: string): boolean => {
  const trimmed = ip.trim()
  const parts = trimmed.split(".")
  if (parts.length !== 4) return false

  for (const part of parts) {
    if (part === "") return false
    if (!/^\d+$/.test(part)) return false
    if (part.length > 1 && part.startsWith("0")) return false
    const num = Number(part)
    if (num < 0 || num > 255) return false
  }

  return true
}

const convertIPv4 = (ip: string): ConversionResult => {
  const trimmed = ip.trim()

  if (!validateIPv4(trimmed)) {
    return {
      original: trimmed,
      valid: false,
      ipv4: "",
      integer: "",
      hex: "",
      ipv6Short: "",
      ipv6Long: "",
    }
  }

  const octets = trimmed.split(".").map(Number)
  const [o1, o2, o3, o4] = octets

  const intValue = o1 * 16777216 + o2 * 65536 + o3 * 256 + o4

  const hexOctets = octets.map((o) => o.toString(16).toUpperCase().padStart(2, "0"))
  const hexValue = `0x${hexOctets.join("")}`

  const hexGroup1 = ((o1 << 8) | o2).toString(16).padStart(4, "0")
  const hexGroup2 = ((o3 << 8) | o4).toString(16).padStart(4, "0")

  const ipv6Short = `::ffff:${hexGroup1}:${hexGroup2}`
  const ipv6Long = `0000:0000:0000:0000:0000:ffff:${hexGroup1}:${hexGroup2}`

  return {
    original: trimmed,
    valid: true,
    ipv4: trimmed,
    integer: intValue.toString(),
    hex: hexValue,
    ipv6Short,
    ipv6Long,
  }
}

const formatResultText = (result: ConversionResult, wrapBrackets: boolean): string => {
  const ipv6LongVal = wrapBrackets ? `[${result.ipv6Long}]` : result.ipv6Long
  return [
    `IPv4:         ${result.ipv4}`,
    `Integer:      ${result.integer}`,
    `Hex:          ${result.hex}`,
    `IPv6 (short): ${result.ipv6Short}`,
    `IPv6 (long):  ${ipv6LongVal}`,
  ].join("\n")
}

const IPv4Converter = () => {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<ConversionResult[]>([])
  const [wrapBrackets, setWrapBrackets] = useState(false)
  const [copyStates, setCopyStates] = useState<CopyState>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const validResults = results.filter((r) => r.valid)

  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStates((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: false }))
      }, 1500)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  const handleConvert = useCallback(() => {
    const lines = input.split("\n")
    const converted = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => convertIPv4(line))

    if (converted.length === 0) {
      toast.error("Please enter at least one IPv4 address")
      return
    }

    setResults(converted)

    const validCount = converted.filter((r) => r.valid).length
    const invalidCount = converted.length - validCount

    if (invalidCount > 0) {
      toast.warning(`Converted ${validCount} IP${validCount !== 1 ? "s" : ""}, ${invalidCount} invalid`)
    } else {
      toast.success(`Converted ${validCount} IP address${validCount !== 1 ? "es" : ""}`)
    }
  }, [input])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleConvert()
      }
    },
    [handleConvert]
  )

  const handleCopyAll = useCallback(() => {
    if (validResults.length === 0) return

    const allText = validResults
      .map((r) => formatResultText(r, wrapBrackets))
      .join("\n\n")

    handleCopy(allText, "copy-all-results")
    toast.success("All results copied to clipboard")
  }, [validResults, wrapBrackets, handleCopy])

  const handleCopyCardAll = useCallback(
    (result: ConversionResult, index: number) => {
      const text = formatResultText(result, wrapBrackets)
      handleCopy(text, `card-all-${index}`)
    },
    [wrapBrackets, handleCopy]
  )

  // Shared formatter for both display and copy — split into separate
  // functions if display vs. clipboard formatting ever needs to diverge.
  const getFormattedValue = useCallback(
    (format: string, value: string): string => {
      if (format === "ipv6Long" && wrapBrackets) {
        return `[${value}]`
      }
      return value
    },
    [wrapBrackets]
  )

  const formats: { key: keyof ConversionResult; label: string }[] = [
    { key: "ipv4", label: "IPv4" },
    { key: "integer", label: "Integer" },
    { key: "hex", label: "Hex" },
    { key: "ipv6Short", label: "IPv6 (short)" },
    { key: "ipv6Long", label: "IPv6 (long)" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Network className="w-10 h-10 text-chart-1" />
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              IPv4 Converter
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Convert IPv4 addresses to Integer, Hex, IPv6 and more
          </p>
        </div>

        {/* Input Area */}
        <Card className="bg-card border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-chart-1">Input</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter one or more IPv4 addresses, one per line
              </p>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Enter IPv4 addresses (one per line)\n212.8.253.104\n212.8.253.108\n212.8.253.109\n\nPress Ctrl+Enter to convert"}
            className="w-full h-48 bg-muted border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            aria-label="IPv4 address input"
            tabIndex={0}
          />

          <div className="flex items-center gap-4">
            <Button onClick={handleConvert} size="lg">
              <Network className="w-5 h-5 mr-2" />
              Convert
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Ctrl+Enter to convert
            </span>
          </div>
        </Card>

        {/* Results Controls */}
        {results.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label
              className="flex items-center gap-2 cursor-pointer select-none"
              htmlFor="wrap-brackets"
            >
              <input
                id="wrap-brackets"
                type="checkbox"
                checked={wrapBrackets}
                onChange={(e) => setWrapBrackets(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring accent-primary"
                aria-label="Wrap IPv6 (long) in square brackets"
              />
              <span className="text-sm text-foreground">
                Wrap IPv6 (long) in [ ]
              </span>
            </label>

            {validResults.length > 0 && (
              <Button
                onClick={handleCopyAll}
                variant="outline"
                size="sm"
              >
                {copyStates["copy-all-results"] ? (
                  <Check className="w-4 h-4 mr-2 text-chart-2" />
                ) : (
                  <ClipboardList className="w-4 h-4 mr-2" />
                )}
                Copy All Results
              </Button>
            )}
          </div>
        )}

        {/* Result Cards */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card
                key={`${result.original}-${index}`}
                className={`bg-card border-border p-5 space-y-3 ${
                  !result.valid ? "border-destructive/50" : ""
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-lg font-semibold"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {result.original}
                    </span>
                    {!result.valid && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Invalid
                      </Badge>
                    )}
                  </div>
                  {result.valid && (
                    <Button
                      onClick={() => handleCopyCardAll(result, index)}
                      variant="outline"
                      size="sm"
                      aria-label={`Copy all formats for ${result.original}`}
                      tabIndex={0}
                    >
                      {copyStates[`card-all-${index}`] ? (
                        <Check className="w-4 h-4 mr-2 text-chart-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy All
                    </Button>
                  )}
                </div>

                {/* Format Rows */}
                {result.valid ? (
                  <div className="space-y-1">
                    {formats.map((format) => {
                      const rawValue = result[format.key] as string
                      const formattedValue = getFormattedValue(format.key, rawValue)
                      const copyKey = `${index}-${format.key}`

                      return (
                        <div
                          key={format.key}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/60 transition-colors group"
                        >
                          <span
                            className="w-28 shrink-0 text-sm text-muted-foreground"
                            style={{ fontFamily: "'Sora', sans-serif" }}
                          >
                            {format.label}
                          </span>
                          <span
                            className="flex-1 text-sm text-foreground break-all"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {formattedValue}
                          </span>
                          <button
                            onClick={() => handleCopy(formattedValue, copyKey)}
                            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label={`Copy ${format.label} value for ${result.original}`}
                            tabIndex={0}
                          >
                            {copyStates[copyKey] ? (
                              <Check className="w-4 h-4 text-chart-2" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-3 rounded-md bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      Invalid IPv4 address
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IPv4Converter
