import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserApiKeys } from "@/lib/api-keys";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          hasAnyKey: false,
        },
        { status: 200 },
      );
    }

    const apiKeys = await getUserApiKeys(user.id, undefined);

    const hasAnyKey = apiKeys.length > 0;

    return NextResponse.json(
      {
        authenticated: true,
        hasAnyKey,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error checking API key status:", error);
    return NextResponse.json(
      {
        authenticated: false,
        hasAnyKey: false,
        error: error?.message || "Failed to check API key status",
      },
      { status: 500 },
    );
  }
}


