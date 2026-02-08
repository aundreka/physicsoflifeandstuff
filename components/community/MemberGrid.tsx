// components/community/MemberGrid.tsx
"use client";

import React from "react";
import type { Member } from "@/lib/communityContent";
import MemberCard from "@/components/community/MemberCard";

type MemberGridProps = {
  members: Member[];
};

export default function MemberGrid({ members }: MemberGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
      }}
    >
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
