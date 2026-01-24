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
        background: "#fff",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <nav
        className="siteNav"
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative", // needed for centering
        }}
      >
        {/* Logo */}
        <a
          href="/"
          className="brand"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Image src="/logo.svg" alt="Logo" width={44} height={44} priority />
          <span className="siteTitle">
            <strong>Physics of Life and Stuff</strong>
          </span>
        </a>

        {/* Desktop links */}
        <div className="desktopNav">
          <a className="navLink" href="#members">Members</a>
          <a className="navLink" href="#publications">Publications</a>
          <a className="navLink" href="#news">News</a>
        </div>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#fff",
            borderRadius: "12px",
            padding: "0.55rem 0.65rem",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span className="bar" />
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
              background: "rgba(0,0,0,0.25)",
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
              background: "#fff",
              borderLeft: "1px solid rgba(0,0,0,0.1)",
              zIndex: 60,
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <strong>Menu</strong>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "0.4rem 0.6rem",
                }}
              >
                ✕
              </button>
            </div>

            <a className="mobileLink" href="#members" onClick={() => setOpen(false)}>
              Members
            </a>
            <a className="mobileLink" href="#publications" onClick={() => setOpen(false)}>
              Publications
            </a>
            <a className="mobileLink" href="#news" onClick={() => setOpen(false)}>
              News
            </a>
            <a className="mobileLink" href="#contact" onClick={() => setOpen(false)}>
              Contact
            </a>
          </div>
        </>
      )}
    </header>
  );
}
