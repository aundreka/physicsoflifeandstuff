// lib/communityContent.ts
// Content layer for the Community + Publications pages.
// Uses lib/sheets.ts (GViz fetch) and returns typed, joined, approved-only data.

import {
  fetchSheetRows,
  rowsToObjects,
  isApproved,
  toNumber,
  normalizeDriveImageUrl,
} from "@/lib/sheets";

export type MemberType = "admin" | "member" | "alumni";

export type Member = {
  id: string;
  last_name: string;
  first_name: string;
  image: string; // normalized
  specialization: string;
  course: string;
  graduation_ay: string;
  educational_attainment: string;
  member_since: string;
  associated_institutes: string;
  bionotes: string;
  email: string;
  type: MemberType | ""; // tolerate blanks
  status: string;
};

export type Publication = {
  id: string;
  title: string;
  publishing_date: string;
  description: string;
  field_of_study: string;
  abstract: string;
  institute: string;
  status: string;
};

export type PublicationLink = {
  id: string;
  publication_id: string;
  label: string;
  url: string;
  sort: string; // stored as string; convert via toNumber when sorting
  status: string;
};

export type PublicationAuthor = {
  id: string;
  publication_id: string;
  person_id: string;
  author_order: string; // stored as string
};

export type Presentation = {
  id: string;
  title: string;
  conference_name: string;
  presentation_date: string;
  description: string;
  status: string;
};

export type PresentationAuthor = {
  id: string;
  presentation_id: string;
  person_id: string;
};

export type Award = {
  id: string;
  award: string;
  image: string; // normalized
  awarded_by: string;
  awarded_date: string;
  status: string;
};

export type AwardRecipient = {
  id: string;
  award_id: string;
  person_id: string;
};

export type AwardPublication = {
  id: string;
  award_id: string;
  publication_id: string;
};

export type Certificate = {
  id: string;
  certificate: string;
  image: string; // normalized
  certified_by: string;
  certified_date: string;
  status: string;
};

export type CertificateHolder = {
  id: string;
  certificate_id: string;
  person_id: string;
};

export type CommunityTables = {
  members: Member[];
  publications: Publication[];
  publication_links: PublicationLink[];
  publication_authors: PublicationAuthor[];
  presentations: Presentation[];
  presentation_authors: PresentationAuthor[];
  awards: Award[];
  award_recipients: AwardRecipient[];
  award_publications: AwardPublication[];
  certificates: Certificate[];
  certificate_holders: CertificateHolder[];
};

export type MemberDetail = {
  member: Member;
  publications: Array<Publication & { authors: Member[] }>;
  awards: Award[];
  certificates: Certificate[];
};

export type PublicationDetail = {
  publication: Publication;
  authors: Array<{ member: Member; author_order: number }>;
  links: PublicationLink[];
};

function s(v: any): string {
  return (v == null ? "" : String(v)).trim();
}

function lower(v: any): string {
  return s(v).toLowerCase();
}

