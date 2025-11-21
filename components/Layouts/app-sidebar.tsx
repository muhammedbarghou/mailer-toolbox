"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { FileText, Inbox, Network, ImageIcon, Sparkles, PanelsRightBottom, Scissors, Layers, Home, Mail, Search} from "lucide-react"
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


const toolCategories = [
  {
    category: "Email Processing",
    tools: [
      {
        href: "/rewrite",
        title: "AI Email Rewriter",
        icon: Sparkles,
        badge: "Popular",
      },
      {
        href: "/subject-rewrite",
        title: "Subject Line Rewriter",
        icon: Mail,
      },
      {
        href: "/header-processor",
        title: "Email Header Processor",
        icon: Inbox,
      },
      {
        href: "/eml-to-txt-converter",
        title: "EML to TXT Converter",
        icon: FileText,
      },
      {
        href: "/eml-text-extractor",
        title: "Merge Tool",
        icon: Scissors,
      },
      {
        href: "/email-source-separator",
        title: "Email Source Separator",
        icon: Layers,
      },
      {
        href: "/gmail-deliverability",
        title: "Gmail Deliverability Viewer",
        icon: Search,
      },
    ],
  },
  {
    category: "Advanced Tools",
    tools: [
      {
        href: "/html-to-img",
        title: "HTML to Image Converter",
        icon: ImageIcon,
      },
      {
        href: "/ip-comparator",
        title: "IP Comparator",
        icon: Network,
      },
      {
        href: "/photo-editor",
        title: "Images Toolkit",
        icon: PanelsRightBottom,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar/95">
      <SidebarContent className="gap-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/home"}
                  tooltip="Dashboard"
                  className="h-10 rounded-lg bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20"
                >
                  <Link href="/home" className="font-medium">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {toolCategories.map((group) => (
          <SidebarGroup key={group.category}>
            <SidebarGroupLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.category}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.tools.map((tool) => {
                  const Icon = tool.icon
                  const isActive = pathname === tool.href
                  return (
                    <SidebarMenuItem key={tool.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={tool.title}
                        className={`relative rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-sidebar-primary/20 text-sidebar-primary"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                        }`}
                      >
                        <Link href={tool.href} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-sm">{tool.title}</span>
                          {tool.badge && (
                            <span className="hidden rounded-full bg-sidebar-primary/30 px-2 py-0.5 text-xs font-medium text-sidebar-primary lg:inline-block">
                              {tool.badge}
                            </span>
                          )}
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
