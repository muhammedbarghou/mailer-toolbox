import IPv4Converter from "@/components/pages/ipv4-converter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "IPv4 Converter",
  description: "Convert IPv4 addresses to Integer, Hex, IPv6 (short and long) formats. Supports batch conversion of multiple IP addresses.",
  keywords: ["IPv4 converter", "IP address converter", "IPv4 to IPv6", "IP to integer", "IP to hex", "IP tool"],
  openGraph: {
    title: "IPv4 Converter | Mailer Toolbox",
    description: "Convert IPv4 addresses to Integer, Hex, IPv6 and more formats with our comprehensive converter tool.",
    url: "/ipv4-converter",
  },
  alternates: {
    canonical: "/ipv4-converter",
  },
}

export default function IPv4ConverterPage() {
  return (
    <IPv4Converter />
  )
}
