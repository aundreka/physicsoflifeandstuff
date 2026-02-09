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

export type MemberType = "adviser" | "member" | "alumni";

export type Member = {
  id: string;
  title: string;
  last_name: string;
  first_name: string;
  image: string; // normalized
  specialization: string;
  occupation: string;
  course: string;
  graduation_ay: string;
  educational_attainment: string;
  member_since: string;
  associated_institutes: string;
  bionotes: string;
  email: string;
  linkedin: string;
  type: MemberType | ""; // tolerate blanks
  status: string;
  show_specialization: boolean;
  show_occupation: boolean;
  show_course: boolean;
  show_graduation_ay: boolean;
  show_educational_attainment: boolean;
  show_member_since: boolean;
  show_associated_institutes: boolean;
  show_bionotes: boolean;
  show_email: boolean;
  show_linkedin: boolean;
};

export type Publication = {
  id: string;
  title: string;
  publishing_date: string;
  field_of_study: string;
  journal: string;
  publisher: string;
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
  author_name: string;
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
  authors: Array<{
    id: string;
    member?: Member;
    author_name?: string;
    author_order: number;
  }>;
  links: PublicationLink[];
};

function s(v: unknown): string {
  return (v == null ? "" : String(v)).trim();
}

function lower(v: unknown): string {
  return s(v).toLowerCase();
}

function slugify(value: string): string {
  const t = lower(value);
  if (!t) return "";
  const normalized = t.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug;
}

function normalizeKey(key: string): string {
  return lower(key)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeRow(o: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in o) {
    if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
    out[normalizeKey(k)] = o[k];
  }
  return out;
}

function getField(o: Record<string, string>, keys: string[]): string {
  const normalized = normalizeRow(o);
  for (let i = 0; i < keys.length; i++) {
    const v = normalized[normalizeKey(keys[i])];
    if (v != null && String(v).trim() !== "") return s(v);
  }
  return "";
}

function safeMemberType(v: string): MemberType | "" {
  const t = lower(v);
  if (t === "adviser") return "adviser";
  if (t === "admin") return "adviser";
  if (t === "member" || t === "alumni") return t as MemberType;
  return "";
}

function showFlag(v: string): boolean {
  const t = lower(v);
  if (!t) return true;
  if (t === "false" || t === "0" || t === "no" || t === "hide") return false;
  return true;
}

function byLastFirst(a: Member, b: Member): number {
  const al = lower(a.last_name);
  const bl = lower(b.last_name);
  if (al < bl) return -1;
  if (al > bl) return 1;

  const af = lower(a.first_name);
  const bf = lower(b.first_name);
  if (af < bf) return -1;
  if (af > bf) return 1;
  return 0;
}

function parseDateKey(v: string): number {
  // Accepts "YYYY-MM-DD" or any Date.parse-able string.
  // Returns numeric key for sorting desc; invalid -> 0.
  const t = Date.parse(v);
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
    title: getField(o, ["title", "honorific", "prefix"]),
    last_name: getField(o, ["last_name", "lastname", "last name", "surname"]),
    first_name: getField(o, ["first_name", "firstname", "first name", "given name"]),
    image: normalizeDriveImageUrl(getField(o, ["image", "photo", "avatar"])),
    specialization: getField(o, ["specialization", "specialisation"]),
    occupation: getField(o, ["occupation"]),
    course: getField(o, ["course"]),
    graduation_ay: getField(o, ["graduation_ay", "graduation ay", "graduation_year"]),
    educational_attainment: getField(o, ["educational_attainment", "educational attainment", "education"]),
    member_since: getField(o, ["member_since", "member since", "since"]),
    associated_institutes: getField(o, ["associated_institutes", "associated institutes", "institutes"]),
    bionotes: getField(o, ["bionotes", "bio", "biography"]),
    email: getField(o, ["email", "e-mail"]),
    linkedin: getField(o, ["linkedin", "linked_in", "linkedin_url", "linked in", "linkedin url"]),
    type: safeMemberType(getField(o, ["type"])),
    status: getField(o, ["status"]),
    show_specialization: showFlag(getField(o, ["show_specialization"])),
    show_occupation: showFlag(getField(o, ["show_occupation"])),
    show_course: showFlag(getField(o, ["show_course"])),
    show_graduation_ay: showFlag(getField(o, ["show_graduation_ay"])),
    show_educational_attainment: showFlag(getField(o, ["show_educational_attainment"])),
    show_member_since: showFlag(getField(o, ["show_member_since"])),
    show_associated_institutes: showFlag(getField(o, ["show_associated_institutes"])),
    show_bionotes: showFlag(getField(o, ["show_bionotes"])),
    show_email: showFlag(getField(o, ["show_email"])),
    show_linkedin: showFlag(getField(o, ["show_linkedin"])),
  };
}

