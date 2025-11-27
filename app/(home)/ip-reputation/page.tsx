import type { Metadata } from "next"
import IPReputationTool from "@/components/pages/ip-reputation"

export const metadata: Metadata = {
  title: "IP Reputation Checker",
  description: "Check IP, domain, or URL reputation in batch using AbuseIPDB.",
  keywords: ["ip reputation", "abuseipdb", "ip blacklist", "ip risk score", "security"],
  openGraph: {
    title: "IP Reputation Checker | Mailer Toolbox",
    description: "Analyze the abuse reputation of IPs, domains, or URLs using AbuseIPDB.",
    url: "/ip-reputation",
  },
  alternates: {
    canonical: "/ip-reputation",
  },
}

export default function IPReputationPage() {
  return <IPReputationTool />
}


