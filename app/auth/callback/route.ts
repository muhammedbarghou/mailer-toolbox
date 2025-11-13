import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // If it's a password recovery, redirect to reset password confirmation
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password/confirm`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/home`)
}

