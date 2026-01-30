// app/news/page.tsx
import NewsPageClient from "@/components/news/NewsPageClient";
import { Suspense } from "react";

export default function NewsPage() {
  return (
    <Suspense fallback={null}>
      <NewsPageClient />
    </Suspense>
  );
}
