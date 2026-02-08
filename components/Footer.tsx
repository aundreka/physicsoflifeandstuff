// components/Footer.tsx
"use client";

import { useEffect, useState } from "react";
import { getHomeAboutContentClient } from "@/lib/homeContentClient";
import type { HomeContent } from "@/lib/homeContent";

const CONTACT_EMAIL = "physics@plsust.org";

export default function Footer() {
  const [contact, setContact] = useState<HomeContent["about"]["contact"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHomeAboutContentClient()
      .then((fresh) => {
        if (cancelled || !fresh) return;
        setContact(fresh.contact);
      })
      .catch((err) => {
        console.warn("[footer] contact fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer
      style={{
        marginTop: "auto",
        padding: "2rem",
        borderTop: "1px solid #e5e5e5",
        fontSize: "0.9rem",
        color: "#666",
        background: "#fff",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600, color: "#222" }}>Contact</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#777" }}>Email</span>
            <a className="textLink" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
          {contact?.location ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#777" }}>{contact.locationLabel || "Location"}</span>
              <span>{contact.location}</span>
            </div>
          ) : null}
          {contact?.address ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#777" }}>{contact.addressLabel || "Address"}</span>
              <span>{contact.address}</span>
            </div>
          ) : null}
          {contact?.links?.length ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {contact.links.map((l) => (
                <a key={l.label} className="textLink" href={l.href}>
                  {l.label} <span aria-hidden="true">-&gt;</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ color: "#888" }}>
          (c) {new Date().getFullYear()} Physics of Life and Stuff
        </div>
      </div>
    </footer>
  );
}