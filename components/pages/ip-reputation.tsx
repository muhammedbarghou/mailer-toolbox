"use client"

import { useState, useMemo } from "react"
import { ShieldAlert, ShieldCheck, Globe2, Loader2, Info, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type QueryType = "ip" | "domain" | "url"

interface AbuseIpdbReport {
  reportedAt: string
  comment: string | null
  categories: number[]
  reporterId: number
  reporterCountryCode: string | null
  reporterCountryName: string | null
}

interface AbuseIpdbCheckData {
  ipAddress: string
  isPublic: boolean
  ipVersion: number
  isWhitelisted: boolean | null
  abuseConfidenceScore: number
  countryCode: string | null
  countryName?: string | null
  usageType: string | null
  isp: string | null
  domain: string | null
  hostnames: string[]
  isTor: boolean
  totalReports: number
  numDistinctUsers: number
  lastReportedAt: string | null
  reports?: AbuseIpdbReport[]
}

interface ReputationResultItem {
  input: string
  queryType: QueryType
  value: string
  ipAddress?: string
  success: boolean
  error?: string
  data?: AbuseIpdbCheckData
}

interface ReputationResponse {
  maxAgeInDays: number
  verbose: boolean
  count: number
  results: ReputationResultItem[]
}

const getScoreColorClass = (score: number | undefined): string => {
  if (score === undefined || Number.isNaN(score)) {
    return "bg-muted text-muted-foreground"
  }

  if (score >= 75) {
    return "bg-destructive/10 text-destructive border-destructive/40"
  }

  if (score >= 25) {
    return "bg-amber-500/10 text-amber-500 border-amber-500/40"
  }

  return "bg-emerald-500/10 text-emerald-500 border-emerald-500/40"
}

const getScoreLabel = (score: number | undefined): string => {
  if (score === undefined || Number.isNaN(score)) {
    return "Unknown"
  }

  if (score >= 90) return "Highly abusive"
  if (score >= 75) return "Likely abusive"
  if (score >= 50) return "Suspicious"
  if (score >= 25) return "Some reports"
  if (score > 0) return "Low risk"
  return "No abuse reports"
}

const getUsageLabel = (usageType: string | null): string => {
  if (!usageType) return "Unknown usage"
  return usageType
}

const parseInputLines = (raw: string): string[] => {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const IPReputationTool = () => {
  const [rawInput, setRawInput] = useState("")
  const [maxAgeInDays, setMaxAgeInDays] = useState<number>(90)
  const [includeReports, setIncludeReports] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [responseData, setResponseData] = useState<ReputationResponse | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const inputItems = useMemo(() => {
    return parseInputLines(rawInput)
  }, [rawInput])

  const totalItems = inputItems.length

  const handleChangeMaxAge = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === "") {
      setMaxAgeInDays(90)
      return
    }

    const numericValue = Number(trimmed)
    if (Number.isNaN(numericValue)) {
      return
    }

    const clamped = Math.min(Math.max(Math.floor(numericValue), 1), 365)
    setMaxAgeInDays(clamped)
  }

  const handleCheckReputation = async () => {
    if (isChecking) {
      return
    }

    const items = inputItems

    if (items.length === 0) {
      toast.error("Please enter at least one IP address, domain, or URL.")
      return
    }

    if (items.length > 30) {
      toast.error("You can check up to 30 items at a time. Please reduce your list.")
      return
    }

    setIsChecking(true)
    setLastError(null)

    try {
      const response = await fetch("/api/ip-reputation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((value) => ({ input: value })),
          maxAgeInDays,
          verbose: includeReports,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to check reputation."
        try {
          const errorBody = (await response.json()) as { error?: string }
          if (errorBody?.error) {
            errorMessage = errorBody.error
          }
        } catch {
        }

        setLastError(errorMessage)
        setResponseData(null)
        toast.error(errorMessage)
        return
      }

      const data = (await response.json()) as ReputationResponse
      setResponseData(data)

      const successCount = data.results.filter((item) => item.success).length
      const failedCount = data.results.length - successCount

      if (successCount > 0 && failedCount === 0) {
        toast.success(`Reputation checked successfully for ${successCount} item${successCount === 1 ? "" : "s"}.`)
      } else if (successCount > 0 && failedCount > 0) {
        toast.success(
          `Reputation checked for ${successCount} item${successCount === 1 ? "" : "s"} (${failedCount} failed).`,
        )
      } else {
        toast.error("Failed to check reputation for all items.")
      }
    } catch (error) {
      console.error("Error checking IP reputation:", error)
      setLastError("Unexpected error while checking reputation. Please try again.")
      setResponseData(null)
      toast.error("Unexpected error while checking reputation.")
    } finally {
      setIsChecking(false)
    }
  }

  const handleClearAll = () => {
    setRawInput("")
    setResponseData(null)
    setLastError(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Globe2 className="w-9 h-9 text-chart-3" />
            <h1 className="text-3xl md:text-4xl font-bold">IP / Domain / URL Reputation Checker</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Check the abuse reputation of IP addresses, domains, or URLs in batch using AbuseIPDB. Up to{" "}
            <span className="font-semibold text-foreground">30 items</span> per request.
          </p>
        </div>

        <Card className="p-4 md:p-6 space-y-4 border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Input list</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Enter one value per line. You can paste IPs, bare domains (e.g. example.com), or full URLs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="max-age-input" className="text-xs font-medium text-muted-foreground">
                  Max age (days)
                </label>
                <Input
                  id="max-age-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  value={maxAgeInDays}
                  onChange={(event) => handleChangeMaxAge(event.target.value)}
                  className="w-20 h-8 text-xs"
                  aria-label="Maximum age in days for AbuseIPDB reports (1-365)"
                />
              </div>
              <button
                type="button"
                onClick={() => setIncludeReports(!includeReports)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                  includeReports
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-muted text-muted-foreground border-border"
                }`}
                aria-pressed={includeReports}
                aria-label="Toggle including detailed reports in results"
              >
                <Info className="w-3 h-3" />
                <span>{includeReports ? "Verbose details" : "Summary only"}</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <textarea
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
                placeholder={
                  "One item per line:\n8.8.8.8\n1.1.1.1\nexample.com\nhttps://malicious.example/path"
                }
                className="w-full h-56 md:h-64 rounded-lg border border-border bg-muted p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                aria-label="Enter IP addresses, domains, or URLs (one per line)"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    AbuseIPDB keys are server-side only. This tool cannot be used without authentication.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={rawInput.trim().length === 0 && !responseData && !lastError}
                    className="bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCheckReputation}
                    disabled={isChecking || totalItems === 0}
                    aria-label="Check reputation for the provided IPs, domains, or URLs"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Check reputation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Card className="p-3 md:p-4 space-y-3 bg-card border-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-chart-5" />
                <h3 className="text-sm font-semibold">How to interpret scores</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <span className="font-semibold text-emerald-500">0</span>{" "}
                  &ndash; No abuse reports in the selected time window.
                </li>
                <li>
                  <span className="font-semibold text-amber-500">25 &ndash; 74</span>{" "}
                  &ndash; Some abusive activity reported. Monitor or add conditional rules.
                </li>
                <li>
                  <span className="font-semibold text-destructive">75 &ndash; 100</span>{" "}
                  &ndash; Highly abusive. Safe to treat as high risk in your filters.
                </li>
                <li>
                  Scores and metadata come directly from{" "}
                  <a
                    href="https://www.abuseipdb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    AbuseIPDB
                  </a>
                  . Always combine with your own telemetry before blocking.
                </li>
              </ul>
            </Card>
          </div>
        </Card>

        {lastError && (
          <Card className="border-destructive/40 bg-destructive/5 text-destructive px-4 py-3 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <p>{lastError}</p>
          </Card>
        )}

        {responseData && (
          <Card className="p-4 md:p-6 space-y-4 border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Results</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Checked {responseData.count} item{responseData.count === 1 ? "" : "s"} with a{" "}
                  {responseData.maxAgeInDays}-day window.{" "}
                  {responseData.verbose ? "Detailed reports are included when available." : "Showing summary data only."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {responseData.results.filter((item) => item.success).length} succeeded
                </span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {responseData.results.filter((item) => !item.success).length} failed
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {responseData.results.map((item, index) => {
                const score = item.data?.abuseConfidenceScore
                const scoreClassName = getScoreColorClass(score)
                const usageLabel = getUsageLabel(item.data?.usageType ?? null)
                const hasError = !item.success

                return (
                  <Card
                    key={`${item.input}-${index}`}
                    className={`p-4 border transition-colors ${
                      hasError ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs text-muted-foreground border border-border">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold break-all">{item.input}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase tracking-wide">
                            {item.queryType}
                          </span>
                          {item.ipAddress && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                              IP: {item.ipAddress}
                            </span>
                          )}
                        </div>
                        {hasError && item.error && (
                          <p className="text-xs text-destructive mt-1">{item.error}</p>
                        )}
                      </div>

                      {!hasError && (
                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                          <div
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${scoreClassName}`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{score ?? "?"}</span>
                            <span className="text-[11px] uppercase tracking-wide">{getScoreLabel(score)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {item.data?.countryCode && (
                              <span className="mr-2">
                                {item.data.countryCode}
                                {item.data.countryName ? ` · ${item.data.countryName}` : ""}
                              </span>
                            )}
                            {usageLabel && <span>{usageLabel}</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {!hasError && item.data && (
                      <div className="mt-3 grid gap-3 md:grid-cols-4 text-xs md:text-sm">
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Abuse metrics</p>
                          <p>
                            <span className="font-medium">{item.data.totalReports}</span>{" "}
                            <span className="text-muted-foreground">reports</span>
                          </p>
                          <p className="text-muted-foreground">
                            From {item.data.numDistinctUsers} distinct reporter
                            {item.data.numDistinctUsers === 1 ? "" : "s"}
                          </p>
                          <p className="text-muted-foreground">
                            Last report:{" "}
                            {item.data.lastReportedAt
                              ? new Date(item.data.lastReportedAt).toLocaleString()
                              : "no recent reports"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Network</p>
                          <p className="break-all">
                            <span className="font-medium">{item.data.ipAddress}</span>
                            <span className="ml-1 text-muted-foreground">v{item.data.ipVersion}</span>
                          </p>
                          {item.data.domain && (
                            <p className="break-all text-muted-foreground">Domain: {item.data.domain}</p>
                          )}
                          {item.data.isTor && <p className="text-chart-5 font-medium">TOR exit node</p>}
                          {item.data.isWhitelisted && (
                            <p className="text-emerald-500 font-medium">Whitelisted in AbuseIPDB</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Provider</p>
                          <p className="text-muted-foreground break-all">
                            {item.data.isp || "Unknown ISP"}
                          </p>
                          {item.data.hostnames && item.data.hostnames.length > 0 && (
                            <p className="text-muted-foreground break-all">
                              Hostname: {item.data.hostnames[0]}
                              {item.data.hostnames.length > 1 ? " (+ more)" : ""}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] uppercase text-muted-foreground tracking-wide">
                            Reports (sample)
                          </p>
                          {item.data.reports && item.data.reports.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto border border-border rounded-md p-2 bg-muted/60">
                              {item.data.reports.slice(0, 3).map((report, reportIndex) => (
                                <div key={reportIndex} className="border-b border-border/60 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                  <p className="text-[11px] text-muted-foreground">
                                    {report.reportedAt
                                      ? new Date(report.reportedAt).toLocaleString()
                                      : "Unknown time"}
                                  </p>
                                  {report.comment && (
                                    <p className="text-[11px] text-foreground mt-0.5 line-clamp-2 wrap-break-word">
                                      {report.comment}
                                    </p>
                                  )}
                                  {report.categories && report.categories.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Categories: {report.categories.join(", ")}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {item.data.reports.length > 3 && (
                                <p className="text-[11px] text-muted-foreground">
                                  + {item.data.reports.length - 3} more report
                                  {item.data.reports.length - 3 === 1 ? "" : "s"} (see AbuseIPDB UI for full history)
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No detailed reports returned in this window.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default IPReputationTool


