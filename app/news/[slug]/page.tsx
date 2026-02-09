import NewsDetailClient from "@/components/news/NewsDetailClient";
import { getAllNews, getNewsBySlug, getSimilarArticles, type NewsArticle, type NewsListItem } from "@/lib/newsContent";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

function truncate(value: string, max = 160): string {
  const text = (value || "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export async function generateStaticParams() {
  try {
    const items = await getAllNews();
    return items.map((item) => ({ slug: item.slug }));
  } catch (err) {
    console.warn("[news] generateStaticParams failed", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  let article = null;
  try {
    article = await getNewsBySlug(params.slug);
  } catch (err) {
    console.warn("[news] metadata fetch failed", err);
  }

  if (!article) {
    return {
      title: "News",
      description: "Updates, publications, events, and highlights from the Physics of Life and Stuff group.",
      alternates: { canonical: `/news/${params.slug}` },
    };
  }

  const title = article.title || "News";
  const description =
    truncate(article.dek || "") ||
    truncate(article.content.find((b) => b.type === "paragraph")?.text || "") ||
    "News and updates from the Physics of Life and Stuff group.";
  const image = article.hero?.image || DEFAULT_OG_IMAGE;
  const url = `/news/${article.slug}`;
  const keywords = [
    article.title,
    ...(article.tags ?? []),
    article.author?.name,
    SITE_NAME,
  ].filter((v): v is string => Boolean(v));

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let article: NewsArticle | null = null;
  let items: NewsListItem[] = [];
  try {
    [article, items] = await Promise.all([
      getNewsBySlug(params.slug),
      getAllNews(),
    ]);
  } catch (err) {
    console.warn("[news] detail fetch failed", err);
  }

  const similar = article ? getSimilarArticles(items, article, 5) : [];

  const jsonLd = article
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.dek || undefined,
        datePublished: article.publishedAt || undefined,
        dateModified: article.updatedAt || undefined,
        author: article.author?.name
          ? { "@type": "Person", name: article.author.name }
          : undefined,
        keywords: (article.tags ?? []).join(", ") || undefined,
        image: article.hero?.image || DEFAULT_OG_IMAGE,
        mainEntityOfPage: `${SITE_URL}/news/${article.slug}`,
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <NewsDetailClient
        slug={params.slug}
        initialArticle={article}
        initialItems={items}
      />
    </>
  );
}
