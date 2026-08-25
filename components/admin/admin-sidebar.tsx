"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  ArrowLeft,
  KeyRound,
  LayoutDashboard,
  Mail,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AdminNavItem {
  href: string
  title: string
  icon: typeof LayoutDashboard
}

const navGroups: { category: string; items: AdminNavItem[] }[] = [
  {
    category: "Insights",
    items: [
      { href: "/admin", title: "Overview", icon: LayoutDashboard },
      { href: "/admin/tools", title: "Tools", icon: Wrench },
      { href: "/admin/ai", title: "AI Usage", icon: Sparkles },
    ],
  },
  {
    category: "People",
    items: [{ href: "/admin/users", title: "Users", icon: Users }],
  },
  {
    category: "Operations",
    items: [
      { href: "/admin/api-keys", title: "API Key Health", icon: KeyRound },
      { href: "/admin/security", title: "Security", icon: ShieldAlert },
      { href: "/admin/gmail", title: "Gmail Audit", icon: Mail },
      { href: "/admin/activity", title: "Admin Activity", icon: Activity },
    ],
  },
]

/**
 * Determine whether a nav item matches the current route.
 * /admin only matches exactly, so it does not stay active on subpages.
 */
const isItemActive = (pathname: string, href: string): boolean => {
  if (href === "/admin") {
    return pathname === "/admin"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const AdminSidebar = () => {
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar/95"
    >
      <SidebarContent className="gap-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Back to app"
                  className="h-10 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                  <Link href="/home" className="flex items-center gap-2 font-medium">
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span>Back to app</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navGroups.map((group) => (
          <SidebarGroup key={group.category}>
            <SidebarGroupLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.category}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = isItemActive(pathname, item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`relative rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-sidebar-primary/20 text-sidebar-primary"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                      >
                        <Link href={item.href} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
