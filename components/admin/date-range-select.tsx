"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ADMIN_RANGES, type AdminRange } from "@/lib/admin/queries"

interface DateRangeSelectProps {
  value: AdminRange
}

/**
 * Writes the selected range to the URL so the server component re-renders with
 * fresh data and the choice survives a refresh or a shared link.
 */
export const DateRangeSelect = ({ value }: DateRangeSelectProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleValueChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("range", next)

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        className="w-[170px]"
        aria-label="Select date range"
        disabled={isPending}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ADMIN_RANGES.map((range) => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
