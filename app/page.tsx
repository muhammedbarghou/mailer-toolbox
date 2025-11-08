"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import HeroSection from "@/components/Layouts/HeroSection"

const page = () => {
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const techStackRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const floatingElementsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return

    // Register ScrollTrigger only on client side
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Background animation
      if (backgroundRef.current) {
        gsap.fromTo(
          backgroundRef.current,
          {
            scale: 1.2,
            opacity: 0,
          },
          {
            scale: 1,
            opacity: 1,
            duration: 2,
            ease: "power2.out",
          }
        )
      }

      // Logo entrance animation
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          {
            scale: 0,
            rotation: -180,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 1.2,
            ease: "back.out(1.7)",
            delay: 0.3,
          }
        )
      }

      // Title animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          {
            y: 50,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            delay: 0.6,
          }
        )
      }

      // Subtitle animation
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          {
            y: 30,
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

      // Tech stack stagger animation
      if (techStackRef.current) {
        const techItems = techStackRef.current.children || []
        if (techItems.length > 0) {
          gsap.fromTo(
            techItems,
            {
              y: 40,
              opacity: 0,
              scale: 0.8,
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.4)",
              stagger: 0.1,
              delay: 1.2,
            }
          )
        }
      }

      // Buttons animation
      if (buttonsRef.current) {
        gsap.fromTo(
          buttonsRef.current,
          {
            y: 30,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            delay: 1.5,
          }
        )
      }

      // Floating elements animation
      floatingElementsRef.current.forEach((el, index) => {
        if (el) {
          gsap.to(el, {
            y: `+=${20 + index * 10}`,
            x: `+=${10 + index * 5}`,
            rotation: `+=${5 + index * 2}`,
            duration: 3 + index * 0.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 0.2,
          })
        }
      })

      // Scroll-triggered animations
      if (typeof document !== "undefined") {
        const techItems = gsap.utils.toArray<HTMLElement>(".tech-item")
        techItems.forEach((item) => {
          gsap.fromTo(
            item,
            {
              scale: 0.9,
              opacity: 0.5,
            },
            {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: item,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse",
              },
            }
          )
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isMounted])

  const handleTechHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMounted || typeof window === "undefined") return
    gsap.to(e.currentTarget, {
      scale: 1.15,
      rotation: 5,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  const handleTechLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMounted || typeof window === "undefined") return
    gsap.to(e.currentTarget, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  const handleButtonHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMounted || typeof window === "undefined") return
    gsap.to(e.currentTarget, {
      scale: 1.05,
      y: -3,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  const handleButtonLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMounted || typeof window === "undefined") return
    gsap.to(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.out",
    })
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden p-4 md:p-8"
    >
      {/* Animated Background */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 flex h-full w-full items-center justify-center opacity-100"
      >
        <Image
          alt="background"
          src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/square-alt-grid.svg"
          className="opacity-90 mask-[radial-gradient(75%_75%_at_center,white,transparent)]"
          fill
          priority
          height={0}
          width={0}
        />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={(el) => {
            if (el) floatingElementsRef.current[0] = el
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"
        />
        <div
          ref={(el) => {
            if (el) floatingElementsRef.current[1] = el
          }}
          className="absolute bottom-20 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl"
        />
        <div
          ref={(el) => {
            if (el) floatingElementsRef.current[2] = el
          }}
          className="absolute top-1/2 right-1/4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center pt-20 md:pt-32">
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Logo */}
            <div
              ref={logoRef}
              className="bg-background/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-border/50 hover:shadow-primary/20 transition-shadow duration-300"
            >
              <Image
                src="/Logo.svg"
                alt="logo"
                className="h-20 md:h-24 transition-transform duration-300 hover:scale-110"
                width={96}
                height={96}
              />
            </div>

            {/* Title */}
            <div className="space-y-6">
              <h1
                ref={titleRef}
                className="mb-6 text-pretty text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
              >
                Welcome to MailerTools Hub
              </h1>
              <p
                ref={subtitleRef}
                className="text-muted-foreground mx-auto max-w-3xl text-lg md:text-xl lg:text-2xl leading-relaxed"
              >
                Your all-in-one suite of essential email and IP tools, designed
                to simplify your workflow and enhance productivity.
              </p>
            </div>

            {/* Tech Stack */}
            <div className="mt-24 flex flex-col items-center gap-6">
              <p className="text-muted-foreground font-medium text-base md:text-lg">
                Built with open-source technologies
              </p>
              <div
                ref={techStackRef}
                className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
              >
                <Link
                  href="https://ui.shadcn.com/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "tech-item group flex aspect-square h-14 md:h-16 items-center justify-center p-0 relative overflow-hidden",
                  )}
                  onMouseEnter={handleTechHover}
                  onMouseLeave={handleTechLeave}
                  tabIndex={0}
                  aria-label="Visit shadcn/ui"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-icon.svg"
                    alt="shadcn/ui logo"
                    className="h-7 md:h-8 saturate-0 transition-all duration-300 group-hover:saturate-100 relative z-10"
                    width={28}
                    height={28}
                  />
                </Link>
                <Link
                  href="https://www.typescriptlang.org/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "tech-item group flex aspect-square h-14 md:h-16 items-center justify-center p-0 relative overflow-hidden",
                  )}
                  onMouseEnter={handleTechHover}
                  onMouseLeave={handleTechLeave}
                  tabIndex={0}
                  aria-label="Visit TypeScript"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/typescript-icon.svg"
                    alt="TypeScript logo"
                    className="h-7 md:h-8 saturate-0 transition-all duration-300 group-hover:saturate-100 relative z-10"
                    width={28}
                    height={28}
                  />
                </Link>

                <Link
                  href="https://nextjs.org/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "tech-item group flex aspect-square h-14 md:h-16 items-center justify-center p-0 relative overflow-hidden",
                  )}
                  onMouseEnter={handleTechHover}
                  onMouseLeave={handleTechLeave}
                  tabIndex={0}
                  aria-label="Visit Next.js"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/nextjs-icon.svg"
                    alt="Next.js logo"
                    className="h-7 md:h-8 saturate-0 transition-all duration-300 group-hover:saturate-100 relative z-10"
                    width={28}
                    height={28}
                  />
                </Link>
                <Link
                  href="https://tailwindcss.com/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "tech-item group flex aspect-square h-14 md:h-16 items-center justify-center p-0 relative overflow-hidden",
                  )}
                  onMouseEnter={handleTechHover}
                  onMouseLeave={handleTechLeave}
                  tabIndex={0}
                  aria-label="Visit Tailwind CSS"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/tailwind-icon.svg"
                    alt="Tailwind CSS logo"
                    className="h-7 md:h-8 saturate-0 transition-all duration-300 group-hover:saturate-100 relative z-10"
                    width={28}
                    height={28}
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            ref={buttonsRef}
            className="mt-32 flex w-full flex-col sm:flex-row items-center justify-center gap-4 md:gap-6"
          >
            <Button
              variant="default"
              size="lg"
              className="group relative overflow-hidden px-8 py-6 text-base md:text-lg"
            >
              <Link
                href="/contact-us"
                className="relative z-10 flex items-center gap-2"
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
                tabIndex={-1}
              >
                <span>Contact Us</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="group relative overflow-hidden px-8 py-6 text-base md:text-lg border-2"
            >
              <Link
                href="/about-us"
                className="relative z-10 flex items-center gap-2"
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
                tabIndex={-1}
              >
                <span>About Us</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Link>
              <div className="absolute inset-0 bg-linear-to-r from-accent/0 via-accent/10 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="relative z-10 mt-20 md:mt-32">
        <HeroSection />
      </div>
    </section>
  )
}

export default page
