import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { getAdminAuditLog, type AdminAuditEntry } from "@/lib/admin/queries"
import { formatDateTime, formatRelativeTime } from "@/lib/admin/format"

const columns: DataTableColumn<AdminAuditEntry>[] = [
  {
    key: "when",
    header: "When",
    render: (row) => formatDateTime(row.created_at),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => (
      <Badge variant="secondary" className="font-mono text-xs">
        {row.action}
      </Badge>
    ),
  },
  {
    key: "target",
    header: "Target",
    render: (row) =>
      row.target_id ? (
        <span className="font-mono text-xs">
          {row.target_type ? `${row.target_type}: ` : ""}
          {row.target_id}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "age",
    header: "Age",
    align: "right",
    hideOnMobile: true,
    render: (row) => formatRelativeTime(row.created_at),
  },
]

export default async function AdminActivityPage() {
  const entries = await getAdminAuditLog(100)

  return (
    <>
      <PageHeader
        title="Admin Activity"
        description="This console reads other people's data, so every mutating action it performs is recorded here."
      />

      <Card>
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
          <CardDescription>
            The 100 most recent admin actions, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={entries}
            getRowKey={(row) => row.id}
            emptyMessage="No admin actions have been recorded yet."
          />
        </CardContent>
      </Card>
    </>
  )
}
