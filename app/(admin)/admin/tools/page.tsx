import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/admin/page-header"
import { DateRangeSelect } from "@/components/admin/date-range-select"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import {
  getToolBreakdown,
  parseRange,
  type ToolBreakdown,
} from "@/lib/admin/queries"
import {
  formatCount,
  formatDuration,
  formatPercent,
  formatRelativeTime,
  formatToolName,
} from "@/lib/admin/format"
import { TRACKED_TOOL_ROUTES } from "@/lib/page-visit-tracker"

/**
 * Colour the error rate so a failing tool stands out at a glance
 */
const errorRateTone = (rate: number): string => {
  if (rate >= 10) {
    return "text-destructive font-medium"
  }
  if (rate > 0) {
    return "text-amber-600 dark:text-amber-500"
  }
  return "text-muted-foreground"
}

const columns: DataTableColumn<ToolBreakdown>[] = [
  {
    key: "tool",
    header: "Tool",
    render: (row) => (
      <div className="flex flex-col">
        <span className="font-medium">{formatToolName(row.tool_slug)}</span>
        <span className="text-xs text-muted-foreground">{row.tool_slug}</span>
      </div>
    ),
  },
  { key: "runs", header: "Runs", align: "right", render: (row) => formatCount(row.runs) },
  {
    key: "views",
    header: "Views",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatCount(row.views),
  },
  {
    key: "users",
    header: "Unique users",
    align: "right",
    render: (row) => formatCount(row.unique_users),
  },
  {
    key: "errors",
    header: "Error rate",
    align: "right",
    render: (row) => (
      <span className={errorRateTone(row.error_rate)}>
        {formatPercent(row.error_rate)}
      </span>
    ),
  },
  {
    key: "cache",
    header: "Cache hits",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatCount(row.cache_hits),
  },
  {
    key: "p95",
    header: "p95 duration",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDuration(row.p95_duration_ms),
  },
  {
    key: "last",
    header: "Last used",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatRelativeTime(row.last_used_at),
  },
]

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range = parseRange(params.range)
  const tools = await getToolBreakdown(range)

  const seenSlugs = new Set(tools.map((tool) => tool.tool_slug))
  const unusedTools = TRACKED_TOOL_ROUTES.filter((route) => !seenSlugs.has(route))

  return (
    <>
      <PageHeader
        title="Tools"
        description="Adoption and reliability per tool. Use this to decide what to invest in and what to retire."
        action={<DateRangeSelect value={range} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Per-tool breakdown</CardTitle>
          <CardDescription>
            Runs come from instrumented server routes. Views come from page visits by
            signed-in users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={tools}
            getRowKey={(row) => row.tool_slug}
            emptyMessage="No tool usage recorded in this range yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>No activity in this range</CardTitle>
          <CardDescription>
            Tracked tools with zero recorded runs or views. Candidates for removal if
            this persists over a longer window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unusedTools.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every tracked tool saw activity in this range.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unusedTools.map((route) => (
                <Link key={route} href={route} className="focus:outline-none">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    tabIndex={0}
                    aria-label={`Open ${formatToolName(route)}`}
                  >
                    {formatToolName(route)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
