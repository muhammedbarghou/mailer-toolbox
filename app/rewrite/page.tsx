"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Copy,
  Trash2,
  Zap,
  Shield,
  Code,
  Database,
  ArrowRight,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

export default function RewritePage() {
  const [htmlInput, setHtmlInput] = useState("");
  const [rewrittenHtml, setRewrittenHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const handleRewrite = async () => {
    if (!htmlInput.trim()) {
      toast.error("Please enter HTML content to rewrite");
      return;
    }

    setIsLoading(true);
    setIsCached(false);
    setRewrittenHtml("");

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlInput }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to rewrite email";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setRewrittenHtml(data.html);
      setIsCached(data.cached);

      if (data.cached) {
        toast.success("Rewritten email retrieved from cache");
      } else {
        toast.success("Email rewritten successfully");
      }
    } catch (error) {
      console.error("Error rewriting email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to rewrite email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!rewrittenHtml) return;

    try {
      await navigator.clipboard.writeText(rewrittenHtml);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard. Please try again.");
    }
  };

  const handleClear = () => {
    setHtmlInput("");
    setRewrittenHtml("");
    setIsCached(false);
  };

  const inputCharCount = htmlInput.length;
  const outputCharCount = rewrittenHtml.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-12 space-y-8 md:space-y-12">
      {/* Enhanced Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <Sparkles className="relative h-10 w-10 md:h-12 md:w-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            AI Email Rewriter
          </h1>
        </div>
        <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          Transform your HTML emails to bypass spam filters and improve
          deliverability while maintaining your original message and design.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Powered by Gemini 2.5 Flash</span>
          </div>
          {isCached && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Cached Result</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enhanced Input Section */}
        <Card className="relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl z-0" />
          <CardHeader className="relative z-10 border-b bg-linear-to-r from-transparent via-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Original HTML Email</CardTitle>
                  <CardDescription className="mt-1">
                    Paste your HTML email content below
                  </CardDescription>
                </div>
              </div>
            </div>
            {inputCharCount > 0 && (
              <div className="mt-3 text-xs text-muted-foreground font-mono">
                {inputCharCount.toLocaleString()} characters
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="relative">
              <Textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste your HTML email here...&#10;&#10;Example:&#10;&lt;html&gt;&#10;  &lt;body&gt;&#10;    &lt;h1&gt;Hello World&lt;/h1&gt;&#10;  &lt;/body&gt;&#10;&lt;/html&gt;"
                className="min-h-[450px] font-mono text-sm resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              {!htmlInput && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-center space-y-3 text-muted-foreground/50">
                    <Code className="h-12 w-12 mx-auto opacity-30" />
                    <p className="text-sm">Waiting for HTML input...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRewrite}
                disabled={isLoading || !htmlInput.trim()}
                className="flex-1 h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Rewrite Email
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLoading || !htmlInput}
                className="h-11 px-4 border-2 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200"
                size="lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Output Section */}
        <Card className="relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/50">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl z-0" />
          <CardHeader className="relative z-10 border-b bg-linear-to-r from-transparent via-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Rewritten HTML Email</CardTitle>
                  <CardDescription className="mt-1">
                    Your optimized email ready for delivery
                  </CardDescription>
                </div>
              </div>
              {isCached && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-right-5">
                  <Database className="h-3.5 w-3.5" />
                  <span>Cached</span>
                </div>
              )}
            </div>
            {outputCharCount > 0 && (
              <div className="mt-3 text-xs text-muted-foreground font-mono">
                {outputCharCount.toLocaleString()} characters
                {inputCharCount > 0 && (
                  <span className="ml-2 text-primary">
                    ({Math.round((outputCharCount / inputCharCount) * 100)}% of original)
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            {rewrittenHtml ? (
              <>
                <div className="relative">
                  <Textarea
                    value={rewrittenHtml}
                    readOnly
                    className="min-h-[450px] font-mono text-sm resize-none bg-muted/30 border-2"
                  />
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full h-11 text-base font-semibold border-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                  size="lg"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[450px] text-muted-foreground">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                    <Sparkles className="relative h-16 w-16 mx-auto opacity-40 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium">Rewritten email will appear here</p>
                    <p className="text-sm opacity-70">
                      {isLoading
                        ? "Processing your email..."
                        : "Click 'Rewrite Email' to get started"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Info Section */}
      <Card className="bg-linear-to-br from-muted/50 via-muted/30 to-muted/50 border-2 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-primary/5" />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base">Content Transformation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All text is rewritten using alternative vocabulary while preserving meaning and emotional tone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base">Spam Trigger Elimination</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Removes high-risk promotional words and replaces them with deliverability-safe alternatives.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base">HTML Structure Optimization</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Reorganizes code structure, renames classes/IDs, and adjusts styling for better compatibility.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base">Smart Caching</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Identical requests are served instantly from cache, saving tokens and improving response time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


