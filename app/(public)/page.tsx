import Home from "@/components/Landing/Home"
import type { Metadata } from "next"
import Navbar from "@/components/Landing/nav-bar"
import Footer from "@/components/Landing/footer"
import Contact from "@/components/Landing/contact-us"
import HeroSection from "@/components/Landing/HeroSection"

export const metadata: Metadata = {
  title: "Mailer Toolkit",
  description: "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity.",
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

