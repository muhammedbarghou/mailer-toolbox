"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  FileText,
  Inbox,
  Network,
  Image as ImageIcon,
  Sparkles,
  PanelsRightBottom,
  Scissors,
  X,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

const tools = [
  {
    href: "/rewrite",
    title: "AI Email Rewriter",
    icon: Sparkles,
    color: "text-purple-500",
  },
  {
    href: "/header-processor",
    title: "Email Header Processor",
    icon: Inbox,
    color: "text-blue-500",
  },
  {
    href: "/eml-to-txt-converter",
    title: "EML to TXT Converter",
    icon: FileText,
    color: "text-green-500",
  },
  {
    href: "/eml-text-extractor",
    title: "EML Text Extractor",
    icon: Scissors,
    color: "text-yellow-500",
  },
  {
    href: "/email-source-separator",
    title: "Email Source Separator",
    icon: Layers,
    color: "text-violet-500",
  },
  {
    href: "/html-to-img",
    title: "HTML to Image Converter",
    icon: ImageIcon,
    color: "text-orange-500",
  },
  {
    href: "/ip-comparator",
    title: "IP Comparator",
    icon: Network,
    color: "text-indigo-500",
  },
  {
    href: "/photo-editor",
    title: "Images Toolkit",
    icon: PanelsRightBottom,
    color: "text-teal-500",
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background border-r z-50 transform transition-transform duration-300 ease-in-out lg:fixed lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="text-lg font-semibold">Tools</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          {/* Tools List */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Tools
              </h3>
            </div>
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = pathname === tool.href
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", tool.color)} />
                  <span>{tool.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

