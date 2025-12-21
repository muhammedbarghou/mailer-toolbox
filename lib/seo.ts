import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL as string
const siteName = "Mailer Toolkit"
const defaultDescription = "Your all-in-one suite of essential email and IP tools, designed to simplify your workflow and enhance productivity."

export interface PageMetadata {
  title: string
  description?: string
  path?: string
  keywords?: string[]
  noindex?: boolean
  image?: string
}

export function generateMetadata({
  title,
  description = defaultDescription,
  path = "",
  keywords = [],
  noindex = false,
  image = "/AppLogo.png",
}: PageMetadata): Metadata {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  const url = `${siteUrl}${path}`
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
    metadataBase: new URL(siteUrl),
  }
}

export function generateStructuredData(type: "Organization" | "WebSite" | "BreadcrumbList", data?: any) {
  const baseOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/AppLogo.png`,
    description: defaultDescription,
    sameAs: [
      "https://www.linkedin.com/in/mohamed-barghou-abb848314/",
      "https://github.com/muhammedbarghou"
    ],
  }

  const baseWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  switch (type) {
    case "Organization":
      return baseOrganization
    case "WebSite":
      return baseWebSite
    case "BreadcrumbList":
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: data?.items || [],
      }
    default:
      return baseOrganization
  }
}
