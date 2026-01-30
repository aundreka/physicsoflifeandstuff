// components/community/CommunityHero.tsx
"use client";

import React from "react";
import { THEME } from "@/components/theme";

type CommunityHeroProps = {
  title: string;
  subtitle?: string;
  imageSrc?: string;
};

export default function CommunityHero({ title, subtitle, imageSrc }: CommunityHeroProps) {
  const heroImage = imageSrc || "/communityhero.png";

  return (
    <section
      style={{
        position: "relative",
        height: 380,
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(3,7,18,0.55), rgba(3,7,18,0.2))",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 20%, ${THEME.bridgeTint}, transparent 55%)`,
          opacity: 0.7,
        }}
        aria-hidden="true"
      />
      <div
        className="homeContainer"
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: 88,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 4vw, 56px)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              marginTop: 12,
              maxWidth: 520,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -1,
          height: 84,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
          <path
            d="M0,64 C240,128 480,0 720,64 C960,128 1200,0 1440,64 L1440,120 L0,120 Z"
            fill="var(--light-bg)"
          />
        </svg>
      </div>
    </section>
  );
}