function mapPublication(o: Record<string, string>): Publication {
  return {
    id: getField(o, ["id"]),
    title: getField(o, ["title"]),
    publishing_date: getField(o, ["publishing_date", "publishing date", "date"]),
    field_of_study: getField(o, ["field_of_study", "field of study", "field"]),
    journal: getField(o, ["journal"]),
    publisher: getField(o, ["publisher"]),
    abstract: getField(o, ["abstract"]),
    institute: getField(o, ["institute", "institution"]),
    status: getField(o, ["status"]),
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
    author_name: s(o.author_name),
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

  const results: Array<Record<string, string>[]> = [];
  for (let i = 0; i < tabs.length; i++) {
    results.push(await fetchTabObjects(sheetId, tabs[i], revalidateSeconds));
  }

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
  const admins: Member[] = [];
  const mems: Member[] = [];
  const alumni: Member[] = [];

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (m.type === "adviser") admins.push(m);
    else if (m.type === "alumni") alumni.push(m);
    else mems.push(m);
  }

  admins.sort(byLastFirst);
  mems.sort(byLastFirst);
  alumni.sort(byLastFirst);

  return { admins: admins, members: mems, alumni: alumni };
}

export function getMemberById(tables: CommunityTables, id: string): Member | null {
  const target = s(id);
  for (let i = 0; i < tables.members.length; i++) {
    if (tables.members[i].id === target) return tables.members[i];
  }
  return null;
}

export function getMemberSlug(member: Member): string {
  const base = [member.last_name, member.first_name].filter(Boolean).join(" ");
  return slugify(base) || lower(member.id);
}

export function getMemberBySlugOrId(tables: CommunityTables, slugOrId: string): Member | null {
  const target = s(slugOrId);
  if (!target) return null;
  const lowerTarget = lower(target);
  for (let i = 0; i < tables.members.length; i++) {
    const m = tables.members[i];
    if (m.id === target) return m;
    if (getMemberSlug(m) === lowerTarget) return m;
  }
  return null;
}

export function getPublicationById(tables: CommunityTables, id: string): Publication | null {
  const target = s(id);
  for (let i = 0; i < tables.publications.length; i++) {
    if (tables.publications[i].id === target) return tables.publications[i];
  }
  return null;
}

export function getPublicationSlug(publication: Publication): string {
  return slugify(publication.title) || lower(publication.id);
}

export function getPublicationBySlugOrId(tables: CommunityTables, slugOrId: string): Publication | null {
  const target = s(slugOrId);
  if (!target) return null;
  const lowerTarget = lower(target);
  for (let i = 0; i < tables.publications.length; i++) {
    const p = tables.publications[i];
    if (p.id === target) return p;
    if (getPublicationSlug(p) === lowerTarget) return p;
  }
  return null;
}

