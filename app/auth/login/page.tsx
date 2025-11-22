import LoginForm from "@/components/auth/login"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Mailer Toolbox account to access all email and IP tools.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <LoginForm />
  )
} 