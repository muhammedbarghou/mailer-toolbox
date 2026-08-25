"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationControlsProps {
  page: number
  pageSize: number
  totalCount: number
}

export const PaginationControls = ({
  page,
  pageSize,
  totalCount,
}: PaginationControlsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)
  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, totalCount)

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(nextPage))
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handlePrevious = () => goToPage(page - 1)
  const handleNext = () => goToPage(page + 1)

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground">
        Showing {firstRow}-{lastRow} of {totalCount}
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        Showing {firstRow}-{lastRow} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
