"use client"

import { FeedbackWidget } from "./feedback-widget"
import { usePathname } from "next/navigation"

export function FeedbackWidgetWrapper() {
  const pathname = usePathname()

  return (
    <FeedbackWidget 
      trigger="auto" 
      delay={30000}
      context={{
        page: pathname || "",
      }}
    />
  )
}

