// components/publications/PublicationsPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import CommunityHero from "@/components/community/CommunityHero";
import SectionHeading from "@/components/community/SectionHeading";
import PublicationFilters, {
  type PublicationListItem,
} from "@/components/publications/PublicationFilters";
import { THEME } from "@/components/theme";
import {
  getPublicationAuthorsOrdered,
  type CommunityTables,
} from "@/lib/communityContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";

function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

function yearFromDate(value: string): string {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "";
  return new Date(t).getUTCFullYear().toString();
}

function buildPublicationList(tables: CommunityTables): PublicationListItem[] {
  return tables.publications.map((pub) => {
    const authors = getPublicationAuthorsOrdered(tables, pub.id).map((a) => ({
      id: a.member.id,
      name: fullName(a.member.first_name, a.member.last_name),
    }));

    return {
      id: pub.id,
      title: pub.title,
      publishing_date: pub.publishing_date,
      field_of_study: pub.field_of_study,
      institute: pub.institute,
      description: pub.description,
      abstract: pub.abstract,
      year: yearFromDate(pub.publishing_date),
      authors,
    };
  });
}

export default function PublicationsPageClient() {
  const [items, setItems] = useState<PublicationListItem[]>([]);

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
      <CommunityHero
        title="Publications"
        subtitle="Browse the group's published works."
        imageSrc="/publicationhero.png"
      />

      <div className="homeLight">
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
