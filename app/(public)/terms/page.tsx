import type { Metadata } from "next"
import { FileText, AlertTriangle, Shield, Ban, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | MailerTools Hub",
  description: "Terms and conditions for using MailerTools Hub email and IP tools suite.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="p-6 mb-6">
          <p className="text-foreground leading-relaxed">
            Welcome to MailerTools Hub. These Terms of Service ("Terms") govern your access to and use of our 
            email and IP tools suite. By accessing or using our services, you agree to be bound by these Terms. 
            If you disagree with any part of these terms, then you may not access the service.
          </p>
        </Card>

        {/* Acceptance of Terms */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground">
              By accessing and using MailerTools Hub, you accept and agree to be bound by the terms and provision 
              of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </Card>
        </section>

        {/* Description of Service */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              MailerTools Hub provides a suite of browser-based tools for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Processing email headers and files</li>
              <li>Converting email formats (EML to TXT)</li>
              <li>Comparing IP address lists</li>
              <li>Converting HTML to images</li>
              <li>Image editing and processing</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              All processing is performed locally in your browser. We do not store, transmit, or have access to 
              your files or data.
            </p>
          </Card>
        </section>

        {/* User Responsibilities */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">User Responsibilities</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use the service only for lawful purposes</li>
              <li>Not upload malicious files or content</li>
              <li>Not attempt to interfere with or disrupt the service</li>
              <li>Not use the service to violate any laws or regulations</li>
              <li>Not use the service to process content you do not have rights to</li>
              <li>Respect intellectual property rights</li>
              <li>Not attempt to reverse engineer or extract our code</li>
            </ul>
          </Card>
        </section>

        {/* Prohibited Uses */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="h-6 w-6 text-destructive" />
            <h2 className="text-2xl font-semibold">Prohibited Uses</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">You may not use our service:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>For any illegal purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To collect or track the personal information of others</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>For any obscene or immoral purpose</li>
              <li>To interfere with or circumvent the security features of the service</li>
            </ul>
          </Card>
        </section>

        {/* Privacy and Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Privacy and Data</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of 
              the service, to understand our practices regarding cookies and data collection.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>All file processing occurs locally in your browser</li>
              <li>We do not store, access, or transmit your files or data</li>
              <li>We use cookies only to remember your preferences (see Privacy Policy)</li>
              <li>No personal information is collected or shared</li>
            </ul>
            <Link 
              href="/privacy" 
              className="text-primary hover:underline font-medium inline-block mt-4"
            >
              Read our Privacy Policy
            </Link>
          </Card>
        </section>

        {/* Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              The service and its original content, features, and functionality are and will remain the exclusive 
              property of MailerTools Hub and its licensors. The service is protected by copyright, trademark, and 
              other laws.
            </p>
            <p className="text-muted-foreground">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly 
              perform, republish, download, store, or transmit any of the material on our service without prior 
              written consent.
            </p>
          </Card>
        </section>

        {/* Service Availability */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          <Card className="p-6">
            <p className="text-muted-foreground">
              We reserve the right to withdraw or amend our service, and any service or material we provide, 
              in our sole discretion without notice. We will not be liable if, for any reason, all or any 
              part of the service is unavailable at any time or for any period. From time to time, we may 
              restrict access to some parts of the service, or the entire service, to users.
            </p>
          </Card>
        </section>

        {/* Disclaimer of Warranties */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Disclaimer of Warranties</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO WARRANTIES, EXPRESSED 
              OR IMPLIED, AND HEREBY DISCLAIM AND NEGATE ALL OTHER WARRANTIES, INCLUDING WITHOUT LIMITATION, 
              IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR 
              NON-INFRINGEMENT OF INTELLECTUAL PROPERTY OR OTHER VIOLATION OF RIGHTS.
            </p>
            <p className="text-muted-foreground">
              We do not warrant that the service will be uninterrupted, timely, secure, or error-free, or that 
              defects will be corrected. We do not warrant that the results that may be obtained from the use of 
              the service will be effective, accurate, or reliable.
            </p>
          </Card>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              IN NO EVENT SHALL MAILERTOOLS HUB, ITS AFFILIATES, AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS, OR 
              LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY 
              DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER 
              INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THE SERVICE.
            </p>
            <p className="text-muted-foreground">
              Under no circumstances will MailerTools Hub be responsible for any damage, loss, or injury resulting 
              from hacking, tampering, or other unauthorized access or use of the service or your account or the 
              information contained therein.
            </p>
          </Card>
        </section>

        {/* Indemnification */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
          <Card className="p-6">
            <p className="text-muted-foreground">
              You agree to defend, indemnify, and hold harmless MailerTools Hub and its licensee and licensors, 
              and their employees, contractors, agents, officers and directors, from and against any and all claims, 
              damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to 
              attorney's fees), resulting from or arising out of your use and access of the service, or a breach 
              of these Terms.
            </p>
          </Card>
        </section>

        {/* Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
          <Card className="p-6">
            <p className="text-muted-foreground">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a 
              revision is material, we will provide at least 30 days notice prior to any new terms taking effect. 
              What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-muted-foreground mt-4">
              By continuing to access or use our service after those revisions become effective, you agree to be bound 
              by the revised terms. If you do not agree to the new terms, please stop using the service.
            </p>
          </Card>
        </section>

        {/* Governing Law */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
          <Card className="p-6">
            <p className="text-muted-foreground">
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which MailerTools Hub 
              operates, without regard to its conflict of law provisions. Our failure to enforce any right or 
              provision of these Terms will not be considered a waiver of those rights.
            </p>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2">
              <Link 
                href="/contact-us" 
                className="text-primary hover:underline font-medium"
              >
                Contact Us Page
              </Link>
            </div>
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
          <Link href="/about-us" className="text-muted-foreground hover:text-foreground text-sm">
            About Us
          </Link>
          <Link href="/contact-us" className="text-muted-foreground hover:text-foreground text-sm">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

