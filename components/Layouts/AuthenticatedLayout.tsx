"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import SidebarLayout from "@/components/Layouts/SidebarLayout"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Don't show sidebar on landing page or auth page
  const shouldShowSidebar = user && pathname !== "/" && pathname !== "/auth"

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  }

  if (!user || !shouldShowSidebar) {
    // Landing page has its own full-screen layout, don't add padding
    if (pathname === "/") {
      return <>{children}</>
    }
    return <div className="p-4 lg:p-6">{children}</div>
  }

  return <SidebarLayout>{children}</SidebarLayout>
}

