// components/publications/PublicationsPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import CommunityHero from "@/components/community/CommunityHero";
import SectionHeading from "@/components/community/SectionHeading";
import PublicationFilters from "@/components/publications/PublicationFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import { THEME } from "@/components/theme";
import { buildPublicationList, type PublicationListItem } from "@/lib/publicationsContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";

export default function PublicationsPageClient({
  initialItems = [],
}: {
  initialItems?: PublicationListItem[];
}) {
  const [items, setItems] = useState<PublicationListItem[]>(initialItems);

  useEffect(() => {
    let cancelled = false;
    getCommunityTablesClient()
      .then((tables) => {
        if (cancelled) return;
        setItems(buildPublicationList(tables));
      })
      .catch((err) => {
        console.warn("[publications] client fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      <CommunityHero
        title="Publications"
        subtitle="Browse the group's published works."
        imageSrc="/publicationhero.png"
      />

      <div className="homeLight">
        <div className="homeContainer">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Publications" },
            ]}
          />
        </div>
        <section id="publications" className="homeSection pubListSection">
          <div className="homeContainer pubListContainer">
            <SectionHeading title="All Publications" subtitle="Lorem ipsum eme eme." />
            <PublicationFilters items={items} />
          </div>
        </section>
      </div>
    </div>
  );
}
