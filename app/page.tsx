import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

const page = () => {
  return (
    <section className="min-h-screen  p-4 md:p-8">
      <div className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100">
        <Image
          alt="background"
          src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/square-alt-grid.svg"
          className="opacity-90 mask-[radial-gradient(75%_75%_at_center,white,transparent)]"
          fill
          priority
          height={0}
          width={0}
        />
      </div>
      <div className="relative">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="bg-background/30 rounded-xl p-4 shadow-sm backdrop-blur-sm">
              <Image
                src="/Logo.svg"
                alt="logo"
                className="h-16"
                width={64}
                height={64}
              />
            </div>
            <div>
              <h1 className="mb-6 text-pretty text-2xl font-bold tracking-tight lg:text-5xl">
                Welcome to MailerTools Hub
              </h1>
              <p className="text-muted-foreground mx-auto max-w-3xl lg:text-xl">
                Your all-in-one suite of essential email and IP tools, designed to
                simplify your workflow and enhance productivity.
              </p>
            </div>
            <div className="mt-20 flex flex-col items-center gap-5">
              <p className="text-muted-foreground font-medium lg:text-left">
                Built with open-source technologies
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="https://ui.shadcn.com/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group flex aspect-square h-12 items-center justify-center p-0",
                  )}
                >
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-icon.svg"
                    alt="shadcn/ui logo"
                    className="h-6 saturate-0 transition-all group-hover:saturate-100"
                    width={24}
                    height={24}
                  />
                </Link>
                <Link
                  href="https://www.typescriptlang.org/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group flex aspect-square h-12 items-center justify-center p-0",
                  )}
                >
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/typescript-icon.svg"
                    alt="TypeScript logo"
                    className="h-6 saturate-0 transition-all group-hover:saturate-100"
                    width={24}
                    height={24}
                  />
                </Link>

                <a
                  href="https://nextjs.org/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group flex aspect-square h-12 items-center justify-center p-0",
                  )}
                >
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/nextjs-icon.svg"
                    alt="React logo"
                    className="h-6 saturate-0 transition-all group-hover:saturate-100"
                    width={24}
                    height={24}
                  />
                </a>
                <Link
                  href="https://tailwindcss.com/"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group flex aspect-square h-12 items-center justify-center p-0",
                  )}
                >
                  <Image
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/tailwind-icon.svg"
                    alt="Tailwind CSS logo"
                    className="h-6 saturate-0 transition-all group-hover:saturate-100"
                    width={24}
                    height={24}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 flex w-full items-center justify-center gap-4">
          <Button variant={"default"}>
            <Link href="/contact-us">Contact Us</Link>
          </Button>
          <Button variant={"outline"}>
            <Link href="/about-us">About Us</Link>
          </Button>
        </div>
      </div>
  </section>
  )
}

export default page