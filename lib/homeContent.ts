// lib/homeContent.ts
import {
  fetchSheetRows,
  rowsToObjects,
  isApproved,
  toNumber,
  normalizeDriveImageUrl,
} from "./sheets";

export type HomeContent = {
  news: {
    eyebrow: string;
    title: string;
    subtitle: string;
    viewAllLabel: string;
    gallery: {
      eyebrow: string;
      subtitle: string;
      images: Array<{ src: string; alt: string }>;
    };
  };

  about: {
    eyebrow: string;
    title: string;
    subtitle: string;
    bullets: string[];
    stats: Array<{ label: string; value: string }>;
    images: Array<{ src: string; alt: string }>;
    focusBlocks: Array<{ title: string; body: string }>;
    contact: {
      eyebrow: string;
      emailLabel: string;
      email: string;
      locationLabel: string;
      location: string;
      addressLabel: string;
      address: string;
      links: Array<{ label: string; href: string }>;
    };
  };
};

const SHEET_ID = process.env.SHEETS_ID!;
const REVALIDATE_SECONDS = Number(process.env.SHEETS_REVALIDATE ?? 300);

function metaToRecord(metaRows: Record<string, string>[]) {
  const out: Record<string, string> = {};
  for (const r of metaRows) {
    const k = (r.key ?? "").trim();
    if (!k) continue;
    out[k] = r.value ?? "";
  }
  return out;
}

export async function getHomeContent(): Promise<HomeContent> {
  if (!SHEET_ID) throw new Error("Missing env var SHEETS_ID");

  const metaSheet = await fetchSheetRows(SHEET_ID, "home", REVALIDATE_SECONDS);
  const metaRows = rowsToObjects(metaSheet);
  const meta = metaToRecord(metaRows);

  const homeGallerySheet = await fetchSheetRows(
    SHEET_ID,
    "home_gallery",
    REVALIDATE_SECONDS
  );
  const galleryImages = rowsToObjects(homeGallerySheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ src: normalizeDriveImageUrl(r.src), alt: r.alt }));

  const aboutBulletsSheet = await fetchSheetRows(
    SHEET_ID,
    "about_bullets",
    REVALIDATE_SECONDS
  );
  const bullets = rowsToObjects(aboutBulletsSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => r.text);

  const aboutStatsSheet = await fetchSheetRows(
    SHEET_ID,
    "about_stats",
    REVALIDATE_SECONDS
  );
  const stats = rowsToObjects(aboutStatsSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ label: r.label, value: r.value }));

  const aboutImagesSheet = await fetchSheetRows(
    SHEET_ID,
    "about_images",
    REVALIDATE_SECONDS
  );
  const aboutImages = rowsToObjects(aboutImagesSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ src: normalizeDriveImageUrl(r.src), alt: r.alt }));

  const aboutFocusSheet = await fetchSheetRows(
    SHEET_ID,
    "about_focus",
    REVALIDATE_SECONDS
  );
  const focusBlocks = rowsToObjects(aboutFocusSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ title: r.title, body: r.body }));

  const aboutLinksSheet = await fetchSheetRows(
    SHEET_ID,
    "about_links",
    REVALIDATE_SECONDS
  );
  const links = rowsToObjects(aboutLinksSheet)
    .filter((r) => isApproved(r.status))
    .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
    .map((r) => ({ label: r.label, href: r.href }));

  return {
    news: {
      eyebrow: meta.news_eyebrow ?? "News",
      title: meta.news_title ?? "",
      subtitle: meta.news_subtitle ?? "",
      viewAllLabel: meta.news_viewAllLabel ?? "View all",
      gallery: {
        eyebrow: meta.gallery_eyebrow ?? "Gallery",
        subtitle: meta.gallery_subtitle ?? "",
        images: galleryImages,
      },
    },
    about: {
      eyebrow: meta.about_eyebrow ?? "About the group",
      title: meta.about_title ?? "",
      subtitle: meta.about_subtitle ?? "",
      bullets,
      stats,
      images: aboutImages,
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
    },
  };
}
