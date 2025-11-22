import IPComparator from "@/components/pages/ip-comparator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "IP Comparator",
  description: "Compare and analyze IP addresses. Check IP reputation, compare multiple IPs, and get detailed information about IP addresses.",
  keywords: ["IP comparator", "IP address checker", "IP analysis", "IP reputation", "IP lookup", "IP tool"],
  openGraph: {
    title: "IP Comparator | Mailer Toolbox",
    description: "Compare and analyze IP addresses with our comprehensive IP comparator tool.",
    url: "/ip-comparator",
  },
  alternates: {
    canonical: "/ip-comparator",
  },
}

export default function IPComparatorPage() {
  return (
    <IPComparator />
  )
}