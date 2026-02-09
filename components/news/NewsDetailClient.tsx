// components/news/NewsDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NewsArticle, NewsListItem } from "@/lib/newsContent";
import { getSimilarArticles } from "@/lib/newsContent";
import { getAllNewsClient, getNewsBySlugClient } from "@/lib/newsContentClient";
import NewsArticleView from "@/components/news/NewsArticleView";
import { SITE_NAME } from "@/lib/site";

export default function NewsDetailClient({
  slug,
  initialArticle = undefined,
  initialItems = [],
}: {
  slug?: string;
  initialArticle?: NewsArticle | null;
  initialItems?: NewsListItem[];
}) {
  const initialSlug = slug || "";
  const [resolvedSlug, setResolvedSlug] = useState<string>(initialSlug);
  const [article, setArticle] = useState<NewsArticle | null | undefined>(
    initialArticle
  );
  const [loadedSlug, setLoadedSlug] = useState<string>(initialArticle?.slug || "");
  const [items, setItems] = useState<NewsListItem[]>(initialItems);

  useEffect(() => {
    if (!resolvedSlug && typeof window !== "undefined") {
      const path = window.location.pathname || "";
      const fromPath = path.startsWith("/news/") ? path.slice("/news/".length) : "";
      const search = new URLSearchParams(window.location.search);
      const fromQuery = (search.get("slug") ?? "").trim();
      const nextSlug = (fromPath || fromQuery).trim();
      if (nextSlug) queueMicrotask(() => setResolvedSlug(nextSlug));
    }
  }, [resolvedSlug]);

  useEffect(() => {
    let cancelled = false;
    if (!resolvedSlug) return () => {
      cancelled = true;
    };

    getNewsBySlugClient(resolvedSlug)
      .then((fresh) => {
        if (!cancelled) {
          setArticle(fresh);
          setLoadedSlug(resolvedSlug);
        }
      })
      .catch((err) => {
        console.warn("[news] client detail fetch failed", err);
        if (!cancelled) {
          setArticle(null);
          setLoadedSlug(resolvedSlug);
        }
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

  useEffect(() => {
    if (!article?.title) return;
    document.title = `${article.title} | ${SITE_NAME}`;
  }, [article?.title]);

  if (!resolvedSlug) {
    return (
      <main className="newsPageWhite">
        <div className="newsWrap">
          <div className="newsMast">Missing article.</div>
        </div>
      </main>
    );
  }

  const isLoading = article === undefined || loadedSlug !== resolvedSlug;

  if (isLoading) {
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
            <Link className="textLink" href="/news">
              Back to News
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return <NewsArticleView article={article} similar={similar} />;
}
