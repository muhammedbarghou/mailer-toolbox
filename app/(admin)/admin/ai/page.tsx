import { AlertTriangle, Database, Gauge, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DateRangeSelect } from "@/components/admin/date-range-select"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import {
  getAiBreakdown,
  getErrorBreakdown,
  parseRange,
  type AiBreakdown,
  type ErrorBreakdown,
} from "@/lib/admin/queries"
import {
  formatCount,
  formatDuration,
  formatPercent,
  formatRelativeTime,
  formatToolName,
} from "@/lib/admin/format"

const providerColumns: DataTableColumn<AiBreakdown>[] = [
  {
    key: "provider",
    header: "Provider",
    render: (row) => <span className="font-medium capitalize">{row.provider}</span>,
  },
  {
    key: "model",
    header: "Model",
    render: (row) => <span className="font-mono text-xs">{row.model}</span>,
  },
  { key: "runs", header: "Runs", align: "right", render: (row) => formatCount(row.runs) },
  {
    key: "cache",
    header: "Cache hits",
    align: "right",
    render: (row) => formatCount(row.cache_hits),
  },
  {
    key: "errors",
    header: "Error rate",
    align: "right",
    render: (row) => (
      <span className={row.error_rate >= 10 ? "font-medium text-destructive" : ""}>
        {formatPercent(row.error_rate)}
      </span>
    ),
  },
  {
    key: "avg",
    header: "Avg",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDuration(row.avg_duration_ms),
  },
  {
    key: "p95",
    header: "p95",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDuration(row.p95_duration_ms),
  },
]

const errorColumns: DataTableColumn<ErrorBreakdown>[] = [
  {
    key: "code",
    header: "Failure reason",
    render: (row) => (
      <Badge variant="outline" className="font-mono text-xs">
        {row.error_code}
      </Badge>
    ),
  },
  {
    key: "tool",
    header: "Tool",
    render: (row) => formatToolName(row.tool_slug),
  },
  {
    key: "provider",
    header: "Provider",
    hideOnMobile: true,
    render: (row) => <span className="capitalize">{row.provider}</span>,
  },
  {
    key: "count",
    header: "Occurrences",
    align: "right",
    render: (row) => formatCount(row.occurrences),
  },
  {
    key: "last",
    header: "Last seen",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatRelativeTime(row.last_seen_at),
  },
]

export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range = parseRange(params.range)

  const [providers, errors] = await Promise.all([
    getAiBreakdown(range),
    getErrorBreakdown(range),
  ])

  const totalRuns = providers.reduce((sum, row) => sum + row.runs, 0)
  const totalCacheHits = providers.reduce((sum, row) => sum + row.cache_hits, 0)
  const totalErrors = providers.reduce((sum, row) => sum + row.errors, 0)
  const cacheHitRate = totalRuns > 0 ? (totalCacheHits / totalRuns) * 100 : 0
  const errorRate = totalRuns > 0 ? (totalErrors / totalRuns) * 100 : 0

  return (
    <>
      <PageHeader
        title="AI Usage"
        description="Provider and model performance for the rewrite tools, which run on user-supplied API keys."
        action={<DateRangeSelect value={range} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="AI runs"
          value={formatCount(totalRuns)}
          hint="Rewrite and subject rewrite"
          icon={Sparkles}
        />
        <StatCard
          title="Cache hit rate"
          value={formatPercent(cacheHitRate)}
          hint={`${formatCount(totalCacheHits)} avoided provider calls`}
          icon={Database}
        />
        <StatCard
          title="Error rate"
          value={formatPercent(errorRate)}
          hint={`${formatCount(totalErrors)} failed runs`}
          icon={AlertTriangle}
          tone={errorRate >= 10 ? "danger" : errorRate > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Models in use"
          value={formatCount(providers.length)}
          hint="Distinct provider and model pairs"
          icon={Gauge}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider and model breakdown</CardTitle>
          <CardDescription>
            Cache hits are served from Redis and never reach the provider, so they cost
            users nothing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={providerColumns}
            rows={providers}
            getRowKey={(row) => `${row.provider}:${row.model}`}
            emptyMessage="No AI runs recorded in this range yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranked failure reasons</CardTitle>
          <CardDescription>
            Across all instrumented routes. Codes like invalid_api_key point at user
            configuration, while model_overloaded and quota_exceeded point at providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={errorColumns}
            rows={errors}
            getRowKey={(row) => `${row.tool_slug}:${row.provider}:${row.error_code}`}
            emptyMessage="No failures recorded in this range."
          />
        </CardContent>
      </Card>
    </>
  )
}
