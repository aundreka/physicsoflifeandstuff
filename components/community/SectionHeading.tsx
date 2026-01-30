// components/community/SectionHeading.tsx
"use client";

import React from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export default function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="sectionHeader">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="h2Title">{title}</h2>
      {subtitle ? <p className="lead">{subtitle}</p> : null}
    </div>
  );
}
