import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import AuthenticatedNavbar from "@/components/Layouts/authenticated-nav-bar"
import {  SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Layouts/app-sidebar"

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <AuthenticatedNavbar />
        <ProtectedRoute>{children}</ProtectedRoute>
      </div>
    </SidebarProvider>
  )
}

