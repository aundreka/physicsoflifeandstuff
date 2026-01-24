// components/AboutSection.tsx
import type { HomeContent } from "@/lib/homeContent";

export default function AboutSection({ content }: { content: HomeContent["about"] }) {
  return (
    <div className="aboutGrid">
      {/* Left */}
      <div>
        <div className="eyebrow">{content.eyebrow}</div>
        <h2 className="h2Title">{content.title}</h2>
        <p className="lead">{content.subtitle}</p>

        <ul className="bullets">
          {content.bullets.map((b) => (
            <li key={b} className="bulletItem">
              <span className="bulletDot" aria-hidden="true" />
              <span style={{ color: "var(--light-muted)", lineHeight: 1.7 }}>{b}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="statsRow" role="list">
          {content.stats.map((s) => (
            <div key={s.label} className="statCell" role="listitem">
              <div className="statValue">{s.value}</div>
              <div className="statLabel">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="contactBlock">
          <div className="eyebrow">{content.contact.eyebrow}</div>

          <div className="contactRow">
            <div className="contactLabel">{content.contact.emailLabel}</div>
            <a className="contactValue" href={`mailto:${content.contact.email}`}>
              {content.contact.email}
            </a>
          </div>

          <div className="contactRow">
            <div className="contactLabel">{content.contact.locationLabel}</div>
            <div className="contactValue">{content.contact.location}</div>
          </div>

          <div className="contactRow">
            <div className="contactLabel">{content.contact.addressLabel}</div>
            <div className="contactValue">{content.contact.address}</div>
          </div>

          <div className="contactLinks">
            {content.contact.links.map((l) => (
              <a key={l.label} className="contactLink" href={l.href}>
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="imageGrid">
        <figure className="figure figureWide imageWide">
          <img src={content.images[0].src} alt={content.images[0].alt} loading="lazy" />
        </figure>

        <figure className="figure figureSmall">
          <img src={content.images[1].src} alt={content.images[1].alt} loading="lazy" />
        </figure>

        <figure className="figure figureSmall">
          <img src={content.images[2].src} alt={content.images[2].alt} loading="lazy" />
        </figure>

        <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
          <div className="dividerList">
            {content.focusBlocks.map((b) => (
              <div key={b.title} className="dividerItem">
                <div className="dividerTitle">{b.title}</div>
                <div className="dividerBody">{b.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
