"use client"

import { useState, useEffect, useRef } from "react"
import { Cookie, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { getCookie, setCookie } from "@/lib/cookies"
import { COOKIE_NAMES } from "@/lib/cookies"

const CONSENT_COOKIE_NAME = "cookie-consent"

type ConsentStatus = "pending" | "accepted" | "rejected" | "customized"

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("pending")
  const [isMounted, setIsMounted] = useState(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true
    setIsMounted(true)

    // Only check cookies on client side
    if (typeof window === 'undefined') {
      return () => {
        isMountedRef.current = false
      }
    }

    // Check if user has already given consent
    const consent = getCookie(CONSENT_COOKIE_NAME)
    let timer: NodeJS.Timeout | null = null

    if (!consent) {
      // Show banner after a short delay for better UX
      timer = setTimeout(() => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setShowBanner(true)
        }
      }, 1000)
    } else {
      // Set consent status if consent already exists
      if (isMountedRef.current) {
        setConsentStatus(consent as ConsentStatus)
      }
    }

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
      isMountedRef.current = false
    }
  }, [])

  const handleAcceptAll = () => {
    setCookie(CONSENT_COOKIE_NAME, "accepted", {
      expires: 365, // 1 year
      path: "/",
      secure: true,
      sameSite: "lax",
    })
    setConsentStatus("accepted")
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    // Reject non-essential cookies
    // Essential cookies (like theme) are still set, but we mark preference as rejected
    setCookie(CONSENT_COOKIE_NAME, "rejected", {
      expires: 365,
      path: "/",
      secure: true,
      sameSite: "lax",
    })
    setConsentStatus("rejected")
    setShowBanner(false)
    
    // Optionally clear non-essential cookies
    // This would require implementing a function to clear specific cookies
  }

  const handleCustomize = () => {
    setShowDetails(true)
  }

  const handleSavePreferences = () => {
    setCookie(CONSENT_COOKIE_NAME, "customized", {
      expires: 365,
      path: "/",
      secure: true,
      sameSite: "lax",
    })
    setConsentStatus("customized")
    setShowBanner(false)
    setShowDetails(false)
  }

  // Don't render anything until component is mounted (prevents SSR issues)
  if (!isMounted) {
    return null
  }

  // Don't show banner if consent has been given and banner is not showing
  if (!showBanner && consentStatus !== "pending") {
    return null
  }

  return (
    <>
      {showBanner && !showDetails && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
          <Card className="max-w-4xl mx-auto shadow-lg border-2 p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-3 shrink-0">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">We use cookies</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your experience, remember your preferences, and improve our tools. 
                  All processing happens locally in your browser.{" "}
                  <Link 
                    href="/privacy" 
                    className="text-primary hover:underline font-medium"
                  >
                    Learn more
                  </Link>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Accept All
                </Button>
                <Button
                  onClick={handleCustomize}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="ghost"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Cookie Preferences
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Essential Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                    Always Active
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  These cookies are necessary for core functionality such as theme preferences. 
                  They cannot be disabled.
                </p>
              </div>

              {/* Preference Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Preference Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Remember your tool settings and preferences
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Recommended
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  These cookies remember your tool preferences (format choices, presets, configurations) 
                  to improve your experience. Without these, you'll need to reconfigure settings each visit.
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-2 space-y-1">
                  <li>Header Processor presets and configurations</li>
                  <li>HTML to Image format preferences</li>
                  <li>IP Comparator settings</li>
                  <li>EML Converter preferences</li>
                </ul>
              </div>

              {/* UI State Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">UI State Cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      Remember interface preferences
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Recommended
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  These cookies remember your interface preferences like panel states and recently used tools 
                  for better navigation.
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  <Link 
                    href="/privacy" 
                    className="text-primary hover:underline font-medium"
                  >
                    Read our full Privacy Policy
                  </Link>{" "}
                  to learn more about how we use cookies and protect your data.
                </p>

                <div className="flex gap-2">
                  <Button onClick={handleSavePreferences} className="flex-1">
                    Save Preferences
                  </Button>
                  <Button 
                    onClick={handleAcceptAll} 
                    variant="outline"
                    className="flex-1"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

