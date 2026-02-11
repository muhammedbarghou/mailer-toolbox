"use client"

import { useEffect, useState } from 'react'
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTopVisitedTools } from '@/lib/page-visit-tracker'
import { tools } from '@/lib/tools-data'
import { MostUsedToolsSkeleton } from "@/components/skeletons"

// All tools are now in the shared tools-data file
const allTools = tools

type ToolWithCount = {
  route: string
  count: number
  tool: typeof tools[number]
}

export const MostUsedTools = () => {
  const [topTools, setTopTools] = useState<ToolWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get top 3 most visited tools
    const topVisited = getTopVisitedTools(3)
    
    // Map visit data to tool data
    const toolsWithData: ToolWithCount[] = topVisited
      .map(({ route, count }) => {
        const tool = allTools.find(t => t.href === route)
        if (!tool) return null
        return { route, count, tool }
      })
      .filter((item): item is ToolWithCount => item !== null)

    setTopTools(toolsWithData)
    setLoading(false)
  }, [])

  // Show skeleton while loading
  if (loading) {
    return <MostUsedToolsSkeleton />
  }

  // Don't render if no tools have been visited
  if (topTools.length === 0) {
    return null
  }

  return (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            Your Most Used Tools
          </h2>
          <p className="text-muted-foreground">
            Quick access to the tools you use most frequently
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topTools.map(({ route, count, tool }) => {
          const Icon = tool.icon
          return (
            <Card
              key={route}
              className={cn(
                "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                tool.borderColor,
                "hover:border-primary/50"
              )}
            >
              {/* Background Gradient */}
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  tool.color
                )}
              />

              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={cn(
                      "p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 group-hover:scale-110 transition-transform duration-300",
                      tool.iconColor
                    )}
                  >
                    <Icon className={cn("h-6 w-6", tool.iconColor)} />
                  </div>
                  {/* Visit Count Badge */}
                  <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    {count} {count === 1 ? 'visit' : 'visits'}
                  </div>
                </div>
                <CardTitle className="text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </CardTitle>
                <CardDescription className="text-sm md:text-base leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <Button
                  asChild
                  variant="outline"
                  className="w-full group/button border-2 hover:border-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <Link
                    href={tool.href}
                    className="flex items-center justify-center gap-2"
                  >
                    <span>Open Tool</span>
                    <ArrowRight className="h-4 w-4 group-hover/button:translate-x-1 transition-transform duration-200" />
                  </Link>
                </Button>
              </CardContent>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          )
        })}
      </div>
    </div>
  )
}

