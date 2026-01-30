// components/NewsSection.tsx
"use client";

import { useEffect, useState } from "react";
import GalleryCarousel from "@/components/GalleryCarousel";
import type { HomeContent } from "@/lib/homeContent";
import { formatDate, type NewsListItem } from "@/lib/newsContent";
import { getAllNewsClient } from "@/lib/newsContentClient";
import { getHomeNewsContentClient } from "@/lib/homeContentClient";

function NewsMeta({ tag, date }: { tag?: string; date: string }) {
  return (
    <div className="newsMetaRow">
      {tag ? (
        <>
          <span className="newsTag">{tag}</span>
          <span className="newsDot" aria-hidden="true" />
        </>
      ) : null}
      <span className="newsDate">{date}</span>
    </div>
  );
}

export default function NewsSection({
  meta,
  items,
}: {
  meta: HomeContent["news"];
  items: NewsListItem[]; // real articles list items
}) {
  const [liveMeta, setLiveMeta] = useState(meta);
  const [liveItems, setLiveItems] = useState(items);

  useEffect(() => {
    setLiveMeta(meta);
    setLiveItems(items);
  }, [meta, items]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getHomeNewsContentClient(), getAllNewsClient()])
      .then(([freshMeta, freshItems]) => {
        if (cancelled) return;
        if (freshMeta) setLiveMeta(freshMeta);
        if (freshItems.length) setLiveItems(freshItems);
      })
      .catch((err) => {
        console.warn("[news] client fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = liveItems.slice(0, 3);
  const featured = latest[0];
  const rest = latest.slice(1);

  if (!featured) return null;

  const featuredTag = featured.tags?.[0];
  const featuredImg = featured.hero?.image ?? "";

  return (
    <div>
      <div className="sectionHeader">
        <div className="eyebrow">{liveMeta.eyebrow}</div>

        <div className="sectionHeaderRow">
          <h2 className="h2Title" style={{ margin: 0 }}>
            {liveMeta.title}
          </h2>

          <a className="textLink" href="/news">
            {liveMeta.viewAllLabel} <span aria-hidden="true">→</span>
          </a>
        </div>

        <p className="lead" style={{ marginTop: 12 }}>
          {liveMeta.subtitle}
        </p>
      </div>

      <div className="newsGridPro">
        <a className="newsFeatured" href={`/news?slug=${featured.slug}`}>
          <div className="newsFeaturedMedia">
            {/* fallback alt to title to be nicer than "" */}
            <img src={featuredImg} alt={featured.title} loading="lazy" />
          </div>

          <div className="newsFeaturedBody">
            <NewsMeta tag={featuredTag} date={formatDate(featured.publishedAt)} />
            <div className="newsFeaturedTitle">{featured.title}</div>
            {featured.dek ? (
              <div className="newsFeaturedExcerpt">{featured.dek}</div>
            ) : null}
            <div className="newsReadMore">
              Read more <span aria-hidden="true">→</span>
            </div>
          </div>
        </a>

        <div className="newsList">
          {rest.map((n) => {
            const tag = n.tags?.[0];
            const img = n.hero?.image ?? "";
            return (
              <a key={n.slug} className="newsItem" href={`/news?slug=${n.slug}`}>
                <div className="newsItemMedia">
                  <img src={img} alt={n.title} loading="lazy" />
                </div>

                <div className="newsItemBody">
                  <NewsMeta tag={tag} date={formatDate(n.publishedAt)} />
                  <div className="newsItemTitle">{n.title}</div>
                  {n.dek ? <div className="newsItemExcerpt">{n.dek}</div> : null}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="galleryWrap">
        <div className="galleryHeader">
          <div className="eyebrow">{liveMeta.gallery.eyebrow}</div>
          <div className="gallerySub">{liveMeta.gallery.subtitle}</div>
        </div>

        <GalleryCarousel images={liveMeta.gallery.images} />
      </div>
    </div>
  );
}
