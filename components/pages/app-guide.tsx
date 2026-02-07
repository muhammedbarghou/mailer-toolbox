"use client"

import type React from "react"
import {
  Sparkles,
  Mail,
  Inbox,
  FileText,
  Scissors,
  SplitSquareHorizontal,
  Layers,
  Search,
  ImageIcon,
  Network,
  ShieldAlert,
  PanelsRightBottom,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  AlertCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface AppGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const tools = [
  {
    icon: Sparkles,
    title: "AI Email Rewriter",
    description: "Transform HTML emails to bypass spam filters and improve deliverability while maintaining your original message and design.",
    features: [
      "Multi-provider AI support (Gemini, OpenAI, Anthropic)",
      "Preserve original email design and colors",
      "Optional primary color customization",
      "Optimized prompt caching for cost efficiency",
      "Real-time rewriting with progress indicators",
    ],
    usage: [
      "Paste your HTML email content or upload an HTML file",
      "Select your preferred AI provider and model",
      "Optionally customize the primary color (or keep original)",
      "Click 'Rewrite Email' to generate optimized versions",
      "Copy or download the rewritten email",
    ],
  },
  {
    icon: Mail,
    title: "Subject Line Rewriter",
    description: "Transform spam-triggering subject lines into deliverable, high-performing alternatives with AI-powered optimization.",
    features: [
      "Generate 20 optimized subject line variations",
      "Multi-provider AI support (Gemini, OpenAI, Anthropic)",
      "Spam filter bypass technology",
      "Maintains message intent while improving deliverability",
      "Optimized prompt caching",
    ],
    usage: [
      "Enter your original subject line",
      "Select your preferred AI provider and model",
      "Click 'Rewrite Subject Lines' to generate alternatives",
      "Review and select the best option for your campaign",
    ],
  },
  {
    icon: Inbox,
    title: "Email Header Processor",
    description: "Process and analyze email headers in batch mode. Remove tracking headers, sanitize sender information, and optimize headers for better deliverability.",
    features: [
      "Batch processing of multiple email files (.eml, .txt)",
      "Remove DKIM, SPF, ARC, and tracking headers",
      "Optional X-header removal",
      "Custom parameter placeholders",
      "Custom headers support",
      "Profile management for saved configurations",
      "Paste mode for quick processing",
    ],
    usage: [
      "Upload email files or paste email content",
      "Configure parameters in the Parameters dialog",
      "Set up custom headers if needed",
      "Toggle X-header removal option",
      "Process files individually or in batch",
      "Save configurations as profiles for reuse",
    ],
  },
  {
    icon: FileText,
    title: "EML to TXT Converter",
    description: "Convert multiple email files (.eml) to plain text format with timestamps. Extract text content from email files quickly and efficiently.",
    features: [
      "Batch conversion of .eml files",
      "Preserves timestamps and metadata",
      "Clean text extraction",
      "Download individual or all files",
    ],
    usage: [
      "Upload one or more .eml files",
      "Files are automatically converted to .txt format",
      "Download converted files individually or as a ZIP",
    ],
  },
  {
    icon: Scissors,
    title: "Merge Tool (EML Text Extractor)",
    description: "Extract plain text from multiple .eml files, remove headers and HTML, then combine all texts into a single file separated by _SPT_ tag.",
    features: [
      "Extract text from multiple .eml files",
      "Remove headers and HTML formatting",
      "Combine all texts with _SPT_ separators",
      "Single output file for easy processing",
    ],
    usage: [
      "Upload multiple .eml files",
      "Tool extracts plain text from each file",
      "All texts are combined into one file with _SPT_ separators",
      "Download the merged text file",
    ],
  },
  {
    icon: SplitSquareHorizontal,
    title: "Text File Mapper",
    description: "Map and transform text files with custom rules and patterns for bulk processing.",
    features: [
      "Custom mapping rules",
      "Pattern matching and replacement",
      "Batch file processing",
    ],
    usage: [
      "Upload text files to process",
      "Configure mapping rules",
      "Process and download transformed files",
    ],
  },
  {
    icon: Layers,
    title: "Email Source Separator",
    description: "Separate email headers, plain text, and HTML parts. Select which parts to keep and download the modified email source as a text file.",
    features: [
      "Separate headers, text, and HTML components",
      "Selective component extraction",
      "Clean source file generation",
    ],
    usage: [
      "Upload or paste email source",
      "Select which components to keep",
      "Download the modified email source",
    ],
  },
  {
    icon: Search,
    title: "Gmail Deliverability Viewer",
    description: "Analyze email deliverability metrics and view how Gmail processes your emails.",
    features: [
      "Gmail-specific deliverability analysis",
      "Header analysis and recommendations",
      "Spam score indicators",
    ],
    usage: [
      "Upload or paste email content",
      "View deliverability analysis",
      "Review recommendations for improvement",
    ],
  },
  {
    icon: ImageIcon,
    title: "HTML to Image Converter",
    description: "Convert HTML code to high-quality PNG or JPEG images. Perfect for creating email previews, screenshots, or visual representations of HTML content.",
    features: [
      "High-quality image output (PNG/JPEG)",
      "Custom dimensions and quality settings",
      "Batch conversion support",
    ],
    usage: [
      "Paste HTML code or upload HTML file",
      "Configure image settings (format, quality, dimensions)",
      "Generate and download the image",
    ],
  },
  {
    icon: Network,
    title: "IP Comparator",
    description: "Compare two IP address lists to find missing IPs. Identify unique addresses, common entries, and differences between IP lists with detailed statistics.",
    features: [
      "Compare two IP lists",
      "Find unique and common IPs",
      "Detailed statistics and analysis",
      "Export comparison results",
    ],
    usage: [
      "Upload or paste two IP address lists",
      "View comparison statistics",
      "Export results showing differences",
    ],
  },
  {
    icon: ShieldAlert,
    title: "IP Reputation Checker",
    description: "Check the reputation and status of IP addresses to ensure optimal email deliverability.",
    features: [
      "IP reputation scoring",
      "Blacklist checking",
      "Historical data analysis",
    ],
    usage: [
      "Enter IP addresses to check",
      "View reputation scores and status",
      "Review blacklist information",
    ],
  },
  {
    icon: PanelsRightBottom,
    title: "Images Toolkit",
    description: "All-in-one image processing suite featuring image combination, Base64 encoding, and interactive image map editor for email campaigns.",
    features: [
      "Image combination and merging",
      "Base64 encoding/decoding",
      "Interactive image map editor",
      "Multiple format support",
    ],
    usage: [
      "Upload images to process",
      "Select the desired operation",
      "Download processed images",
    ],
  },
]

export const AppGuide: React.FC<AppGuideProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6" />
            Mailer Toolkit - Complete Guide
          </DialogTitle>
          <DialogDescription>
            Comprehensive guide to all features and tools in the Mailer Toolkit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Mailer Toolkit is a comprehensive suite of email and IP tools designed to improve email deliverability,
                bypass spam filters, and streamline your email marketing workflow. All tools are built with modern
                web technologies and support batch processing for maximum efficiency.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Email Processing</Badge>
                <Badge variant="secondary">AI-Powered</Badge>
                <Badge variant="secondary">Batch Processing</Badge>
                <Badge variant="secondary">Multi-Provider AI</Badge>
                <Badge variant="secondary">Profile Management</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">1. Sign Up / Sign In</h4>
                <p className="text-sm text-muted-foreground">
                  Create an account or sign in to access all features. Authentication is required for saving profiles
                  and managing API keys.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">2. Add API Keys</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to Settings and add your API keys for AI providers (Gemini, OpenAI, or Anthropic). Your keys
                  are encrypted and stored securely. You can use different models from different providers for different tools.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Gemini: Get your API key from Google AI Studio</li>
                  <li>OpenAI: Get your API key from OpenAI Platform</li>
                  <li>Anthropic: Get your API key from Anthropic Console</li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">3. Choose Your Tool</h4>
                <p className="text-sm text-muted-foreground">
                  Browse the sidebar to find the tool you need. Each tool is designed for specific email processing tasks.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tools Section */}
          <Card>
            <CardHeader>
              <CardTitle>Tools & Features</CardTitle>
              <CardDescription>Detailed information about each tool in the Mailer Toolkit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {tools.map((tool, index) => {
                  const Icon = tool.icon
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Key Features:
                            </h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-6">
                              {tool.features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              How to Use:
                            </h4>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-6">
                              {tool.usage.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                      {index < tools.length - 1 && <Separator className="mt-4" />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Multi-Provider AI Support</h4>
                <p className="text-sm text-muted-foreground">
                  Choose from multiple AI providers (Gemini, OpenAI, Anthropic) and their latest models. Each provider
                  offers different strengths - select the one that best fits your needs.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">API Key Management</h4>
                <p className="text-sm text-muted-foreground">
                  Securely store and manage your API keys. All keys are encrypted before storage and can be validated
                  before saving. You can add keys for multiple providers and switch between them as needed.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Profile Management</h4>
                <p className="text-sm text-muted-foreground">
                  Save your configurations as profiles for quick reuse. Profiles store parameters, custom headers, and
                  processing options. Set a default profile to automatically load your preferred settings.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Optimized Prompt Caching</h4>
                <p className="text-sm text-muted-foreground">
                  Our intelligent caching system reduces token usage and costs by caching system prompts separately from
                  content. This optimization can significantly reduce API costs for frequent operations.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Batch Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Process multiple files at once with batch operations. Upload multiple files, process them all, and
                  download results individually or as a ZIP archive.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Email Rewriting</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Test with small batches first to understand the output quality</li>
                  <li>Use faster models (like Flash) for bulk processing and premium models for important campaigns</li>
                  <li>Keep original colors when possible to maintain brand consistency</li>
                  <li>Review rewritten content before sending to ensure message integrity</li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Header Processing</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Create profiles for different campaign types (newsletter, transactional, etc.)</li>
                  <li>Use custom headers to add campaign-specific metadata</li>
                  <li>Enable X-header removal for cleaner email sources</li>
                  <li>Test processed headers with deliverability tools before sending</li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">API Key Management</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Add API keys for multiple providers to have flexibility</li>
                  <li>Monitor your API usage through provider dashboards</li>
                  <li>Use rate limiting to avoid exceeding quotas</li>
                  <li>Validate keys before saving to ensure they work correctly</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">API Key Issues</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>
                    <strong>Invalid API Key:</strong> Verify your key is correct and has the necessary permissions
                  </li>
                  <li>
                    <strong>Rate Limit Exceeded:</strong> Wait a few minutes or upgrade your API plan
                  </li>
                  <li>
                    <strong>Quota Exceeded:</strong> Check your provider dashboard for usage limits
                  </li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Processing Errors</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>
                    <strong>File Upload Fails:</strong> Ensure files are in supported formats (.eml, .txt, .html)
                  </li>
                  <li>
                    <strong>Processing Timeout:</strong> Try processing smaller batches or check your internet connection
                  </li>
                  <li>
                    <strong>Unexpected Output:</strong> Review your parameters and custom headers configuration
                  </li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Profile Issues</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>
                    <strong>Profile Not Loading:</strong> Ensure you're signed in and the profile exists
                  </li>
                  <li>
                    <strong>Settings Not Saving:</strong> Check for unsaved changes indicator and click save
                  </li>
                  <li>
                    <strong>Default Profile Not Applied:</strong> Verify the profile is marked as default
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you encounter any issues or have questions, please contact our support team through the Contact Support
                link in the sidebar. We're here to help you get the most out of Mailer Toolkit.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
