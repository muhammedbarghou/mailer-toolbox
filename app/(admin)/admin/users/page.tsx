import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/admin/page-header"
import { DataTable, type DataTableColumn } from "@/components/admin/data-table"
import { UserSearch } from "@/components/admin/user-search"
import { PaginationControls } from "@/components/admin/pagination-controls"
import { getUserList, type AdminUserRow } from "@/lib/admin/queries"
import { formatCount, formatDateTime, formatRelativeTime } from "@/lib/admin/format"

const PAGE_SIZE = 25

const columns: DataTableColumn<AdminUserRow>[] = [
  {
    key: "user",
    header: "User",
    render: (row) => (
      <Link
        href={`/admin/users/${row.id}`}
        className="flex flex-col rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View details for ${row.email}`}
      >
        <span className="font-medium text-primary hover:underline">{row.email}</span>
        {row.display_name && (
          <span className="text-xs text-muted-foreground">{row.display_name}</span>
        )}
      </Link>
    ),
  },
  {
    key: "provider",
    header: "Provider",
    hideOnMobile: true,
    render: (row) => (
      <Badge variant="secondary" className="capitalize">
        {row.auth_provider}
      </Badge>
    ),
  },
  {
    key: "confirmed",
    header: "Status",
    hideOnMobile: true,
    render: (row) =>
      row.email_confirmed ? (
        <Badge variant="outline">Confirmed</Badge>
      ) : (
        <Badge variant="destructive">Unconfirmed</Badge>
      ),
  },
  {
    key: "signup",
    header: "Signed up",
    hideOnMobile: true,
    render: (row) => formatDateTime(row.created_at),
  },
  {
    key: "lastSignIn",
    header: "Last sign in",
    render: (row) => formatRelativeTime(row.last_sign_in_at),
  },
  {
    key: "runs",
    header: "Runs",
    align: "right",
    render: (row) => formatCount(row.total_runs),
  },
  {
    key: "keys",
    header: "API keys",
    align: "right",
    render: (row) => formatCount(row.api_key_count),
  },
]

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search?.trim() ?? ""
  const requestedPage = Number.parseInt(params.page ?? "1", 10)
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const { rows, totalCount } = await getUserList({
    search,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with an account, along with how much they actually use the product."
      />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Directory</CardTitle>
              <CardDescription>
                {search
                  ? `Results for "${search}"`
                  : "Newest signups first. Select a user to see their full activity."}
              </CardDescription>
            </div>
            <UserSearch initialValue={search} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            emptyMessage={
              search ? "No users match that search." : "No users found."
            }
          />
          <PaginationControls
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
          />
        </CardContent>
      </Card>
    </>
  )
}
