import SignupForm from "@/components/auth/signup-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new Mailer Toolbox account to access all email and IP tools.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignupPage() {
  return (
      <SignupForm />
  )
}
