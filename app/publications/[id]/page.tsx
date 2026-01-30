import PublicationDetailClient from "@/components/publications/PublicationDetailClient";
import { getCommunityTables } from "@/lib/communityContent";

const SHEET_ID = process.env.NEXT_PUBLIC_SHEETS_ID ?? process.env.SHEETS_ID ?? "";

export const dynamicParams = false;

export async function generateStaticParams() {
  if (!SHEET_ID) {
    throw new Error("Missing SHEETS_ID or NEXT_PUBLIC_SHEETS_ID for static export.");
  }
  const tables = await getCommunityTables({ sheetId: SHEET_ID, revalidateSeconds: 0 });
  return tables.publications
    .map((publication) => publication.id)
    .filter(Boolean)
    .map((id) => ({ id }));
}

export default function PublicationDetailPage() {
  return <PublicationDetailClient />;
}
