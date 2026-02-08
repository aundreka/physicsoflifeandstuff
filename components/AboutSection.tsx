// components/AboutSection.tsx
"use client";

import { useEffect, useState } from "react";
import type { HomeContent } from "@/lib/homeContent";
import { getHomeAboutContentClient } from "@/lib/homeContentClient";

export default function AboutSection({
  content,
}: {
  content: HomeContent["about"];
}) {
  const [liveContent, setLiveContent] = useState(content);

  useEffect(() => {
    setLiveContent(content);
  }, [content]);

  useEffect(() => {
    let cancelled = false;
    getHomeAboutContentClient()
      .then((fresh) => {
        if (!cancelled && fresh) setLiveContent(fresh);
      })
      .catch((err) => {
        console.warn("[about] client fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const images = liveContent.images ?? [];

  return (
    <div className="aboutGrid">
      {/* Left */}
      <div>
        <div className="eyebrow">{liveContent.eyebrow}</div>
        <h2 className="h2Title">{liveContent.title}</h2>
        {liveContent.subtitle ? (
          <p className="lead">{liveContent.subtitle}</p>
        ) : null}

        {liveContent.bullets?.length ? (
          <ul className="bullets">
            {liveContent.bullets.map((b, i) => (
              <li key={i} className="bulletItem">
                <span className="bulletDot" aria-hidden="true" />
                <span
                  style={{
                    color: "var(--light-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {b}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Stats */}
        {liveContent.stats?.length ? (
          <div className="statsRow" role="list">
            {liveContent.stats.map((s) => (
              <div key={s.label} className="statCell" role="listitem">
                <div className="statValue">{s.value}</div>
                <div className="statLabel">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Right */}
      <div className="imageGrid">
        {images[0] ? (
          <figure className="figure figureWide imageWide">
            <img src={images[0].src} alt={images[0].alt || ""} loading="lazy" />
          </figure>
        ) : null}

        {images[1] ? (
          <figure className="figure figureSmall">
            <img src={images[1].src} alt={images[1].alt || ""} loading="lazy" />
          </figure>
        ) : null}

        {images[2] ? (
          <figure className="figure figureSmall">
            <img src={images[2].src} alt={images[2].alt || ""} loading="lazy" />
          </figure>
        ) : null}

        {liveContent.focusBlocks?.length ? (
          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            <div className="dividerList">
              {liveContent.focusBlocks.map((b) => (
                <div key={b.title} className="dividerItem">
                  <div className="dividerTitle">{b.title}</div>
                  <div className="dividerBody">{b.body}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}