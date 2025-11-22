import SubjectRewrite from "@/components/pages/subject-rewrite"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Subject Line Rewrite Tool",
  description: "Optimize your email subject lines for better open rates. Use AI to rewrite and improve subject lines that grab attention and drive engagement.",
  keywords: ["subject line", "email subject", "subject rewrite", "email optimization", "open rate", "subject line generator"],
  openGraph: {
    title: "Subject Line Rewrite Tool | Mailer Toolbox",
    description: "Optimize your email subject lines for better open rates with AI-powered rewriting.",
    url: "/subject-rewrite",
  },
  alternates: {
    canonical: "/subject-rewrite",
  },
}

export default function SubjectRewritePage() {
  return (
    <SubjectRewrite />
  )
}

