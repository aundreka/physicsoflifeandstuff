// components/HomeLayout.tsx
import Hero from "@/components/Hero";
import { THEME } from "@/components/theme";
import NewsSection from "@/components/NewsSection";
import AboutSection from "@/components/AboutSection";
import { getHomeContent } from "@/lib/homeContent";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="homeContainer">{children}</div>;
}

export default function HomeLayout() {
  const content = getHomeContent();

  return (
    <div
      style={
        {
          ["--hero-bg" as any]: THEME.pageBg,
          ["--light-bg" as any]: THEME.lightBg,
          ["--light-text" as any]: THEME.lightText,
          ["--light-muted" as any]: THEME.lightMuted,
          ["--hairline" as any]: THEME.hairline,
        } as React.CSSProperties
      }
    >
      <Hero />

      {/* Wave transition: Hero (dark) -> News (light) */}
      <div className="heroToLightWave" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="heroToLightWaveSvg">
          <path
            d="M0,64 C240,128 480,0 720,64 C960,128 1200,0 1440,64 L1440,120 L0,120 Z"
            fill="var(--light-bg)"
          />
        </svg>
      </div>

      <div className="homeLight">
        <section id="news" className="homeSection">
          <Container>
            <NewsSection content={content.news} />
          </Container>
        </section>

        <section id="about" className="homeSection">
          <Container>
            <AboutSection content={content.about} />
          </Container>
        </section>
      </div>
    </div>
  );
}
