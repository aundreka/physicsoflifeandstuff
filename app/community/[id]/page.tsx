import MemberDetailClient from "@/components/community/MemberDetailClient";
import {
  buildMemberDetail,
  getMemberSlug,
  type CommunityTables,
} from "@/lib/communityContent";
import { getCommunityTables } from "@/lib/communityContent";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

async function getTables(): Promise<CommunityTables> {
  const sheetId = process.env.SHEETS_ID ?? process.env.NEXT_PUBLIC_SHEETS_ID ?? "";
  if (!sheetId) return emptyTables();
  try {
    return await getCommunityTables({ sheetId, revalidateSeconds: revalidate });
  } catch (err) {
    console.warn("[community] server fetch failed", err);
    return emptyTables();
  }
}

function truncate(value: string, max = 160): string {
  const text = (value || "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export async function generateStaticParams() {
  const tables = await getTables();
  return tables.members.map((member) => ({
    id: getMemberSlug(member),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const tables = await getTables();
  const detail = buildMemberDetail(tables, params.id);
  if (!detail) {
    return {
      title: "Member not found",
      robots: { index: false, follow: false },
    };
  }

  const member = detail.member;
  const name = [member.title, member.first_name, member.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const description =
    truncate(member.bionotes) ||
    truncate(member.specialization || member.occupation || member.course || "") ||
    `Profile of ${name} in the ${SITE_NAME} community.`;
  const slug = getMemberSlug(member);
  const url = `/community/${slug}`;
  const image = member.image || DEFAULT_OG_IMAGE;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description,
      url,
      siteName: SITE_NAME,
      images: image ? [{ url: image }] : undefined,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MemberPage({
  params,
}: {
  params: { id: string };
}) {
  const tables = await getTables();
  const detail = buildMemberDetail(tables, params.id);
  if (!detail) notFound();

  const member = detail.member;
  const name = [member.title, member.first_name, member.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const slug = getMemberSlug(member);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `${SITE_URL}/community/${slug}`,
    image: member.image || undefined,
    jobTitle: member.occupation || undefined,
    affiliation: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    sameAs: [
      member.linkedin && member.show_linkedin ? member.linkedin : null,
      member.email && member.show_email ? `mailto:${member.email}` : null,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <MemberDetailClient initialDetail={detail} />
    </>
  );
}
