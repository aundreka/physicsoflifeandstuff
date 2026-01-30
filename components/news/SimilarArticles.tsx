// components/news/SimilarArticles.tsx
"use client";

import type { NewsListItem } from "@/lib/newsContent";
import { formatDate } from "@/lib/newsContent";

export default function SimilarArticles({ items }: { items: NewsListItem[] }) {
  if (!items.length) return null;

  return (
    <aside className="newsSidebar">
      <div className="newsSidebarTitle">More from the lab</div>

      <div className="newsSidebarList">
        {items.map((a) => {
          const slug = (a.slug ?? "").trim();
          if (!slug) return null;

          const heroImage = (a.hero?.image ?? "").trim();
          const heroAlt = a.title ? `${a.title} cover` : "";

          return (
            <a key={slug} className="newsSideCard" href={`/news?slug=${encodeURIComponent(slug)}`}>
              <div className="newsSideMedia">
                {heroImage ? (
                  <img src={heroImage} alt={heroAlt} loading="lazy" />
                ) : (
                  <div className="newsSideMediaFallback" />
                )}
              </div>

              <div className="newsSideBody">
                <div className="newsSideMeta">{formatDate(a.publishedAt)}</div>
                <div className="newsSideTitle">{a.title}</div>
                {a.dek ? <div className="newsSideDek">{a.dek}</div> : null}
              </div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
