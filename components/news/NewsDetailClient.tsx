// components/news/NewsDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle, NewsListItem } from "@/lib/newsContent";
import { getSimilarArticles } from "@/lib/newsContent";
import { getAllNewsClient, getNewsBySlugClient } from "@/lib/newsContentClient";
import NewsArticleView from "@/components/news/NewsArticleView";

export default function NewsDetailClient({
  slug,
  initialArticle = undefined,
  initialItems = [],
}: {
  slug?: string;
  initialArticle?: NewsArticle | null;
  initialItems?: NewsListItem[];
}) {
  const [resolvedSlug, setResolvedSlug] = useState<string>(slug || "");
  const [article, setArticle] = useState<NewsArticle | null | undefined>(
    initialArticle
  );
  const [items, setItems] = useState<NewsListItem[]>(initialItems);

  useEffect(() => {
    let cancelled = false;
    if (!resolvedSlug && typeof window !== "undefined") {
      const path = window.location.pathname || "";
      const fromPath = path.startsWith("/news/") ? path.slice("/news/".length) : "";
      const search = new URLSearchParams(window.location.search);
      const fromQuery = (search.get("slug") ?? "").trim();
      const nextSlug = (fromPath || fromQuery).trim();
      if (nextSlug) setResolvedSlug(nextSlug);
    }
    if (!resolvedSlug) {
      setArticle(null);
      return () => {
        cancelled = true;
      };
    }

    if (article === undefined) {
      setArticle(undefined);
    }

    getNewsBySlugClient(resolvedSlug)
      .then((fresh) => {
        if (!cancelled) setArticle(fresh);
      })
      .catch((err) => {
        console.warn("[news] client detail fetch failed", err);
        if (!cancelled) setArticle(null);
      });

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
  }, [resolvedSlug]);

  const similar = useMemo(() => {
    if (!article) return [];
    return getSimilarArticles(items, article, 5);
  }, [items, article]);

  if (!resolvedSlug) {
    return (
      <main className="newsPageWhite">
        <div className="newsWrap">
          <div className="newsMast">Missing article.</div>
        </div>
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
        <div className="newsWrap">
          <div className="newsMast">Article not found.</div>
          <p style={{ marginTop: 12 }}>
            <a className="textLink" href="/news">Back to News</a>
          </p>
        </div>
      </main>
    );
  }

  return <NewsArticleView article={article} similar={similar} />;
}
