// app/news/page.tsx
import NewsPageClient from "@/components/news/NewsPageClient";
import { getAllNews, type NewsListItem } from "@/lib/newsContent";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Suspense } from "react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "News",
  description: "Updates, publications, events, and highlights from the Physics of Life and Stuff group.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "News",
    description: "Updates, publications, events, and highlights from the Physics of Life and Stuff group.",
    siteName: SITE_NAME,
    url: "/news",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "News",
    description: "Updates, publications, events, and highlights from the Physics of Life and Stuff group.",
    images: ["/og.png"],
  },
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: { slug?: string };
}) {
  const slug = (searchParams?.slug ?? "").trim();
  if (slug) {
    redirect(`/news/${encodeURIComponent(slug)}`);
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "News",
        item: `${SITE_URL}/news`,
      },
    ],
  };

  let items: NewsListItem[] = [];
  try {
    items = await getAllNews();
  } catch (err) {
    console.warn("[news] server list fetch failed", err);
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Breadcrumb JSON-LD for sitelinks and rich results context.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <NewsPageClient initialItems={items} />
      </Suspense>
    </>
  );
}
