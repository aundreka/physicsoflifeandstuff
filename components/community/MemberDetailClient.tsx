// components/community/MemberDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/community/Avatar";
import TypeBadge from "@/components/community/TypeBadge";
import { THEME } from "@/components/theme";
import { buildMemberDetail, type MemberDetail } from "@/lib/communityContent";
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
            <p className="lead">Loading...</p>
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

  const chips = [member.specialization, member.course, member.associated_institutes]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const quickFacts: Array<{ label: string; value: string }> = [
    { label: "Member Since", value: member.member_since },
    { label: "Graduation AY", value: member.graduation_ay },
    { label: "Educational Attainment", value: member.educational_attainment },
    { label: "Status", value: member.status },
  ];

  const profileFields: Array<{ label: string; value: string }> = [
    { label: "Specialization", value: member.specialization },
    { label: "Course", value: member.course },
    { label: "Associated Institutes", value: member.associated_institutes },
  ];

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
        <section className="homeSection" style={{ paddingTop: 32 }}>
          <div className="homeContainer">
            <Link className="textLink" href="/community">Back to Community</Link>

            <div
              style={{
                marginTop: 18,
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid rgba(11,18,32,0.12)",
                background: "linear-gradient(135deg, rgba(10,16,38,0.92), rgba(10,16,38,0.6))",
                color: "white",
                position: "relative",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(circle at 85% 10%, rgba(255,255,255,0.08), transparent 50%)",
                }}
              />
              <div style={{ position: "relative", padding: "28px 28px 40px" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      padding: 6,
                      borderRadius: 22,
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Avatar src={member.image} alt={name} size={120} square />
                  </div>
                  <div style={{ minWidth: 240 }}>
                    <TypeBadge type={member.type} />
                    <h1
                      style={{
                        margin: "12px 0 6px",
                        fontSize: "clamp(28px, 3.6vw, 44px)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {name}
                    </h1>
                    {subtitle ? (
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.82)" }}>{subtitle}</p>
                    ) : null}
                    {member.email ? (
                      <p style={{ marginTop: 10 }}>
                        <a
                          className="textLink"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                          href={`mailto:${member.email}`}
                        >
                          {member.email}
                        </a>
                      </p>
                    ) : null}
                    {chips.length ? (
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {chips.map((chip) => (
                          <span
                            key={chip}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.16)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              fontSize: 12,
                              color: "rgba(255,255,255,0.9)",
                            }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "grid", gap: 24, flex: "1 1 560px", minWidth: 0 }}>
                <section
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: "18px",
                    border: "1px solid rgba(11,18,32,0.1)",
                  }}
                >
                  <h2 style={{ marginBottom: 10 }}>About</h2>
                  {member.bionotes ? (
                    <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {member.bionotes}
                    </p>
                  ) : (
                    <p className="lead">No bio available.</p>
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
                            <span style={{ color: "rgba(11,18,32,0.5)", fontSize: 14 }}>-&gt;</span>
                          </article>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="lead">No publications listed yet.</p>
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
              </div>

              <aside style={{ display: "grid", gap: 18, flex: "1 1 280px", minWidth: 0 }}>
                <section
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: "16px",
                    border: "1px solid rgba(11,18,32,0.1)",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px" }}>Profile</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {profileFields.map((field) => (
                      <div key={field.label} style={{ display: "grid", gap: 4 }}>
                        <span style={{ fontSize: 12, color: "rgba(11,18,32,0.5)" }}>{field.label}</span>
                        <span style={{ fontSize: 14, color: "rgba(11,18,32,0.85)" }}>
                          {field.value || "--"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: "16px",
                    border: "1px solid rgba(11,18,32,0.1)",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px" }}>Quick Facts</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {quickFacts.map((fact) => (
                      <div key={fact.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "rgba(11,18,32,0.5)" }}>{fact.label}</span>
                        <span style={{ fontSize: 13, color: "rgba(11,18,32,0.8)", textAlign: "right" }}>
                          {fact.value || "--"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: "16px",
                    border: "1px solid rgba(11,18,32,0.1)",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px" }}>Contact</h3>
                  {member.email ? (
                    <p style={{ margin: 0 }}>
                      <a className="textLink" href={`mailto:${member.email}`}>
                        {member.email}
                      </a>
                    </p>
                  ) : (
                    <p className="lead">No contact details listed.</p>
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
