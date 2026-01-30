// lib/newsContentClient.ts
import type { NewsArticle, NewsBlock, NewsListItem } from "./newsContent";
import {
  fetchSheetRows,
  rowsToObjects,
  isApproved,
  parseJsonMaybe,
  toNumber,
  normalizeDriveImageUrl,
} from "./sheets";

const SHEET_ID = process.env.NEXT_PUBLIC_SHEETS_ID ?? "";

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
  const out: Array<{ src: string; alt?: string; caption?: string; credit?: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      warnMalformed("gallery item", context, item);
      continue;
    }
    const obj = item as Record<string, unknown>;
    const src = toCleanString(obj.src) || toCleanString(obj.url) || "";
    if (!src) {
      warnMalformed("gallery item", context, item);
      continue;
    }
    const alt = toCleanString(obj.alt) || toCleanString(obj.text) || undefined;
    const caption = toCleanString(obj.caption) || toCleanString(obj.text) || undefined;
    const credit = toCleanString(obj.credit) || toCleanString(obj.cite) || undefined;
    out.push({
      src: normalizeDriveImageUrl(src),
      alt,
      caption,
      credit,
    });
  }
  return out;
}

export async function getAllNewsClient(): Promise<NewsListItem[]> {
  if (!SHEET_ID) return [];

  const rows = rowsToObjects(await fetchSheetRows(SHEET_ID, "news_articles"));

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

export async function getNewsBySlugClient(slug: string): Promise<NewsArticle | null> {
  if (!SHEET_ID) return null;

  const articles = rowsToObjects(await fetchSheetRows(SHEET_ID, "news_articles"));
  const row = articles.find((r) => r.slug === slug && isApproved(r.status));
  if (!row) return null;

  const blocks = rowsToObjects(await fetchSheetRows(SHEET_ID, "news_blocks"))
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
