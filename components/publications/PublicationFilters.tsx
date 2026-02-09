"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicationListItem } from "@/lib/publicationsContent";

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
  const map = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!map.has(key)) map.set(key, trimmed);
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

function uniqueItems(items: PublicationListItem[]): PublicationListItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.id, item.slug, item.title, item.publishing_date]
      .filter(Boolean)
      .join("|")
      .toLowerCase()
      .trim();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function PublicationFilters({ items }: PublicationFiltersProps) {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("");
  const [institute, setInstitute] = useState("");
  const [journal, setJournal] = useState("");
  const [publisher, setPublisher] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  const uniqueItemsList = useMemo(() => uniqueItems(items), [items]);

  const fields = useMemo(
    () => uniqueSorted(uniqueItemsList.map((i) => i.field_of_study)),
    [uniqueItemsList]
  );
  const institutes = useMemo(
    () => uniqueSorted(uniqueItemsList.map((i) => i.institute)),
    [uniqueItemsList]
  );
  const years = useMemo(
    () =>
      uniqueSorted(uniqueItemsList.map((i) => i.year)).sort(
        (a, b) => Number(b) - Number(a)
      ),
    [uniqueItemsList]
  );
  const journals = useMemo(
    () => uniqueSorted(uniqueItemsList.map((i) => i.journal)),
    [uniqueItemsList]
  );
  const publishers = useMemo(
    () => uniqueSorted(uniqueItemsList.map((i) => i.publisher)),
    [uniqueItemsList]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = yearStart ? Number(yearStart) : null;
    const end = yearEnd ? Number(yearEnd) : null;
    const minYear =
      start !== null && end !== null ? Math.min(start, end) : start ?? null;
    const maxYear =
      start !== null && end !== null ? Math.max(start, end) : end ?? null;
    return uniqueItemsList
      .filter((item) => {
        if (
          field &&
          (item.field_of_study || "").toLowerCase() !== field.toLowerCase()
        )
          return false;
        if (
          institute &&
          (item.institute || "").toLowerCase() !== institute.toLowerCase()
        )
          return false;
        if (
          journal &&
          (item.journal || "").toLowerCase() !== journal.toLowerCase()
        )
          return false;
        if (
          publisher &&
          (item.publisher || "").toLowerCase() !== publisher.toLowerCase()
        )
          return false;
        if (minYear !== null || maxYear !== null) {
          const itemYear = Number(item.year);
          if (Number.isNaN(itemYear)) return false;
          if (minYear !== null && itemYear < minYear) return false;
          if (maxYear !== null && itemYear > maxYear) return false;
        }

        if (!q) return true;
        const haystack = [
          item.title,
          item.journal,
          item.publisher,
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
  }, [uniqueItemsList, query, field, institute, journal, publisher, yearStart, yearEnd]);

  return (
    <div className="pubFilters">
      <div id="pub-filters-panel" className="pubFiltersBar">
        <label className="pubFiltersLabel pubFiltersLabel--search">
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
          <span className="eyebrow">Journal</span>
          <select
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            className="pubFiltersSelect"
          >
            <option value="">All journals</option>
            {journals.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="pubFiltersLabel">
          <span className="eyebrow">Publisher</span>
          <select
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="pubFiltersSelect"
          >
            <option value="">All publishers</option>
            {publishers.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="pubFiltersLabel pubFiltersLabel--year">
          <span className="eyebrow">Year range</span>
          <div className="pubFiltersRange">
            <select
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              className="pubFiltersSelect"
              aria-label="Start year"
            >
              <option value="">From</option>
              {years.map((y) => (
                <option key={`start-${y}`} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              className="pubFiltersSelect"
              aria-label="End year"
            >
              <option value="">To</option>
              {years.map((y) => (
                <option key={`end-${y}`} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </label>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            setField("");
            setInstitute("");
            setJournal("");
            setPublisher("");
            setYearStart("");
            setYearEnd("");
          }}
          className="pubFiltersClear"
        >
          Clear
        </button>
      </div>

      <div className="pubList">
        {filtered.length ? (
          filtered.map((item) => (
            <Link key={item.id} href={`/publications/${item.slug || item.id}`} className="pubCardLink">
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
