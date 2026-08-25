import { AlertTriangle, Inbox, ScrollText, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { getGmailOverview, type GmailOverview } from "@/lib/admin/queries"
import { formatCount, formatDateTime, formatRelativeTime } from "@/lib/admin/format"
import { ADMIN_EMAILS } from "@/lib/admin/access-control"

type AccountRow = GmailOverview["accounts"][number]
type ShareRow = GmailOverview["shares"][number]
type AuditRow = GmailOverview["audit"][number]

/**
 * A token expiring within the day needs a refresh before the next search
 */
const isExpiringSoon = (expiresAt: string | null): boolean => {
  if (!expiresAt) {
    return false
  }
  return new Date(expiresAt).getTime() < Date.now() + 24 * 60 * 60 * 1000
}

const accountColumns: DataTableColumn<AccountRow>[] = [
  {
    key: "email",
    header: "Gmail account",
    render: (row) => <span className="font-medium">{row.email}</span>,
  },
  {
    key: "owner",
    header: "Owner",
    render: (row) => row.owner_email ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "viewers",
    header: "Viewers",
    align: "right",
    render: (row) => formatCount(row.viewer_count),
  },
  {
    key: "token",
    header: "Token",
    render: (row) =>
      isExpiringSoon(row.token_expires_at) ? (
        <Badge variant="destructive">Expiring</Badge>
      ) : (
        <Badge variant="outline">Valid</Badge>
      ),
  },
  {
    key: "connected",
    header: "Connected",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDateTime(row.created_at),
  },
]

const shareColumns: DataTableColumn<ShareRow>[] = [
  {
    key: "account",
    header: "Account",
    render: (row) => row.account_email ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "owner",
    header: "Shared by",
    render: (row) => row.owner_email ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "viewer",
    header: "Shared with",
    render: (row) => row.viewer_email ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "granted",
    header: "Granted",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatDateTime(row.created_at),
  },
]

const auditColumns: DataTableColumn<AuditRow>[] = [
  {
    key: "when",
    header: "When",
    render: (row) => formatDateTime(row.created_at),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => (
      <Badge variant="secondary" className="capitalize">
        {row.action}
      </Badge>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    render: (row) => row.actor_email ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "account",
    header: "Account",
    hideOnMobile: true,
    render: (row) => row.account_email ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "age",
    header: "Age",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatRelativeTime(row.created_at),
  },
]

export default async function AdminGmailPage() {
  const overview = await getGmailOverview()
  const { totals } = overview

  return (
    <>
      <PageHeader
        title="Gmail Audit"
        description="Connected inboxes, who they are shared with, and every privileged action taken against them."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Connected accounts"
          value={formatCount(totals.accounts)}
          hint="Via Google OAuth"
          icon={Inbox}
        />
        <StatCard
          title="Active shares"
          value={formatCount(totals.shares)}
          hint="Viewer grants outstanding"
          icon={Share2}
        />
        <StatCard
          title="Audit entries"
          value={formatCount(totals.audit_entries)}
          hint="All time"
          icon={ScrollText}
        />
        <StatCard
          title="Expiring tokens"
          value={formatCount(totals.expiring_tokens)}
          hint="Within the next 24 hours"
          icon={AlertTriangle}
          tone={totals.expiring_tokens > 0 ? "warning" : "default"}
        />
      </div>

      {totals.accounts === 0 && (
        <Alert>
          <Inbox className="h-4 w-4" />
          <AlertTitle>No inboxes connected yet</AlertTitle>
          <AlertDescription>
            The Gmail deliverability backend is implemented and restricted to{" "}
            {ADMIN_EMAILS.join(", ")}, but no account has completed the OAuth flow. Note
            that the /gmail-deliverability page itself does not exist yet, so the flow
            can currently only be started through the API.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>
            OAuth tokens are encrypted at rest and never shown here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={accountColumns}
            rows={overview.accounts}
            getRowKey={(row) => row.id}
            emptyMessage="No Gmail accounts have been connected."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sharing graph</CardTitle>
          <CardDescription>
            Every viewer who can read metadata from someone else&apos;s inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={shareColumns}
            rows={overview.shares}
            getRowKey={(row) => row.id}
            emptyMessage="No inbox has been shared with another user."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            The 100 most recent connect, disconnect, search, share, and unshare events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={auditColumns}
            rows={overview.audit}
            getRowKey={(row) => row.id}
            emptyMessage="No Gmail actions have been recorded."
          />
        </CardContent>
      </Card>
    </>
  )
}
