import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import AuthenticatedNavbar from "@/components/Layouts/authenticated-nav-bar"
import {  SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Layouts/app-sidebar"
import Banner from "@/components/banner"
import { PageVisitTracker } from "@/components/tracking/page-visit-tracker"

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col  pt-0">
        <AuthenticatedNavbar />
        <Banner />
        <PageVisitTracker />
        <ProtectedRoute>{children}</ProtectedRoute>
      </div>
    </SidebarProvider>
  )
}

