"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { InboxIcon, ZapIcon, PanelsRightBottom, ImageIcon, Menu } from "lucide-react"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"

const navigationLinks = [
  { href: "/header-processor", label: "Header Processor", icon: InboxIcon },
  { href: "/eml-to-txt-converter", label: "EML to TXT", icon: ZapIcon },
  { href: "/ip-comparator", label: "IP Comparator", icon: ZapIcon },
  { href: "/photo-editor", label: "Images Toolkit", icon: PanelsRightBottom },
  { href: "/html-to-img", label: "HTML to Image", icon: ImageIcon },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side: Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Toggle menu"
                className="md:hidden"
                variant="ghost"
                size="icon"
              >
                <Menu className="size-5" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-48 p-2 md:hidden">
              <NavigationMenu className="max-w-none">
                <NavigationMenuList className="flex-col items-stretch gap-1 w-full">
                  <NavigationMenuItem className="w-full">
                    <NavigationMenuLink
                      href="/"
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                        pathname === "/"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      Home
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  {navigationLinks.map(({ href, label }, i) => (
                    <NavigationMenuItem key={i} className="w-full">
                      <NavigationMenuLink
                        href={href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                          pathname === href
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        {label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
        </div>

        {/* Middle: Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex items-center gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/"
                className={cn(
                  "px-3 py-2 text-sm rounded-md",
                  pathname === "/"
                    ? "text-primary font-medium"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            {navigationLinks.map(({ href, label }, i) => {
              const isActive = pathname === href
              return (
                <NavigationMenuItem key={i}>
                  <NavigationMenuLink
                    href={href}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md whitespace-nowrap",
                      isActive
                        ? "text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    {label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side: Theme Toggle */}
        <div className="flex items-center">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
