// components/community/MemberDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/community/Avatar";
import TypeBadge from "@/components/community/TypeBadge";
import { THEME } from "@/components/theme";
import { buildMemberDetail, getMemberSlug, getPublicationSlug, type MemberDetail } from "@/lib/communityContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";
import { SITE_NAME } from "@/lib/site";

function fullName(title: string, first: string, last: string): string {
  return [title, first, last].filter(Boolean).join(" ").trim();
}

function truncateText(value: string, maxChars: number): string {
  const text = (value || "").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  const cut = Math.max(0, maxChars - 3);
  return text.slice(0, cut).trimEnd() + "...";
}

export default function MemberDetailClient({
  initialDetail = undefined,
}: {
  initialDetail?: MemberDetail | null;
}) {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<MemberDetail | null | undefined>(initialDetail);
  const [avatarSize, setAvatarSize] = useState(190);

  useEffect(() => {
    function updateAvatarSize() {
      if (typeof window === "undefined") return;
      setAvatarSize(window.innerWidth < 640 ? 96 : 190);
    }
    updateAvatarSize();
    window.addEventListener("resize", updateAvatarSize);
    return () => window.removeEventListener("resize", updateAvatarSize);
  }, []);

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
    const name = fullName(member.title, member.first_name, member.last_name) || "Unnamed";
    const subtitle = truncateText(
      (member.show_specialization ? member.specialization : "") ||
        (member.show_occupation ? member.occupation : "") ||
        (member.show_course ? member.course : ""),
      120
    );
    return { member, awards, certificates, publications, name, subtitle };
  }, [detail]);

  useEffect(() => {
    if (!content?.name) return;
    document.title = `${content.name} | ${SITE_NAME}`;
  }, [content?.name]);

  if (detail === undefined) {
    return (
      <div className="homeLight" style={{ background: "#ffffff" }}>
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
  const memberSlug = getMemberSlug(member);

  const profileFields: Array<{ label: string; value: string }> = [
    member.show_educational_attainment ? { label: "Highest Educational Attainment", value: member.educational_attainment } : null,
    member.show_graduation_ay ? { label: "Graduation AY", value: member.graduation_ay } : null,
    member.show_occupation ? { label: "Occupation", value: member.occupation } : null,
    member.show_course ? { label: "Course", value: member.course } : null,
    member.show_associated_institutes ? { label: "Associated Institutes", value: member.associated_institutes } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

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
              className="memberHero"
              style={{
                marginTop: 18,
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid rgba(11,18,32,0.12)",
                background: "linear-gradient(135deg, rgba(24,34,64,0.86), rgba(58,66,94,0.62))",
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
              <div className="memberHeroInner" style={{ position: "relative", padding: "28px 28px 40px" }}>
                <div className="memberHeroGrid" style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "nowrap" }}>
                  <div
                    className="memberAvatarWrap"
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                    }}
                  >
                    <Avatar src={member.image} alt={name} size={avatarSize} square borderless />
                  </div>
                  <div className="memberHeroText" style={{ minWidth: 240, display: "flex", flexDirection: "column" }}>
                    <span
                      className="memberHeroType"
                      style={{
                        display: "block",
                        textTransform: "uppercase",
                        letterSpacing: "0.24em",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {member.type}
                    </span>
                    <h1
                      className="memberHeroName"
                      style={{
                        margin: "8px 0 6px",
                        fontSize: "clamp(28px, 3.6vw, 44px)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {name}
                    </h1>
                    {subtitle ? (
                      <p className="memberHeroSubtitle" style={{ margin: 0, color: "rgba(255,255,255,0.82)" }}>
                        {subtitle}
                      </p>
                    ) : null}
                    {(member.show_linkedin && member.linkedin) || (member.show_email && member.email) || (member.show_member_since && member.member_since) ? (
                      <div className="memberHeroActions" style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {member.show_email && member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            aria-label="Email"
                            title="Email"
                            className="memberHeroIcon"
                            style={{
                              width: 36,
                              height: 36,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 10,
                              border: "1px solid rgba(255,255,255,0.25)",
                              background: "rgba(255,255,255,0.12)",
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              aria-hidden="true"
                              focusable="false"
                              style={{ display: "block", fill: "white" }}
                            >
                              <path d="M3 5h18c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2zm0 2v.01L12 12l9-4.99V7H3zm0 12h18V9.35l-9 5-9-5V19z" />
                            </svg>
                          </a>
                        ) : null}
                        {member.show_linkedin && member.linkedin ? (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="LinkedIn profile"
                            title="LinkedIn"
                            className="memberHeroIcon"
                            style={{
                              width: 36,
                              height: 36,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 10,
                              border: "1px solid rgba(255,255,255,0.25)",
                              background: "rgba(255,255,255,0.12)",
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              aria-hidden="true"
                              focusable="false"
                              style={{ display: "block", fill: "white" }}
                            >
                              <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.68H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.34 7.43c-1.14 0-2.06-.93-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.13-.92 2.06-2.06 2.06zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.23 0z" />
                            </svg>
                          </a>
                        ) : null}
                        {member.show_member_since && member.member_since ? (
                          <span
                            className="memberHeroBadge"
                            style={{
                              padding: "6px 12px",
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.16)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              fontSize: 12,
                              color: "rgba(255,255,255,0.9)",
                            }}
                          >
                            Member Since {member.member_since}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="memberLayout"
              style={{
                marginTop: 28,
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div className="memberMain" style={{ display: "grid", gap: 24, flex: "1 1 560px", minWidth: 0 }}>
                {member.show_bionotes ? (
                  <section
                    className="memberCard"
                    style={{
                      background: "#fcfcff",
                      borderRadius: 18,
                      padding: "18px",
                      border: "1px solid rgba(11,18,32,0.1)",
                    }}
                  >
                    <h2 style={{ marginBottom: 10 }}>About</h2>
                    {member.bionotes ? (
                      <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: "pre-line", textAlign: "justify" }}>
                        {member.bionotes}
                      </p>
                    ) : (
                      <p className="lead">No bio available.</p>
                    )}
                  </section>
                ) : null}

                {publications.length ? (
                  <section className="memberSection">
                    <h2 style={{ marginBottom: 10 }}>Publications</h2>
                    <div style={{ display: "grid", gap: 12 }}>
                      {publications.map((pub) => (
                        <Link
                          key={pub.id}
                          href={`/publications/${getPublicationSlug(pub)}?from=${memberSlug}`}
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
                  </section>
                ) : null}

              </div>

              <aside className="memberAside" style={{ display: "grid", gap: 18, flex: "1 1 280px", minWidth: 0 }}>
                <section
                  className="memberCard"
                  style={{
                    background: "#fcfcff",
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
                    {!profileFields.length ? (
                      <p className="lead" style={{ margin: 0 }}>No profile details listed.</p>
                    ) : null}
                  </div>
                </section>

                {awards.length ? (
                  <section className="memberSection">
                    <h2 style={{ marginBottom: 10 }}>Awards</h2>
                    <div className="badgeList">
                      {awards.map((award) => (
                        <article
                          key={award.id}
                          className="badgeItem"
                        >
                          {award.image ? (
                            <img
                              src={award.image}
                              alt={award.award}
                              width={56}
                              height={56}
                              className="badgeIcon"
                            />
                          ) : (
                            <div
                              className="badgeIcon badgeIconPlaceholder"
                              aria-hidden="true"
                            />
                          )}
                          <div className="badgeText">
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
                  </section>
                ) : null}

                {certificates.length ? (
                  <section className="memberSection">
                    <h2 style={{ marginBottom: 10 }}>Certificates</h2>
                    <div className="badgeList">
                      {certificates.map((cert) => (
                        <article
                          key={cert.id}
                          className="badgeItem"
                        >
                          {cert.image ? (
                            <img
                              src={cert.image}
                              alt={cert.certificate}
                              width={56}
                              height={56}
                              className="badgeIcon"
                            />
                          ) : (
                            <div
                              className="badgeIcon badgeIconPlaceholder"
                              aria-hidden="true"
                            />
                          )}
                          <div className="badgeText">
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
                  </section>
                ) : null}

              </aside>
            </div>
          </div>
        </section>
      </div>
      <style jsx>{`
        .badgeList {
          display: grid;
          gap: 12px;
        }
        .badgeItem {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 6px 0;
        }
        .badgeIcon {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid rgba(11,18,32,0.12);
          background: #fff;
          flex: 0 0 auto;
        }
        .badgeIconPlaceholder {
          background: rgba(11,18,32,0.08);
          border: 1px solid rgba(11,18,32,0.12);
        }
        .badgeText {
          min-width: 0;
        }
        .badgeText h3,
        .badgeText p {
          overflow-wrap: anywhere;
        }
        @media (max-width: 720px) {
          .memberHero {
            border-radius: 18px;
          }
          .memberHeroInner {
            padding: 20px 18px 26px;
          }
          .memberHeroGrid {
            gap: 16px;
            flex-wrap: wrap;
            align-items: center;
            flex-direction: column;
          }
          .memberHeroText {
            min-width: 0;
            width: 100%;
            text-align: left;
          }
          .memberHeroName {
            font-size: 20px;
            line-height: 1.2;
            overflow-wrap: anywhere;
            word-break: break-word;
            max-width: 100%;
          }
          .memberHeroType {
            font-size: 10px;
            letter-spacing: 0.22em;
            max-width: 100%;
          }
          .memberHeroSubtitle {
            font-size: 13px;
            line-height: 1.4;
            overflow-wrap: anywhere;
            word-break: break-word;
            max-width: 100%;
          }
          .memberHeroActions {
            gap: 8px;
            width: 100%;
            flex-wrap: wrap;
          }
          .memberHeroIcon {
            width: 30px !important;
            height: 30px !important;
            border-radius: 8px !important;
          }
          .memberHeroIcon svg {
            width: 15px;
            height: 15px;
          }
          .memberHeroBadge {
            padding: 4px 10px !important;
            font-size: 11px !important;
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
            white-space: normal;
          }
          .memberLayout {
            gap: 16px;
            margin-top: 20px;
          }
          .memberMain {
            gap: 16px;
          }
          .memberAside {
            gap: 14px;
          }
          .memberCard {
            padding: 12px !important;
            border-radius: 14px !important;
          }
          .memberSection h2 {
            font-size: 18px;
          }
          .memberSection p,
          .memberCard p,
          .memberCard span {
            font-size: 13px;
          }
          .badgeItem {
            gap: 12px;
          }
          .badgeIcon {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </div>
  );
}
