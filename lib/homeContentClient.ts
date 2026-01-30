// lib/homeContentClient.ts
import type { HomeContent } from "./homeContent";
import {
  fetchSheetRows,
  rowsToObjects,
  isApproved,
  toNumber,
  normalizeDriveImageUrl,
} from "./sheets";

function metaToRecord(metaRows: Record<string, string>[]) {
  const out: Record<string, string> = {};
  for (const r of metaRows) {
    const k = (r.key ?? "").trim();
    if (!k) continue;
    out[k] = r.value ?? "";
  }
  return out;
}

export async function getHomeAboutContentClient(): Promise<HomeContent["about"] | null> {
  const sheetId = process.env.NEXT_PUBLIC_SHEETS_ID ?? "";
  if (!sheetId) return null;

  const metaSheet = await fetchSheetRows(sheetId, "home");
  const metaRows = rowsToObjects(metaSheet);
  const meta = metaToRecord(metaRows);

  const aboutBulletsSheet = await fetchSheetRows(sheetId, "about_bullets");
  const bullets = rowsToObjects(aboutBulletsSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => r.text);

  const aboutStatsSheet = await fetchSheetRows(sheetId, "about_stats");
  const stats = rowsToObjects(aboutStatsSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ label: r.label, value: r.value }));

  const aboutImagesSheet = await fetchSheetRows(sheetId, "about_images");
  const images = rowsToObjects(aboutImagesSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ src: normalizeDriveImageUrl(r.src), alt: r.alt }));

  const aboutFocusSheet = await fetchSheetRows(sheetId, "about_focus");
  const focusBlocks = rowsToObjects(aboutFocusSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ title: r.title, body: r.body }));

  const aboutLinksSheet = await fetchSheetRows(sheetId, "about_links");
  const links = rowsToObjects(aboutLinksSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ label: r.label, href: r.href }));

  return {
    eyebrow: meta.about_eyebrow ?? "About the group",
    title: meta.about_title ?? "",
    subtitle: meta.about_subtitle ?? "",
    bullets,
    stats,
    images,
    focusBlocks,
    contact: {
      eyebrow: meta.contact_eyebrow ?? "Contact",
      emailLabel: meta.contact_emailLabel ?? "Email",
      email: meta.contact_email ?? "",
      locationLabel: meta.contact_locationLabel ?? "Location",
      location: meta.contact_location ?? "",
      addressLabel: meta.contact_addressLabel ?? "Address",
      address: meta.contact_address ?? "",
      links,
    },
  };
}

export async function getHomeNewsContentClient(): Promise<HomeContent["news"] | null> {
  const sheetId = process.env.NEXT_PUBLIC_SHEETS_ID ?? "";
  if (!sheetId) return null;

  const metaRows = rowsToObjects(await fetchSheetRows(sheetId, "home"));
  const meta = metaToRecord(metaRows);

  const galleryImages = rowsToObjects(await fetchSheetRows(sheetId, "home_gallery"))
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ src: normalizeDriveImageUrl(r.src), alt: r.alt }));

  return {
    eyebrow: meta.news_eyebrow ?? "News",
    title: meta.news_title ?? "",
    subtitle: meta.news_subtitle ?? "",
    viewAllLabel: meta.news_viewAllLabel ?? "View all",
    gallery: {
      eyebrow: meta.gallery_eyebrow ?? "Gallery",
      subtitle: meta.gallery_subtitle ?? "",
      images: galleryImages,
    },
  };
}
