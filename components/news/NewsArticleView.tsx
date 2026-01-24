// components/news/NewsArticleView.tsx
import type { NewsArticle, NewsBlock, NewsListItem } from "@/lib/newsContent";
import { estimateReadingTime, formatDate } from "@/lib/newsContent";
import SimilarArticles from "@/components/news/SimilarArticles";

function Blocks({ blocks }: { blocks: NewsBlock[] }) {
  return (
    <div className="articleBody">
      {blocks.map((b, i) => {
        if (b.type === "paragraph") {
          return <p key={i} className="articleP">{b.text}</p>;
        }
        if (b.type === "subhead") {
          return <h2 key={i} className="articleH2">{b.text}</h2>;
        }
        if (b.type === "quote") {
          return (
            <blockquote key={i} className="articleQuote">
              <p>{b.text}</p>
              {b.cite ? <cite>{b.cite}</cite> : null}
            </blockquote>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="articleList">
              {b.items.map((it) => <li key={it}>{it}</li>)}
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
                    <a href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        if (b.type === "image") {
          return (
            <figure key={i} className="articleFigure">
              <div className="articleFigureMedia">
                <img src={b.src} alt={b.alt ?? ""} loading="lazy" />
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
  const hasHero = Boolean(article.hero?.image);

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
                <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
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
                  <div className="articleUpdated">Updated {formatDate(article.updatedAt)}</div>
                ) : null}
              </div>
            </header>

            {/* HERO */}
            <section className={`articleHero ${hasHero ? "hasImage" : "noImage"}`}>
              {hasHero ? (
                <div className="articleHeroMedia">
                  <img src={article.hero!.image!} alt="" />
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
                      <a href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>
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
