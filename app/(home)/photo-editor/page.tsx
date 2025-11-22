import PhotoEditor from "@/components/pages/photo-editor"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Photo Editor",
  description: "Edit and enhance your photos online. Crop, resize, adjust colors, add filters, and more with our powerful photo editing tool.",
  keywords: ["photo editor", "image editor", "photo editing", "image editing", "photo tool", "image tool"],
  openGraph: {
    title: "Photo Editor | Mailer Toolbox",
    description: "Edit and enhance your photos online with our powerful photo editing tool.",
    url: "/photo-editor",
  },
  alternates: {
    canonical: "/photo-editor",
  },
}

export default function PhotoEditorPage() {
  return (
    <PhotoEditor />
  )
}