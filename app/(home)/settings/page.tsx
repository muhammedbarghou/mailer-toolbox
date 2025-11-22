import Settings from "@/components/pages/settings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings, preferences, and tool configurations.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SettingsPage() {
  return (
    <Settings />
  )
}