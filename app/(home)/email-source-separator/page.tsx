import EmailSourceSeparator from "@/components/pages/source-separator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Email Source Separator",
  description: "Separate and extract different parts of email sources. Split HTML, text, and attachments from email files with ease.",
  keywords: ["email source", "email separator", "email extractor", "email parser", "email splitter", "EML parser"],
  openGraph: {
    title: "Email Source Separator | Mailer Toolbox",
    description: "Separate and extract different parts of email sources with our powerful tool.",
    url: "/email-source-separator",
  },
  alternates: {
    canonical: "/email-source-separator",
  },
}

export default function EmailSourceSeparatorPage() {
  return (
    <EmailSourceSeparator />
  )
}