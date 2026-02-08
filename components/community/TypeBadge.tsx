// components/community/TypeBadge.tsx
"use client";

import React from "react";
import type { MemberType } from "@/lib/communityContent";

type TypeBadgeProps = {
  type: MemberType | "";
  size?: "sm" | "md" | "lg";
  tone?: "dark" | "light";
};

function labelFor(type: MemberType | ""): string {
  if (type === "adviser") return "Adviser";
  if (type === "alumni") return "Alumni";
  if (type === "member") return "Member";
  return "Member";
}

function colorFor(type: MemberType | ""): string {
  if (type === "adviser") return "rgba(15, 60, 120, 0.12)";
  if (type === "alumni") return "rgba(120, 75, 20, 0.12)";
  return "rgba(11, 18, 32, 0.10)";
}

function borderFor(type: MemberType | ""): string {
  if (type === "adviser") return "rgba(15, 60, 120, 0.2)";
  if (type === "alumni") return "rgba(120, 75, 20, 0.2)";
  return "rgba(11, 18, 32, 0.18)";
}

export default function TypeBadge({ type, size = "sm", tone = "dark" }: TypeBadgeProps) {
  const sizeStyles =
    size === "lg"
      ? { padding: "0.45rem 0.9rem", fontSize: "13px", letterSpacing: "0.12em" }
      : size === "md"
      ? { padding: "0.35rem 0.75rem", fontSize: "12px", letterSpacing: "0.1em" }
      : { padding: "0.25rem 0.6rem", fontSize: "12px", letterSpacing: "0.08em" };
  const darkStyles = {
    background: colorFor(type),
    border: `1px solid ${borderFor(type)}`,
    color: "rgba(11,18,32,0.76)",
  };
  const lightStyles = {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.95)",
    textShadow: "0 1px 6px rgba(0,0,0,0.35)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        textTransform: "uppercase",
        ...(tone === "light" ? lightStyles : darkStyles),
        ...sizeStyles,
      }}
    >
      {labelFor(type)}
    </span>
  );
}
