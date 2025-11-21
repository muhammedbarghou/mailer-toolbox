import type { Metadata } from "next"
import { Ubuntu } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import CookieConsentBanner from "@/components/cookie-consent-banner"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/AuthContext"
import { ErrorBoundary } from "@/components/ui/error-boundary"

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
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
    <html lang="en" className={`light ${ubuntu.variable}`} style={{ colorScheme: "light" }}>
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
              <Analytics />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