function normalizeKey(key: string): string {
  return lower(key)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeRow(o: Record<string, string>): Record<string, string> {
  var out: Record<string, string> = {};
  for (var k in o) {
    if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
    out[normalizeKey(k)] = o[k];
  }
  return out;
}

function getField(o: Record<string, string>, keys: string[]): string {
  var normalized = normalizeRow(o);
  for (var i = 0; i < keys.length; i++) {
    var v = normalized[normalizeKey(keys[i])];
    if (v != null && String(v).trim() !== "") return s(v);
  }
  return "";
}

function safeMemberType(v: string): MemberType | "" {
  var t = lower(v);
  if (t === "admin" || t === "member" || t === "alumni") return t as MemberType;
  return "";
}

function byLastFirst(a: Member, b: Member): number {
  var al = lower(a.last_name);
  var bl = lower(b.last_name);
  if (al < bl) return -1;
  if (al > bl) return 1;

  var af = lower(a.first_name);
  var bf = lower(b.first_name);
  if (af < bf) return -1;
  if (af > bf) return 1;
  return 0;
}

function parseDateKey(v: string): number {
  // Accepts "YYYY-MM-DD" or any Date.parse-able string.
  // Returns numeric key for sorting desc; invalid -> 0.
  var t = Date.parse(v);
  return isNaN(t) ? 0 : t;
}

async function fetchTabObjects(
  sheetId: string,
  tabName: string,
  revalidateSeconds: number
): Promise<Record<string, string>[]> {
  const rows = await fetchSheetRows(sheetId, tabName, revalidateSeconds);
  if (tabName === "members") {
  }
  return rowsToObjects(rows);
}

function mapMember(o: Record<string, string>): Member {
  return {
    id: getField(o, ["id"]),
    last_name: getField(o, ["last_name", "lastname", "last name", "surname"]),
    first_name: getField(o, ["first_name", "firstname", "first name", "given name"]),
    image: normalizeDriveImageUrl(getField(o, ["image", "photo", "avatar"])),
    specialization: getField(o, ["specialization", "specialisation"]),
    course: getField(o, ["course"]),
    graduation_ay: getField(o, ["graduation_ay", "graduation ay", "graduation_year"]),
    educational_attainment: getField(o, ["educational_attainment", "educational attainment", "education"]),
    member_since: getField(o, ["member_since", "member since", "since"]),
    associated_institutes: getField(o, ["associated_institutes", "associated institutes", "institutes"]),
    bionotes: getField(o, ["bionotes", "bio", "biography"]),
    email: getField(o, ["email", "e-mail"]),
    type: safeMemberType(getField(o, ["type"])),
    status: getField(o, ["status"]),
  };
}

function mapPublication(o: Record<string, string>): Publication {
  return {
    id: s(o.id),
    title: s(o.title),
    publishing_date: s(o.publishing_date),
    description: s(o.description),
    field_of_study: s(o.field_of_study),
    abstract: s(o.abstract),
    institute: s(o.institute),
    status: s(o.status),
  };
}

function mapPublicationLink(o: Record<string, string>): PublicationLink {
  return {
    id: s(o.id),
    publication_id: s(o.publication_id),
    label: s(o.label),
    url: s(o.url),
    sort: s(o.sort),
    status: s(o.status),
  };
}

function mapPublicationAuthor(o: Record<string, string>): PublicationAuthor {
  return {
    id: s(o.id),
    publication_id: s(o.publication_id),
    person_id: s(o.person_id),
    author_order: s(o.author_order),
  };
}

function mapPresentation(o: Record<string, string>): Presentation {
  return {
    id: s(o.id),
    title: s(o.title),
    conference_name: s(o.conference_name),
    presentation_date: s(o.presentation_date),
    description: s(o.description),
    status: s(o.status),
  };
}

function mapPresentationAuthor(o: Record<string, string>): PresentationAuthor {
  return {
    id: s(o.id),
    presentation_id: s(o.presentation_id),
    person_id: s(o.person_id),
  };
}

function mapAward(o: Record<string, string>): Award {
  return {
    id: s(o.id),
    award: s(o.award),
    image: normalizeDriveImageUrl(s(o.image)),
    awarded_by: s(o.awarded_by),
    awarded_date: s(o.awarded_date),
    status: s(o.status),
  };
}

function mapAwardRecipient(o: Record<string, string>): AwardRecipient {
  return {
    id: s(o.id),
    award_id: s(o.award_id),
    person_id: s(o.person_id),
  };
}

function mapAwardPublication(o: Record<string, string>): AwardPublication {
  return {
    id: s(o.id),
    award_id: s(o.award_id),
    publication_id: s(o.publication_id),
  };
}

function mapCertificate(o: Record<string, string>): Certificate {
  return {
    id: s(o.id),
    certificate: s(o.certificate),
    image: normalizeDriveImageUrl(s(o.image)),
    certified_by: s(o.certified_by),
    certified_date: s(o.certified_date),
    status: s(o.status),
  };
}

function mapCertificateHolder(o: Record<string, string>): CertificateHolder {
  return {
    id: s(o.id),
    certificate_id: s(o.certificate_id),
    person_id: s(o.person_id),
  };
}

/**
 * Fetch all tables used by the Community pages.
 * Filters approved-only for tables with "status" columns:
 * - members, publications, publication_links, presentations, awards, certificates
 * Relationship tables do not have status (per your schema) and are returned as-is.
 */
export async function getCommunityTables(opts: {
  sheetId: string;
  revalidateSeconds?: number;
}): Promise<CommunityTables> {
  const sheetId = opts.sheetId;
  const revalidateSeconds = typeof opts.revalidateSeconds === "number" ? opts.revalidateSeconds : 300;

  const tabs = [
    "members",
    "publications",
    "publication_links",
    "publication_authors",
    "presentations",
    "presentation_authors",
    "awards",
    "award_recipients",
    "award_publications",
    "certificates",
    "certificate_holders",
  ];

  const results = await Promise.all(
    tabs.map(function (t) {
      return fetchTabObjects(sheetId, t, revalidateSeconds);
    })
  );

  if (results[0] && results[0].length) {
  }

  // Build in same order
  const membersRaw = results[0].map(mapMember);
  const members = membersRaw.filter(function (m) { return isApproved(m.status); });
  const publications = results[1].map(mapPublication).filter(function (p) { return isApproved(p.status); });
  const publication_links = results[2].map(mapPublicationLink).filter(function (l) { return isApproved(l.status); });
  const publication_authors = results[3].map(mapPublicationAuthor);
  const presentations = results[4].map(mapPresentation).filter(function (p) { return isApproved(p.status); });
  const presentation_authors = results[5].map(mapPresentationAuthor);
  const awards = results[6].map(mapAward).filter(function (a) { return isApproved(a.status); });
  const award_recipients = results[7].map(mapAwardRecipient);
  const award_publications = results[8].map(mapAwardPublication);
  const certificates = results[9].map(mapCertificate).filter(function (c) { return isApproved(c.status); });
  const certificate_holders = results[10].map(mapCertificateHolder);

  if (members.length === 0) {
  }

  // sort members for consistent display
  members.sort(byLastFirst);

  return {
    members: members,
    publications: publications,
    publication_links: publication_links,
    publication_authors: publication_authors,
    presentations: presentations,
    presentation_authors: presentation_authors,
    awards: awards,
    award_recipients: award_recipients,
    award_publications: award_publications,
    certificates: certificates,
    certificate_holders: certificate_holders,
  };
}

export function splitMembersByType(members: Member[]): {
  admins: Member[];
  members: Member[];
  alumni: Member[];
} {
  var admins: Member[] = [];
  var mems: Member[] = [];
  var alumni: Member[] = [];

  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    if (m.type === "admin") admins.push(m);
    else if (m.type === "alumni") alumni.push(m);
    else mems.push(m);
  }

  admins.sort(byLastFirst);
  mems.sort(byLastFirst);
  alumni.sort(byLastFirst);

  return { admins: admins, members: mems, alumni: alumni };
}

