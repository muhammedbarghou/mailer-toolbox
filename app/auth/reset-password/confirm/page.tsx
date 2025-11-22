import ConfirmResetPasswordForm from "@/components/auth/confirm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Confirm Password Reset",
  description: "Confirm your password reset for your Mailer Toolbox account.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ConfirmResetPasswordPage() {
  return (
    <ConfirmResetPasswordForm />
  )
}