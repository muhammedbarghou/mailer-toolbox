import {
  AlertTriangle,
  Database,
  Gauge,
  KeyRound,
  Play,
  UserPlus,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DateRangeSelect } from "@/components/admin/date-range-select"
import { ActivityChart } from "@/components/admin/activity-chart"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import {
  getApiKeyOverview,
  getDailyActivity,
  getKpiSummary,
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

const topToolColumns: DataTableColumn<ToolBreakdown>[] = [
  {
    key: "tool",
    header: "Tool",
    render: (row) => <span className="font-medium">{formatToolName(row.tool_slug)}</span>,
  },
  { key: "runs", header: "Runs", align: "right", render: (row) => formatCount(row.runs) },
  {
    key: "users",
    header: "Users",
    align: "right",
    render: (row) => formatCount(row.unique_users),
  },
  {
    key: "errors",
    header: "Error rate",
    align: "right",
    render: (row) => formatPercent(row.error_rate),
  },
  {
    key: "last",
    header: "Last used",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatRelativeTime(row.last_used_at),
  },
]

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range = parseRange(params.range)

  const [kpi, activity, tools, keys] = await Promise.all([
    getKpiSummary(range),
    getDailyActivity(range),
    getToolBreakdown(range),
    getApiKeyOverview(),
  ])

  const brokenKeys = keys.totals.invalid + keys.totals.expired

  return (
    <>
      <PageHeader
        title="Overview"
        description="Health and usage of Mailer Toolbox at a glance."
        action={<DateRangeSelect value={range} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total users"
          value={formatCount(kpi.total_users)}
          hint="All time"
          icon={Users}
        />
        <StatCard
          title="New signups"
          value={formatCount(kpi.new_users)}
          hint="In selected range"
          icon={UserPlus}
        />
        <StatCard
          title="Active users"
          value={formatCount(kpi.active_users)}
          hint={`${formatCount(kpi.signed_in_users)} signed in`}
          icon={Gauge}
        />
        <StatCard
          title="Tool runs"
          value={formatCount(kpi.total_runs)}
          hint={`${formatCount(kpi.total_views)} page views`}
          icon={Play}
        />
        <StatCard
          title="Error rate"
          value={formatPercent(kpi.error_rate)}
          hint={`${formatCount(kpi.error_runs)} failed runs`}
          icon={AlertTriangle}
          tone={kpi.error_rate >= 10 ? "danger" : kpi.error_rate > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Cache hit rate"
          value={formatPercent(kpi.cache_hit_rate)}
          hint={`${formatCount(kpi.cache_hits)} served from cache`}
          icon={Database}
        />
        <StatCard
          title="Avg run time"
          value={formatDuration(kpi.avg_duration_ms)}
          hint="Across instrumented routes"
          icon={Gauge}
        />
        <StatCard
          title="Broken API keys"
          value={formatCount(brokenKeys)}
          hint={`${formatCount(keys.totals.total)} keys from ${formatCount(
            keys.totals.users_with_keys
          )} users`}
          icon={KeyRound}
          tone={brokenKeys > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Daily tool runs, page views, active users, and errors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart data={activity} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most used tools</CardTitle>
          <CardDescription>
            Ranked by runs in the selected range. See the Tools page for latency and
            reliability detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={topToolColumns}
            rows={tools.slice(0, 8)}
            getRowKey={(row) => row.tool_slug}
            emptyMessage="No tool usage recorded in this range yet."
          />
        </CardContent>
      </Card>
    </>
  )
}
