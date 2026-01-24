// components/news/SimilarArticles.tsx
import type { NewsListItem } from "@/lib/newsContent";
import { formatDate } from "@/lib/newsContent";

export default function SimilarArticles({ items }: { items: NewsListItem[] }) {
  if (!items.length) return null;

  return (
    <aside className="newsSidebar">
      <div className="newsSidebarTitle">More from the lab</div>

      <div className="newsSidebarList">
        {items.map((a) => (
          <a key={a.slug} className="newsSideCard" href={`/news?slug=${a.slug}`}>
            <div className="newsSideMedia">
              {a.hero?.image ? <img src={a.hero.image} alt="" loading="lazy" /> : <div className="newsSideMediaFallback" />}
            </div>

            <div className="newsSideBody">
              <div className="newsSideMeta">{formatDate(a.publishedAt)}</div>
              <div className="newsSideTitle">{a.title}</div>
              {a.dek ? <div className="newsSideDek">{a.dek}</div> : null}
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}
