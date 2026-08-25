import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, KeyRound, Mail, Play, Wrench } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { getUserDetail, type UserDetail } from "@/lib/admin/queries"
import {
  formatCount,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  formatToolName,
} from "@/lib/admin/format"

type ApiKeyRow = UserDetail["api_keys"][number]
type ToolUsageRow = UserDetail["tool_usage"][number]
type EventRow = UserDetail["recent_events"][number]

const validationVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "valid") {
    return "outline"
  }
  if (status === "invalid" || status === "expired") {
    return "destructive"
  }
  return "secondary"
}

const apiKeyColumns: DataTableColumn<ApiKeyRow>[] = [
  {
    key: "provider",
    header: "Provider",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium capitalize">{row.provider}</span>
        {row.is_default && <Badge variant="secondary">Default</Badge>}
      </div>
    ),
  },
  {
    key: "name",
    header: "Label",
    render: (row) => row.key_name || <span className="text-muted-foreground">Unnamed</span>,
  },
  {
    key: "status",
    header: "Validation",
    render: (row) => (
      <Badge variant={validationVariant(row.validation_status)} className="capitalize">
        {row.validation_status}
      </Badge>
    ),
  },
  {
    key: "active",
    header: "Active",
    hideOnMobile: true,
    render: (row) => (row.is_active ? "Yes" : "No"),
  },
  {
    key: "validated",
    header: "Last validated",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatRelativeTime(row.last_validated_at),
  },
]

const toolUsageColumns: DataTableColumn<ToolUsageRow>[] = [
  {
    key: "tool",
    header: "Tool",
    render: (row) => <span className="font-medium">{formatToolName(row.tool_slug)}</span>,
  },
  { key: "runs", header: "Runs", align: "right", render: (row) => formatCount(row.runs) },
  {
    key: "errors",
    header: "Errors",
    align: "right",
    render: (row) => formatCount(row.errors),
  },
  {
    key: "last",
    header: "Last used",
    align: "right",
    render: (row) => formatRelativeTime(row.last_used_at),
  },
]

const eventColumns: DataTableColumn<EventRow>[] = [
  {
    key: "when",
    header: "When",
    render: (row) => formatDateTime(row.created_at),
  },
  {
    key: "tool",
    header: "Tool",
    render: (row) => formatToolName(row.tool_slug),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => (
      <Badge variant={row.status === "error" ? "destructive" : "secondary"}>
        {row.status === "error" ? row.error_code || "error" : row.action}
      </Badge>
    ),
  },
  {
    key: "provider",
    header: "Model",
    hideOnMobile: true,
    render: (row) =>
      row.model ? (
        <span className="font-mono text-xs">{row.model}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "cached",
    header: "Cached",
    hideOnMobile: true,
    render: (row) => (row.cached ? "Yes" : "No"),
  },
  {
    key: "duration",
    header: "Duration",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDuration(row.duration_ms),
  },
]

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await getUserDetail(id)

  if (!detail?.profile) {
    notFound()
  }

  const { profile, api_keys, gmail_accounts, header_profiles, tool_usage, recent_events } =
    detail

  const totalRuns = tool_usage.reduce((sum, row) => sum + row.runs, 0)
  const totalErrors = tool_usage.reduce((sum, row) => sum + row.errors, 0)
  const brokenKeys = api_keys.filter((key) =>
    ["invalid", "expired"].includes(key.validation_status)
  ).length

  return (
    <>
      <Link
        href="/admin/users"
        className="inline-flex w-fit items-center gap-2 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <PageHeader
        title={profile.display_name || profile.email}
        description={`${profile.email} · signed up ${formatDateTime(profile.created_at)}`}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="capitalize">
          {profile.auth_provider}
        </Badge>
        {profile.email_confirmed ? (
          <Badge variant="outline">Email confirmed</Badge>
        ) : (
          <Badge variant="destructive">Email unconfirmed</Badge>
        )}
        {profile.banned_until && <Badge variant="destructive">Banned</Badge>}
        <Badge variant="outline">
          Last sign in {formatRelativeTime(profile.last_sign_in_at)}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tool runs"
          value={formatCount(totalRuns)}
          hint="All time"
          icon={Play}
        />
        <StatCard
          title="Errors"
          value={formatCount(totalErrors)}
          hint="Across all tools"
          icon={Wrench}
          tone={totalErrors > 0 ? "warning" : "default"}
        />
        <StatCard
          title="API keys"
          value={formatCount(api_keys.length)}
          hint={brokenKeys > 0 ? `${brokenKeys} need attention` : "All healthy"}
          icon={KeyRound}
          tone={brokenKeys > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Gmail accounts"
          value={formatCount(gmail_accounts.length)}
          hint={`${formatCount(header_profiles.length)} header profiles`}
          icon={Mail}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
          <CardDescription>
            Metadata only. Stored keys are encrypted and are never decrypted for the
            admin console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={apiKeyColumns}
            rows={api_keys}
            getRowKey={(row) => row.id}
            emptyMessage="This user has not added any API keys."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tool usage</CardTitle>
          <CardDescription>Lifetime totals per tool for this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={toolUsageColumns}
            rows={tool_usage}
            getRowKey={(row) => row.tool_slug}
            emptyMessage="No recorded tool usage for this user yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The 50 most recent events for this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={eventColumns}
            rows={recent_events}
            getRowKey={(row) => row.id}
            emptyMessage="No events recorded for this user yet."
          />
        </CardContent>
      </Card>
    </>
  )
}
