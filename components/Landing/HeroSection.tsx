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
  Layers,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

const tools = [
  {
    href: "/rewrite",
    title: "AI Email Rewriter",
    description: "Transform HTML emails to bypass spam filters and improve deliverability while maintaining your original message and design.",
    icon: Sparkles,
    color: "from-[#778da9]/10 to-[#415a77]/10",
    iconColor: "text-[#778da9]",
    borderColor: "border-[#778da9]/30",
  },
  {
    href: "/subject-rewrite",
    title: "AI Subject Line Rewriter",
    description: "Transform spam-triggering subject lines into deliverable, high-performing alternatives. Get 20 optimized versions for each input subject line with AI-powered spam filter bypass technology.",
    icon: Mail,
    color: "from-[#415a77]/10 to-[#1b263b]/10",
    iconColor: "text-[#415a77]",
    borderColor: "border-[#415a77]/30",
  },
  {
    href: "/header-processor",
    title: "Email Header Processor",
    description: "Process and analyze email headers in batch mode. Remove tracking headers, sanitize sender information, and optimize headers for better deliverability.",
    icon: Inbox,
    color: "from-[#778da9]/10 to-[#415a77]/10",
    iconColor: "text-[#778da9]",
    borderColor: "border-[#778da9]/30",
  },
  {
    href: "/eml-to-txt-converter",
    title: "EML to TXT Converter",
    description: "Convert multiple email files (.eml) to plain text format with timestamps. Extract text content from email files quickly and efficiently.",
    icon: FileText,
    color: "from-[#415a77]/10 to-[#1b263b]/10",
    iconColor: "text-[#415a77]",
    borderColor: "border-[#415a77]/30",
  },
  {
    href: "/eml-text-extractor",
    title: "EML Text Extractor",
    description: "Extract plain text from multiple .eml files, remove headers and HTML, then combine all texts into a single file separated by _SPT_ tag.",
    icon: Scissors,
    color: "from-[#778da9]/10 to-[#415a77]/10",
    iconColor: "text-[#778da9]",
    borderColor: "border-[#778da9]/30",
  },
  {
    href: "/email-source-separator",
    title: "Email Source Separator",
    description: "Separate email headers, plain text, and HTML parts. Select which parts to keep and download the modified email source as a text file.",
    icon: Layers,
    color: "from-[#415a77]/10 to-[#1b263b]/10",
    iconColor: "text-[#415a77]",
    borderColor: "border-[#415a77]/30",
  },
  {
    href: "/html-to-img",
    title: "HTML to Image Converter",
    description: "Convert HTML code to high-quality PNG or JPEG images. Perfect for creating email previews, screenshots, or visual representations of HTML content.",
    icon: ImageIcon,
    color: "from-[#778da9]/10 to-[#415a77]/10",
    iconColor: "text-[#778da9]",
    borderColor: "border-[#778da9]/30",
  },
  {
    href: "/ip-comparator",
    title: "IP Comparator",
    description: "Compare two IP address lists to find missing IPs. Identify unique addresses, common entries, and differences between IP lists with detailed statistics.",
    icon: Network,
    color: "from-[#415a77]/10 to-[#1b263b]/10",
    iconColor: "text-[#415a77]",
    borderColor: "border-[#415a77]/30",
  },
  {
    href: "/photo-editor",
    title: "Images Toolkit",
    description: "All-in-one image processing suite featuring image combination, Base64 encoding, and interactive image map editor for email campaigns.",
    icon: PanelsRightBottom,
    color: "from-[#778da9]/10 to-[#415a77]/10",
    iconColor: "text-[#778da9]",
    borderColor: "border-[#778da9]/30",
  },
]

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-20 lg:py-24 ">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="bg-linear-to-r from-[#1b263b] via-[#415a77] to-[#778da9] dark:from-[#e0e1dd] dark:via-[#778da9] dark:to-[#415a77] bg-clip-text text-transparent">
              Powerful Tools for Your Email Workflow
            </span>
          </h2>
          <p className="text-[#415a77] dark:text-[#778da9] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Discover our comprehensive suite of {tools.length} professional email and IP tools designed to streamline your workflow and boost productivity
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card
                key={tool.href}
                className={cn(
                  "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-[#e0e1dd]/30 dark:bg-[#1b263b]/30 backdrop-blur-sm",
                  tool.borderColor,
                  "hover:border-[#415a77] dark:hover:border-[#778da9]"
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
                        "p-3 rounded-lg bg-[#e0e1dd]/50 dark:bg-[#1b263b]/50 backdrop-blur-sm border border-[#778da9]/30 group-hover:scale-110 transition-transform duration-300 group-hover:border-[#415a77] dark:group-hover:border-[#778da9]",
                        tool.iconColor
                      )}
                    >
                      <Icon className={cn("h-6 w-6", tool.iconColor)} />
                    </div>
                  </div>
                  <CardTitle className="text-xl md:text-2xl mb-2 text-[#1b263b] dark:text-[#e0e1dd] group-hover:text-[#415a77] dark:group-hover:text-[#778da9] transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base leading-relaxed text-[#415a77] dark:text-[#778da9]">
                    {tool.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group/button border-2 border-[#778da9]/30 hover:border-[#415a77] dark:hover:border-[#778da9] hover:bg-[#778da9]/10 dark:hover:bg-[#415a77]/20 text-[#415a77] dark:text-[#778da9] transition-all duration-200"
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
                <div className="absolute inset-0 bg-linear-to-br from-[#778da9]/0 via-[#415a77]/0 to-[#778da9]/10 dark:to-[#415a77]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

