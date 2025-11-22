import Support from "@/components/pages/support"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Support",
  description: "Get help from our support team. Submit a support request for technical issues, feature requests, or general inquiries.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SupportPage() {
  return (
    <Support />
  )
}

