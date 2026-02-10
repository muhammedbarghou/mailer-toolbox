"use client"


import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Inbox,
  Network,
  Image as ImageIcon,
  Sparkles,
  PanelsRightBottom,
  ArrowRight,
  Scissors,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Mail,
  Star,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MostUsedTools } from "./most-used-tools"
import { tools } from "@/lib/tools-data"
import { useAuth } from "@/contexts/AuthContext"

const DashboardPage = () => {
  const { user } = useAuth()

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8 lg:py-12">
      {/* Welcome Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
              Welcome back {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mt-2">
              Your dashboard for all email and IP processing tools
            </p>
          </div>
        </div>
      </div>

      {/* Most Used Tools Section */}
      <MostUsedTools />

    </div>
  )
}

export default DashboardPage