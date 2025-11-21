import type { Metadata } from "next"
import PrivacyPolicy from "@/components/Policies/privacy"

export const metadata: Metadata = {
  title: "Privacy Policy | MailerTools Hub",
  description: "Learn how MailerTools Hub collects, uses, and protects your information and cookie usage.",
}

export default function PrivacyPage() {
  return (
    <PrivacyPolicy />
  )
}

