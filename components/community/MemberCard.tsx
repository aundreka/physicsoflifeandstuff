// components/community/MemberCard.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMemberSlug, type Member } from "@/lib/communityContent";
import Avatar from "@/components/community/Avatar";

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
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallPhone, setIsSmallPhone] = useState(false);

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 640px)");
    const smallMedia = window.matchMedia("(max-width: 420px)");
    const onChange = () => {
      setIsMobile(mobileMedia.matches);
      setIsSmallPhone(smallMedia.matches);
    };
    onChange();
    mobileMedia.addEventListener("change", onChange);
    smallMedia.addEventListener("change", onChange);
    return () => {
      mobileMedia.removeEventListener("change", onChange);
      smallMedia.removeEventListener("change", onChange);
    };
  }, []);

  const name = fullName(member) || "Unnamed";
  const subtitle = truncateText(member.specialization || member.course || "", isSmallPhone ? 52 : 90);
  const institutes = truncateText(member.associated_institutes || "", isSmallPhone ? 46 : 80);
  const avatarSize = isSmallPhone ? 62 : isMobile ? 74 : 92;

  const slug = getMemberSlug(member);

  return (
    <Link
      href={`/community/${slug}`}
      className="memberGridCardLink"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <article
        className="memberGridCard"
        style={{
          border: "1px solid rgba(11,18,32,0.1)",
          borderRadius: isSmallPhone ? 12 : isMobile ? 14 : 20,
          padding: isSmallPhone ? "8px" : isMobile ? "9px" : "14px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
          display: "grid",
          gap: isSmallPhone ? 6 : isMobile ? 7 : 10,
          boxShadow: "0 14px 34px rgba(11,18,32,0.08)",
          minHeight: 0,
          height: "100%",
        }}
      >
        <div style={{ display: "flex", gap: isSmallPhone ? 8 : isMobile ? 10 : 16, alignItems: "center", minWidth: 0 }}>
          <Avatar src={member.image} alt={name} size={avatarSize} />
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <h3
              style={{
                margin: isSmallPhone ? "6px 0 3px" : "8px 0 4px",
                fontSize: isSmallPhone ? 12.5 : isMobile ? 13.5 : 17,
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
                  fontSize: isSmallPhone ? 10.5 : isMobile ? 11.5 : 13,
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
                  marginTop: isSmallPhone ? 3 : isMobile ? 4 : 6,
                  fontSize: isSmallPhone ? 10 : isMobile ? 11 : 12.5,
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
      </article>
    </Link>
  );
}
