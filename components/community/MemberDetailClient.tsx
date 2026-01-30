// components/community/MemberDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/community/Avatar";
import TypeBadge from "@/components/community/TypeBadge";
import { THEME } from "@/components/theme";
import {
  buildMemberDetail,
  type MemberDetail,
} from "@/lib/communityContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";

function fullName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

export default function MemberDetailClient() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<MemberDetail | null | undefined>(undefined);

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
        const d = buildMemberDetail(tables, id);
        setDetail(d ?? null);
      })
      .catch((err) => {
        console.warn("[community] member fetch failed", err);
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const content = useMemo(() => {
    if (!detail) return null;
    const { member, awards, certificates, publications } = detail;
    const name = fullName(member.first_name, member.last_name) || "Unnamed";
    const subtitle = member.specialization || member.course || "";
    return { member, awards, certificates, publications, name, subtitle };
  }, [detail]);

  if (detail === undefined) {
    return (
      <div className="homeLight">
        <section className="homeSection" style={{ paddingTop: 56 }}>
          <div className="homeContainer">
            <p className="lead">Loading…</p>
          </div>
        </section>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="homeLight">
        <section className="homeSection" style={{ paddingTop: 56 }}>
          <div className="homeContainer">
            <p className="lead">Member not found.</p>
            <p style={{ marginTop: 12 }}>
              <Link className="textLink" href="/community">Back to Community</Link>
            </p>
          </div>
        </section>
      </div>
    );
  }

  const { member, awards, certificates, publications, name, subtitle } = content;

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
        <section className="homeSection" style={{ paddingTop: 56 }}>
          <div className="homeContainer">
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                marginTop: 24,
                flexWrap: "wrap",
              }}
            >
              <Avatar src={member.image} alt={name} size={128} />
              <div style={{ minWidth: 240 }}>
                <TypeBadge type={member.type} />
                <h1
                  style={{
                    margin: "14px 0 8px",
                    fontSize: "clamp(28px, 3.2vw, 40px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {name}
                </h1>
                {subtitle ? (
                  <p style={{ margin: 0, color: "rgba(11,18,32,0.7)" }}>{subtitle}</p>
                ) : null}
                {member.course ? (
                  <p style={{ marginTop: 6, color: "rgba(11,18,32,0.56)" }}>{member.course}</p>
                ) : null}
                {member.email ? (
                  <p style={{ marginTop: 10 }}>
                    <a className="textLink" href={`mailto:${member.email}`}>
                      {member.email}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ marginTop: 36, display: "grid", gap: 32 }}>
              <section>
                <h2 style={{ marginBottom: 10 }}>Bio</h2>
                {member.bionotes ? (
                  <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {member.bionotes}
                  </p>
                ) : (
                  <p className="lead">No bio available.</p>
                )}
              </section>

              <section>
                <h2 style={{ marginBottom: 10 }}>Awards</h2>
                {awards.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {awards.map((award) => (
                      <article
                        key={award.id}
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          padding: "12px 14px",
                          border: "1px solid rgba(11,18,32,0.12)",
                          borderRadius: 14,
                          background: "white",
                        }}
                      >
                        {award.image ? (
                          <img
                            src={award.image}
                            alt={award.award}
                            width={56}
                            height={56}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid rgba(11,18,32,0.12)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 10,
                              background: "rgba(11,18,32,0.08)",
                              border: "1px solid rgba(11,18,32,0.12)",
                            }}
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16 }}>{award.award}</h3>
                          <p style={{ margin: "6px 0 0", color: "rgba(11,18,32,0.6)" }}>
                            {award.awarded_by}
                          </p>
                          {award.awarded_date ? (
                            <p style={{ margin: "4px 0 0", color: "rgba(11,18,32,0.5)" }}>
                              {award.awarded_date}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="lead">No awards listed yet.</p>
                )}
              </section>

              <section>
                <h2 style={{ marginBottom: 10 }}>Certificates</h2>
                {certificates.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {certificates.map((cert) => (
                      <article
                        key={cert.id}
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          padding: "12px 14px",
                          border: "1px solid rgba(11,18,32,0.12)",
                          borderRadius: 14,
                          background: "white",
                        }}
                      >
                        {cert.image ? (
                          <img
                            src={cert.image}
                            alt={cert.certificate}
                            width={56}
                            height={56}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid rgba(11,18,32,0.12)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 10,
                              background: "rgba(11,18,32,0.08)",
                              border: "1px solid rgba(11,18,32,0.12)",
                            }}
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16 }}>{cert.certificate}</h3>
                          <p style={{ margin: "6px 0 0", color: "rgba(11,18,32,0.6)" }}>
                            {cert.certified_by}
                          </p>
                          {cert.certified_date ? (
                            <p style={{ margin: "4px 0 0", color: "rgba(11,18,32,0.5)" }}>
                              {cert.certified_date}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="lead">No certificates listed yet.</p>
                )}
              </section>

              <section>
                <h2 style={{ marginBottom: 10 }}>Publications</h2>
                {publications.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {publications.map((pub) => (
                      <Link
                        key={pub.id}
                        href={`/publications/${pub.id}?from=${member.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <article
                          style={{
                            padding: "14px 16px",
                            border: "1px solid rgba(11,18,32,0.12)",
                            borderRadius: 14,
                            background: "white",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 12,
                          }}
                        >
                          <div>
                            <h3 style={{ margin: 0, fontSize: 16 }}>{pub.title}</h3>
                            {pub.publishing_date ? (
                              <p style={{ margin: "6px 0 0", color: "rgba(11,18,32,0.6)" }}>
                                {pub.publishing_date}
                              </p>
                            ) : null}
                          </div>
                          <span style={{ color: "rgba(11,18,32,0.5)", fontSize: 14 }}>→</span>
                        </article>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="lead">No publications listed yet.</p>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
