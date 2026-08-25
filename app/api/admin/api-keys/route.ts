import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getApiKeyOverview } from "@/lib/admin/queries";

/**
 * API key health metadata. Never returns encrypted key material.
 */
export async function GET() {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  const overview = await getApiKeyOverview();

  return NextResponse.json(overview);
}
