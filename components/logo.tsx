import Image from "next/image"
import Link from "next/link"

const Logo = () => {
  return (
    <>
      <div className="relative">
        <Image
          src="/Logo.svg"
          alt="MailerTools Hub Logo"
          className="h-9 w-9 transition-transform duration-300 group-hover:scale-105"
          width={36}
          height={36}
          priority
        />
      </div>
      <span className="font-bold text-lg bg-linear-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
        Toolbox
      </span>
      </>
  )
}

export default Logo
  