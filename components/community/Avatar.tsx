// components/community/Avatar.tsx
"use client";

import React from "react";

type AvatarProps = {
  src?: string;
  alt: string;
  size?: number;
  initials?: string;
  square?: boolean;
};

function initialsFromName(name: string): string {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, alt, size = 96, initials, square }: AvatarProps) {
  const fallback = initials ?? initialsFromName(alt);

  const shape = square ? "12px" : "999px";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: shape,
        overflow: "hidden",
        background:
          "linear-gradient(140deg, rgba(11,18,32,0.08), rgba(11,18,32,0.18))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(11,18,32,0.75)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        border: "1px solid rgba(11,18,32,0.12)",
      }}
      aria-label={alt}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span style={{ fontSize: Math.max(14, Math.round(size * 0.26)) }}>{fallback}</span>
      )}
    </div>
  );
}
