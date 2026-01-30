//layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RedirectHandler from "@/components/RedirectHandler";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Research Club",
  description: "Research club website",
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
