// components/news/NewsArticleView.tsx
"use client";

import type { NewsArticle, NewsBlock, NewsListItem } from "@/lib/newsContent";
import { estimateReadingTime, formatDate } from "@/lib/newsContent";
import SimilarArticles from "@/components/news/SimilarArticles";

function toIsoDate(iso?: string | number | Date | null): string | undefined {
  if (iso == null) return undefined;

  if (iso instanceof Date && !Number.isNaN(iso.getTime())) {
    return iso.toISOString().slice(0, 10);
  }

  const raw = typeof iso === "string" ? iso.trim() : String(iso);
  if (!raw) return undefined;

  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;

  const gvMatch = raw.match(/Date\((\d{1,4}),\s*(\d{1,2}),\s*(\d{1,2})\)/i);
  if (gvMatch) {
    const y = Number(gvMatch[1]);
    const m = Number(gvMatch[2]) + 1;
    const d = Number(gvMatch[3]);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return undefined;
}

function TextWithBreaks({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <>
      {lines.map((line, i) => (
        <span key={`${i}-${line}`}>
          {i > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  );
}

function Blocks({ blocks }: { blocks: NewsBlock[] }) {
  return (
    <div className="articleBody">
      {blocks.map((b, i) => {
        if (b.type === "paragraph") {
          return (
            <p key={i} className="articleP">
              <TextWithBreaks text={b.text} />
            </p>
          );
        }
        if (b.type === "subhead") {
          return (
            <h2 key={i} className="articleH2">
              <TextWithBreaks text={b.text} />
            </h2>
          );
        }
        if (b.type === "quote") {
          return (
            <blockquote key={i} className="articleQuote">
              <p>
                <TextWithBreaks text={b.text} />
              </p>
              {b.cite ? <cite>{b.cite}</cite> : null}
            </blockquote>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="articleList">
              {b.items.map((it, idx) => (
                <li key={`${idx}-${it}`}>{it}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "links") {
          return (
            <section key={i} className="articleLinksInline">
              {b.title ? <div className="articleLinksTitle">{b.title}</div> : null}
              <ul className="articleLinksList">
                {b.items.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      {l.label || l.url} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        if (b.type === "image") {
          const alt = b.alt || b.caption || "";
          return (
            <figure key={i} className="articleFigure">
              <div className="articleFigureMedia">
                <img src={b.src} alt={alt} loading="lazy" />
              </div>
              {(b.caption || b.credit) ? (
                <figcaption className="articleCaption">
                  {b.caption ? <span>{b.caption}</span> : null}
                  {b.credit ? <span className="articleCredit">{b.credit}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        if (b.type === "gallery") {
          return (
            <section key={i} className="articleGalleryWrap">
              {b.title ? <div className="articleGalleryTitle">{b.title}</div> : null}
              <div className="articleGallery">
                {b.images.map((img, j) => (
                  <div key={`${img.src}-${j}`} className="articleGalleryTile">
                    <img src={img.src} alt={img.alt ?? ""} loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (b.type === "pdf") {
          return (
            <section key={i} className="articleEmbed">
              {b.title ? <div className="articleEmbedTitle">{b.title}</div> : null}
              <div className="articleEmbedFrame">
                <iframe src={b.src} title={b.title ?? "Embedded PDF"} />
              </div>
              <a className="articleEmbedLink" href={b.src} target="_blank" rel="noreferrer">
                Open PDF ↗
              </a>
            </section>
          );
        }
        if (b.type === "embed") {
          return (
            <section key={i} className="articleEmbed">
              {b.title ? <div className="articleEmbedTitle">{b.title}</div> : null}
              <div className="articleEmbedFrame">
                <iframe src={b.url} title={b.title ?? "Embedded content"} />
              </div>
              <a className="articleEmbedLink" href={b.url} target="_blank" rel="noreferrer">
                Open source ↗
              </a>
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function NewsArticleView({
  article,
  similar,
}: {
  article: NewsArticle;
    similar: NewsListItem[];
  }) {
  const heroImage = (article.hero?.image ?? "").trim();
  const hasHero = Boolean(heroImage);
  const publishedDateTime = toIsoDate(article.publishedAt);
  const updatedDateTime = toIsoDate(article.updatedAt ?? null);

  return (
    <main className="newsPageWhite">
      <div className="newsWrap">
<div className="articleTopNav">
  <div className="articleTopNavInner">
    <a className="articleBack" href="/news">← Back to News</a>
  </div>
</div>


        <div className="articleLayout">
          {/* MAIN */}
          <article className="articleMain">
            <header className="articleHeader">
              <div className="articleMeta">
                <time dateTime={publishedDateTime}>{formatDate(article.publishedAt)}</time>
                <span className="articleMetaDot" aria-hidden="true" />
                <span className="articleRead">{estimateReadingTime(article)}</span>
                {article.tags?.length ? (
                  <>
                    <span className="articleMetaDot" aria-hidden="true" />
                    <span className="articleTags">{article.tags.join(" • ")}</span>
                  </>
                ) : null}
              </div>

              <h1 className="articleTitle">{article.title}</h1>
              {article.dek ? <p className="articleDek">{article.dek}</p> : null}

              <div className="articleBylineRow">
                {article.author?.name ? (
                  <div className="articleByline">
                    By <span>{article.author.name}</span>
                    {article.author.role ? <span className="articleRole"> • {article.author.role}</span> : null}
                  </div>
                ) : null}

                {article.updatedAt ? (
                  <div className="articleUpdated">
                    <time dateTime={updatedDateTime}>Updated {formatDate(article.updatedAt)}</time>
                  </div>
                ) : null}
              </div>
            </header>

            {/* HERO */}
            <section className={`articleHero ${hasHero ? "hasImage" : "noImage"}`}>
              {hasHero ? (
                <div className="articleHeroMedia">
                  <img src={heroImage} alt={article.title ? `${article.title} hero` : ""} />
                </div>
              ) : (
                <div className="articleHeroFallback" aria-hidden="true" />
              )}

              {(article.hero?.caption || article.hero?.credit) ? (
                <div className="articleHeroCaption">
                  {article.hero?.caption ? <span>{article.hero.caption}</span> : null}
                  {article.hero?.credit ? <span className="articleCredit">{article.hero.credit}</span> : null}
                </div>
              ) : null}
            </section>

            {/* TOP LINKS (optional) */}
            {article.links?.length ? (
              <aside className="articleLinks">
                <div className="articleLinksTitle">Links</div>
                <ul className="articleLinksList">
                  {article.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.label || l.url} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}

            <Blocks blocks={article.content} />
          </article>

          {/* SIDEBAR */}
          <SimilarArticles items={similar} />
        </div>
      </div>
    </main>
  );
}
