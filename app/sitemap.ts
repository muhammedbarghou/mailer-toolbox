import { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mailer-toolkit.online"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/header-processor",
    "/rewrite",
    "/subject-rewrite",
    "/email-source-separator",
    "/eml-text-extractor",
    "/eml-to-txt-converter",
    "/gmail-deliverability",
    "/html-to-img",
    "/photo-editor",
    "/ip-comparator",
    "/privacy",
    "/terms",
  ]

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }))
}

