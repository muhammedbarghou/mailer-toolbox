/**
 * Page visit tracking utility for monitoring user tool usage
 * Stores visit counts in cookies and provides functions to retrieve top visited tools
 */

import { getJsonCookie, setJsonCookie, DEFAULT_COOKIE_OPTIONS, COOKIE_NAMES } from './cookies'

export type ToolVisits = Record<string, number>

/**
 * List of tool routes to track
 * Only these routes will be tracked for visit counts
 */
export const TRACKED_TOOL_ROUTES = [
  '/rewrite',
  '/header-processor',
  '/eml-to-txt-converter',
  '/eml-text-extractor',
  '/email-source-separator',
  '/html-to-img',
  '/ip-comparator',
  '/photo-editor',
  '/subject-rewrite',
  '/gmail-deliverability',
  '/ip-reputation',
  '/text-file-mapper',
] as const

/**
 * Check if a route should be tracked
 */
export const isTrackedRoute = (route: string): boolean => {
  return TRACKED_TOOL_ROUTES.includes(route as typeof TRACKED_TOOL_ROUTES[number])
}

/**
 * Get all visit counts from cookie
 */
export const getVisitCounts = (): ToolVisits => {
  const visits = getJsonCookie<ToolVisits>(COOKIE_NAMES.TOOL_VISITS)
  return visits || {}
}

/**
 * Track a page visit by incrementing the count for a specific route
 */
export const trackPageVisit = (route: string): void => {
  if (!isTrackedRoute(route)) {
    return
  }

  const visits = getVisitCounts()
  const currentCount = visits[route] || 0
  visits[route] = currentCount + 1

  setJsonCookie(COOKIE_NAMES.TOOL_VISITS, visits, DEFAULT_COOKIE_OPTIONS)
}

/**
 * Get visit count for a specific route
 */
export const getVisitCount = (route: string): number => {
  const visits = getVisitCounts()
  return visits[route] || 0
}

/**
 * Get top N most visited tools sorted by visit count (descending)
 * Returns array of { route, count } objects
 */
export const getTopVisitedTools = (limit: number = 3): Array<{ route: string; count: number }> => {
  const visits = getVisitCounts()
  
  // Convert to array and filter to only tracked routes
  const visitEntries = Object.entries(visits)
    .filter(([route]) => isTrackedRoute(route))
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count) // Sort descending by count
    .slice(0, limit) // Take top N

  return visitEntries
}

/**
 * Clear all visit tracking data
 */
export const clearVisitTracking = (): void => {
  setJsonCookie(COOKIE_NAMES.TOOL_VISITS, {}, DEFAULT_COOKIE_OPTIONS)
}

