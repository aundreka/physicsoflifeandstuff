import {
  getPublicationAuthorsOrdered,
  getPublicationSlug,
  type CommunityTables,
} from "@/lib/communityContent";

export type PublicationListItem = {
  id: string;
  slug: string;
  title: string;
  publishing_date: string;
  field_of_study: string;
  institute: string;
  journal: string;
  publisher: string;
  abstract: string;
  year: string;
  authors: Array<{ id: string; name: string }>;
};

function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

function yearFromDate(value: string): string {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "";
  return new Date(t).getUTCFullYear().toString();
}

export function buildPublicationList(tables: CommunityTables): PublicationListItem[] {
  return tables.publications.map((pub) => {
    const authors = getPublicationAuthorsOrdered(tables, pub.id).map((a) => {
      if (a.member) {
        return {
          id: a.member.id,
          name: fullName(a.member.first_name, a.member.last_name),
        };
      }
      return {
        id: `external:${a.id || a.author_order}`,
        name: `${a.author_name || "Unknown"} (external)`,
      };
    });

    return {
      id: pub.id,
      slug: getPublicationSlug(pub),
      title: pub.title,
      publishing_date: pub.publishing_date,
      field_of_study: pub.field_of_study,
      institute: pub.institute,
      journal: pub.journal,
      publisher: pub.publisher,
      abstract: pub.abstract,
      year: yearFromDate(pub.publishing_date),
      authors,
    };
  });
}
