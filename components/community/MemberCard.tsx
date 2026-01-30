// components/community/MemberCard.tsx
"use client";

import Link from "next/link";
import type { Member } from "@/lib/communityContent";
import Avatar from "@/components/community/Avatar";

function fullName(member: Member): string {
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
}

export default function MemberCard({ member }: { member: Member }) {
  const name = fullName(member) || "Unnamed";
  const subtitle = member.specialization || member.course || "";

  return (
    <Link
      href={`/community/${member.id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <article
        style={{
          border: "1px solid rgba(11,18,32,0.12)",
          borderRadius: 18,
          padding: "16px",
          background: "white",
          display: "flex",
          gap: 14,
          alignItems: "center",
          transition: "transform 160ms ease, box-shadow 160ms ease",
          boxShadow: "0 10px 24px rgba(11,18,32,0.06)",
        }}
      >
        <Avatar src={member.image} alt={name} size={64} />
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </h3>
          {subtitle ? (
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "rgba(11,18,32,0.6)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