export function getMemberById(tables: CommunityTables, id: string): Member | null {
  var target = s(id);
  for (var i = 0; i < tables.members.length; i++) {
    if (tables.members[i].id === target) return tables.members[i];
  }
  return null;
}

export function getPublicationById(tables: CommunityTables, id: string): Publication | null {
  var target = s(id);
  for (var i = 0; i < tables.publications.length; i++) {
    if (tables.publications[i].id === target) return tables.publications[i];
  }
  return null;
}

export function getPublicationLinks(tables: CommunityTables, publicationId: string): PublicationLink[] {
  var pid = s(publicationId);
  var out: PublicationLink[] = [];
  for (var i = 0; i < tables.publication_links.length; i++) {
    var l = tables.publication_links[i];
    if (l.publication_id === pid) out.push(l);
  }
  out.sort(function (a, b) {
    return toNumber(a.sort, 0) - toNumber(b.sort, 0);
  });
  return out;
}

export function getPublicationAuthorsOrdered(
  tables: CommunityTables,
  publicationId: string
): Array<{ member: Member; author_order: number }> {
  var pid = s(publicationId);

  // Build member map
  var memberById: Record<string, Member> = {};
  for (var i = 0; i < tables.members.length; i++) {
    memberById[tables.members[i].id] = tables.members[i];
  }

  var rels: PublicationAuthor[] = [];
  for (var j = 0; j < tables.publication_authors.length; j++) {
    var r = tables.publication_authors[j];
    if (r.publication_id === pid) rels.push(r);
  }

  rels.sort(function (a, b) {
    return toNumber(a.author_order, 0) - toNumber(b.author_order, 0);
  });

  var out: Array<{ member: Member; author_order: number }> = [];
  for (var k = 0; k < rels.length; k++) {
    var rel = rels[k];
    var m = memberById[rel.person_id];
    if (m) out.push({ member: m, author_order: toNumber(rel.author_order, 0) });
  }
  return out;
}

