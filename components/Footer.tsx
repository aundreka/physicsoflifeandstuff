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

  const labelSrOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  return (
    <footer
      className="siteFooter"
      style={{
        marginTop: "auto",
        padding: "2.4rem 1.2rem",
        borderTop: "1px solid #e7e7e7",
        color: "#5a5a5a",
        background:
          "linear-gradient(180deg, rgba(250,250,248,1) 0%, rgba(245,244,240,1) 100%)",
      }}
    >
      <div
        className="siteFooterInner"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <div className="siteFooterTitle" style={{ fontWeight: 700, color: "#1f2937", letterSpacing: "0.02em" }}>
          Contact
        </div>
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 0,
          }}
        >
          <div className="siteFooterRow">
            <span className="siteFooterIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeWidth="1.6" />
                <path d="m22 8-10 6L2 8" strokeWidth="1.6" />
              </svg>
            </span>
            <span style={labelSrOnly}>Email</span>
            <a className="textLink siteFooterText" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
          {contact?.location ? (
            <div className="siteFooterRow">
              <span className="siteFooterIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                  <path
                    d="M12 22s7-7.2 7-12a7 7 0 0 0-14 0c0 4.8 7 12 7 12Z"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="10" r="2.6" strokeWidth="1.6" />
                </svg>
              </span>
              <span style={labelSrOnly}>{contact.locationLabel || "Location"}</span>
              <span className="siteFooterText">{contact.location}</span>
            </div>
          ) : null}
          {contact?.address ? (
            <div className="siteFooterRow">
              <span className="siteFooterIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                  <path
                    d="M4 7a2 2 0 0 1 2-2h8l6 6v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                    strokeWidth="1.6"
                  />
                  <path d="M14 5v6h6" strokeWidth="1.6" />
                </svg>
              </span>
              <span style={labelSrOnly}>{contact.addressLabel || "Address"}</span>
              <span className="siteFooterText">{contact.address}</span>
            </div>
          ) : null}
          {contact?.links?.length ? (
            <div className="siteFooterRow">
              <span className="siteFooterIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
                  <path
                    d="M10.5 13.5 13.5 10.5M8 12a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 1 1 5.7 5.7L14.7 12"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M16 12a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 1 1-5.7-5.7L9.3 12"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              <span style={labelSrOnly}>Links</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, minWidth: 0 }}>
                {contact.links.map((l) => (
                  <a key={l.label} className="textLink siteFooterText" href={l.href}>
                    {l.label} <span aria-hidden="true">-&gt;</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="siteFooterCopy" style={{ color: "#777" }}>
          (c) {new Date().getFullYear()} Physics of Life and Stuff
        </div>
      </div>
    </footer>
  );
}
