// lib/homeContent.ts
import fs from "fs";
import path from "path";

export type HomeContent = {
  news: {
    eyebrow: string;
    title: string;
    subtitle: string;
    viewAllLabel: string;
    items: Array<{
      title: string;
      slug: string;          // ✅ add this
      date: string;
      tag: string;
      excerpt: string;
      image: string;
      href?: string;         // ✅ optional (legacy, can delete later)
    }>;
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

export function getHomeContent(): HomeContent {
  const filePath = path.join(process.cwd(), "content", "home.json");
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as HomeContent;
}
