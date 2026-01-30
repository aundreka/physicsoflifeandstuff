"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type AuthorRef = {
  id: string;
  name: string;
};

export type PublicationListItem = {
  id: string;
  title: string;
  publishing_date: string;
  field_of_study: string;
  institute: string;
  description: string;
  abstract: string;
  year: string;
  authors: AuthorRef[];
};

type PublicationFiltersProps = {
  items: PublicationListItem[];
};

function parseDateKey(value: string): number {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function formatDate(value: string): string {
  if (!value) return "";
  const match = value.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(parsed));
  }
  return value;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export default function PublicationFilters({ items }: PublicationFiltersProps) {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("");
  const [institute, setInstitute] = useState("");
  const [year, setYear] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fields = useMemo(
    () => uniqueSorted(items.map((i) => i.field_of_study)),
    [items]
  );
  const institutes = useMemo(
    () => uniqueSorted(items.map((i) => i.institute)),
    [items]
  );
  const years = useMemo(
    () => uniqueSorted(items.map((i) => i.year)).sort((a, b) => b.localeCompare(a)),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (field && item.field_of_study !== field) return false;
        if (institute && item.institute !== institute) return false;
        if (year && item.year !== year) return false;

        if (!q) return true;
        const haystack = [
          item.title,
          item.description,
          item.abstract,
          item.field_of_study,
          item.institute,
          item.authors.map((a) => a.name).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => parseDateKey(b.publishing_date) - parseDateKey(a.publishing_date));
  }, [items, query, field, institute, year]);

  return (
    <div className="pubFilters">


      <div
        id="pub-filters-panel"
        className={`pubFiltersBar ${filtersOpen ? "is-open" : ""}`}
      >
        <label className="pubFiltersLabel">
          <span className="eyebrow">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, field…"
            className="pubFiltersInput"
          />
        </label>

        <label className="pubFiltersLabel">
          <span className="eyebrow">Field</span>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="pubFiltersSelect"
          >
            <option value="">All fields</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="pubFiltersLabel">
          <span className="eyebrow">Institute</span>
          <select
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            className="pubFiltersSelect"
          >
            <option value="">All institutes</option>
            {institutes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="pubFiltersLabel">
          <span className="eyebrow">Year</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="pubFiltersSelect"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            setField("");
            setInstitute("");
            setYear("");
          }}
          className="pubFiltersClear"
        >
          Clear
        </button>
      </div>

      <div className="pubList">
        {filtered.length ? (
          filtered.map((item) => (
            <Link key={item.id} href={`/publications/${item.id}`} className="pubCardLink">
              <article className="pubCard">
                <div className="pubCardHeader">
                  <h3 className="pubCardTitle">{item.title}</h3>
                  {item.publishing_date ? (
                    <span className="pubCardDate">{formatDate(item.publishing_date)}</span>
                  ) : null}
                </div>
                <div className="pubMeta">
                  {item.field_of_study ? (
                    <span className="pubMetaItem">{item.field_of_study}</span>
                  ) : null}
                  {item.institute ? <span className="pubMetaItem">{item.institute}</span> : null}
                </div>
                {item.authors.length ? (
                  <p className="pubAuthors">{item.authors.map((a) => a.name).join(", ")}</p>
                ) : null}
              </article>
            </Link>
          ))
        ) : (
          <p className="lead pubEmpty">No publications match the current filters.</p>
        )}
      </div>
    </div>
  );
}
