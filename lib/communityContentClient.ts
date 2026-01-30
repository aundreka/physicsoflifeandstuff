// lib/communityContentClient.ts
import type { CommunityTables } from "@/lib/communityContent";
import { getCommunityTables } from "@/lib/communityContent";

const EMPTY_TABLES: CommunityTables = {
  members: [],
  publications: [],
  publication_links: [],
  publication_authors: [],
  presentations: [],
  presentation_authors: [],
  awards: [],
  award_recipients: [],
  award_publications: [],
  certificates: [],
  certificate_holders: [],
};

export async function getCommunityTablesClient(): Promise<CommunityTables> {
  const sheetId = process.env.NEXT_PUBLIC_SHEETS_ID ?? "";
  if (!sheetId) return EMPTY_TABLES;
  return getCommunityTables({ sheetId, revalidateSeconds: 0 });
}
