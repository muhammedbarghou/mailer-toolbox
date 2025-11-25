"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"


const LoginForm = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signInWithGoogle, user } = useAuth()
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
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(error.message || "Failed to sign in")
      } else {
        toast.success("Signed in successfully")
        router.push("/home")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
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
    <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to continue to your account.
          </p>
        </div>
        <Field>
          <Button 
            variant="outline" 
            type="button" 
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 mr-2">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="email">Email*</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={loading || googleLoading}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password*</FieldLabel>
            <Link
              href="/auth/reset-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            disabled={loading || googleLoading}
          />
        </Field>
        <Field>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}

export default LoginForm