"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { tools } from "@/lib/tools-data"
import { cn } from "@/lib/utils"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(undefined)

  // Filter tools based on query
  const filteredTools = useMemo(() => {
    if (!query.trim()) {
      return []
    }

    const lowerQuery = query.toLowerCase().trim()
    const matches = tools
      .map((tool) => {
        const titleMatch = tool.title.toLowerCase().includes(lowerQuery)
        const descMatch = tool.description.toLowerCase().includes(lowerQuery)
        
        if (titleMatch || descMatch) {
          return {
            ...tool,
            matchType: titleMatch ? "title" : "description",
            titleMatchIndex: titleMatch ? tool.title.toLowerCase().indexOf(lowerQuery) : -1,
            descMatchIndex: descMatch ? tool.description.toLowerCase().indexOf(lowerQuery) : -1,
          }
        }
        return null
      })
      .filter((tool): tool is NonNullable<typeof tool> => tool !== null)
      .sort((a, b) => {
        // Sort by: title matches first, then description matches
        if (a.matchType === "title" && b.matchType !== "title") return -1
        if (a.matchType !== "title" && b.matchType === "title") return 1
        // If both are title matches, sort by match position
        if (a.matchType === "title" && b.matchType === "title") {
          return a.titleMatchIndex - b.titleMatchIndex
        }
        return 0
      })
      .slice(0, 10) // Limit to 10 results

    return matches
  }, [query])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredTools.length])

  // Update popover open state based on filtered results
  useEffect(() => {
    if (query.trim() && filteredTools.length > 0 && inputRef.current === document.activeElement) {
      setIsOpen(true)
    } else if (query.trim() && filteredTools.length === 0) {
      setIsOpen(false)
    }
  }, [filteredTools.length, query])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    // Check if there will be results by filtering inline
    const lowerValue = value.toLowerCase().trim()
    if (lowerValue.length > 0) {
      const hasMatches = tools.some(
        (tool) =>
          tool.title.toLowerCase().includes(lowerValue) ||
          tool.description.toLowerCase().includes(lowerValue)
      )
      setIsOpen(hasMatches)
    } else {
      setIsOpen(false)
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (inputRef.current) {
      setPopoverWidth(inputRef.current.offsetWidth)
    }
    if (query.trim().length > 0 && filteredTools.length > 0) {
      setIsOpen(true)
    }
  }

  // Handle input blur (with delay to allow clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredTools.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        // Try to navigate to first matching tool if any
        const firstMatch = tools.find(
          (tool) =>
            tool.title.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase())
        )
        if (firstMatch) {
          router.push(firstMatch.href)
          setQuery("")
          setIsOpen(false)
        }
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredTools.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredTools[selectedIndex]) {
          router.push(filteredTools[selectedIndex].href)
          setQuery("")
          setIsOpen(false)
          inputRef.current?.blur()
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Handle tool selection
  const handleToolSelect = (href: string) => {
    router.push(href)
    setQuery("")
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const lowerQuery = query.toLowerCase()
    const lowerText = text.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)
    
    if (index === -1) return text
    
    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)
    
    return (
      <>
        {before}
        <span className="font-semibold text-sidebar-primary">{match}</span>
        {after}
      </>
    )
  }

  return (
    <form {...props} onSubmit={(e) => e.preventDefault()} className="w-96">
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverAnchor asChild>
              <div className="relative">
                <SidebarInput
                  ref={inputRef}
                  id="search"
                  placeholder="Search For tools..."
                  className="pl-8"
                  value={query}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  aria-label="Search tools"
                  aria-expanded={isOpen}
                  aria-controls="search-results"
                  role="combobox"
                />
                <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
              </div>
            </PopoverAnchor>
            {isOpen && filteredTools.length > 0 && (
              <PopoverContent
                id="search-results"
                className="p-0 max-h-[400px] overflow-y-auto"
                style={{ width: popoverWidth ? `${popoverWidth}px` : undefined }}
                align="start"
                side="bottom"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="py-1" role="listbox">
                  {filteredTools.map((tool, index) => {
                    const Icon = tool.icon
                    const isSelected = index === selectedIndex
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={(e) => {
                          e.preventDefault()
                          handleToolSelect(tool.href)
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors",
                          isSelected
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <Icon className="h-4 w-4 shrink-0 mt-0.5 text-sidebar-foreground/60" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {highlightText(tool.title, query)}
                          </div>
                          <div className="text-xs text-sidebar-foreground/60 mt-0.5 line-clamp-2">
                            {tool.description}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </PopoverContent>
            )}
            {isOpen && query.trim() && filteredTools.length === 0 && (
              <PopoverContent
                className="p-4"
                style={{ width: popoverWidth ? `${popoverWidth}px` : undefined }}
                align="start"
                side="bottom"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="text-sm text-sidebar-foreground/60 text-center py-2">
                  No tools found matching &quot;{query}&quot;
                </div>
              </PopoverContent>
            )}
          </Popover>
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
