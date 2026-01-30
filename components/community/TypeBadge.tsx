// components/community/TypeBadge.tsx
"use client";

import React from "react";
import type { MemberType } from "@/lib/communityContent";

type TypeBadgeProps = {
  type: MemberType | "";
};

function labelFor(type: MemberType | ""): string {
  if (type === "admin") return "Adviser";
  if (type === "alumni") return "Alumni";
  if (type === "member") return "Member";
  return "Member";
}

function colorFor(type: MemberType | ""): string {
  if (type === "admin") return "rgba(15, 60, 120, 0.12)";
  if (type === "alumni") return "rgba(120, 75, 20, 0.12)";
  return "rgba(11, 18, 32, 0.10)";
}

function borderFor(type: MemberType | ""): string {
  if (type === "admin") return "rgba(15, 60, 120, 0.2)";
  if (type === "alumni") return "rgba(120, 75, 20, 0.2)";
  return "rgba(11, 18, 32, 0.18)";
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.6rem",
        borderRadius: "999px",
        fontSize: "12px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: colorFor(type),
        border: `1px solid ${borderFor(type)}`,
        color: "rgba(11,18,32,0.76)",
      }}
    >
      {labelFor(type)}
    </span>
  );
}
