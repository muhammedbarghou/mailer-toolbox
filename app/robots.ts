import { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mailer-toolkit.online"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/home/",
          "/settings/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

