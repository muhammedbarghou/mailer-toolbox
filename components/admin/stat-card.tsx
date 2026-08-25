import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string
  hint?: string
  icon?: LucideIcon
  /** Draws attention when the metric is in a bad state, e.g. a high error rate */
  tone?: "default" | "warning" | "danger"
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-amber-600 dark:text-amber-500",
  danger: "text-destructive",
}

export const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: StatCardProps) => {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold tracking-tight ${toneStyles[tone]}`}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
