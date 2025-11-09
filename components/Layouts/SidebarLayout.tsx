"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import Sidebar from "@/components/Layouts/Sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) {
    return <div className="p-4 lg:p-6">{children}</div>
  }

  if (!user) {
    return <div className="p-4 lg:p-6">{children}</div>
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64">
        <div className="min-h-full">
          {/* Mobile sidebar toggle button */}
          <div className="lg:hidden fixed top-20 left-4 z-30">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-10 w-10 bg-background shadow-md"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
          <div className="p-4 lg:p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

