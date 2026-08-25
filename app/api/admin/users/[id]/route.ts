import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getUserDetail } from "@/lib/admin/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, response } = await requireAdminApi();
  if (!admin) {
    return response;
  }

  const { id } = await params;
  const detail = await getUserDetail(id);

  if (!detail) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
