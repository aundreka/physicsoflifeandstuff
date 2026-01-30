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
