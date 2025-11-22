import Home from "@/components/Landing/Home"
import type { Metadata } from "next"
import Navbar from "@/components/Landing/nav-bar"
import Footer from "@/components/Landing/footer"
import Contact from "@/components/Landing/contact-us"
import HeroSection from "@/components/Landing/HeroSection"

export const metadata: Metadata = {
  title: "Mailer Toolbox - All-in-One Email & IP Tools Suite",
  description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity. Free tools for email header processing, rewriting, subject line optimization, and more.",
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
    "free email tools",
  ],
  openGraph: {
    title: "Mailer Toolbox - All-in-One Email & IP Tools Suite",
    description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
    url: "/",
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
  },
  alternates: {
    canonical: "/",
  },
}


const page = () => {
  return (
    <div>
      <Navbar />
      <Home />  
      <HeroSection />
      <Contact />
      <Footer />
    </div>
  )
}

export default page

