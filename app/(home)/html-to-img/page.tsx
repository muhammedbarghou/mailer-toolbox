import HtmlToImage from "@/components/pages/html-to-img"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HTML to Image Converter",
  description: "Convert HTML content to high-quality images. Transform web pages, email templates, or HTML snippets into PNG, JPEG, or other image formats.",
  keywords: ["HTML to image", "HTML converter", "webpage to image", "screenshot tool", "HTML renderer", "image generator"],
  openGraph: {
    title: "HTML to Image Converter | Mailer Toolbox",
    description: "Convert HTML content to high-quality images quickly and easily.",
    url: "/html-to-img",
  },
  alternates: {
    canonical: "/html-to-img",
  },
}

export default function HtmlToImagePage() {
  return (
    <HtmlToImage />
  )
}