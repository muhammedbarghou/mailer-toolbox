import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getToolBreakdown, parseRange } from "@/lib/admin/queries";

export async function GET(request: NextRequest) {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const tools = await getToolBreakdown(range);

  return NextResponse.json({ range, tools });
}
