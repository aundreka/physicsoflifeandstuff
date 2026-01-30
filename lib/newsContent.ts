// lib/newsContent.ts
import {
  fetchSheetRows,
  rowsToObjects,
  isApproved,
  parseJsonMaybe,
  toNumber,
  normalizeDriveImageUrl,
} from "./sheets";

export type NewsBlock =
  | { type: "paragraph"; text: string }
  | { type: "subhead"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt?: string; caption?: string; credit?: string }
  | { type: "gallery"; title?: string; images: Array<{ src: string; alt?: string }> }
  | { type: "pdf"; title?: string; src: string }
  | { type: "embed"; title?: string; provider?: "iframe"; url: string }
  | { type: "list"; items: string[] }
  | { type: "links"; title?: string; items: Array<{ label: string; url: string }> };

export type NewsArticle = {
  slug: string;
  title: string;
  dek?: string;
  author?: { name: string; role?: string };
  publishedAt: string; // YYYY-MM-DD
  updatedAt?: string;  // YYYY-MM-DD
  tags?: string[];
  hero?: { image?: string; caption?: string; credit?: string };
  links?: Array<{ label: string; url: string }>;
  content: NewsBlock[];
};

export type NewsListItem = Pick<
  NewsArticle,
  "slug" | "title" | "publishedAt" | "tags" | "hero" | "dek" | "author"
>;

const SHEET_ID = process.env.SHEETS_ID!;
const REVALIDATE_SECONDS = Number(process.env.SHEETS_REVALIDATE ?? 300);

export async function getAllNews(): Promise<NewsListItem[]> {
  if (!SHEET_ID) throw new Error("Missing env var SHEETS_ID");

  const rows = rowsToObjects(
    await fetchSheetRows(SHEET_ID, "news_articles", REVALIDATE_SECONDS)
  );

  const items: NewsListItem[] = rows
    .filter((r) => isApproved(r.status))
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      dek: r.dek || undefined,
      author: r.author_name
        ? { name: r.author_name, role: r.author_role || undefined }
        : undefined,
      publishedAt: r.publishedAt,
      tags: (r.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      hero: {
        image: r.hero_image ? normalizeDriveImageUrl(r.hero_image) : undefined,
        caption: r.hero_caption || undefined,
        credit: r.hero_credit || undefined,
      },
    }));

  items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return items;
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  if (!SHEET_ID) throw new Error("Missing env var SHEETS_ID");

  const articles = rowsToObjects(
    await fetchSheetRows(SHEET_ID, "news_articles", REVALIDATE_SECONDS)
  );

  const row = articles.find((r) => r.slug === slug && isApproved(r.status));
  if (!row) return null;

  const blocks = rowsToObjects(
    await fetchSheetRows(SHEET_ID, "news_blocks", REVALIDATE_SECONDS)
  )
    .filter((b) => b.slug === slug && isApproved(b.status))
    .sort((a, b) => toNumber(a.idx) - toNumber(b.idx));

  const content: NewsBlock[] = blocks.map((b) => {
    const type = b.type as NewsBlock["type"];

    if (type === "paragraph" || type === "subhead") return { type, text: b.text };

    if (type === "quote")
      return { type, text: b.text, cite: b.cite || undefined };

    if (type === "image")
      return {
        type,
        src: normalizeDriveImageUrl(b.src),
        alt: b.alt || undefined,
        caption: b.caption || undefined,
        credit: b.credit || undefined,
      };

    if (type === "pdf") return { type, title: b.title || undefined, src: b.src };

    if (type === "embed")
      return {
        type,
        title: b.title || undefined,
        provider: (b.provider as any) || "iframe",
        url: b.url,
      };

    if (type === "list")
      return { type, items: parseJsonMaybe<string[]>(b.items_json, []) };

    if (type === "links")
      return {
        type,
        title: b.title || undefined,
        items: parseJsonMaybe<Array<{ label: string; url: string }>>(b.items_json, []),
      };

    if (type === "gallery")
      return {
        type,
        title: b.title || undefined,
        images: parseJsonMaybe<Array<{ src: string; alt?: string }>>(b.images_json, []).map(
          (img) => ({
            ...img,
            src: normalizeDriveImageUrl(img.src),
          })
        ),
      };

    // Fallback
    return { type: "paragraph", text: "" };
  });

  return {
    slug: row.slug,
    title: row.title,
    dek: row.dek || undefined,
    author: row.author_name
      ? { name: row.author_name, role: row.author_role || undefined }
      : undefined,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt || undefined,
    tags: (row.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    hero: {
      image: row.hero_image ? normalizeDriveImageUrl(row.hero_image) : undefined,
      caption: row.hero_caption || undefined,
      credit: row.hero_credit || undefined,
    },
    links: parseJsonMaybe<Array<{ label: string; url: string }>>(row.links_json, []),
    content,
  };
}

export function formatDate(iso?: string | number | Date | null): string {
  if (iso == null) return "";

  const pad2 = (n: number): string => String(n).padStart(2, "0");

  const formatYmd = (y: number, m: number, d: number): string => {
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return "";
    if (m < 1 || m > 12 || d < 1 || d > 31) return "";
    const yy = pad2(((y % 100) + 100) % 100);
    return `${pad2(m)}/${pad2(d)}/${yy}`;
  };

  if (iso instanceof Date) {
    const y = iso.getUTCFullYear();
    const m = iso.getUTCMonth() + 1;
    const d = iso.getUTCDate();
    return formatYmd(y, m, d);
  }

  const raw = typeof iso === "string" ? iso : String(iso);
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Fast path for YYYY-MM-DD.
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const y = Number(ymdMatch[1]);
    const m = Number(ymdMatch[2]);
    const d = Number(ymdMatch[3]);
    const formatted = formatYmd(y, m, d);
    if (formatted) return formatted;
  }

  // Handle Google Visualization-style dates like "Date(2026,0,2)" (month is 0-based).
  const gvMatch = trimmed.match(/Date\((\d{1,4}),\s*(\d{1,2}),\s*(\d{1,2})\)/i);
  if (gvMatch) {
    const y = Number(gvMatch[1]);
    const m = Number(gvMatch[2]) + 1;
    const d = Number(gvMatch[3]);
    const formatted = formatYmd(y, m, d);
    if (formatted) return formatted;
  }

  // Fallback: try parsing any other ISO-ish input.
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return formatYmd(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth() + 1,
      parsed.getUTCDate()
    );
  }

  return raw;
}


export function estimateReadingTime(article: NewsArticle): string {
  const words = (article.content ?? [])
    .filter((b) => b.type === "paragraph" || b.type === "quote")
    .map((b: any) => b.text || "")
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

export function getSimilarArticles(
  all: NewsListItem[],
  current: NewsArticle,
  limit = 4
): NewsListItem[] {
  const curTags = new Set((current.tags ?? []).map((t) => t.toLowerCase()));

  return all
    .filter((a) => a.slug !== current.slug)
    .map((a) => {
      const tags = (a.tags ?? []).map((t) => t.toLowerCase());
      const score = tags.reduce((acc, t) => acc + (curTags.has(t) ? 1 : 0), 0);
      return { a, score };
    })
    .sort((x, y) =>
      y.score !== x.score ? y.score - x.score : x.a.publishedAt < y.a.publishedAt ? 1 : -1
    )
    .slice(0, limit)
    .map((x) => x.a);
}
