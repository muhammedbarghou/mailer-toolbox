import type { Metadata } from "next"
import TermsOfService from "@/components/Policies/terms"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Mailer Toolbox email and IP tools suite. Read our terms of service to understand the rules and guidelines for using our platform.",
  keywords: ["terms of service", "terms and conditions", "user agreement", "legal", "terms"],
  openGraph: {
    title: "Terms of Service | Mailer Toolbox",
    description: "Terms and conditions for using Mailer Toolbox email and IP tools suite.",
    url: "/terms",
  },
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
  return (
    <TermsOfService />
  )
}

