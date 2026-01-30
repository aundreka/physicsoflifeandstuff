// lib/sheets.ts
// Fetch Google Sheets tabs via GViz JSON (no API key) + caching via Next.js revalidate.

type GViz = {
  table: {
    cols: Array<{ label: string }>;
    rows: Array<{ c: Array<{ v?: any } | null> }>;
  };
};

const CLIENT_CACHE_TTL_MS = Number(
  process.env.NEXT_PUBLIC_SHEETS_CACHE_TTL_MS ?? 300000
);

function readClientCache(key: string, ttlMs: number): string[][] | null {
  if (ttlMs <= 0) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: string[][] };
    if (!parsed || !Array.isArray(parsed.data) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeClientCache(key: string, data: string[][], ttlMs: number) {
  if (ttlMs <= 0) return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // ignore cache write failures
  }
}

function extractGVizJson(text: string): GViz {
  // GViz returns: google.visualization.Query.setResponse({...});
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Unexpected GViz response");
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Returns rows as: [headerRow, ...dataRows]
 * Each cell is stringified.
 */
export async function fetchSheetRows(
  sheetId: string,
  tabName: string,
  revalidateSeconds = 5
): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    tabName
  )}`;
  if (tabName === "members") {
  }

  const isBrowser = typeof window !== "undefined";
  if (isBrowser) {
    const cacheKey = `sheets_cache:${sheetId}:${tabName}`;
    const cached = readClientCache(cacheKey, CLIENT_CACHE_TTL_MS);
    if (cached) return cached;
  }

  const init: RequestInit = isBrowser
    ? { cache: "no-store" }
    : { next: { revalidate: revalidateSeconds } };
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Failed to fetch sheet "${tabName}" (${res.status})`);

  const text = await res.text();
  const json = extractGVizJson(text);

  const header = json.table.cols.map((c) => (c.label ?? "").toString().trim());
  const rows = json.table.rows.map((r) =>
    (r.c ?? []).map((cell) => (cell?.v ?? "").toString())
  );

  const data = [header, ...rows];
  if (isBrowser) {
    const cacheKey = `sheets_cache:${sheetId}:${tabName}`;
    writeClientCache(cacheKey, data, CLIENT_CACHE_TTL_MS);
  }
  return data;
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (!rows.length) return [];

  // Find the first plausible header row (some sheets have blank row 1).
  let headerIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i] || [];
    const trimmed = row.map((h) => (h ?? "").toString().trim());
    const nonEmpty = trimmed.filter(Boolean).length;
    const hasId = trimmed.some((h) => h.toLowerCase() === "id");
    if (nonEmpty >= 2 && (hasId || nonEmpty >= 3)) {
      headerIndex = i;
      break;
    }
  }

  const headerRaw = rows[headerIndex] || [];
  const data = rows.slice(headerIndex + 1);

  const header = headerRaw.map((h) => (h ?? "").toString().trim());

  // If GViz headers are blank, assume meta-table style: [key, value]
  const effectiveHeader =
    header.length >= 2 && header[0] && header[1]
      ? header
      : ["key", "value", ...header.slice(2)];

  return data
    .filter((r) => r.some((x) => (x ?? "").toString().trim() !== ""))
    .map((r) =>
      Object.fromEntries(
        effectiveHeader.map((h, i) => [h, (r[i] ?? "").toString()])
      )
    );
}

export function toNumber(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function isApproved(status?: string): boolean {
  return (status ?? "").toLowerCase() === "approved";
}

export function parseJsonMaybe<T>(s: string, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function extractDriveFileId(src: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/{id}/view
    /[?&]id=([a-zA-Z0-9_-]+)/, // ?id={id}
    /\/d\/([a-zA-Z0-9_-]+)/, // googleusercontent.com/d/{id}
  ];

  for (const p of patterns) {
    const m = src.match(p);
    if (m?.[1]) return m[1];
  }

  return null;
}

export function normalizeDriveImageUrl(src: string): string {
  const trimmed = (src ?? "").toString().trim();
  if (!trimmed) return "";

  const fileId = extractDriveFileId(trimmed);
  if (!fileId) return trimmed;

  // Use googleusercontent direct image host to avoid Drive HTML/403 responses in <img>.
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}
