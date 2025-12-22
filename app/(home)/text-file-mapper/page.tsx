import TextFileMapper from "@/components/pages/text-file-mapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Text File Mapper",
  description: "Parse merged text files with __SEP__ separators and view each text section with copy functionality.",
  keywords: ["text mapper", "text parser", "copy text sections", "text separator", "file parser", "text splitter"],
  openGraph: {
    title: "Text File Mapper | Mailer Toolbox",
    description: "Parse merged text files and copy individual text sections easily.",
    url: "/text-file-mapper",
  },
  alternates: {
    canonical: "/text-file-mapper",
  },
}

export default function TextFileMapperPage() {
  return <TextFileMapper />
}
