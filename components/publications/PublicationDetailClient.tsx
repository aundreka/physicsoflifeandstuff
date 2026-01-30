// components/publications/PublicationDetailClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { THEME } from "@/components/theme";
import {
  buildPublicationDetail,
  getMemberById,
  type PublicationDetail,
} from "@/lib/communityContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";

function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").trim();
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

export default function PublicationDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<PublicationDetail | null | undefined>(undefined);
  const [backHref, setBackHref] = useState<string>("/community");

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setDetail(null);
      return () => {
        cancelled = true;
      };
    }

    getCommunityTablesClient()
      .then((tables) => {
        if (cancelled) return;
        const d = buildPublicationDetail(tables, id);
        setDetail(d ?? null);

        const fromId = (searchParams?.get("from") ?? "").trim();
        const fromMember = fromId ? getMemberById(tables, fromId) : null;
        setBackHref(fromMember ? `/community/${fromId}` : "/community");
      })
      .catch((err) => {
        console.warn("[publications] detail fetch failed", err);
        if (!cancelled) setDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id, searchParams]);

  const content = useMemo(() => {
    if (!detail) return null;
    return detail;
  }, [detail]);

  if (detail === undefined) {
    return (
      <div className="homeLight">
        <section className="homeSection pubDetailSection">
          <div className="homeContainer pubDetail">
            <p className="lead">Loading…</p>
          </div>
        </section>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="homeLight">
        <section className="homeSection pubDetailSection">
          <div className="homeContainer pubDetail">
            <p className="lead">Publication not found.</p>
            <p style={{ marginTop: 12 }}>
              <Link className="textLink" href="/publications">Back to Publications</Link>
            </p>
          </div>
        </section>
      </div>
    );
  }

  const { publication, authors, links } = content;

  return (
    <div
      style={
        {
          ["--hero-bg" as any]: THEME.pageBg,
          ["--light-bg" as any]: THEME.lightBg,
          ["--light-text" as any]: THEME.lightText,
          ["--light-muted" as any]: THEME.lightMuted,
          ["--hairline" as any]: THEME.hairline,
        } as React.CSSProperties
      }
    >
      <div className="homeLight">
        <section className="homeSection pubDetailSection">
          <div className="homeContainer pubDetail">
            <header className="pubDetailHeader">
              <p className="pubDetailEyebrow">Publication</p>
              <h1 className="pubDetailTitle">{publication.title}</h1>
              <div className="pubDetailMeta">
                {publication.publishing_date ? (
                  <span className="pubDetailDate">{formatDate(publication.publishing_date)}</span>
                ) : null}
                {publication.institute ? (
                  <span className="pubDetailMetaItem">{publication.institute}</span>
                ) : null}
                {publication.field_of_study ? (
                  <span className="pubDetailMetaItem">{publication.field_of_study}</span>
                ) : null}
              </div>
              <div style={{ marginTop: 10 }}>
                <Link className="textLink" href={backHref}>
                  ← Back
                </Link>
              </div>
            </header>

            <div className="pubDetailGrid">
              <section className="pubDetailPanel">
                <div className="pubDetailBlock">
                  <h2>Overview</h2>
                  {publication.description ? (
                    <p className="pubDetailBody">{publication.description}</p>
                  ) : (
                    <p className="pubDetailBody pubDetailMuted">No description available.</p>
                  )}
                </div>
                <div className="pubDetailBlock">
                  <h2>Abstract</h2>
                  {publication.abstract ? (
                    <p className="pubDetailBody">{publication.abstract}</p>
                  ) : (
                    <p className="pubDetailBody pubDetailMuted">No abstract available.</p>
                  )}
                </div>
              </section>

              <aside className="pubDetailAside">
                <section className="pubDetailCard">
                  <h3>Authors</h3>
                  {authors.length ? (
                    <div className="pubDetailAuthors">
                      {authors.map((author) => (
                        <Link
                          key={author.member.id}
                          href={`/community/${author.member.id}`}
                          className="pubDetailAuthor"
                        >
                          {fullName(author.member.first_name, author.member.last_name)}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="pubDetailMuted">No authors listed.</p>
                  )}
                </section>

                <section className="pubDetailCard">
                  <h3>Links</h3>
                  {links.length ? (
                    <div className="pubDetailLinks">
                      {links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="pubDetailLink"
                        >
                          <span>{link.label || link.url}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="pubDetailMuted">No links available.</p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
