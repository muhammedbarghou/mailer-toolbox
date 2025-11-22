"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"

const ResetPasswordForm = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        toast.error(error.message || "Failed to send reset email")
      } else {
        setSuccess(true)
        toast.success("Password reset email sent! Check your inbox.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground">
                We've sent a password reset link to {email}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Back to Sign In
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground underline">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/auth/login")}
              disabled={loading}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordForm