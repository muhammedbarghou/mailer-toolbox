import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { requireAdmin } from "@/lib/admin/require-admin"

export const metadata: Metadata = {
  title: "Admin | Mailer Toolbox",
  robots: { index: false, follow: false },
}

// Every admin page reads the session and live data, so there is nothing to
// prerender. Declaring this keeps the build from attempting static rendering.
export const dynamic = "force-dynamic"

/**
 * Server-enforced gate for the whole admin console.
 *
 * proxy.ts already redirects non-admins, but this check is the one that
 * matters: it runs on the server for every render and cannot be bypassed by a
 * client-side navigation. It returns 404 rather than 403 so the existence of
 * these routes is not confirmed to non-admins.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  if (!admin) {
    notFound()
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">Admin Console</span>
          </div>
          <span className="ml-auto truncate text-xs text-muted-foreground">
            {admin.email}
          </span>
        </header>
        <main className="flex-1 space-y-6 p-4 md:p-6">{children}</main>
      </div>
    </SidebarProvider>
  )
}
