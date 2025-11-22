import Rewrite from "@/components/pages/rewrite"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Email Rewrite Tool",
  description: "Rewrite and improve your email content with AI-powered tools. Enhance clarity, tone, and effectiveness of your email messages.",
  keywords: ["email rewrite", "email improvement", "email editor", "email content", "email writing", "AI email"],
  openGraph: {
    title: "Email Rewrite Tool | Mailer Toolbox",
    description: "Rewrite and improve your email content with AI-powered tools.",
    url: "/rewrite",
  },
  alternates: {
    canonical: "/rewrite",
  },
}

export default function RewritePage() {
  return (
    <Rewrite />
  )
} 