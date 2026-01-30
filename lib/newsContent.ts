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
  | {
      type: "gallery";
      title?: string;
      images: Array<{ src: string; alt?: string; caption?: string; credit?: string }>;
    }
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
  images?: Array<{ src: string; alt?: string; caption?: string; credit?: string }>;
  content: NewsBlock[];
};

export type NewsListItem = Pick<
  NewsArticle,
  "slug" | "title" | "publishedAt" | "tags" | "hero" | "dek" | "author"
>;

const SHEET_ID = process.env.SHEETS_ID!;
const REVALIDATE_SECONDS = Number(process.env.SHEETS_REVALIDATE ?? 300);

function toCleanString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function warnMalformed(kind: string, context: string, detail: unknown) {
  if (typeof console === "undefined" || !console.warn) return;
  console.warn(`[news] malformed ${kind} in ${context}`, detail);
}

function normalizeListItems(raw: unknown, context: string): string[] {
  if (!Array.isArray(raw)) {
    if (raw) warnMalformed("list data", context, raw);
    return [];
  }
  let warned = false;
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number" && Number.isFinite(item)) return String(item);
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        return (
          toCleanString(obj.text) ||
          toCleanString(obj.label) ||
          toCleanString(obj.url) ||
          toCleanString(obj.cite) ||
          ""
        );
      }
      if (!warned) {
        warned = true;
        warnMalformed("list item", context, item);
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeLinkItems(
  raw: unknown,
  context: string
): Array<{ label: string; url: string }> {
  if (!Array.isArray(raw)) {
    if (raw) warnMalformed("link data", context, raw);
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const url = toCleanString(obj.url) || "";
      if (!url) {
        warnMalformed("link item", context, item);
        return null;
      }
      const label =
        toCleanString(obj.label) ||
        toCleanString(obj.text) ||
        toCleanString(obj.cite) ||
        url;
      return { label, url };
    })
    .filter((item): item is { label: string; url: string } => Boolean(item));
}

function normalizeGalleryItems(
  raw: unknown,
  context: string
): Array<{ src: string; alt?: string; caption?: string; credit?: string }> {
  if (!Array.isArray(raw)) {
    if (raw) warnMalformed("gallery data", context, raw);
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        warnMalformed("gallery item", context, item);
        return null;
      }
      const obj = item as Record<string, unknown>;
      const src = toCleanString(obj.src) || toCleanString(obj.url) || "";
      if (!src) {
        warnMalformed("gallery item", context, item);
        return null;
      }
      const alt = toCleanString(obj.alt) || toCleanString(obj.text) || undefined;
      const caption = toCleanString(obj.caption) || toCleanString(obj.text) || undefined;
      const credit = toCleanString(obj.credit) || toCleanString(obj.cite) || undefined;
      return {
        src: normalizeDriveImageUrl(src),
        alt,
        caption,
        credit,
      };
    })
    .filter(
      (item): item is { src: string; alt?: string; caption?: string; credit?: string } =>
        Boolean(item)
    );
}

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
      return {
        type,
        items: normalizeListItems(
          parseJsonMaybe<unknown>(b.items_json, []),
          `news_blocks.items_json slug=${slug} idx=${b.idx ?? ""}`
        ),
      };

    if (type === "links")
      return {
        type,
        title: b.title || undefined,
        items: normalizeLinkItems(
          parseJsonMaybe<unknown>(b.items_json, []),
          `news_blocks.items_json slug=${slug} idx=${b.idx ?? ""}`
        ),
      };

    if (type === "gallery")
      return {
        type,
        title: b.title || undefined,
        images: normalizeGalleryItems(
          parseJsonMaybe<unknown>(b.images_json, []),
          `news_blocks.images_json slug=${slug} idx=${b.idx ?? ""}`
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
    links: normalizeLinkItems(
      parseJsonMaybe<unknown>(row.links_json, []),
      `news_articles.links_json slug=${row.slug || slug}`
    ),
    images: normalizeGalleryItems(
      parseJsonMaybe<unknown>(row.images_json || row.images, []),
      `news_articles.images slug=${row.slug || slug}`
    ),
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
