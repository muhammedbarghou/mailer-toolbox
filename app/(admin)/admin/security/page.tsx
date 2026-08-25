import { Activity, ShieldAlert, ShieldBan } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { BlockedIpTable } from "@/components/admin/blocked-ip-table"
import { listSpamTrapIps, getSpamTrapThreshold } from "@/lib/zero-bounce"
import { formatCount } from "@/lib/admin/format"

export default async function AdminSecurityPage() {
  const [records, threshold] = await Promise.all([
    listSpamTrapIps(),
    Promise.resolve(getSpamTrapThreshold()),
  ])

  const blockedCount = records.filter((record) => record.blocked).length
  const trackingCount = records.length - blockedCount

  return (
    <>
      <PageHeader
        title="Security"
        description="Signup abuse controls. IPs are tracked when ZeroBounce flags a signup email as a spam trap, and blocked permanently after repeated attempts."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Blocked IPs"
          value={formatCount(blockedCount)}
          hint="Cannot reach the signup route"
          icon={ShieldBan}
          tone={blockedCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Being tracked"
          value={formatCount(trackingCount)}
          hint={`Blocked at ${threshold} attempts`}
          icon={Activity}
        />
        <StatCard
          title="Block threshold"
          value={formatCount(threshold)}
          hint="Spam trap attempts before a permanent block"
          icon={ShieldAlert}
        />
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Blocks are permanent until lifted here</AlertTitle>
        <AlertDescription>
          Attempt counters expire after 24 hours, but a block set once it reaches the
          threshold never expires on its own. If a legitimate user was caught, unblock
          them below.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Tracked IP addresses</CardTitle>
          <CardDescription>
            Blocked addresses first, then those approaching the threshold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlockedIpTable records={records} threshold={threshold} />
        </CardContent>
      </Card>
    </>
  )
}