export function getMemberPublications(
  tables: CommunityTables,
  memberId: string
): Publication[] {
  var mid = s(memberId);
  var pubIds: Record<string, boolean> = {};

  for (var i = 0; i < tables.publication_authors.length; i++) {
    var pa = tables.publication_authors[i];
    if (pa.person_id === mid && pa.publication_id) pubIds[pa.publication_id] = true;
  }

  var out: Publication[] = [];
  for (var j = 0; j < tables.publications.length; j++) {
    var p = tables.publications[j];
    if (pubIds[p.id]) out.push(p);
  }

  out.sort(function (a, b) {
    return parseDateKey(b.publishing_date) - parseDateKey(a.publishing_date);
  });

  return out;
}

export function getMemberAwards(tables: CommunityTables, memberId: string): Award[] {
  var mid = s(memberId);
  var awardIds: Record<string, boolean> = {};

  for (var i = 0; i < tables.award_recipients.length; i++) {
    var ar = tables.award_recipients[i];
    if (ar.person_id === mid && ar.award_id) awardIds[ar.award_id] = true;
  }

  var out: Award[] = [];
  for (var j = 0; j < tables.awards.length; j++) {
    var a = tables.awards[j];
    if (awardIds[a.id]) out.push(a);
  }

  out.sort(function (a, b) {
    return parseDateKey(b.awarded_date) - parseDateKey(a.awarded_date);
  });

  return out;
}

export function getMemberCertificates(tables: CommunityTables, memberId: string): Certificate[] {
  var mid = s(memberId);
  var certIds: Record<string, boolean> = {};

  for (var i = 0; i < tables.certificate_holders.length; i++) {
    var ch = tables.certificate_holders[i];
    if (ch.person_id === mid && ch.certificate_id) certIds[ch.certificate_id] = true;
  }

  var out: Certificate[] = [];
  for (var j = 0; j < tables.certificates.length; j++) {
    var c = tables.certificates[j];
    if (certIds[c.id]) out.push(c);
  }

  out.sort(function (a, b) {
    return parseDateKey(b.certified_date) - parseDateKey(a.certified_date);
  });

  return out;
}

/**
 * Convenience: fully joined member detail.
 */
export function buildMemberDetail(tables: CommunityTables, memberId: string): MemberDetail | null {
  var member = getMemberById(tables, memberId);
  if (!member) return null;

  var pubs = getMemberPublications(tables, memberId);
  var pubsWithAuthors: Array<Publication & { authors: Member[] }> = [];

  for (var i = 0; i < pubs.length; i++) {
    var p = pubs[i];
    var authorPairs = getPublicationAuthorsOrdered(tables, p.id);
    var authorMembers: Member[] = [];
    for (var j = 0; j < authorPairs.length; j++) authorMembers.push(authorPairs[j].member);
    pubsWithAuthors.push(Object.assign({}, p, { authors: authorMembers }));
  }

  return {
    member: member,
    publications: pubsWithAuthors,
    awards: getMemberAwards(tables, memberId),
    certificates: getMemberCertificates(tables, memberId),
  };
}

/**
 * Convenience: fully joined publication detail.
 */
export function buildPublicationDetail(tables: CommunityTables, publicationId: string): PublicationDetail | null {
  var publication = getPublicationById(tables, publicationId);
  if (!publication) return null;

  return {
    publication: publication,
    authors: getPublicationAuthorsOrdered(tables, publicationId),
    links: getPublicationLinks(tables, publicationId),
  };
}
