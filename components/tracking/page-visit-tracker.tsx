"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageVisit, isTrackedRoute } from '@/lib/page-visit-tracker'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Component that tracks page visits for tool pages
 *
 * Writes a cookie (used by the "most used tools" widget) and, for signed-in
 * users, reports the same visit to the server so it appears in the admin
 * analytics. Server reporting is best effort and never surfaces errors.
 */
export const PageVisitTracker = () => {
  const pathname = usePathname()
  const { user } = useAuth()
  const lastReportedRef = useRef<string | null>(null)

  useEffect(() => {
    if (pathname) {
      trackPageVisit(pathname)
    }
  }, [pathname])

  useEffect(() => {
    if (!pathname || !user || !isTrackedRoute(pathname)) {
      return
    }

    // Guard against duplicate reports from re-renders on the same route
    const reportKey = `${user.id}:${pathname}`
    if (lastReportedRef.current === reportKey) {
      return
    }
    lastReportedRef.current = reportKey

    const controller = new AbortController()

    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolSlug: pathname, action: 'view' }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Telemetry must never disrupt the user
    })

    return () => controller.abort()
  }, [pathname, user])

  // This component doesn't render anything
  return null
}
