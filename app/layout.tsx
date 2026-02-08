// layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RedirectHandler from "@/components/RedirectHandler";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://plsust.org";
const siteName = "Physics of Life and Stuff";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: `${siteName}`,
    template: `%s | ${siteName}`,
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
    url: siteUrl,
    siteName,
    title: siteName,
    description:
      "Announcements, projects, resources, and opportunities for student research at UST.",
    images: [
      {
        url: "/og.png", 
        width: 1200,
        height: 630,
        alt: `${siteName} preview image`,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description:
      "Announcements, projects, resources, and opportunities for student research at UST.",
    images: ["/og.png"],
  },

  icons: {
    icon: "/favicon.ico",

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
