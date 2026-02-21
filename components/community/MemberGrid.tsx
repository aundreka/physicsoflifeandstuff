// components/community/MemberGrid.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Member } from "@/lib/communityContent";
import MemberCard from "@/components/community/MemberCard";

type MemberGridProps = {
  members: Member[];
  showSearch?: boolean;
};

export default function MemberGrid({ members, showSearch = false }: MemberGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const tabletMedia = window.matchMedia("(max-width: 980px)");
    const onChange = () => setIsMobile(media.matches);
    const onTabletChange = () => setIsTablet(tabletMedia.matches);
    onChange();
    onTabletChange();
    media.addEventListener("change", onChange);
    tabletMedia.addEventListener("change", onTabletChange);
    return () => {
      media.removeEventListener("change", onChange);
      tabletMedia.removeEventListener("change", onTabletChange);
    };
  }, []);

  const filteredMembers = useMemo(() => {
    if (!showSearch) return members;
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => {
      const text = [
        member.title,
        member.first_name,
        member.last_name,
        member.specialization,
        member.course,
        member.associated_institutes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [members, query, showSearch]);

  return (
    <div style={{ display: "grid", gap: isMobile ? 8 : 10 }}>
      {showSearch ? (
        <label style={{ display: "grid", gap: 6 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members..."
            style={{
              width: "100%",
              maxWidth: isMobile ? "100%" : 360,
              padding: isMobile ? "8px 10px" : "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(11,18,32,0.16)",
              background: "rgba(255,255,255,0.9)",
              fontSize: isMobile ? "inherit" : 14,
              color: "rgba(11,18,32,0.82)",
            }}
          />
        </label>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(auto-fit, minmax(min(100%, 188px), 1fr))"
            : isTablet
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(3, minmax(0, 1fr))",
          gap: isMobile ? 10 : 12,
          alignItems: "stretch",
          gridAutoRows: "1fr",
        }}
      >
        {filteredMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
      {showSearch && !filteredMembers.length ? (
        <p className="lead" style={{ margin: 0 }}>
          No members match your search.
        </p>
      ) : null}
    </div>
  );
}
