import Home from "@/components/Landing/Home"
import type { Metadata } from "next"
import Navbar from "@/components/Landing/nav-bar"
import Footer from "@/components/Landing/footer"
import Contact from "@/components/Landing/contact-us"

export const metadata: Metadata = {
  title: "Mailer Toolkit - All-in-One Email & IP Tools Suite",
  description: "Mailer Toolkit is an all-in-one suite of professional email and IP tools designed for marketers, developers, and deliverability specialists. Created by Mohamed Barghou. Free tools for email header processing, rewriting, subject line optimization, Gmail deliverability analysis, and more.",
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
    "Mailer Toolkit",
  ],
  openGraph: {
    title: "Mailer Toolkit - All-in-One Email & IP Tools Suite",
    description: "Mailer Toolkit is an all-in-one suite of professional email and IP tools designed for marketers, developers, and deliverability specialists.",
    url: "/",
    images: [
      {
        url: "/AppLogo.png",
        width: 1200,
        height: 630,
        alt: "Mailer Toolkit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mailer Toolkit - All-in-One Email & IP Tools Suite",
    description: "Mailer Toolkit is an all-in-one suite of professional email and IP tools designed for marketers, developers, and deliverability specialists.",
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
      <Contact />
      <Footer />
    </div>
  )
}

export default page

