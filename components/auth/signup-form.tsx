"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

const SignupForm = () => {
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signUp, signInWithGoogle, user } = useAuth()
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
      // Validate email with ZeroBounce before signup
      const validationResponse = await fetch("/api/auth/validate-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const validationData = await validationResponse.json()

      if (!validationData.allowed) {
        // Show error message from validation
        toast.error(validationData.reason || "Email validation failed")
        
        // If IP is blocked, show additional warning
        if (validationResponse.status === 403) {
          toast.error("Your IP address has been blocked. Please contact support if you believe this is an error.")
        }
        
        setLoading(false)
        return
      }

      // Email is valid, proceed with Supabase signup
      const displayName = `${name.trim()} ${lastName.trim()}`.trim()
      const { error } = await signUp(email, password, displayName)
      if (error) {
        toast.error(error.message || "Failed to sign up")
      } else {
        toast.success("Account created! Please check your email to verify your account.")
        router.push("/auth/login")
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error?.message || "An unexpected error occurred")
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
          <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm">
              Sign up to start using our tools.
            </p>
            <p className="text-muted-foreground text-sm">
              We use ZeroBounce to validate your email address.Therefore, if your trying to sign up with a disposable email address, it will be rejected.
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
            {googleLoading ? "Signing up..." : "Sign in with Google"}
          </Button>
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="name">Name*</FieldLabel>
          <Input 
            id="name" 
            type="text" 
            placeholder="Enter your name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
            disabled={loading || googleLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">Last Name*</FieldLabel>
          <Input 
            id="lastName" 
            type="text" 
            placeholder="Enter your last name" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required 
            disabled={loading || googleLoading}
          />
        </Field>
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
          <FieldLabel htmlFor="password">Password*</FieldLabel>
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
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline underline-offset-4">
            Login Here
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}

export default SignupForm
