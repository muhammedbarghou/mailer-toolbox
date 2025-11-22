"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, X } from "lucide-react"
import { FeedbackWidget } from "./feedback-widget"

interface PostActionFeedbackProps {
  action: string // e.g., "email_rewritten", "header_processed"
  tool: string
  onDismiss?: () => void
  showDelay?: number
}

export function PostActionFeedback({ 
  action, 
  tool, 
  onDismiss,
  showDelay = 2000 
}: PostActionFeedbackProps) {
  const [show, setShow] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)

  useEffect(() => {
    // Show after delay of successful action
    const timer = setTimeout(() => {
      setShow(true)
    }, showDelay)
    return () => clearTimeout(timer)
  }, [showDelay])

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type)
    
    // Track feedback (you can add analytics here)
    if (typeof window !== "undefined") {
      // Store feedback for analytics
      const feedbackData = {
        type,
        tool,
        action,
        timestamp: new Date().toISOString(),
      }
      // You can send this to your analytics service
      console.log("Feedback tracked:", feedbackData)
    }

    // Auto-open detailed feedback for negative feedback
    if (type === "negative") {
      setTimeout(() => {
        setShowDetailedFeedback(true)
        setShow(false)
      }, 500)
    } else {
      // Hide after positive feedback
      setTimeout(() => {
        setShow(false)
        onDismiss?.()
      }, 1500)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    onDismiss?.()
  }

  if (showDetailedFeedback) {
    return (
      <FeedbackWidget
        trigger="manual"
        context={{
          page: typeof window !== "undefined" ? window.location.pathname : "",
          tool,
          action,
        }}
      />
    )
  }

  if (!show || feedback) {
    return null
  }

  return (
    <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 p-4 shadow-lg z-40 animate-in slide-in-from-bottom-5 max-w-md w-[calc(100%-2rem)]">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium flex-1">
          How was your experience with <span className="font-semibold">{tool}</span>?
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFeedback("positive")}
            className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
            aria-label="Positive feedback"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFeedback("negative")}
            className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            aria-label="Negative feedback"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

