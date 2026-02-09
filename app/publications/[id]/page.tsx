import PublicationDetailClient from "@/components/publications/PublicationDetailClient";
import {
  buildPublicationDetail,
  getMemberBySlugOrId,
  getMemberSlug,
  getPublicationSlug,
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
    console.warn("[publications] server fetch failed", err);
    return emptyTables();
  }
}

function toIsoDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const gvMatch = trimmed.match(/Date\((\d{1,4}),\s*(\d{1,2}),\s*(\d{1,2})\)/i);
  if (gvMatch) {
    const y = Number(gvMatch[1]);
    const m = Number(gvMatch[2]) + 1;
    const d = Number(gvMatch[3]);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
    }
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return undefined;
}

export async function generateStaticParams() {
  const tables = await getTables();
  return tables.publications.map((publication) => ({
    id: getPublicationSlug(publication),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const tables = await getTables();
  const detail = buildPublicationDetail(tables, params.id);
  if (!detail) {
    return {
      title: "Publication not found",
      robots: { index: false, follow: false },
    };
  }

  const { publication } = detail;
  const title = publication.title || "Publication";
  const description =
    publication.abstract ||
    publication.field_of_study ||
    publication.journal ||
    "Research publication from the Physics of Life and Stuff group.";
  const slug = getPublicationSlug(publication);
  const url = `/publications/${slug}`;
  const image = DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { from?: string };
}) {
  const tables = await getTables();
  const detail = buildPublicationDetail(tables, params.id);
  if (!detail) notFound();

  const fromId = (searchParams?.from ?? "").trim();
  const fromMember = fromId ? getMemberBySlugOrId(tables, fromId) : null;
  const backHref = fromMember ? `/community/${getMemberSlug(fromMember)}` : "/publications";

  const pub = detail.publication;
  const slug = getPublicationSlug(pub);
  const isoDate = toIsoDate(pub.publishing_date);
  const authorList = detail.authors
    .map((a) => a.member)
    .filter(Boolean)
    .map((m) => ({
      "@type": "Person",
      name: [m?.first_name, m?.last_name].filter(Boolean).join(" ").trim(),
    }));

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: pub.title,
    name: pub.title,
    datePublished: isoDate,
    author: authorList.length ? authorList : undefined,
    publisher: pub.publisher
      ? { "@type": "Organization", name: pub.publisher }
      : undefined,
    isPartOf: pub.journal
      ? { "@type": "PublicationIssue", name: pub.journal }
      : undefined,
    url: `${SITE_URL}/publications/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <PublicationDetailClient initialDetail={detail} initialBackHref={backHref} />
    </>
  );
}
