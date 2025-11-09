"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import Logo from "@/components/logo"
import { Chrome } from "lucide-react"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.replace("/home")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password)
        if (error) {
          toast.error(error.message || "Failed to sign in")
        } else {
          toast.success("Signed in successfully")
          router.push("/home")
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          toast.error(error.message || "Failed to sign up")
        } else {
          toast.success("Account created! Please check your email to verify your account.")
          setMode("signin")
          setEmail("")
          setPassword("")
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin")
    setEmail("")
    setPassword("")
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message || "Failed to sign in with Google")
      }
      // Note: On success, user will be redirected by Supabase OAuth flow
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your tools"
                : "Get started with Mailer Toolbox"}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Enter your credentials to continue"
                : "Create a new account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full mb-4"
            >
              <Chrome className="mr-2 h-4 w-4" />
              {googleLoading ? "Loading..." : "Continue with Google"}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={6}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading
                    ? "Loading..."
                    : mode === "signin"
                      ? "Sign In"
                      : "Sign Up"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleMode}
                  disabled={loading}
                  className="w-full"
                >
                  {mode === "signin"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

