// components/HomeLayout.tsx
import Hero from "@/components/Hero";
import { THEME } from "@/components/theme";
import NewsSection from "@/components/NewsSection";
import AboutSection from "@/components/AboutSection";

import { getHomeContent } from "@/lib/homeContent";
import { getAllNews } from "@/lib/newsContent";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="homeContainer">{children}</div>;
}

export default async function HomeLayout() {

  const home = await getHomeContent();
  const allNews = await getAllNews();

  const latestThree = allNews.slice(0, 3);
  type CSSVars = React.CSSProperties & Record<`--${string}`, string>;
  const styleVars: CSSVars = {
    "--hero-bg": THEME.pageBg,
    "--light-bg": THEME.lightBg,
    "--light-text": THEME.lightText,
    "--light-muted": THEME.lightMuted,
    "--hairline": THEME.hairline,
  };

  return (
    <div style={styleVars}>
      <Hero />

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
            <NewsSection meta={home.news} items={latestThree} />
          </Container>
        </section>

        <section id="about" className="homeSection">
          <Container>
            <AboutSection content={home.about} />
          </Container>
        </section>
      </div>
    </div>
  );
}
