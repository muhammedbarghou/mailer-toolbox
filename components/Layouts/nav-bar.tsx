"use client"

import { usePathname } from "next/navigation"
import { InboxIcon, ZapIcon, PanelsRightBottom } from "lucide-react"
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

const navigationLinks = [
  { href: "/header-processor", label: "Header Processor", icon: InboxIcon },
  { href: "/eml-to-txt-converter", label: "EML to TXT Converter", icon: ZapIcon },
  { href: "/ip-comparator", label: "IP Comparator", icon: ZapIcon },
  { href: "/photo-editor", label: "Images Toolkit", icon: PanelsRightBottom },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side: Logo + Mobile Menu */}
        <div className="flex flex-1 items-center gap-2">
          {/* Mobile Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Toggle menu"
                className="group size-9 md:hidden rounded-full hover:bg-accent transition"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
                  />
                </svg>
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-44 p-2 md:hidden rounded-xl shadow-lg">
              <NavigationMenu className="max-w-none">
                <NavigationMenuList className="flex-col items-start gap-1">
                  {navigationLinks.map(({ href, label, icon: Icon }, i) => (
                    <NavigationMenuItem key={i} className="w-full">
                      <NavigationMenuLink
                        href={href}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          pathname === href
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <Icon size={16} className="text-muted-foreground" />
                        {label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 text-primary hover:opacity-90">
            <Logo />
          </a>
        </div>

        {/* Middle: Desktop Navigation */}
        <NavigationMenu className="max-md:hidden">
          <NavigationMenuList className="gap-4">
            {navigationLinks.map(({ href, label, icon: Icon }, i) => (
              <NavigationMenuItem key={i}>
                <NavigationMenuLink
                  href={href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname === href
                      ? "text-primary border-b-2 border-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  <Icon
                    size={16}
                    className="text-muted-foreground/80"
                    aria-hidden="true"
                  />
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side: Theme Toggle */}
        <div className="flex flex-1 items-center justify-end">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
