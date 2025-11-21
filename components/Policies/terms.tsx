import { FileText, AlertTriangle, Shield, Ban, CheckCircle2, Users, Key, Lock, Scale, Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

const TermsOfService = () => {
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
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="p-6 mb-6">
          <p className="text-foreground leading-relaxed">
            Welcome to Mailer Toolkit ("the Service"). These Terms govern your use of our website and the tools we provide, 
            including email-processing utilities, AI-powered rewriting tools, image-processing tools, and features that 
            accept user-provided API keys.
          </p>
          <p className="text-foreground leading-relaxed mt-4">
            By accessing or using the Service, you agree to these Terms.
          </p>
        </Card>

        {/* 1. Description of the Service */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">1. Description of the Service</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              The Service provides tools for processing, analyzing, and transforming email content, including:
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Email Processing Tools:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
              <li>AI Email Rewriter</li>
              <li>Subject Line Rewriter</li>
              <li>Email Header Processor</li>
              <li>EML to TXT Converter</li>
              <li>Merge Tool</li>
              <li>Email Source Separator</li>
              <li>Gmail Deliverability Viewer</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Advanced Tools:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>HTML to Image Converter</li>
              <li>IP Comparator</li>
              <li>Images Toolkit</li>
            </ul>
            
            <p className="text-muted-foreground mt-4">
              Some AI features may require the user to provide their own API key (e.g., OpenAI, Anthropic, or other 
              third-party AI providers). These keys are never used for any purpose other than generating the requested output.
            </p>
          </Card>
        </section>

        {/* 2. Eligibility */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">2. Eligibility</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground">
              You must be at least 13 years old to use the Service and comply with any age or usage restrictions 
              required by connected third-party APIs.
            </p>
          </Card>
        </section>

        {/* 3. User Responsibilities */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">You agree to use the Service only for lawful purposes and to avoid:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Processing emails or content you do not have permission to use</li>
              <li>Using AI tools for spam generation, bulk email abuse, or harmful activities</li>
              <li>Uploading illegal, malicious, or dangerous content</li>
              <li>Attempting to extract or interfere with the Service's systems</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You are responsible for all activities performed with your API keys.
            </p>
          </Card>
        </section>

        {/* 4. User-Provided API Keys */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">4. User-Provided API Keys</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              Certain features allow you to enter your own API keys.
            </p>
            <p className="text-muted-foreground mb-4">
              By using these features, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Your API keys are encrypted before being stored.</li>
              <li>They are stored only so the tools can function as intended.</li>
              <li>They are never shared, sold, or used outside your requests.</li>
              <li>You can delete your API keys at any time.</li>
              <li>You are responsible for reviewing and following the terms of the API provider (e.g., OpenAI, Anthropic, Google).</li>
            </ul>
            <p className="text-muted-foreground">
              We do not assume responsibility for usage charges associated with your API keys.
            </p>
          </Card>
        </section>

        {/* 5. Google User Data */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">5. Google User Data</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              If you connect a Google account, we only access the minimum data required for the tool you use.
            </p>
            <p className="text-muted-foreground mb-4">
              We never sell, share, or use Google user data for advertising or analytics.
            </p>
            <p className="text-muted-foreground">
              We comply with Google API Services User Data Policy and Limited Use requirements.
            </p>
          </Card>
        </section>

        {/* 6. Intellectual Property */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              All software, UI, and branding belong to MailerTools Hub.
            </p>
            <p className="text-muted-foreground">
              You retain all rights to the content you upload or process.
            </p>
          </Card>
        </section>

        {/* 7. Disclaimer */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">7. Disclaimer</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground">
              The Service is provided "as is" without warranties of any kind, including accuracy of email analysis, 
              AI output, deliverability scoring, or conversions.
            </p>
          </Card>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
          </div>
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              We are not liable for damages arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use or inability to use the Service</li>
              <li>API usage charges</li>
              <li>Data loss or corruption</li>
              <li>Misinterpretation of tool output</li>
            </ul>
          </Card>
        </section>

        {/* 9. Changes */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes</h2>
          <Card className="p-6">
            <p className="text-muted-foreground">
              We may update these Terms at any time. Continued use means acceptance of updated Terms.
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
              For questions regarding these Terms:
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:support@mailer-toolkit.online" 
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

export default TermsOfService