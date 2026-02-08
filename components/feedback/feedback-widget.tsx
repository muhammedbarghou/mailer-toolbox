"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { MessageSquare, Star, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react"
import emailjs from "@emailjs/browser"
import { getCookie, setCookie, removeCookie, COOKIE_NAMES, SESSION_COOKIE_OPTIONS } from "@/lib/cookies"

interface FeedbackWidgetProps {
  trigger?: "auto" | "manual" | "post-action"
  delay?: number
  context?: {
    page?: string
    tool?: string
    action?: string
  }
}

export function FeedbackWidget({ 
  trigger = "auto", 
  delay = 30000, // 30 seconds
  context = {} 
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [feedbackType, setFeedbackType] = useState<"general" | "feature" | "bug" | "improvement">("general")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Check if user has already submitted feedback (localStorage) and session cookie
  useEffect(() => {
    // Check if user has selected "Don't show again" for this session
    const dontShowCookie = getCookie(COOKIE_NAMES.FEEDBACK_DONT_SHOW_AGAIN)
    if (dontShowCookie === "true" && trigger === "auto") {
      return // Don't show if user selected "Don't show again"
    }

    const hasSubmittedToday = localStorage.getItem("feedback_submitted_date")
    const today = new Date().toDateString()
    
    if (hasSubmittedToday === today && trigger === "auto") {
      return // Don't show if already submitted today
    }

    if (trigger === "auto") {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [trigger, delay])

  const handleRatingClick = (value: number) => {
    setRating(value)
    if (value >= 4) {
      setFeedbackType("general")
    } else {
      setFeedbackType("improvement")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_FEEDBACK_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      toast.error("Feedback service is not configured. Please contact support.")
      setIsSubmitting(false)
      return
    }

    try {
      const feedbackData = {
        feedback_type: feedbackType,
        rating: rating?.toString() || "N/A",
        message: message || "No message provided",
        email: email || "No email provided",
        page: context.page || (typeof window !== "undefined" ? window.location.pathname : ""),
        tool: context.tool || "N/A",
        action: context.action || "N/A",
        timestamp: new Date().toISOString(),
        user_agent: typeof window !== "undefined" ? navigator.userAgent : "N/A",
      }

      await emailjs.send(serviceId, templateId, feedbackData, publicKey)
      
      // Mark as submitted for today
      if (typeof window !== "undefined") {
        localStorage.setItem("feedback_submitted_date", new Date().toDateString())
      }
      
      setHasSubmitted(true)
      toast.success("Thank you! Your feedback helps us improve.")
      
      // Close after 2 seconds
      setTimeout(() => {
        setIsOpen(false)
        // Reset form
        setRating(null)
        setMessage("")
        setEmail("")
        setFeedbackType("general")
        setHasSubmitted(false)
      }, 2000)
    } catch (error) {
      toast.error("Failed to send feedback. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Thank You!
            </DialogTitle>
            <DialogDescription>
              Your feedback has been received. We appreciate you taking the time to help us improve!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      {/* Floating Button - Always accessible */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
        size="icon"
        aria-label="Send feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Share Your Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve by sharing your thoughts, suggestions, or reporting issues.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Rating */}
            <div className="space-y-3">
              <Label>How would you rate your experience?</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingClick(value)}
                    className={`p-2 rounded-lg transition-all ${
                      rating === value
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    aria-label={`Rate ${value} out of 5`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating && rating >= value ? "fill-current" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Type */}
            <div className="space-y-3">
              <Label>What type of feedback is this?</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "general", label: "General", icon: MessageSquare },
                  { value: "feature", label: "Feature Request", icon: Sparkles },
                  { value: "bug", label: "Bug Report", icon: ThumbsDown },
                  { value: "improvement", label: "Improvement", icon: ThumbsUp },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFeedbackType(value as any)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                      feedbackType === value
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mx-auto mb-1" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Your feedback {feedbackType === "bug" && "(Please include steps to reproduce)"}
              </Label>
              <Textarea
                id="message"
                placeholder={
                  feedbackType === "feature"
                    ? "What feature would you like to see?"
                    : feedbackType === "bug"
                    ? "Describe the issue and steps to reproduce..."
                    : "Tell us what's on your mind..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/500 characters
              </p>
            </div>

            {/* Optional Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground">(optional - for follow-up)</span>
              </Label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>

            {/* Don't Show Again Option */}
            <div className="pt-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onChange={(e) => {
                  const checked = e.target.checked
                  setDontShowAgain(checked)
                  
                  // Save or remove session cookie based on checkbox state
                  if (typeof window !== "undefined") {
                    if (checked) {
                      setCookie(
                        COOKIE_NAMES.FEEDBACK_DONT_SHOW_AGAIN,
                        "true",
                        SESSION_COOKIE_OPTIONS
                      )
                    } else {
                      removeCookie(COOKIE_NAMES.FEEDBACK_DONT_SHOW_AGAIN)
                    }
                  }
                }}
                label="Don't show again this session"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!rating && !message.trim())}
                className="flex-1"
              >
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

