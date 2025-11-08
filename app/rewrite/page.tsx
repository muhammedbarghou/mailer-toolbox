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
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">AI Email Rewriter</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Transform your HTML emails to bypass spam filters and improve
          deliverability while maintaining your original message and design.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Original HTML Email</CardTitle>
            <CardDescription>
              Paste your HTML email content below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Paste your HTML email here..."
              className="min-h-[400px] font-mono text-sm"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleRewrite}
                disabled={isLoading || !htmlInput.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Rewrite Email
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rewritten HTML Email</CardTitle>
                <CardDescription>
                  Your optimized email ready for delivery
                </CardDescription>
              </div>
              {isCached && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>From Cache</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rewrittenHtml ? (
              <>
                <Textarea
                  value={rewrittenHtml}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full"
                >
                  Copy to Clipboard
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <Sparkles className="h-12 w-12 mx-auto opacity-50" />
                  <p>Rewritten email will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                <strong>Content Transformation:</strong> All text is rewritten
                using alternative vocabulary while preserving meaning
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                <strong>Spam Trigger Elimination:</strong> Removes high-risk
                promotional words and replaces them with deliverability-safe
                alternatives
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                <strong>HTML Structure Optimization:</strong> Reorganizes code
                structure, renames classes/IDs, and adjusts styling for better
                compatibility
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                <strong>Smart Caching:</strong> Identical requests are served
                instantly from cache, saving tokens and improving response time
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

