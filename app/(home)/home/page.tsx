"use client"


import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Inbox,
  Network,
  Image as ImageIcon,
  Sparkles,
  PanelsRightBottom,
  ArrowRight,
  Scissors,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Mail,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"


const tools = [
  {
    href: "/rewrite",
    title: "AI Email Rewriter",
    description: "Transform HTML emails to bypass spam filters and improve deliverability while maintaining your original message and design.",
    icon: Sparkles,
    color: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
    borderColor: "border-purple-500/20",
  },
  {
    href: "/header-processor",
    title: "Email Header Processor",
    description: "Process and analyze email headers in batch mode. Remove tracking headers, sanitize sender information, and optimize headers for better deliverability.",
    icon: Inbox,
    color: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/20",
  },
  {
    href: "/eml-to-txt-converter",
    title: "EML to TXT Converter",
    description: "Convert multiple email files (.eml) to plain text format with timestamps. Extract text content from email files quickly and efficiently.",
    icon: FileText,
    color: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500",
    borderColor: "border-green-500/20",
  },
  {
    href: "/eml-text-extractor",
    title: "EML Text Extractor",
    description: "Extract plain text from multiple .eml files, remove headers and HTML, then combine all texts into a single file separated by _SPT_ tag.",
    icon: Scissors,
    color: "from-yellow-500/10 to-amber-500/10",
    iconColor: "text-yellow-500",
    borderColor: "border-yellow-500/20",
  },
  {
    href: "/email-source-separator",
    title: "Email Source Separator",
    description: "Separate email headers, plain text, and HTML parts. Select which parts to keep and download the modified email source as a text file.",
    icon: Layers,
    color: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-500",
    borderColor: "border-violet-500/20",
  },
  {
    href: "/html-to-img",
    title: "HTML to Image Converter",
    description: "Convert HTML code to high-quality PNG or JPEG images. Perfect for creating email previews, screenshots, or visual representations of HTML content.",
    icon: ImageIcon,
    color: "from-orange-500/10 to-red-500/10",
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/20",
  },
  {
    href: "/ip-comparator",
    title: "IP Comparator",
    description: "Compare two IP address lists to find missing IPs. Identify unique addresses, common entries, and differences between IP lists with detailed statistics.",
    icon: Network,
    color: "from-indigo-500/10 to-violet-500/10",
    iconColor: "text-indigo-500",
    borderColor: "border-indigo-500/20",
  },
  {
    href: "/photo-editor",
    title: "Images Toolkit",
    description: "All-in-one image processing suite featuring image combination, Base64 encoding, and interactive image map editor for email campaigns.",
    icon: PanelsRightBottom,
    color: "from-teal-500/10 to-cyan-500/10",
    iconColor: "text-teal-500",
    borderColor: "border-teal-500/20",
  },

  {
    href: "/subject-rewrite",
    title: "AI Subject Line Rewriter",
    description: "Transform spam-triggering subject lines into deliverable, high-performing alternatives. Get 20 optimized versions for each input subject line with AI-powered spam filter bypass technology.",
    icon: Mail,
    color: "from-pink-500/10 to-purple-500/10",
    iconColor: "text-pink-500",
    borderColor: "border-pink-500/20",
  },
]

export default function DashboardPage() {

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8 lg:py-12">
      {/* Welcome Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mt-2">
              Your dashboard for all email and IP processing tools
            </p>
          </div>
        </div>
      </div>

      {/* New Tool Banner */}
      <Card className="relative overflow-hidden border-2 border-primary/30 bg-linear-to-br from-primary/10 via-primary/5 to-primary/10 mb-8 md:mb-12 group hover:shadow-xl hover:border-primary/50 transition-all duration-300">
        <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <div className="relative p-4 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                <span className="text-sm font-semibold text-primary">New Tool</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                AI Subject Line Rewriter
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl">
                Transform spam-triggering subject lines into deliverable, high-performing alternatives. 
                Get 20 optimized versions for each input subject line with AI-powered spam filter bypass technology.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/subject-rewrite" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Try It Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>20 alternatives per line</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Higher deliverability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{tools.length}</div>
            <p className="text-xs text-muted-foreground">
              Professional email & IP tools
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Processing</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">Unlimited</div>
            <p className="text-xs text-muted-foreground">
              Process multiple files at once
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Zap className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Your Tools
            </h2>
            <p className="text-muted-foreground">
              Select a tool to get started or access from the sidebar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card
                key={tool.href}
                className={cn(
                  "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                  tool.borderColor,
                  "hover:border-primary/50"
                )}
              >
                {/* Background Gradient */}
                <div
                  className={cn(
                    "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    tool.color
                  )}
                />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={cn(
                        "p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 group-hover:scale-110 transition-transform duration-300",
                        tool.iconColor
                      )}
                    >
                      <Icon className={cn("h-6 w-6", tool.iconColor)} />
                    </div>
                  </div>
                  <CardTitle className="text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group/button border-2 hover:border-primary hover:bg-primary/10 transition-all duration-200"
                  >
                    <Link
                      href={tool.href}
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Open Tool</span>
                      <ArrowRight className="h-4 w-4 group-hover/button:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </CardContent>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Access Info */}
      <Card className="border-2 bg-linear-to-br from-primary/5 via-transparent to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Tips
          </CardTitle>
          <CardDescription>
            Get the most out of your tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-1.5 rounded bg-primary/10">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Batch Processing</p>
                <p className="text-xs text-muted-foreground">
                  Upload multiple files at once for faster processing
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="p-1.5 rounded bg-primary/10">
                <Network className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Sidebar Navigation</p>
                <p className="text-xs text-muted-foreground">
                  Access all tools quickly from the sidebar menu
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

