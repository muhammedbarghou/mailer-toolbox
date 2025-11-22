import type { Metadata } from "next"
import { Ubuntu } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import CookieConsentBanner from "@/components/cookie-consent-banner"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { FeedbackWidgetWrapper } from "@/components/feedback/feedback-widget-wrapper"

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
})



export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mailer-toolkit.online"),
  title: {
    default: "Mailer Toolbox - All-in-One Email & IP Tools Suite",
    template: "%s | Mailer Toolbox",
  },
  description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
  keywords: [
    "email tools",
    "IP tools",
    "email header processor",
    "email rewrite",
    "subject line rewrite",
    "email source separator",
    "EML converter",
    "Gmail deliverability",
    "IP comparator",
    "email utilities",
    "mailer tools",
  ],
  authors: [{ name: "Mailer Toolbox" }],
  creator: "Mailer Toolbox",
  publisher: "Mailer Toolbox",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/AppLogo.png",
    apple: "/AppLogo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://mailertoolbox.com",
    siteName: "Mailer Toolbox",
    title: "Mailer Toolbox - All-in-One Email & IP Tools Suite",
    description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
    images: [
      {
        url: "/AppLogo.png",
        width: 1200,
        height: 630,
        alt: "Mailer Toolbox",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mailer Toolbox - All-in-One Email & IP Tools Suite",
    description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
    images: ["/AppLogo.png"],
    creator: "@mailertoolbox", // Update with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://mailertoolbox.com",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mailer Toolbox",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://mailertoolbox.com",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mailertoolbox.com"}/AppLogo.png`,
    description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
  }

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mailer Toolbox",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://mailertoolbox.com",
    description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
  }

  return (
    <html lang="en" className={`light ${ubuntu.variable}`} style={{ colorScheme: "light" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body suppressHydrationWarning className={`m-0 p-0 overflow-x-hidden light ${ubuntu.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" />
              <CookieConsentBanner />
              <FeedbackWidgetWrapper />
              <SpeedInsights />
              <Analytics />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
