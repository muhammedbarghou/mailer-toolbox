import DashboardPage from "@/components/pages/home"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Access your email and IP tools dashboard. Manage your workflow, view recent activity, and quickly access all available tools.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomePage() {
  return (
    <DashboardPage />
  )
}