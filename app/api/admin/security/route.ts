import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/admin/require-admin";
import { listSpamTrapIps, unblockIp } from "@/lib/zero-bounce";

/**
 * Read the current spam trap tracking state from Redis
 */
export async function GET() {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  try {
    const records = await listSpamTrapIps();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to list spam trap IPs:", error);
    return NextResponse.json({ error: "Failed to load blocked IPs" }, { status: 500 });
  }
}

/**
 * Lift a block for a single IP address
 */
export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  try {
    let body: { ip?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const ip = typeof body.ip === "string" ? body.ip.trim() : "";
    if (!ip) {
      return NextResponse.json({ error: "An IP address is required" }, { status: 400 });
    }

    const unblocked = await unblockIp(ip);

    if (!unblocked) {
      return NextResponse.json(
        { error: "Could not unblock this IP. Redis may not be configured." },
        { status: 502 }
      );
    }

    await logAdminAction({
      actorUserId: admin.id,
      action: "unblock_ip",
      targetType: "ip",
      targetId: ip,
    });

    return NextResponse.json({ unblocked: true, ip });
  } catch (error) {
    console.error("Failed to unblock IP:", error);
    return NextResponse.json({ error: "Failed to unblock IP" }, { status: 500 });
  }
}
