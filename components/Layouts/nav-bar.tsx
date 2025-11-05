"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { InboxIcon, ZapIcon, PanelsRightBottom, ImageIcon, Home, Menu } from "lucide-react"
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
  { href: "/header-processor", label: "Header Processor", icon: InboxIcon, description: "Process email headers" },
  { href: "/eml-to-txt-converter", label: "EML to TXT", icon: ZapIcon, description: "Convert EML files" },
  { href: "/ip-comparator", label: "IP Comparator", icon: ZapIcon, description: "Compare IP addresses" },
  { href: "/photo-editor", label: "Images Toolkit", icon: PanelsRightBottom, description: "Image editing tools" },
  { href: "/html-to-img", label: "HTML to Image", icon: ImageIcon, description: "Convert HTML to images" },
]

export default function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 gap-4">
        {/* Left side: Logo + Mobile Menu */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Mobile Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Toggle menu"
                className="group size-9 md:hidden rounded-lg hover:bg-accent transition-all duration-200 hover:scale-105"
                variant="ghost"
                size="icon"
              >
                <Menu className="size-5 transition-transform duration-300 group-aria-expanded:rotate-90" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-56 p-2 md:hidden rounded-xl shadow-lg border-2">
              <NavigationMenu className="max-w-none">
                <NavigationMenuList className="flex-col items-stretch gap-1 w-full">
                  <NavigationMenuItem className="w-full">
                    <NavigationMenuLink
                      href="/"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isHome
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Home size={16} className={cn("transition-colors", isHome ? "text-primary" : "text-muted-foreground")} />
                      <span>Home</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  {navigationLinks.map(({ href, label, icon: Icon, description }, i) => (
                    <NavigationMenuItem key={i} className="w-full">
                      <NavigationMenuLink
                        href={href}
                        className={cn(
                          "flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group",
                          pathname === href
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon 
                            size={16} 
                            className={cn(
                              "transition-colors shrink-0",
                              pathname === href ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                            )} 
                          />
                          <span className={cn("font-medium", pathname === href && "font-semibold")}>{label}</span>
                        </div>
                        {description && (
                          <span className="text-xs text-muted-foreground/70 ml-6">{description}</span>
                        )}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity duration-200 group"
          >
            <Logo />
          </Link>
        </div>

        {/* Middle: Desktop Navigation */}
        <NavigationMenu className="hidden md:flex flex-1 justify-center">
          <NavigationMenuList className="flex items-center gap-1 flex-nowrap">
            <NavigationMenuItem className="shrink-0">
              <NavigationMenuLink
                href="/"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative group whitespace-nowrap",
                  isHome
                    ? "text-primary bg-primary/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                )}
              >
                <Home size={16} className={cn("shrink-0 transition-colors", isHome ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="whitespace-nowrap">Home</span>
                {isHome && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </NavigationMenuLink>
            </NavigationMenuItem>
            {navigationLinks.map(({ href, label, icon: Icon }, i) => {
              const isActive = pathname === href
              return (
                <NavigationMenuItem key={i} className="shrink-0">
                  <NavigationMenuLink
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative group whitespace-nowrap",
                      isActive
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        "shrink-0 transition-all duration-200",
                        isActive 
                          ? "text-primary scale-110" 
                          : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                      )}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">{label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side: Theme Toggle */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
