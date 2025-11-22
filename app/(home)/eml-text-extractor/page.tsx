import EmlTextExtractor from "@/components/pages/eml-text-extractor"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EML Text Extractor",
  description: "Extract plain text content from EML email files. Convert EML files to readable text format quickly and efficiently.",
  keywords: ["EML extractor", "EML to text", "email text extractor", "EML converter", "email text", "EML parser"],
  openGraph: {
    title: "EML Text Extractor | Mailer Toolbox",
    description: "Extract plain text content from EML email files quickly and efficiently.",
    url: "/eml-text-extractor",
  },
  alternates: {
    canonical: "/eml-text-extractor",
  },
}

export default function EmlTextExtractorPage() {
  return (
    <EmlTextExtractor />
  )
}

