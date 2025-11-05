import type { Metadata } from "next";
import { Geist, Geist_Mono, Bitcount_Grid_Single } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Layouts/nav-bar";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'sonner'
import CookieConsentBanner from "@/components/cookie-consent-banner"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
;

export const metadata: Metadata = {
  title: "Mailer toolbox",
  description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{colorScheme:"light"}}>
      <body
        className={`${geistSans.variable} antialiased min-h-screen flex flex-col light`
        
        }
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <Navbar />
          <main className="grow px-4 md:px-6 py-4">
          {children}
          </main>
          <Footer />
          <Toaster position="bottom-right" />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
