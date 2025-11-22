import type { Metadata } from "next"
import PrivacyPolicy from "@/components/Policies/privacy"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Mailer Toolbox collects, uses, and protects your information and cookie usage. Read our comprehensive privacy policy to understand how we handle your data.",
  keywords: ["privacy policy", "data protection", "cookie policy", "privacy", "data security"],
  openGraph: {
    title: "Privacy Policy | Mailer Toolbox",
    description: "Learn how Mailer Toolbox collects, uses, and protects your information and cookie usage.",
    url: "/privacy",
  },
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <PrivacyPolicy />
  )
}

