import type { Metadata } from "next";
import { Geist, Geist_Mono, Bitcount_Grid_Single } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Layouts/nav-bar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'sonner'
import CookieConsentBanner from "@/components/cookie-consent-banner"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/AuthContext"
import AuthenticatedLayout from "@/components/Layouts/AuthenticatedLayout"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
;

export const metadata: Metadata = {
  title: "Mailer toolbox",
  description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
  icons: {
    icon: "/Logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{colorScheme:"light"}}>
      <body suppressHydrationWarning>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <AuthProvider>
          <Navbar />
          <main className="grow overflow-auto">
            <AuthenticatedLayout>
              {children}
            </AuthenticatedLayout>
          </main>
          <Footer />
          <Toaster position="bottom-right" />
          <CookieConsentBanner />
          <Analytics />
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
