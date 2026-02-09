// layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RedirectHandler from "@/components/RedirectHandler";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },

  description:
    "Official website of the Physics of Life and Stuff UST Research Club. Announcements, projects, resources, and opportunities for our organization's research.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Announcements, projects, resources, and opportunities for student research at UST.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} preview image`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Announcements, projects, resources, and opportunities for student research at UST.",
    images: [DEFAULT_OG_IMAGE],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#070C1B",
        }}
      >
        <Suspense fallback={null}>
          <RedirectHandler />
        </Suspense>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
