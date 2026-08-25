"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface UserSearchProps {
  initialValue: string
}

/**
 * Debounced search that writes to the URL, so the server component re-queries
 * and the search term survives refresh and sharing.
 */
export const UserSearch = ({ initialValue }: UserSearchProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? ""

    if (value === currentSearch) {
      return
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) {
        params.set("search", value.trim())
      } else {
        params.delete("search")
      }

      // Any new search starts from the first page
      params.delete("page")

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 350)

    return () => clearTimeout(timeout)
  }, [value, searchParams, pathname, router])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <div className="relative w-full sm:w-80">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search by email or name"
        aria-label="Search users"
        className="pl-9"
        data-pending={isPending ? "true" : undefined}
      />
    </div>
  )
}
