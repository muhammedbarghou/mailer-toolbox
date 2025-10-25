import Image from "next/image"
export default function Logo() {
    return (
      <div className="flex items-center space-x-2">
        <Image
          src="/Logo.svg"
          alt="Logo"
          className="h-8 w-8 rounded-sm"
            width={32}
            height={32}
        />
        <span className="font-bold text-lg">Toolbox</span>
      </div>
    )
  }
  