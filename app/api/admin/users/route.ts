import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getUserList } from "@/lib/admin/queries";

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  const searchParams = request.nextUrl.searchParams;
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
  const requestedOffset = Number.parseInt(searchParams.get("offset") ?? "0", 10);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : 50;
  const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;

  const { rows, totalCount } = await getUserList({
    search: searchParams.get("search") ?? undefined,
    limit,
    offset,
  });

  return NextResponse.json({ users: rows, totalCount, limit, offset });
}
