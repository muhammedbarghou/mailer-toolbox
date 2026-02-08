"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern"
import { Check, Play, ArrowRight } from "lucide-react"


const Home = () => {
  const [isMounted, setIsMounted] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const benefitsRef = useRef<HTMLUListElement>(null)
  const illustrationRef = useRef<HTMLDivElement>(null)
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home")
    }
  }, [user, loading, router])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return

    // Register ScrollTrigger only on client side
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Left column animation
      if (leftColumnRef.current) {
        gsap.fromTo(
          leftColumnRef.current,
          {
            x: -50,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            delay: 0.3,
          }
        )
      }

      // Title animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          {
            y: 30,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.5,
          }
        )
      }

      // Subtitle animation
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.7,
          }
        )
      }

      // Buttons animation
      if (buttonsRef.current) {
        gsap.fromTo(
          buttonsRef.current,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.9,
          }
        )
      }

      // Benefits list animation
      if (benefitsRef.current) {
        const benefitItems = benefitsRef.current.children || []
        if (benefitItems.length > 0) {
          gsap.fromTo(
            benefitItems,
            {
              x: -20,
              opacity: 0,
            },
            {
              x: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.1,
              delay: 1.1,
            }
          )
        }
      }

      // Right column (illustration) animation
      if (rightColumnRef.current) {
        gsap.fromTo(
          rightColumnRef.current,
          {
            x: 50,
            opacity: 0,
            scale: 0.9,
          },
          {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            delay: 0.4,
          }
        )
      }

      // Illustration floating animation
      if (illustrationRef.current) {
        gsap.to(illustrationRef.current, {
          y: "+=20",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.5,
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isMounted])

  const handleGetStarted = () => {
    router.push("/home")
  }

  const handleWatchDemo = () => {
    // Scroll to tools carousel or open demo modal
    const carouselSection = document.getElementById("tools-carousel")
    if (carouselSection) {
      carouselSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <section
        ref={containerRef}
        className="relative w-full overflow-hidden py-12 md:py-20 lg:py-24"
      >
        {/* Animated Background */}
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          squares={[
            [4, 4],
            [5, 1],
            [8, 2],
            [5, 3],
            [5, 5],
          ]}
          className={cn(
            "mask-[radial-gradient(400px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
          )}
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
                  className="bg-[#1b263b] dark:bg-[#e0e1dd] text-[#e0e1dd] dark:text-[#1b263b] hover:bg-[#415a77] dark:hover:bg-[#778da9] transition-colors"
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

            {/* Right Column - Animated Illustration */}
            <div ref={rightColumnRef} className="relative flex items-center justify-center lg:justify-end">
              <div
                ref={illustrationRef}
                className="relative w-full max-w-md lg:max-w-lg aspect-square"
              >
                {/* Animated Geometric Illustration */}
                <div className="relative w-full h-full">
                  {/* Main geometric shape */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                      {/* Animated cube/hexagon shape */}
                      <svg
                        viewBox="0 0 200 200"
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#778da9" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#415a77" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#1b263b" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                        {/* Top face */}
                        <polygon
                          points="100,20 180,60 180,140 100,180 20,140 20,60"
                          fill="url(#grad1)"
                          stroke="#415a77"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                        {/* Perspective lines */}
                        <line
                          x1="100"
                          y1="20"
                          x2="100"
                          y2="100"
                          stroke="#778da9"
                          strokeWidth="1.5"
                          strokeDasharray="5,5"
                          className="opacity-50"
                        />
                        <line
                          x1="180"
                          y1="60"
                          x2="100"
                          y2="100"
                          stroke="#778da9"
                          strokeWidth="1.5"
                          strokeDasharray="5,5"
                          className="opacity-50"
                        />
                        <line
                          x1="180"
                          y1="140"
                          x2="100"
                          y2="100"
                          stroke="#778da9"
                          strokeWidth="1.5"
                          strokeDasharray="5,5"
                          className="opacity-50"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Floating decorative elements */}
                  <div className="absolute top-10 left-10 w-16 h-16 bg-[#778da9]/20 dark:bg-[#415a77]/20 rounded-lg rotate-12 animate-pulse" />
                  <div className="absolute bottom-10 right-10 w-12 h-12 bg-[#415a77]/20 dark:bg-[#778da9]/20 rounded-full animate-pulse delay-300" />
                  <div className="absolute top-1/2 right-5 w-8 h-8 bg-[#1b263b]/20 dark:bg-[#e0e1dd]/20 rounded-lg rotate-45 animate-pulse delay-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
