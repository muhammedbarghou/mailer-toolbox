/**
 * Cookie utility functions for managing user preferences and state
 * Uses browser's native cookie API with proper TypeScript types
 */

type CookieOptions = {
  expires?: number | Date // Days as number or specific Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Set a cookie with optional configuration
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof window === 'undefined') return

  const {
    expires,
    path = '/',
    domain,
    secure = true,
    sameSite = 'lax',
  } = options

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (expires) {
    let expiresDate: Date
    if (typeof expires === 'number') {
      expiresDate = new Date()
      expiresDate.setTime(expiresDate.getTime() + expires * 24 * 60 * 60 * 1000)
    } else {
      expiresDate = expires
    }
    cookieString += `; expires=${expiresDate.toUTCString()}`
  }

  cookieString += `; path=${path}`
  if (domain) cookieString += `; domain=${domain}`
  if (secure) cookieString += '; secure'
  cookieString += `; samesite=${sameSite}`

  document.cookie = cookieString
}

/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null

  const nameEQ = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim()
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }

  return null
}

/**
 * Remove a cookie by name
 */
export const removeCookie = (name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void => {
  if (typeof window === 'undefined') return

  const { path = '/', domain } = options
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
  if (domain) cookieString += `; domain=${domain}`

  document.cookie = cookieString
}

/**
 * Get all cookies as an object
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}

  const cookies: Record<string, string> = {}
  const cookieStrings = document.cookie.split(';')

  for (const cookieString of cookieStrings) {
    const [name, value] = cookieString.trim().split('=')
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value)
    }
  }

  return cookies
}

/**
 * Set a JSON cookie (automatically stringifies)
 */
export const setJsonCookie = <T>(name: string, value: T, options: CookieOptions = {}): void => {
  try {
    const jsonString = JSON.stringify(value)
    setCookie(name, jsonString, options)
  } catch (error) {
    console.error(`Failed to set JSON cookie ${name}:`, error)
  }
}

/**
 * Get a JSON cookie (automatically parses)
 */
export const getJsonCookie = <T>(name: string): T | null => {
  const cookieValue = getCookie(name)
  if (!cookieValue) return null

  try {
    return JSON.parse(cookieValue) as T
  } catch (error) {
    console.error(`Failed to parse JSON cookie ${name}:`, error)
    return null
  }
}

/**
 * Cookie names constants to avoid typos
 */
export const COOKIE_NAMES = {
  // Tool preferences
  HEADER_PROCESSOR_PRESET: 'header-processor-preset',
  HEADER_PROCESSOR_CONFIG: 'header-processor-config',
  HTML_TO_IMG_FORMAT: 'html-to-img-format',
  HTML_TO_IMG_QUALITY: 'html-to-img-quality',
  IP_COMPARATOR_PREFERENCES: 'ip-comparator-preferences',
  EML_CONVERTER_PREFERENCES: 'eml-converter-preferences',
  
  // UI preferences
  UI_PREFERENCES: 'ui-preferences',
  RECENT_TOOLS: 'recent-tools',
  TOOL_VISITS: 'tool-visits',
  
  // Work session
  WORK_DRAFTS: 'work-drafts',
} as const

/**
 * Default cookie options
 */
export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  expires: 365, // 1 year
  path: '/',
  secure: true,
  sameSite: 'lax',
}

/**
 * Session cookie options (expires when browser closes)
 */
export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: true,
  sameSite: 'lax',
}

