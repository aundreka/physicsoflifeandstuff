// app/news/page.tsx
import NewsPageClient from "@/components/news/NewsPageClient";
import { getAllNews, type NewsListItem } from "@/lib/newsContent";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
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

  let items: NewsListItem[] = [];
  try {
    items = await getAllNews();
  } catch (err) {
    console.warn("[news] server list fetch failed", err);
  }

  return (
    <Suspense fallback={null}>
      <NewsPageClient initialItems={items} />
    </Suspense>
  );
}
