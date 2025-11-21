"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"

export default function ConfirmResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { updatePassword, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user has a valid session (from password reset link)
    if (!authLoading && !user) {
      toast.error("Invalid or expired reset link")
      router.push("/auth/reset-password")
    }
  }, [user, authLoading, router])

  // Show loading while checking session
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render form if no user session
  if (!user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        toast.error(error.message || "Failed to update password")
      } else {
        setSuccess(true)
        toast.success("Password updated successfully!")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
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
              <h1 className="text-3xl font-bold">Password Updated!</h1>
              <p className="text-muted-foreground">
                Your password has been successfully updated. Redirecting to sign in...
              </p>
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
            <h1 className="text-3xl font-bold">Set New Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update Password"}
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

