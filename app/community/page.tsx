import CommunityPageClient from "@/components/community/CommunityPageClient";
import { splitMembersByType, type CommunityTables } from "@/lib/communityContent";
import { getCommunityTables } from "@/lib/communityContent";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

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
  title: "Community",
  description: "Advisers, members, and alumni of the Physics of Life and Stuff research group.",
  alternates: {
    canonical: "/community",
  },
  openGraph: {
    title: "Community",
    description: "Advisers, members, and alumni of the Physics of Life and Stuff research group.",
    siteName: SITE_NAME,
    url: "/community",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community",
    description: "Advisers, members, and alumni of the Physics of Life and Stuff research group.",
    images: ["/og.png"],
  },
};

export default async function CommunityPage() {
  const sheetId = process.env.SHEETS_ID ?? process.env.NEXT_PUBLIC_SHEETS_ID ?? "";
  let tables = emptyTables();
  if (sheetId) {
    try {
      tables = await getCommunityTables({ sheetId, revalidateSeconds: revalidate });
    } catch (err) {
      console.warn("[community] server fetch failed", err);
    }
  }
  const split = splitMembersByType(tables.members);
  return (
    <CommunityPageClient
      initialAdmins={split.admins}
      initialMembers={split.members}
      initialAlumni={split.alumni}
    />
  );
}
