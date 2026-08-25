import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getGmailOverview } from "@/lib/admin/queries";

export async function GET() {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  const overview = await getGmailOverview();

  return NextResponse.json(overview);
}
