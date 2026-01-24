// components/news/NewsIndex.tsx
import type { NewsListItem } from "@/lib/newsContent";
import { formatDate } from "@/lib/newsContent";

export default function NewsIndex({
  items,
  notFoundSlug,
}: {
  items: NewsListItem[];
  notFoundSlug?: string;
}) {
  return (
    <div className="newsWrap">
      <div className="newsPageTop">
        <div className="newsMast">Newsroom</div>
        <h1 className="newsH1">Latest</h1>
        <p className="newsKicker">Updates, publications, events, and highlights from the lab.</p>

        {notFoundSlug ? (
          <div className="newsNotice">
            We couldn’t find “{notFoundSlug}”. Showing all articles instead.
          </div>
        ) : null}
      </div>

      <div className="newsIndexGrid">
        {items.map((a, idx) => (
          <a
            key={a.slug}
            className={`newsIndexCard ${idx === 0 ? "isLead" : ""}`}
            href={`/news?slug=${encodeURIComponent(a.slug)}`}  // ✅ IMPORTANT
          >
            <div className="newsIndexMedia">
              {a.hero?.image ? (
                <img src={a.hero.image} alt="" loading="lazy" />
              ) : (
                <div className="newsIndexMediaFallback" aria-hidden="true" />
              )}
            </div>

            <div className="newsIndexBody">
              <div className="newsIndexMeta">
                <span className="newsIndexDate">{formatDate(a.publishedAt)}</span>
                {a.tags?.[0] ? (
                  <>
                    <span className="newsIndexDot" aria-hidden="true" />
                    <span className="newsIndexTag">{a.tags[0]}</span>
                  </>
                ) : null}
              </div>

              <div className="newsIndexTitle">{a.title}</div>
              {a.dek ? <div className="newsIndexDek">{a.dek}</div> : null}
              {a.author?.name ? <div className="newsIndexByline">By {a.author.name}</div> : null}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
