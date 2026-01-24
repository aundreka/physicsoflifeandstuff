// components/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,

        // match hero dark vibe
        background: "rgba(10, 16, 38, 0.92)", // THEME.pageBg-ish
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
<nav
  className="siteNav"
  style={{
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0.65rem 0.75rem",
    color: "rgba(255,255,255,0.92)",
  }}
>
  <a href="/" className="brand">
    <Image src="/logo.svg" alt="Logo" width={44} height={44} priority />
    <span className="siteTitle">
      <strong style={{ letterSpacing: "0.02em" }}>Physics of Life and Stuff</strong>
    </span>
  </a>

  <div className="desktopNav">
    <a className="navLink" href="#members">Members</a>
    <a className="navLink" href="#publications">Publications</a>
    <a className="navLink" href="#news">News</a>
        <a className="navLink" href="#contact">Contact</a>

  </div>

<button
  className="hamburger"
  onClick={() => setOpen(!open)}
  aria-label="Open menu"
  aria-expanded={open}
  aria-controls="mobile-menu"
>
  <span className="hamburgerIcon">
    <span className="bar" />
    <span className="bar" />
  </span>
</button>
</nav>


      {/* Mobile menu */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "default",
              zIndex: 40,
            }}
          />

          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100dvh",
              width: "78vw",
              maxWidth: "320px",

              // dark sheet to match hero
              background: "rgba(5, 8, 22, 0.92)", // THEME.vignetteEdge-ish
              borderLeft: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",

              zIndex: 60,
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <strong style={{ letterSpacing: "0.02em", paddingLeft: "10px" }}>Menu</strong>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  padding: "0.4rem 0.6rem",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                ✕
              </button>
            </div>

            <a className="mobileLink" href="#members" onClick={() => setOpen(false)}>
              Members
            </a>
            <a
              className="mobileLink"
              href="#publications"
              onClick={() => setOpen(false)}
            >
              Publications
            </a>
            <a className="mobileLink" href="#news" onClick={() => setOpen(false)}>
              News
            </a>
            <a className="mobileLink" href="#contact" onClick={() => setOpen(false)}>
              Contact
            </a>

            <div style={{ flex: 1 }} />
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
              Physics of Life and Stuff • UST
            </p>
          </div>
        </>
      )}
    </header>
  );
}
