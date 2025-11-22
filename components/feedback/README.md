# Feedback Components

A comprehensive feedback collection system for Mailer Toolbox that encourages user feedback through multiple entry points and smart timing.

## Components

### 1. FeedbackWidget
Main feedback component with rating system, feedback types, and form submission.

**Features:**
- 5-star rating system
- Feedback type selection (General, Feature Request, Bug Report, Improvement)
- Message textarea with character counter
- Optional email field
- Auto-submission prevention (once per day)
- EmailJS integration for sending feedback

**Usage:**
```tsx
import { FeedbackWidget } from "@/components/feedback"

<FeedbackWidget 
  trigger="auto"        // "auto" | "manual" | "post-action"
  delay={30000}         // Delay in ms before showing (for auto trigger)
  context={{
    page: "/current-page",
    tool: "Email Rewrite",
    action: "email_rewritten"
  }}
/>
```

### 2. FeedbackWidgetWrapper
Client-side wrapper that automatically provides the current page context.

**Usage:**
```tsx
import { FeedbackWidgetWrapper } from "@/components/feedback"

// Already integrated in app/layout.tsx
<FeedbackWidgetWrapper />
```

### 3. PostActionFeedback
Contextual feedback prompt that appears after successful tool usage.

**Usage:**
```tsx
import { PostActionFeedback } from "@/components/feedback"

// Show after successful action
<PostActionFeedback 
  action="email_rewritten"
  tool="Email Rewrite Tool"
  showDelay={2000}  // Delay before showing (default: 2000ms)
  onDismiss={() => console.log("Dismissed")}
/>
```

## Integration Examples

### In Tool Pages (Post-Action Feedback)
```tsx
"use client"

import { useState } from "react"
import { PostActionFeedback } from "@/components/feedback"

export default function EmailRewritePage() {
  const [showFeedback, setShowFeedback] = useState(false)
  const [actionCompleted, setActionCompleted] = useState(false)

  const handleRewrite = async () => {
    // Your rewrite logic
    await rewriteEmail()
    setActionCompleted(true)
    setShowFeedback(true)
  }

  return (
    <>
      {/* Your component */}
      {showFeedback && actionCompleted && (
        <PostActionFeedback
          action="email_rewritten"
          tool="Email Rewrite Tool"
          onDismiss={() => setShowFeedback(false)}
        />
      )}
    </>
  )
}
```

### Manual Trigger
```tsx
import { FeedbackWidget } from "@/components/feedback"

// In a settings page or help section
<Button onClick={() => setShowFeedback(true)}>
  Send Feedback
</Button>

{showFeedback && (
  <FeedbackWidget trigger="manual" />
)}
```

## EmailJS Setup

1. Create a feedback template in EmailJS with these variables:
   - `feedback_type` - Type of feedback
   - `rating` - Star rating (1-5)
   - `message` - User's message
   - `email` - User's email (optional)
   - `page` - Current page URL
   - `tool` - Tool name
   - `action` - Action performed
   - `timestamp` - ISO timestamp
   - `user_agent` - Browser user agent

2. Add environment variables:
```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_FEEDBACK_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

If `NEXT_PUBLIC_EMAILJS_FEEDBACK_TEMPLATE_ID` is not set, it will fall back to `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`.

## Features

### Smart Timing
- Auto-trigger after 30 seconds (configurable)
- Only shows once per day per user (localStorage)
- Respects user's previous dismissals

### User Experience
- Non-intrusive floating button (always accessible)
- Progressive disclosure (rating → type → details)
- Visual feedback with icons and colors
- Thank you message after submission
- Easy dismissal

### Data Collection
- Contextual information (page, tool, action)
- User agent for debugging
- Timestamp for analytics
- Optional email for follow-up

## Customization

### Styling
Components use your existing UI components (Dialog, Button, Card) and follow your theme system.

### Behavior
- Adjust `delay` prop for auto-trigger timing
- Modify `trigger` prop for different behaviors
- Customize feedback types in `feedback-widget.tsx`

### Analytics
Add analytics tracking in:
- `PostActionFeedback.handleFeedback()` - Track quick feedback
- `FeedbackWidget.handleSubmit()` - Track detailed submissions

## Best Practices

1. **Don't interrupt critical workflows** - Use post-action feedback for tool pages
2. **Respect user choice** - Easy to dismiss, don't show again same day
3. **Provide context** - Always include page/tool information
4. **Show value** - Thank users and explain how feedback helps
5. **Make it quick** - Start with rating, expand for details

