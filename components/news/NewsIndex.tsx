// components/news/NewsIndex.tsx
"use client";

import { useMemo, useState } from "react";
import type { NewsListItem } from "@/lib/newsContent";
import { formatDate } from "@/lib/newsContent";

export default function NewsIndex({
  items,
  notFoundSlug,
}: {
  items: NewsListItem[];
  notFoundSlug?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      (item.tags ?? []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const parseDateValue = (value?: string): number | null => {
      if (!value) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (ymdMatch) {
        const y = Number(ymdMatch[1]);
        const m = Number(ymdMatch[2]);
        const d = Number(ymdMatch[3]);
        if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
          return Date.UTC(y, m - 1, d);
        }
      }
      const gvMatch = trimmed.match(/Date\((\d{1,4}),\s*(\d{1,2}),\s*(\d{1,2})\)/i);
      if (gvMatch) {
        const y = Number(gvMatch[1]);
        const m = Number(gvMatch[2]) + 1;
        const d = Number(gvMatch[3]);
        if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
          return Date.UTC(y, m - 1, d);
        }
      }
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return Date.UTC(
          parsed.getUTCFullYear(),
          parsed.getUTCMonth(),
          parsed.getUTCDate()
        );
      }
      return null;
    };

    const fromTime = parseDateValue(dateFrom);
    const toTime = parseDateValue(dateTo);

    return items.filter((item) => {
      const time = parseDateValue(item.publishedAt) ?? 0;
      if (fromTime != null && time < fromTime) return false;
      if (toTime != null && time > toTime) return false;

      if (activeTags.length) {
        const tags = (item.tags ?? []).map((t) => t.toLowerCase());
        const matchesTag = activeTags.some((tag) => tags.includes(tag.toLowerCase()));
        if (!matchesTag) return false;
      }

      if (!query) return true;
      const haystack = [
        item.title,
        item.dek,
        item.author?.name,
        item.tags?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, searchTerm, dateFrom, dateTo, activeTags]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setActiveTags([]);
  };

  return (
    <div className="newsWrap">
      <div className="newsLayout">
        <aside
          className={`newsFilters isMinimal ${filtersOpen ? "isOpen" : ""}`}
          role="region"
          aria-label="Filter news"
          id="news-filters"
        >
          <div className="newsFiltersRow">
            <label className="newsFilterGroup">
              <span className="newsFilterLabel">Search</span>
              <input
                className="newsFilterInput"
                type="search"
                placeholder="Search headlines, tags, authors..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label className="newsFilterGroup">
              <span className="newsFilterLabel">From</span>
              <input
                className="newsFilterInput"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>

            <label className="newsFilterGroup">
              <span className="newsFilterLabel">To</span>
              <input
                className="newsFilterInput"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>

            <button className="newsFilterClear" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>

          {tagOptions.length ? (
            <div className="newsFilterChips" role="group" aria-label="Filter by tag">
              {tagOptions.map((tag) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`newsFilterChip ${active ? "isActive" : ""}`}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="newsFilterCount">
            Showing {filteredItems.length} of {items.length}
          </div>
        </aside>

        <div className="newsContent">
          <div className="newsPageTop">
            <div className="newsMastRow">
              <div className="newsMast">Newsroom</div>
              <button
                className="newsFilterToggle"
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="news-filters"
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                <span className="newsFilterToggleIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M4 5h16l-6.5 7.3v4.9l-3 1.6v-6.5L4 5z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="newsFilterToggleText">Filters</span>
              </button>
            </div>
            <h1 className="newsH1">Latest</h1>
            <p className="newsKicker">
              Updates, publications, events, and highlights from the lab.
            </p>

            {notFoundSlug ? (
              <div className="newsNotice">
                We couldn’t find “{notFoundSlug}”. Showing all articles instead.
              </div>
            ) : null}
          </div>

          <div className="newsIndexGrid">
            {filteredItems.map((a, idx) => {
              const slug = (a.slug ?? "").trim();
              if (!slug) return null;

              const heroImage = (a.hero?.image ?? "").trim();
              const heroAlt = a.title ? `${a.title} cover` : "";

              return (
                <a
                  key={slug}
                  className={`newsIndexCard ${idx === 0 ? "isLead" : ""}`}
                  href={`/news?slug=${encodeURIComponent(slug)}`}
                >
                  <div className="newsIndexMedia">
                    {heroImage ? (
                      <img src={heroImage} alt={heroAlt} loading="lazy" />
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
                    {a.author?.name ? (
                      <div className="newsIndexByline">By {a.author.name}</div>
                    ) : null}
                  </div>
                </a>
              );
            })}
          </div>

          {!filteredItems.length ? (
            <div className="newsEmpty">No articles match these filters.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
