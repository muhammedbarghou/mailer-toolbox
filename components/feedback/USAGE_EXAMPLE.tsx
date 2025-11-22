/**
 * Example: How to integrate PostActionFeedback in your tool pages
 * 
 * This shows how to add contextual feedback prompts after successful tool usage
 */

"use client"

import { useState } from "react"
import { PostActionFeedback } from "@/components/feedback"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Example: Email Rewrite Tool
export function EmailRewriteExample() {
  const [showFeedback, setShowFeedback] = useState(false)
  const [actionCompleted, setActionCompleted] = useState(false)

  const handleRewrite = async () => {
    try {
      // Your rewrite logic here
      // const result = await rewriteEmail()
      
      // On success
      toast.success("Email rewritten successfully!")
      setActionCompleted(true)
      setShowFeedback(true)
    } catch (error) {
      toast.error("Failed to rewrite email")
    }
  }

  return (
    <div>
      {/* Your tool UI */}
      <Button onClick={handleRewrite}>Rewrite Email</Button>

      {/* Show feedback prompt after successful action */}
      {showFeedback && actionCompleted && (
        <PostActionFeedback
          action="email_rewritten"
          tool="Email Rewrite Tool"
          showDelay={2000}
          onDismiss={() => {
            setShowFeedback(false)
            setActionCompleted(false)
          }}
        />
      )}
    </div>
  )
}

// Example: Header Processor Tool
export function HeaderProcessorExample() {
  const [showFeedback, setShowFeedback] = useState(false)

  const handleProcess = async () => {
    try {
      // Your processing logic
      // const result = await processHeader()
      
      toast.success("Header processed successfully!")
      
      // Show feedback after 2 seconds
      setTimeout(() => {
        setShowFeedback(true)
      }, 2000)
    } catch (error) {
      toast.error("Failed to process header")
    }
  }

  return (
    <div>
      <Button onClick={handleProcess}>Process Header</Button>

      {showFeedback && (
        <PostActionFeedback
          action="header_processed"
          tool="Email Header Processor"
          onDismiss={() => setShowFeedback(false)}
        />
      )}
    </div>
  )
}

// Example: Manual Feedback Trigger (in Settings or Help page)
export function ManualFeedbackExample() {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowFeedback(true)}>
        Send Feedback
      </Button>

      {/* The floating button is always available, but you can also trigger manually */}
      {showFeedback && (
        <div>
          {/* FeedbackWidget with manual trigger */}
          {/* Note: The floating button is always visible, this is just for custom triggers */}
        </div>
      )}
    </div>
  )
}

