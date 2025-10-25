"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Copy, Check } from "lucide-react"

export default function page() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    sevenBit: string
    quotedPrintable: string
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleRewrite = async () => {
    if (!input.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/rewrite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailHtml: input }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error rewriting email:", error)
      alert("Failed to rewrite email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Email HTML Rewriter</h1>
          <p className="text-slate-600">Rewrite your email HTML while maintaining structure and deliverability</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Original Email HTML</h2>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your email HTML here..."
              className="flex-1 font-mono text-sm resize-none"
            />
            <Button onClick={handleRewrite} disabled={loading || !input.trim()} className="mt-4 w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                "Rewrite Email"
              )}
            </Button>
          </Card>

          {/* Output Section */}
          <div className="space-y-4">
            {input.trim() && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">HTML REVIEW</h3>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(input, "htmlReview")}>
                    {copied === "htmlReview" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="bg-slate-50 rounded p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap wrap-break-word">{input}</pre>
                </div>
              </Card>
            )}

            {result && (
              <>
                {/* 7-bit Version */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">7-BIT VERSION</h3>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.sevenBit, "sevenBit")}>
                      {copied === "sevenBit" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="bg-slate-50 rounded p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap wrap-break-word">
                      {result.sevenBit}
                    </pre>
                  </div>
                </Card>

                {/* Quoted-Printable Version */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">QUOTED-PRINTABLE VERSION</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.quotedPrintable, "quotedPrintable")}
                    >
                      {copied === "quotedPrintable" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="bg-slate-50 rounded p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap wrap-break-word">
                      {result.quotedPrintable}
                    </pre>
                  </div>
                </Card>
              </>
            )}

            {!result && !loading && !input.trim() && (
              <Card className="p-6 text-center text-slate-500">
                <p>Paste your email HTML and click "Rewrite Email" to get started</p>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Rephrases all text content while preserving meaning and intent</li>
            <li>• Modifies HTML structure and styling subtly</li>
            <li>• Maintains email deliverability standards</li>
            <li>• Ensures compatibility with major email clients</li>
            <li>• Includes the required legal footer</li>
          </ul>
        </Card>
      </div>
    </main>
  )
}
