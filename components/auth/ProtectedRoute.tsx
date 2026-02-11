"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { ProtectedRouteSkeleton } from "@/components/skeletons"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  if (loading) {
    return <ProtectedRouteSkeleton />
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/20">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Authentication Required
            </h2>
            <p className="text-muted-foreground text-lg">
              Please sign in to access this tool.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => router.push("/auth")}
            className="mt-4"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

