import SignupForm from "@/components/auth/signup-form"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new Mailer Toolbox account to access all email and IP tools.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-start">
      <Link href="/" className="flex items-center gap-2 font-medium">
          <Image src="/AppLogo.png" alt="logo" width={30} height={30} />
          Mailer Toolkit
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </div>
    <div className="bg-muted relative hidden lg:block">
      <Image
        src="/assets/login.jpg"
        alt="Image"
        className="absolute inset-0 object-cover h-screen w-screen"
        width={500}
        height={500}
      />
    </div>
  </div>
  )
}
