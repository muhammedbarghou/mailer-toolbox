"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageVisit } from '@/lib/page-visit-tracker'

/**
 * Component that tracks page visits for tool pages
 * Automatically tracks when the pathname changes
 */
export const PageVisitTracker = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      trackPageVisit(pathname)
    }
  }, [pathname])

  // This component doesn't render anything
  return null
}

