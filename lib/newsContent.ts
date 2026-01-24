// lib/newsContent.ts
import fs from "fs";
import path from "path";

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

const NEWS_DIR = path.join(process.cwd(), "content", "news");

function readJson(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function getAllNews(): NewsListItem[] {
  if (!fs.existsSync(NEWS_DIR)) return [];

  const files = fs
    .readdirSync(NEWS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(NEWS_DIR, f));

  const items = files.map((fp) => readJson(fp) as NewsArticle);
  items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return items.map((a) => ({
    slug: a.slug,
    title: a.title,
    dek: a.dek,
    author: a.author,
    publishedAt: a.publishedAt,
    tags: a.tags ?? [],
    hero: a.hero ?? {},
  }));
}

export function getNewsBySlug(slug: string): NewsArticle | null {
  const fp = path.join(NEWS_DIR, `${slug}.json`);
  if (!fs.existsSync(fp)) return null;
  return readJson(fp) as NewsArticle;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function estimateReadingTime(article: NewsArticle): string {
  const words = article.content
    .filter((b) => b.type === "paragraph" || b.type === "quote")
    .map((b: any) => b.text || "")
    .join(" ")
    .trim()
    .split(/\s+/).filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

export function getSimilarArticles(all: NewsListItem[], current: NewsArticle, limit = 4): NewsListItem[] {
  const curTags = new Set((current.tags ?? []).map((t) => t.toLowerCase()));

  const scored = all
    .filter((a) => a.slug !== current.slug)
    .map((a) => {
      const tags = (a.tags ?? []).map((t) => t.toLowerCase());
      const score = tags.reduce((acc, t) => acc + (curTags.has(t) ? 1 : 0), 0);
      return { a, score };
    })
    .sort((x, y) => (y.score !== x.score ? y.score - x.score : y.a.publishedAt < x.a.publishedAt ? -1 : 1))
    .slice(0, limit)
    .map((x) => x.a);

  return scored;
}
