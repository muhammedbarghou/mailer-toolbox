import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  text?: string
  size?: "sm" | "md" | "lg"
}

export const Loading = ({ className, text, size = "md" }: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-primary border-t-transparent",
          sizeClasses[size]
        )}
        aria-label="Loading"
        role="status"
      />
      {text && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  )
}

export const PageLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading size="lg" text="Loading..." />
    </div>
  )
}

