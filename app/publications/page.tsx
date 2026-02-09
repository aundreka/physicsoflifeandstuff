import PublicationsPageClient from "@/components/publications/PublicationsPageClient";
import { getCommunityTables, type CommunityTables } from "@/lib/communityContent";
import { buildPublicationList } from "@/lib/publicationsContent";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

function emptyTables(): CommunityTables {
  return {
    members: [],
    publications: [],
    publication_links: [],
    publication_authors: [],
    presentations: [],
    presentation_authors: [],
    awards: [],
    award_recipients: [],
    award_publications: [],
    certificates: [],
    certificate_holders: [],
  };
}

export const metadata: Metadata = {
  title: "Publications",
  description: "Peer-reviewed publications and research outputs from the Physics of Life and Stuff group.",
  alternates: { canonical: "/publications" },
  openGraph: {
    title: "Publications",
    description: "Peer-reviewed publications and research outputs from the Physics of Life and Stuff group.",
    siteName: SITE_NAME,
    url: "/publications",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Publications",
    description: "Peer-reviewed publications and research outputs from the Physics of Life and Stuff group.",
    images: ["/og.png"],
  },
};

export default async function PublicationsPage() {
  const sheetId = process.env.SHEETS_ID ?? process.env.NEXT_PUBLIC_SHEETS_ID ?? "";
  let tables = emptyTables();
  if (sheetId) {
    try {
      tables = await getCommunityTables({ sheetId, revalidateSeconds: revalidate });
    } catch (err) {
      console.warn("[publications] server fetch failed", err);
    }
  }

  const items = buildPublicationList(tables);
  return (
    <>
      <script
        type="application/ld+json"
        // Breadcrumb JSON-LD for sitelinks and rich results context.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Publications",
                item: `${SITE_URL}/publications`,
              },
            ],
          }),
        }}
      />
      <PublicationsPageClient initialItems={items} />
    </>
  );
}
