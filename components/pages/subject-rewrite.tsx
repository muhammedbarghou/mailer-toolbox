"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Copy,
  Trash2,
  Zap,
  Shield,
  Mail,
  ArrowRight,
  FileText,
  Clock,
  AlertCircle,
  TrendingUp,
  Target,
  CloudLightning as Lightning,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { ApiKeyProvider } from "@/lib/api-keys"
import {
  getAvailableModels,
  getDefaultModel,
  getModelDisplayName,
  type AIModel,
} from "@/lib/ai-providers"

interface RewrittenSubject {
  original: string
  rewritten: string[]
  changes: string
}

const SubjectRewrite = () => {
  const [subjectsInput, setSubjectsInput] = useState("")
  const [results, setResults] = useState<RewrittenSubject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number
    resetAt: number
  } | null>(null)
  const [provider, setProvider] = useState<ApiKeyProvider>("gemini")
  const [model, setModel] = useState<AIModel>(getDefaultModel("gemini"))

  const handleProviderChange = (newProvider: ApiKeyProvider) => {
    setProvider(newProvider)
    setModel(getDefaultModel(newProvider))
  }

  const handleRewrite = async () => {
    if (!subjectsInput.trim()) {
      toast.error("Please enter at least one subject line")
      return
    }

    const subjects = subjectsInput
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (subjects.length === 0) {
      toast.error("Please enter at least one valid subject line")
      return
    }

    setIsLoading(true)
    setResults([])
    setRateLimitInfo(null)

    try {
      const response = await fetch("/api/subject-rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subjects, provider, model }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to rewrite subject lines"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage

          if (response.status === 429) {
            setRateLimitInfo({
              remaining: errorData.remaining || 0,
              resetAt: errorData.resetAt || Date.now() + 3600000,
            })
            toast.error(errorData.message || errorMessage)
            return
          }
        } catch {
          errorMessage = response.statusText || `Server error (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setResults(data.results || [])
      setRateLimitInfo(data.rateLimit || null)

      toast.success(`Successfully generated ${data.results?.length || 0} rewritten subject line sets`)
    } catch (error) {
      console.error("Error rewriting subject lines:", error)
      toast.error(error instanceof Error ? error.message : "Failed to rewrite subject lines")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyAll = async () => {
    if (results.length === 0) return

    const allRewritten = results.flatMap((result) => result.rewritten)
    const textToCopy = allRewritten.join("\n")

    try {
      await navigator.clipboard.writeText(textToCopy)
      toast.success(`Copied ${allRewritten.length} subject lines to clipboard`)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard. Please try again.")
    }
  }

  const handleCopyResult = async (rewritten: string[]) => {
    try {
      await navigator.clipboard.writeText(rewritten.join("\n"))
      toast.success(`Copied ${rewritten.length} subject lines to clipboard`)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard. Please try again.")
    }
  }

  const handleClear = () => {
    setSubjectsInput("")
    setResults([])
    setRateLimitInfo(null)
  }

  const inputLineCount = subjectsInput.split("\n").filter((l) => l.trim().length > 0).length
  const totalRewrittenCount = results.reduce((sum, r) => sum + r.rewritten.length, 0)

  const formatResetTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const minutes = Math.ceil(diff / 60000)

    if (minutes <= 0) return "now"
    if (minutes < 60) return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `in ${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20 space-y-8">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <Mail className="relative h-14 w-14 md:h-16 md:w-16 text-primary" />
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
                <span className="text-balance">Email Subject Line Rewriter</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
                Transform spam-triggering subject lines into high-performing, deliverable alternatives using advanced
                AI.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by {getModelDisplayName(model)}</span>
            </div>
            {rateLimitInfo && (
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
                  rateLimitInfo.remaining === 0
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>
                  {rateLimitInfo.remaining === 0
                    ? `Limit reached. Resets ${formatResetTime(rateLimitInfo.resetAt)}`
                    : `${rateLimitInfo.remaining} request${rateLimitInfo.remaining !== 1 ? "s" : ""} remaining`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Model Selection */}
        <div className="relative z-20 mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-border/60 bg-muted/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) => handleProviderChange(value as ApiKeyProvider)}
                disabled={isLoading}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Google Gemini</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <span>OpenAI</span>
                  </SelectItem>
                  <SelectItem value="anthropic">
                    <span>Anthropic</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={model}
                onValueChange={(value) => setModel(value as AIModel)}
                disabled={isLoading}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableModels(provider).map((availableModel) => (
                    <SelectItem key={availableModel} value={availableModel}>
                      {getModelDisplayName(availableModel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mt-12">
          {/* Input Card */}
          <Card className="relative overflow-hidden border transition-all duration-300 hover:shadow-xl hover:border-primary/50 flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl z-0" />
            <CardHeader className="relative z-10 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>Original Subject Lines</CardTitle>
                  <CardDescription>Enter one per line</CardDescription>
                </div>
              </div>
              {inputLineCount > 0 && (
                <div className="mt-3 text-xs font-mono text-muted-foreground">
                  {inputLineCount} line{inputLineCount !== 1 ? "s" : ""} entered
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 flex-1 flex flex-col">
              <div className="relative flex-1">
                <Textarea
                  value={subjectsInput}
                  onChange={(e) => setSubjectsInput(e.target.value)}
                  placeholder="FREE SHIPPING TODAY!!!&#10;Buy now and save 50%&#10;Limited time offer - Act now!"
                  className="min-h-[300px] md:min-h-[400px] font-mono text-sm resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                  disabled={isLoading}
                />
                {!subjectsInput && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-linear-to-b from-transparent to-muted/5">
                    <div className="text-center space-y-2 text-muted-foreground/40">
                      <Mail className="h-10 w-10 mx-auto opacity-50" />
                      <p className="text-sm font-medium">Paste your subject lines here</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleRewrite}
                  disabled={isLoading || !subjectsInput.trim() || rateLimitInfo?.remaining === 0}
                  className="flex-1 h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Rewrite
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isLoading || (!subjectsInput && results.length === 0)}
                  className="h-11 px-4 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 bg-transparent"
                  size="lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {rateLimitInfo?.remaining === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Rate limit reached. Wait {formatResetTime(rateLimitInfo.resetAt)}.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Card */}
          <Card className="relative overflow-hidden border transition-all duration-300 hover:shadow-xl hover:border-primary/50 flex flex-col">
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl z-0" />
            <CardHeader className="relative z-10 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <CardTitle>Rewritten Alternatives</CardTitle>
                  <CardDescription>20 optimized per line</CardDescription>
                </div>
              </div>
              {totalRewrittenCount > 0 && (
                <div className="mt-3 text-xs font-mono text-muted-foreground">
                  {totalRewrittenCount} total generated
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 flex-1 flex flex-col">
              {results.length > 0 ? (
                <>
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-muted/30 space-y-3 hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">Original</div>
                          <div className="text-sm font-medium text-foreground line-clamp-2">{result.original}</div>
                          {result.changes && (
                            <div className="text-xs text-muted-foreground italic mt-1.5 leading-relaxed">
                              {result.changes}
                            </div>
                          )}
                        </div>
                        <div className="border-t pt-3">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">
                            {result.rewritten.length} Alternatives
                          </div>
                          <div className="space-y-1.5">
                            {result.rewritten.slice(0, 3).map((subject, subIndex) => (
                              <div
                                key={subIndex}
                                className="text-xs p-2 rounded bg-background/50 border border-border/50 hover:border-primary/30 transition-colors line-clamp-1"
                              >
                                {subject}
                              </div>
                            ))}
                            {result.rewritten.length > 3 && (
                              <div className="text-xs text-muted-foreground p-2 italic">
                                +{result.rewritten.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleCopyAll}
                      variant="outline"
                      className="flex-1 h-11 text-sm font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 bg-transparent"
                      size="lg"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy All
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 min-h-[300px] md:min-h-[400px]">
                  <div className="text-center space-y-3 text-muted-foreground/50">
                    <div className="relative">
                      <Sparkles className="h-12 w-12 mx-auto opacity-40 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isLoading ? "Rewriting your subject lines..." : "Results will appear here"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="border-t">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
              <p className="text-muted-foreground">AI-powered improvements for better email deliverability</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="relative overflow-hidden border hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Lightning className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base">Spam Filter Bypass</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Removes trigger words and patterns that reduce deliverability rates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base">Higher Open Rates</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Optimized for clarity and engagement to increase subscriber interactions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base">Multiple Variants</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Get 20 unique alternatives for A/B testing and maximum flexibility.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-base">Privacy First</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your subject lines are processed securely and never stored.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubjectRewrite