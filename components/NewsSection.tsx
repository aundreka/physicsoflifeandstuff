// components/NewsSection.tsx
import GalleryCarousel from "@/components/GalleryCarousel";
import type { HomeContent } from "@/lib/homeContent";

function NewsMeta({ tag, date }: { tag: string; date: string }) {
  return (
    <div className="newsMetaRow">
      <span className="newsTag">{tag}</span>
      <span className="newsDot" aria-hidden="true" />
      <span className="newsDate">{date}</span>
    </div>
  );
}

export default function NewsSection({ content }: { content: HomeContent["news"] }) {
  const featured = content.items[0];
  const rest = content.items.slice(1);

  return (
    <div>
      <div className="sectionHeader">
        <div className="eyebrow">{content.eyebrow}</div>

        <div className="sectionHeaderRow">
          <h2 className="h2Title" style={{ margin: 0 }}>
            {content.title}
          </h2>

          <a className="textLink" href="/news">
            {content.viewAllLabel} <span aria-hidden="true">→</span>
          </a>
        </div>

        <p className="lead" style={{ marginTop: 12 }}>{content.subtitle}</p>
      </div>

      <div className="newsGridPro">
        <a className="newsFeatured" href={`/news?slug=${featured.slug}`}>
          <div className="newsFeaturedMedia">
            <img src={featured.image} alt="" loading="lazy" />
          </div>

          <div className="newsFeaturedBody">
            <NewsMeta tag={featured.tag} date={featured.date} />
            <div className="newsFeaturedTitle">{featured.title}</div>
            <div className="newsFeaturedExcerpt">{featured.excerpt}</div>
            <div className="newsReadMore">
              Read more <span aria-hidden="true">→</span>
            </div>
          </div>
        </a>

        <div className="newsList">
          {rest.map((n) => (
            <a key={n.slug} className="newsItem" href={`/news?slug=${n.slug}`}>
              <div className="newsItemMedia">
                <img src={n.image} alt="" loading="lazy" />
              </div>

              <div className="newsItemBody">
                <NewsMeta tag={n.tag} date={n.date} />
                <div className="newsItemTitle">{n.title}</div>
                <div className="newsItemExcerpt">{n.excerpt}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="galleryWrap">
        <div className="galleryHeader">
          <div className="eyebrow">{content.gallery.eyebrow}</div>
          <div className="gallerySub">{content.gallery.subtitle}</div>
        </div>

        <GalleryCarousel images={content.gallery.images} />
      </div>
    </div>
  );
}
