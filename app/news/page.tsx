// app/news/page.tsx
import { getAllNews, getNewsBySlug, getSimilarArticles } from "@/lib/newsContent";
import NewsIndex from "@/components/news/NewsIndex";
import NewsArticleView from "@/components/news/NewsArticleView";

export const runtime = "nodejs"; // ensures fs works

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams; // ✅ unwrap Promise
  const all = getAllNews();

  if (!slug) {
    return (
      <main className="newsPageWhite">
        <NewsIndex items={all} />
      </main>
    );
  }

  const article = getNewsBySlug(slug);

  if (!article) {
    return (
      <main className="newsPageWhite">
        <NewsIndex items={all} notFoundSlug={slug} />
      </main>
    );
  }

  const similar = getSimilarArticles(all, article, 4);
  return <NewsArticleView article={article} similar={similar} />;
}
