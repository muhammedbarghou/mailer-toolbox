import Link from "next/link"
import { AlertTriangle, CheckCircle2, KeyRound, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { getApiKeyOverview, type ApiKeyOverview } from "@/lib/admin/queries"
import { formatCount, formatDateTime, formatRelativeTime } from "@/lib/admin/format"

type ProviderRow = ApiKeyOverview["by_provider"][number]
type AttentionRow = ApiKeyOverview["attention"][number]

const providerColumns: DataTableColumn<ProviderRow>[] = [
  {
    key: "provider",
    header: "Provider",
    render: (row) => <span className="font-medium capitalize">{row.provider}</span>,
  },
  { key: "total", header: "Keys", align: "right", render: (row) => formatCount(row.total) },
  {
    key: "active",
    header: "Active",
    align: "right",
    render: (row) => formatCount(row.active),
  },
  {
    key: "valid",
    header: "Valid",
    align: "right",
    render: (row) => formatCount(row.valid),
  },
  {
    key: "broken",
    header: "Invalid or expired",
    align: "right",
    render: (row) => (
      <span className={row.broken > 0 ? "font-medium text-destructive" : ""}>
        {formatCount(row.broken)}
      </span>
    ),
  },
  {
    key: "users",
    header: "Users",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatCount(row.users),
  },
]

const attentionColumns: DataTableColumn<AttentionRow>[] = [
  {
    key: "user",
    header: "User",
    render: (row) => (
      <Link
        href={`/admin/users/${row.user_id}`}
        className="rounded font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View details for ${row.email ?? "user"}`}
      >
        {row.email ?? row.user_id}
      </Link>
    ),
  },
  {
    key: "provider",
    header: "Provider",
    render: (row) => <span className="capitalize">{row.provider}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge
        variant={
          ["invalid", "expired"].includes(row.validation_status)
            ? "destructive"
            : "secondary"
        }
        className="capitalize"
      >
        {row.last_validated_at ? row.validation_status : "never validated"}
      </Badge>
    ),
  },
  {
    key: "error",
    header: "Reason",
    hideOnMobile: true,
    render: (row) =>
      row.validation_error ? (
        <span className="text-xs text-muted-foreground">{row.validation_error}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "active",
    header: "Active",
    hideOnMobile: true,
    render: (row) => (row.is_active ? "Yes" : "No"),
  },
  {
    key: "created",
    header: "Added",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDateTime(row.created_at),
  },
  {
    key: "validated",
    header: "Last checked",
    align: "right",
    render: (row) => formatRelativeTime(row.last_validated_at),
  },
]

export default async function AdminApiKeysPage() {
  const overview = await getApiKeyOverview()
  const { totals } = overview
  const brokenKeys = totals.invalid + totals.expired

  return (
    <>
      <PageHeader
        title="API Key Health"
        description="Which users have working provider keys. The AI tools are unusable without one, so a broken key is a silently blocked user."
      />

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Keys are never decrypted here</AlertTitle>
        <AlertDescription>
          This page reads only metadata such as provider, validation status, and
          timestamps. The encrypted key material is never selected or displayed.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total keys"
          value={formatCount(totals.total)}
          hint={`${formatCount(totals.active)} active, ${formatCount(totals.inactive)} inactive`}
          icon={KeyRound}
        />
        <StatCard
          title="Users with keys"
          value={formatCount(totals.users_with_keys)}
          hint="Can use the AI tools"
          icon={Users}
        />
        <StatCard
          title="Valid keys"
          value={formatCount(totals.valid)}
          hint="Passed their last check"
          icon={CheckCircle2}
        />
        <StatCard
          title="Need attention"
          value={formatCount(brokenKeys + totals.never_validated + totals.pending)}
          hint={`${formatCount(brokenKeys)} broken, ${formatCount(
            totals.never_validated
          )} never validated`}
          icon={AlertTriangle}
          tone={brokenKeys > 0 ? "danger" : totals.never_validated > 0 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By provider</CardTitle>
          <CardDescription>
            Distribution across Gemini, OpenAI, and Anthropic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={providerColumns}
            rows={overview.by_provider}
            getRowKey={(row) => row.provider}
            emptyMessage="No API keys have been added yet."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keys needing attention</CardTitle>
          <CardDescription>
            Invalid, expired, pending, or never validated. These users may be hitting
            errors on the rewrite tools without reporting it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={attentionColumns}
            rows={overview.attention}
            getRowKey={(row) => row.id}
            emptyMessage="Every stored key is valid and recently checked."
          />
        </CardContent>
      </Card>
    </>
  )
}
