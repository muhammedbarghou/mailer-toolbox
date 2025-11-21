"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Image from "next/image"

export default function Navbar() {
  const router = useRouter()

  const handleSignIn = () => {
    router.push("/auth/login")
  }

  const handleSignUp = () => {
    router.push("/auth/signup")
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/AppLogo.png" alt="logo" width={50} height={50} />
          <span className="font-bold text-lg">
            Mailer Toolkit
          </span>
        </div>
        {/* Right side: Auth + Theme Toggle */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="cursor-pointer" variant="outline" onClick={handleSignIn}>Log In</Button>
          <Button variant="default" size="sm" className="cursor-pointer" onClick={handleSignUp}>Sign Up</Button> 
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
