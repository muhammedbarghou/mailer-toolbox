import ResetPasswordForm from "@/components/auth/reset-password-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Mailer Toolbox account password.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return (
    <ResetPasswordForm />
  )
}
