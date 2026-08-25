"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ShieldOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SpamTrapIpRecord } from "@/lib/zero-bounce"

interface BlockedIpTableProps {
  records: SpamTrapIpRecord[]
  threshold: number
}

/**
 * Render tracked IPs with an inline unblock action.
 *
 * Blocks are permanent in Redis, so lifting one is the only way a legitimate
 * user caught by the spam trap heuristic can sign up.
 */
export const BlockedIpTable = ({ records, threshold }: BlockedIpTableProps) => {
  const router = useRouter()
  const [pendingIp, setPendingIp] = useState<string | null>(null)

  const handleUnblock = async (ip: string) => {
    setPendingIp(ip)

    try {
      const response = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(payload?.error || "Failed to unblock this IP")
        return
      }

      toast.success(`Unblocked ${ip}`)
      router.refresh()
    } catch {
      toast.error("Failed to unblock this IP")
    } finally {
      setPendingIp(null)
    }
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No IPs are currently blocked or being tracked for spam trap attempts.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Attempts</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Counter resets in
            </TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.ip}>
              <TableCell className="font-mono text-sm">{record.ip}</TableCell>
              <TableCell>
                {record.blocked ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : (
                  <Badge variant="secondary">
                    Tracking ({record.attempts}/{threshold})
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">{record.attempts}</TableCell>
              <TableCell className="hidden text-right md:table-cell">
                {record.attemptsExpireIn
                  ? `${Math.ceil(record.attemptsExpireIn / 3600)}h`
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(record.ip)}
                  disabled={pendingIp === record.ip}
                  aria-label={`Unblock ${record.ip}`}
                >
                  <ShieldOff className="h-4 w-4" />
                  {pendingIp === record.ip ? "Unblocking..." : "Unblock"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
