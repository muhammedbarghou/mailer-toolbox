import type { Metadata } from "next"
import TermsOfService from "@/components/Policies/terms"

export const metadata: Metadata = {
  title: "Terms of Service | MailerTools Hub",
  description: "Terms and conditions for using MailerTools Hub email and IP tools suite.",
}

export default function TermsPage() {
  return (
    <TermsOfService />
  )
}

