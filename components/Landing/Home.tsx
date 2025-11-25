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
import { Sparkles, Inbox, Zap, Shield, UserCheck } from "lucide-react"


const Home = () => {
  const [isMounted, setIsMounted] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const techStackRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const floatingElementsRef = useRef<HTMLDivElement[]>([])
  const featuresRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Redirect authenticated users to /home
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

      // CTA buttons animation
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          {
            y: 30,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            delay: 1.2,
          }
        )
      }

      // Features animation
      if (featuresRef.current) {
        const featureItems = featuresRef.current.children || []
        if (featureItems.length > 0) {
          gsap.fromTo(
            featureItems,
            {
              y: 40,
              opacity: 0,
              scale: 0.9,
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.2)",
              stagger: 0.15,
              delay: 1.8,
            }
          )
        }
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

  const handleGetStarted = () => {
    router.push("/auth/signup")
  }

  const handleLearnMore = () => {
    router.push("/about-us")
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden p-4 md:p-8"
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
                src="/AppLogo.png"
                alt="logo"
                className="transition-transform duration-300 hover:scale-110"
                width={150}
                height={150}
              />
            </div>

            {/* Title */}
            <div className="space-y-6">
              <h1
                ref={titleRef}
                className="mb-6 text-pretty text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              >
                <span className="bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Supercharge Your
                </span>
                <br />
                <span className="bg-linear-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                  Email Workflow
                </span>
              </h1>
              <p
                ref={subtitleRef}
                className="text-muted-foreground mx-auto max-w-3xl text-lg md:text-xl lg:text-2xl leading-relaxed"
              >
                Professional email tools powered by AI. Rewrite emails, optimize deliverability, process headers, and convert formats—all in one powerful platform.
              </p>
            </div>


            {/* Key Features */}
            <div
              ref={featuresRef}
              className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full"
            >
              <div className="group relative bg-background/50 backdrop-blur-xl rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">AI-Powered</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Transform emails with AI to bypass spam filters and improve deliverability rates.
                  </p>
                </div>
              </div>

              <div className="group relative bg-background/50 backdrop-blur-xl rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Lightning Fast</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Process multiple files in seconds. Batch operations for maximum efficiency.
                  </p>
                </div>
              </div>

              <div className="group relative bg-background/50 backdrop-blur-xl rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Inbox className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">All-in-One</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete email toolkit: rewriting, conversion, header processing, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* About & Data Use Section for Google Verification */}
            <div className="mt-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
              {/* About the app */}
              <div className="bg-background/60 backdrop-blur-xl rounded-xl border border-border/60 p-6 md:p-8 shadow-sm">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl font-semibold mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>About Mailer Toolkit</span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-3">
                  Mailer Toolkit is an all-in-one suite of professional email and IP tools designed for marketers, developers,
                  and deliverability specialists. It helps you rewrite email bodies and subject lines, process headers, extract
                  text from EML files, convert HTML to images, compare IP lists, and more.
                </p>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  The platform focuses on testing, analyzing, and optimizing your email content and infrastructure. It does not
                  send bulk email itself and is intended to help you improve compliance and deliverability across your own
                  systems and providers.
                </p>
              </div>

              {/* Data & Google usage */}
              <div className="bg-background/60 backdrop-blur-xl rounded-xl border border-border/60 p-6 md:p-8 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl md:text-2xl font-semibold mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>How We Use Your Data</span>
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-3">
                    We only use the content, files, and IP lists you provide to run the selected tools and return results to you.
                    Uploaded data and processing output are not sold or shared for advertising.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm md:text-base">
                    <li>Data you upload (emails, EML files, headers, images, IPs) is processed only to generate tool outputs.</li>
                    <li>We do not use your content or Google data to build advertising profiles or for unrelated purposes.</li>
                    <li>Processing data is retained only as long as necessary to provide results, then discarded.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold mb-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <span>Google &amp; Gmail Data</span>
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-3">
                    When you connect your Google account, Mailer Toolkit only accesses the minimum Gmail data needed to perform
                    actions you request (such as searching or analyzing messages for deliverability). We comply with the Google
                    API Services User Data Policy, including the Limited Use requirements.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm md:text-base mb-3">
                    <li>Google data is not used to serve ads or sold to third parties.</li>
                    <li>Google data is not used to train generalized AI models.</li>
                    <li>You can disconnect access at any time through your Google Account and within our app.</li>
                  </ul>
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs md:text-sm">
                    For full details on how we collect, use, and protect data (including Google user data), please review our
                    Privacy Policy.
                  </p>
                  <Button asChild variant="outline" className="self-start text-xs md:text-sm">
                    <Link href="/privacy">
                      View Privacy Policy
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default Home
