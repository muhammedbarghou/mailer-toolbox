import GmailDeliverability from "@/components/pages/gmail-deliverability"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gmail Deliverability Checker",
  description: "Check and improve your email deliverability to Gmail. Analyze your emails to ensure they reach the inbox and avoid spam folders.",
  keywords: ["Gmail deliverability", "email deliverability", "Gmail inbox", "spam checker", "email reputation", "deliverability test"],
  openGraph: {
    title: "Gmail Deliverability Checker | Mailer Toolbox",
    description: "Check and improve your email deliverability to Gmail with our comprehensive tool.",
    url: "/gmail-deliverability",
  },
  alternates: {
    canonical: "/gmail-deliverability",
  },
}

export default function GmailDeliverabilityPage() {
  return (
    <GmailDeliverability />
  )
}
