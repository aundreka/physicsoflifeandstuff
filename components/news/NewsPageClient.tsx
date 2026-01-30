// components/news/NewsPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { NewsArticle, NewsListItem } from "@/lib/newsContent";
import { getSimilarArticles } from "@/lib/newsContent";
import { getAllNewsClient, getNewsBySlugClient } from "@/lib/newsContentClient";
import NewsIndex from "@/components/news/NewsIndex";
import NewsArticleView from "@/components/news/NewsArticleView";

export default function NewsPageClient({
  initialItems = [],
}: {
  initialItems?: NewsListItem[];
}) {
  const searchParams = useSearchParams();
  const slug = (searchParams?.get("slug") ?? "").trim();

  const [items, setItems] = useState<NewsListItem[]>(initialItems);
  const [article, setArticle] = useState<NewsArticle | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getAllNewsClient()
      .then((fresh) => {
        if (!cancelled && fresh.length) setItems(fresh);
      })
      .catch((err) => {
        console.warn("[news] client list fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setArticle(null);
      return () => {
        cancelled = true;
      };
    }
    setArticle(undefined);
    getNewsBySlugClient(slug)
      .then((fresh) => {
        if (!cancelled) setArticle(fresh);
      })
      .catch((err) => {
        console.warn("[news] client article fetch failed", err);
        if (!cancelled) setArticle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const similar = useMemo(() => {
    if (!article) return [];
    return getSimilarArticles(items, article, 5);
  }, [items, article]);

  if (!slug) {
    return (
      <main className="newsPageWhite">
        <NewsIndex items={items} />
      </main>
    );
  }

  if (article === undefined) {
    return (
      <main className="newsPageWhite">
        <div className="newsWrap">
          <div className="newsMast">Loading…</div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="newsPageWhite">
        <NewsIndex items={items} notFoundSlug={slug} />
      </main>
    );
  }

  return <NewsArticleView article={article} similar={similar} />;
}
