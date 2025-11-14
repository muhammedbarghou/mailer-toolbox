import { ArrowRightIcon, Eclipse } from "lucide-react"

export default function Banner() {
  return (
    <div className=" bg-muted px-4 py-3 text-foreground">
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex grow gap-3">
          <Eclipse
            className="mt-0.5 shrink-0 opacity-60"
            size={16}
            aria-hidden="true"
          />
          <div className="flex grow flex-col justify-between gap-2 md:flex-row md:items-center">
            <p className="text-sm">
              Before using our AI tools , you must first obtain an API key from the <a href="https://aistudio.google.com/app/api-keys" className="text-primary hover:underline font-medium">Google AI Studio</a> website.
            </p>
    </div>
  </div>
</div>
</div>
)
}