export function getPublicationLinks(tables: CommunityTables, publicationId: string): PublicationLink[] {
  const pid = s(publicationId);
  const out: PublicationLink[] = [];
  for (let i = 0; i < tables.publication_links.length; i++) {
    const l = tables.publication_links[i];
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
): Array<{ id: string; member?: Member; author_name?: string; author_order: number }> {
  const pid = s(publicationId);

  // Build member map
  const memberById: Record<string, Member> = {};
  for (let i = 0; i < tables.members.length; i++) {
    memberById[tables.members[i].id] = tables.members[i];
  }

  const rels: PublicationAuthor[] = [];
  for (let j = 0; j < tables.publication_authors.length; j++) {
    const r = tables.publication_authors[j];
    if (r.publication_id === pid) rels.push(r);
  }

  rels.sort(function (a, b) {
    return toNumber(a.author_order, 0) - toNumber(b.author_order, 0);
  });

  const out: Array<{ id: string; member?: Member; author_name?: string; author_order: number }> = [];
  for (let k = 0; k < rels.length; k++) {
    const rel = rels[k];
    const m = memberById[rel.person_id];
    const name = s(rel.author_name);
    if (m) {
      out.push({ id: rel.id, member: m, author_order: toNumber(rel.author_order, 0) });
    } else if (name) {
      out.push({ id: rel.id, author_name: name, author_order: toNumber(rel.author_order, 0) });
    }
  }
  return out;
}

export function getMemberPublications(
  tables: CommunityTables,
  memberId: string
): Publication[] {
  const mid = s(memberId);
  const pubIds: Record<string, boolean> = {};

  for (let i = 0; i < tables.publication_authors.length; i++) {
    const pa = tables.publication_authors[i];
    if (pa.person_id === mid && pa.publication_id) pubIds[pa.publication_id] = true;
  }

  const out: Publication[] = [];
  for (let j = 0; j < tables.publications.length; j++) {
    const p = tables.publications[j];
    if (pubIds[p.id]) out.push(p);
  }

  out.sort(function (a, b) {
    return parseDateKey(b.publishing_date) - parseDateKey(a.publishing_date);
  });

  return out;
}

export function getMemberAwards(tables: CommunityTables, memberId: string): Award[] {
  const mid = s(memberId);
  const awardIds: Record<string, boolean> = {};

  for (let i = 0; i < tables.award_recipients.length; i++) {
    const ar = tables.award_recipients[i];
    if (ar.person_id === mid && ar.award_id) awardIds[ar.award_id] = true;
  }

  const out: Award[] = [];
  for (let j = 0; j < tables.awards.length; j++) {
    const a = tables.awards[j];
    if (awardIds[a.id]) out.push(a);
  }

  out.sort(function (a, b) {
    return parseDateKey(b.awarded_date) - parseDateKey(a.awarded_date);
  });

  return out;
}

export function getMemberCertificates(tables: CommunityTables, memberId: string): Certificate[] {
  const mid = s(memberId);
  const certIds: Record<string, boolean> = {};

  for (let i = 0; i < tables.certificate_holders.length; i++) {
    const ch = tables.certificate_holders[i];
    if (ch.person_id === mid && ch.certificate_id) certIds[ch.certificate_id] = true;
  }

  const out: Certificate[] = [];
  for (let j = 0; j < tables.certificates.length; j++) {
    const c = tables.certificates[j];
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
  const member = getMemberBySlugOrId(tables, memberId);
  if (!member) return null;

  const pubs = getMemberPublications(tables, member.id);
  const pubsWithAuthors: Array<Publication & { authors: Member[] }> = [];

  for (let i = 0; i < pubs.length; i++) {
    const p = pubs[i];
    const authorPairs = getPublicationAuthorsOrdered(tables, p.id);
    const authorMembers: Member[] = [];
    for (let j = 0; j < authorPairs.length; j++) {
      if (authorPairs[j].member) authorMembers.push(authorPairs[j].member as Member);
    }
    pubsWithAuthors.push(Object.assign({}, p, { authors: authorMembers }));
  }

  return {
    member: member,
    publications: pubsWithAuthors,
    awards: getMemberAwards(tables, member.id),
    certificates: getMemberCertificates(tables, member.id),
  };
}

/**
 * Convenience: fully joined publication detail.
 */
export function buildPublicationDetail(tables: CommunityTables, publicationId: string): PublicationDetail | null {
  const publication = getPublicationBySlugOrId(tables, publicationId);
  if (!publication) return null;

  return {
    publication: publication,
    authors: getPublicationAuthorsOrdered(tables, publication.id),
    links: getPublicationLinks(tables, publication.id),
  };
}
