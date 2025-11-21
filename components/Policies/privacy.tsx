import { Shield, Cookie, Eye, Lock, FileText, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Introduction */}
      <Card className="p-6 mb-6">
        <p className="text-foreground leading-relaxed">
          At MailerTools Hub, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
          use, disclose, and safeguard your information when you use our email and IP tools suite. Please read this 
          privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access 
          the application.
        </p>
      </Card>

      {/* Information We Collect */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
        </div>
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Information You Provide</h3>
          <p className="text-muted-foreground mb-4">
            Our tools are designed to process your data locally in your browser. We do not collect, store, or transmit 
            your email files, IP addresses, or any processed content to our servers.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Email files (.eml) you upload are processed entirely in your browser</li>
            <li>IP addresses you enter are compared locally without transmission</li>
            <li>HTML code you paste is converted to images in your browser</li>
            <li>No personal data is sent to our servers</li>
          </ul>
        </Card>
      </section>

      {/* Cookie Usage */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Cookie className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Cookie Usage</h2>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            We use cookies and similar technologies to enhance your experience and remember your preferences. 
            All cookies are stored locally in your browser and are not shared with third parties.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">Types of Cookies We Use</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Essential Cookies</h4>
              <p className="text-sm text-muted-foreground mb-2">
                These cookies are necessary for the website to function properly. They enable core functionality 
                such as theme preferences and cannot be disabled.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Theme Preference:</strong> Stores your dark/light mode preference (managed by next-themes)</li>
                <li><strong>Expiration:</strong> 1 year</li>
                <li><strong>Purpose:</strong> Remember your visual preference</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Preference Cookies</h4>
              <p className="text-sm text-muted-foreground mb-2">
                These cookies remember your tool preferences to improve your experience:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Header Processor Preset:</strong> Your preferred processing preset (standard/minimal/custom)</li>
                <li><strong>Header Processor Config:</strong> Custom field removal configuration (when using custom preset)</li>
                <li><strong>HTML to Image Format:</strong> Your preferred image format (PNG/JPEG)</li>
                <li><strong>IP Comparator Preferences:</strong> UI preferences and settings</li>
                <li><strong>EML Converter Preferences:</strong> File processing preferences</li>
                <li><strong>Expiration:</strong> 1 year</li>
                <li><strong>Purpose:</strong> Remember your tool configurations</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">UI State Cookies</h4>
              <p className="text-sm text-muted-foreground mb-2">
                These cookies remember your interface preferences:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>Settings Panel State:</strong> Whether settings panels are open or closed</li>
                <li><strong>Recent Tools:</strong> List of recently accessed tools (last 5)</li>
                <li><strong>Expiration:</strong> 30-90 days</li>
                <li><strong>Purpose:</strong> Improve navigation and usability</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Managing Cookies</h4>
            <p className="text-sm text-muted-foreground mb-2">
              You can control cookies through your browser settings. However, disabling cookies may affect 
              the functionality of our tools, as we rely on cookies to remember your preferences.
            </p>
            <p className="text-sm text-muted-foreground">
              To delete cookies: Open your browser settings → Privacy → Clear browsing data → Select "Cookies" 
              → Clear data. Note that clearing cookies will reset your preferences.
            </p>
          </div>
        </Card>
      </section>

      {/* How We Use Information */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">How We Use Information</h2>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            We use the information collected through cookies solely to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Remember your tool preferences and settings</li>
            <li>Maintain your theme preference (dark/light mode)</li>
            <li>Track your recently used tools for quick access</li>
            <li>Improve user experience and interface usability</li>
            <li>Ensure the application functions as expected</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            <strong>We do not:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Collect or store your email files or processed content</li>
            <li>Track your browsing behavior across other websites</li>
            <li>Share your data with third parties</li>
            <li>Use cookies for advertising or marketing purposes</li>
            <li>Collect personal identification information</li>
          </ul>
        </Card>
      </section>

      {/* Data Security */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Data Security</h2>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            We prioritize the security of your information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Local Processing:</strong> All file processing happens entirely in your browser</li>
            <li><strong>No Server Storage:</strong> Your files and data never leave your device</li>
            <li><strong>Secure Cookies:</strong> All cookies use secure flags (HTTPS only)</li>
            <li><strong>SameSite Protection:</strong> Cookies are protected against CSRF attacks</li>
            <li><strong>No Data Transmission:</strong> No personal or sensitive data is transmitted to our servers</li>
          </ul>
        </Card>
      </section>

      {/* Third-Party Services */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Third-Party Services</h2>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            We use the following third-party services that may set their own cookies:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Vercel (Hosting):</strong> May use analytics cookies for performance monitoring</li>
            <li><strong>next-themes:</strong> Manages theme preference cookies</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            We do not use advertising networks, tracking pixels, or social media tracking cookies.
          </p>
        </Card>
      </section>

      {/* Your Rights */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Access and review any cookies stored by our application</li>
            <li>Delete cookies through your browser settings</li>
            <li>Disable cookies, though this may affect functionality</li>
            <li>Use our tools without accepting non-essential cookies</li>
          </ul>
        </Card>
      </section>

      {/* Children's Privacy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
        <Card className="p-6">
          <p className="text-muted-foreground">
            Our services are not directed to children under the age of 13. We do not knowingly collect 
            personal information from children. If you are a parent or guardian and believe your child 
            has provided us with personal information, please contact us.
          </p>
        </Card>
      </section>

      {/* Changes to Privacy Policy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
        <Card className="p-6">
          <p className="text-muted-foreground">
            We may update our Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last updated" date. You are 
            advised to review this Privacy Policy periodically for any changes.
          </p>
        </Card>
      </section>

      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            If you have any questions about this Privacy Policy or our cookie usage, please contact us:
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
        <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm">
          Terms of Service
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

export default PrivacyPolicy