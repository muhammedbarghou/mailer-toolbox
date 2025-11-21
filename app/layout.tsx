import type { Metadata } from "next"
import {  IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import CookieConsentBanner from "@/components/cookie-consent-banner"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorBoundary } from "@/components/ui/error-boundary"



const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Mailer toolbox",
  description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
  icons: {
    icon: "/AppLogo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${ibmPlexMono.variable}`} style={{ colorScheme: "light" }}>
      <body suppressHydrationWarning className={`m-0 p-0 overflow-x-hidden ${ibmPlexMono.className} light`}>
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
              <Analytics />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
