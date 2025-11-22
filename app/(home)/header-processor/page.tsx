import EmailHeaderProcessor from "@/components/pages/header-processor"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Email Header Processor",
  description: "Parse, analyze, and process email headers with our powerful header processor tool. Extract sender information, routing details, and security headers from any email.",
  keywords: ["email header", "header processor", "email parser", "header analyzer", "email analysis", "SMTP headers"],
  openGraph: {
    title: "Email Header Processor | Mailer Toolbox",
    description: "Parse, analyze, and process email headers with our powerful header processor tool.",
    url: "/header-processor",
  },
  alternates: {
    canonical: "/header-processor",
  },
}

export default function EmailHeaderProcessorPage() {
  return (
    <EmailHeaderProcessor />
  )
}