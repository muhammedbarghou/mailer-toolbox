'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  setCookie,
  getCookie,
  removeCookie,
  setJsonCookie,
  getJsonCookie,
  type CookieOptions,
} from '@/lib/cookies'

/**
 * React hook for managing cookies with automatic state synchronization
 */
export const useCookie = <T = string>(
  name: string,
  defaultValue: T,
  options?: CookieOptions,
): [T, (value: T) => void, () => void] => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue

    // Try to get JSON cookie first (for objects/arrays)
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      const jsonValue = getJsonCookie<T>(name)
      return jsonValue ?? defaultValue
    }

    // For primitive values, get as string
    const cookieValue = getCookie(name)
    return (cookieValue as T) ?? defaultValue
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Sync with cookie value on mount
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      const jsonValue = getJsonCookie<T>(name)
      if (jsonValue !== null) {
        setValue(jsonValue)
      }
    } else {
      const cookieValue = getCookie(name)
      if (cookieValue !== null) {
        setValue(cookieValue as T)
      }
    }
  }, [name, defaultValue])

  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue)

      if (typeof window === 'undefined') return

      // Store as JSON if it's an object/array
      if (typeof newValue === 'object' && newValue !== null) {
        setJsonCookie(name, newValue, options)
      } else {
        setCookie(name, String(newValue), options)
      }
    },
    [name, options],
  )

  const deleteValue = useCallback(() => {
    setValue(defaultValue)
    removeCookie(name, { path: options?.path, domain: options?.domain })
  }, [name, defaultValue, options])

  return [value, updateValue, deleteValue]
}

/**
 * Hook for managing tool preferences (with default options)
 */
export const useToolPreferences = <T = unknown>(
  toolName: string,
  defaultPreferences: T,
): [T, (preferences: T) => void, () => void] => {
  const cookieName = `${toolName}-preferences`
  const options: CookieOptions = {
    expires: 365, // 1 year
    path: '/',
    secure: true,
    sameSite: 'lax',
  }

  return useCookie<T>(cookieName, defaultPreferences, options)
}

/**
 * Hook for tracking recently used tools
 */
export const useRecentTools = (maxTools: number = 5) => {
  const [recentTools, setRecentTools, clearRecentTools] = useCookie<string[]>(
    'recent-tools',
    [],
    {
      expires: 90, // 3 months
      path: '/',
      secure: true,
      sameSite: 'lax',
    },
  )

  const addRecentTool = useCallback(
    (toolName: string) => {
      setRecentTools((prev) => {
        const filtered = prev.filter((tool) => tool !== toolName)
        const updated = [toolName, ...filtered].slice(0, maxTools)
        return updated
      })
    },
    [setRecentTools, maxTools],
  )

  return {
    recentTools,
    addRecentTool,
    clearRecentTools,
  }
}

