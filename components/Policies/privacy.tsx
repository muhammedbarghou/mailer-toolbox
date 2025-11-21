import { Shield, Eye, Database, Key, Clock, Share2, Lock, UserCheck, FileCheck, Mail } from "lucide-react"
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
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="p-6 mb-6">
          <p className="text-foreground leading-relaxed">
            This Privacy Policy describes how Mailer Toolkit ("we", "us", "our") collects, uses, and protects your information.
          </p>
          <p className="text-foreground leading-relaxed mt-4">
            By using the Service, you agree to this Policy.
          </p>
        </Card>

        {/* 1. Information We Collect */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          </div>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3">1.1 Data You Provide</h3>
            <p className="text-muted-foreground mb-4">
              We may collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li>Email content you paste or upload</li>
              <li>EML files, headers, subjects, or HTML</li>
              <li>Uploaded images</li>
              <li>IPs for comparison</li>
              <li>User-provided API keys (securely encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">1.2 Automatically Collected Data</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Browser, device, and usage logs</li>
              <li>Minimal analytics to improve performance</li>
            </ul>
            <p className="text-muted-foreground italic">
              (We do not track for advertising or behavioral profiling.)
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">1.3 Google User Data</h3>
            <p className="text-muted-foreground mb-4">
              If you connect Google APIs, we only access the minimum data required for the requested task.
              We comply with Google's Limited Use Policy.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong>We do NOT:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Store Google data longer than necessary</li>
              <li>Sell or share Google data</li>
              <li>Use Google data for advertising</li>
              <li>Train AI models on Google data</li>
            </ul>
          </Card>
        </section>

        {/* 2. How We Use Information */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">2. How We Use Information</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              We use your data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li>Provide tool outputs</li>
              <li>Process uploaded email content</li>
              <li>Convert files or images</li>
              <li>Generate AI-based rewrites</li>
              <li>Improve performance and security</li>
            </ul>
            <p className="text-muted-foreground">
              We never use your data for secondary purposes like marketing or profiling.
            </p>
          </Card>
        </section>

        {/* 3. User-Provided API Keys */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">3. User-Provided API Keys</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              When you supply an API key to use our AI features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Your API key is encrypted at rest.</li>
              <li>It is used only to make requests on your behalf.</li>
              <li>It is not logged, shared, or analyzed.</li>
              <li>It can be deleted by you at any time.</li>
              <li>We do not access API key content except through encrypted operations.</li>
            </ul>
            <p className="text-muted-foreground">
              We do not store the content generated by your API key unless temporarily required for delivering the result.
            </p>
          </Card>
        </section>

        {/* 4. Data Retention */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">4. Data Retention</h2>
          </div>
          <Card className="p-6">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Uploaded content is deleted automatically after processing.</li>
              <li>Temporary processing data is not stored in long-term logs.</li>
              <li>Google user data is not stored beyond tool execution.</li>
              <li>API keys remain stored only until you delete them.</li>
            </ul>
          </Card>
        </section>

        {/* 5. Data Sharing */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">5. Data Sharing</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              We do not sell or rent user data.
            </p>
            <p className="text-muted-foreground mb-4">
              We share data only with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Hosting providers</li>
              <li>Security services</li>
              <li>Legal authorities if required by law</li>
            </ul>
            <p className="text-muted-foreground">
              No user data is shared for advertising or marketing.
            </p>
          </Card>
        </section>

        {/* 6. Security */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">6. Security</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              We use encryption, access control, and secure storage practices.
            </p>
            <p className="text-muted-foreground">
              No system is perfectly secure, but we take strong measures to minimize risk.
            </p>
          </Card>
        </section>

        {/* 7. Your Rights */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">7. Your Rights</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              You may request:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Deletion of stored API keys</li>
              <li>Deletion of any persistently stored data</li>
              <li>Clarification about how your information is handled</li>
              <li>Disconnection from Google access</li>
            </ul>
          </Card>
        </section>

        {/* 8. Compliance With Google API Limited Use */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">8. Compliance With Google API Limited Use</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              If Google APIs are used, we follow:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Google API Services User Data Policy</li>
              <li>Limited Use requirements</li>
            </ul>
            <p className="text-muted-foreground">
              Your Google data is not used to develop features unrelated to your direct input.
            </p>
          </Card>
        </section>

        {/* 9. Changes */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes</h2>
          <Card className="p-6">
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time.
            </p>
            <p className="text-muted-foreground mt-4">
              Upon posting, changes become effective.
            </p>
          </Card>
        </section>

        {/* 10. Contact */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">10. Contact</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              For privacy-related questions or requests:
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:support@mailertoolkit.com" 
                className="text-primary hover:underline font-medium"
              >
                support@mailer-toolkit.online
              </a>
            </div>
          </Card>
        </section>

      </div>
    </div>
  )
}

export default PrivacyPolicy