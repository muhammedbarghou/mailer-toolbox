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
]

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Powerful Tools for Your Email Workflow
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
            Discover our comprehensive suite of email and IP tools designed to streamline your workflow and boost productivity
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                      <span>Try Tool</span>
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
    </section>
  )
}

