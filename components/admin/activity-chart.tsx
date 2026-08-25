"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatShortDate } from "@/lib/admin/format"
import type { DailyActivity } from "@/lib/admin/queries"

interface ActivityChartProps {
  data: DailyActivity[]
}

const chartConfig = {
  runs: { label: "Tool runs", color: "var(--chart-1)" },
  views: { label: "Page views", color: "var(--chart-2)" },
  active_users: { label: "Active users", color: "var(--chart-3)" },
  errors: { label: "Errors", color: "var(--chart-5)" },
} satisfies ChartConfig

export const ActivityChart = ({ data }: ActivityChartProps) => {
  const hasActivity = data.some(
    (point) => point.runs > 0 || point.views > 0 || point.active_users > 0
  )

  if (!hasActivity) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
        <p className="text-sm font-medium">No activity recorded yet</p>
        <p className="max-w-md text-xs text-muted-foreground">
          Usage tracking was just enabled. Runs and views will appear here as people
          use the tools.
        </p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value) => formatShortDate(value)}
        />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent labelFormatter={(label) => formatShortDate(String(label))} />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.15}
            strokeWidth={2}
            stackId={undefined}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}
