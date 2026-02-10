"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Check,  ArrowRight } from "lucide-react"
import {BackgroundBeams} from "@/components/ui/beams"


const Home = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const benefitsRef = useRef<HTMLUListElement>(null)
  const leftColumnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home")
    }
  }, [user, loading, router])



  const handleGetStarted = () => {
    router.push("/auth/signup")
  }

  return (
    <>
      <section
        ref={containerRef}
        className="relative w-full overflow-hidden py-12 md:py-20 lg:py-24"
      >
        {/* Animated Background */}
        <BackgroundBeams
          className="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
        />

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
            {/* Left Column */}
            <div ref={leftColumnRef} className="space-y-6 md:space-y-8">
              {/* Heading */}
              <h1
                ref={titleRef}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                Supercharge Your
                Email Workflow
              </h1>

              {/* Description */}
              <p
                ref={subtitleRef}
                className="text-lg md:text-xl leading-relaxed max-w-2xl"
              >
                Professional email tools powered by AI. Rewrite emails, optimize deliverability, process headers, and convert formats—all in one powerful platform
              </p>

              {/* CTA Buttons */}
              <div
                ref={buttonsRef}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Benefits List */}
              <ul
                ref={benefitsRef}
                className="space-y-3 pt-4"
              >
                <li className="flex items-center gap-3 text-[#415a77] dark:text-[#778da9]">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-base md:text-lg">12+ professional tools available</span>
                </li>
                <li className="flex items-center gap-3 text-[#415a77] dark:text-[#778da9]">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-base md:text-lg">Free to use</span>
                </li>
                <li className="flex items-center gap-3 text-[#415a77] dark:text-[#778da9]">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-base md:text-lg">24/7 support included</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
