import EmlToTxtConverter from "@/components/pages/eml-to-txt-converter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EML to TXT Converter",
  description: "Convert EML email files to TXT format. Transform email messages into plain text files for easy reading and archiving.",
  keywords: ["EML to TXT", "EML converter", "email converter", "EML to text", "email to text", "file converter"],
  openGraph: {
    title: "EML to TXT Converter | Mailer Toolbox",
    description: "Convert EML email files to TXT format quickly and easily.",
    url: "/eml-to-txt-converter",
  },
  alternates: {
    canonical: "/eml-to-txt-converter",
  },
}

export default function EmlToTxtConverterPage() {
  return (
    <EmlToTxtConverter />
  )
}

