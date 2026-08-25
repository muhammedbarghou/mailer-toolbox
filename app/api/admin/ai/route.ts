import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getAiBreakdown, getErrorBreakdown, parseRange } from "@/lib/admin/queries";

export async function GET(request: NextRequest) {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const [providers, errors] = await Promise.all([
    getAiBreakdown(range),
    getErrorBreakdown(range),
  ]);

  return NextResponse.json({ range, providers, errors });
}
