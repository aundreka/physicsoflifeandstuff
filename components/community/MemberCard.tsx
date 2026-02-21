// components/community/MemberCard.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMemberSlug, type Member } from "@/lib/communityContent";
import Avatar from "@/components/community/Avatar";
import TypeBadge from "@/components/community/TypeBadge";

function fullName(member: Member): string {
  return [member.title, member.first_name, member.last_name].filter(Boolean).join(" ").trim();
}

function truncateText(value: string, maxChars: number): string {
  const text = (value || "").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  const cut = Math.max(0, maxChars - 3);
  return text.slice(0, cut).trimEnd() + "...";
}

export default function MemberCard({ member }: { member: Member }) {
  const [isSmallPhone, setIsSmallPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 420px)");
    const onChange = () => setIsSmallPhone(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const name = fullName(member) || "Unnamed";
  const subtitle = truncateText(member.specialization || member.course || "", isSmallPhone ? 52 : 90);
  const institutes = truncateText(member.associated_institutes || "", isSmallPhone ? 46 : 80);

  const slug = getMemberSlug(member);

  return (
    <Link href={`/community/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <article
        style={{
          border: "1px solid rgba(11,18,32,0.1)",
          borderRadius: 20,
          padding: "18px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
          display: "grid",
          gap: 14,
          boxShadow: "0 14px 34px rgba(11,18,32,0.08)",
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0 }}>
          <Avatar src={member.image} alt={name} size={92} />
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <TypeBadge type={member.type} />
            <h3
              style={{
                margin: "8px 0 4px",
                fontSize: 17,
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: isSmallPhone ? 2 : 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </h3>
            {subtitle ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "rgba(11,18,32,0.6)",
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </p>
            ) : null}
            {institutes ? (
              <p
                style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: "rgba(11,18,32,0.55)",
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {institutes}
              </p>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {member.member_since ? (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(11,18,32,0.06)",
                fontSize: 12,
                color: "rgba(11,18,32,0.65)",
              }}
            >
              Member since {member.member_since}
            </span>
          ) : null}
          {member.graduation_ay ? (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(11,18,32,0.06)",
                fontSize: 12,
                color: "rgba(11,18,32,0.65)",
              }}
            >
              Grad AY {member.graduation_ay}
            </span>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
