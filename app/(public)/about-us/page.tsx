import type { Metadata } from "next"
import { Info, Mail, FileText, Network, Image as ImageIcon, Palette, Shield, Zap, Target, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About Us | MailerTools Hub",
  description: "Learn about MailerTools Hub - the all-in-one suite of essential email and IP tools designed to simplify agent mailer workflows.",
}

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Info className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">About Us</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Making agent mailers work easier, one tool at a time.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <Target className="h-6 w-6 text-primary mt-1 shrink-0" />
            <div>
              <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
              <p className="text-foreground leading-relaxed mb-4">
                MailerTools Hub was created with a simple goal: to make the lives of email marketing agents and 
                mailer professionals easier. We understand the challenges you face daily - from processing email 
                headers to comparing IP lists, converting formats, and managing images. Our suite of tools eliminates 
                the need for multiple applications and complex workflows.
              </p>
              <p className="text-foreground leading-relaxed">
                Every tool in our platform is designed with your productivity in mind. We believe that the best tools 
                are the ones that just work, without complicated setups or steep learning curves. That's why all our 
                tools run entirely in your browser - fast, secure, and completely private.
              </p>
            </div>
          </div>
        </Card>

        {/* What We Offer */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">What We Offer</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-6">
              MailerTools Hub provides a comprehensive suite of browser-based tools specifically designed for 
              email marketing professionals and agents. Our platform includes:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Email Header Processor</h3>
                  <p className="text-sm text-muted-foreground">
                    Batch process EML files with configurable presets. Clean and standardize email headers efficiently.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">EML to TXT Converter</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert email files to plain text format quickly and easily, preserving essential content.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Network className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">IP Comparator</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare two IP address lists and find missing IPs. Perfect for managing whitelists and blacklists.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <ImageIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">HTML to Image Converter</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert HTML code to PNG or JPEG images. Ideal for creating email previews and thumbnails.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 md:col-span-2">
                <Palette className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Photo Editor & Images Toolkit</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive image editing capabilities for optimizing and preparing visuals for your email campaigns.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Why Choose Us */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Why Choose MailerTools Hub</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Fast & Efficient</h3>
              </div>
              <p className="text-muted-foreground">
                All processing happens locally in your browser. No server delays, no waiting for uploads. 
                Get results instantly.
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">100% Private</h3>
              </div>
              <p className="text-muted-foreground">
                Your files never leave your device. We don't store, transmit, or have access to any of your data. 
                Complete privacy guaranteed.
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">No Installation</h3>
              </div>
              <p className="text-muted-foreground">
                Access all tools directly from your browser. No software downloads, no complex setups. 
                Just open and use.
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Built for Agents</h3>
              </div>
              <p className="text-muted-foreground">
                Every tool is designed specifically for email marketing professionals. Workflows that make sense 
                for your daily tasks.
              </p>
            </Card>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Privacy & Security First</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              At MailerTools Hub, we believe your data should remain yours. That's why we've built our platform 
              with privacy as a core principle:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>All file processing occurs locally in your browser</li>
              <li>No files are uploaded to any server</li>
              <li>No data is stored or transmitted</li>
              <li>We use cookies only to remember your preferences (theme, settings)</li>
              <li>No personal information is collected or shared</li>
            </ul>
            <p className="text-muted-foreground">
              Your work is your business. We just provide the tools to make it easier.
            </p>
          </Card>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              Using MailerTools Hub is straightforward:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Choose the tool you need from our suite</li>
              <li>Upload your files or paste your data (all processing happens in your browser)</li>
              <li>Configure settings if needed (presets available for quick setup)</li>
              <li>Process and download your results instantly</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              No accounts, no subscriptions, no hassle. Just tools that work when you need them.
            </p>
          </Card>
        </section>

        {/* Contact & Support */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              Have questions, suggestions, or feedback? We'd love to hear from you. Your input helps us improve 
              and build better tools for the community.
            </p>
            <Link 
              href="/contact-us" 
              className="text-primary hover:underline font-medium inline-block"
            >
              Contact Us →
            </Link>
          </Card>
        </section>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-4 justify-center mt-8 pt-8 border-t">
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
            Home
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm">
            Terms of Service
          </Link>
          <Link href="/contact-us" className="text-muted-foreground hover:text-foreground text-sm">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AboutUsPage

