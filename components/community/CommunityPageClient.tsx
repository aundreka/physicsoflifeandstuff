// components/community/CommunityPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import CommunityHero from "@/components/community/CommunityHero";
import MemberGrid from "@/components/community/MemberGrid";
import SectionHeading from "@/components/community/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { THEME } from "@/components/theme";
import { splitMembersByType, type Member } from "@/lib/communityContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";

export default function CommunityPageClient({
  initialAdmins = [],
  initialMembers = [],
  initialAlumni = [],
}: {
  initialAdmins?: Member[];
  initialMembers?: Member[];
  initialAlumni?: Member[];
}) {
  const [admins, setAdmins] = useState<Member[]>(initialAdmins);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [alumni, setAlumni] = useState<Member[]>(initialAlumni);

  useEffect(() => {
    let cancelled = false;
    getCommunityTablesClient()
      .then((tables) => {
        if (cancelled) return;
        const split = splitMembersByType(tables.members);
        setAdmins(split.admins);
        setMembers(split.members);
        setAlumni(split.alumni);
      })
      .catch((err) => {
        console.warn("[community] client fetch failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  type CSSVars = React.CSSProperties & Record<`--${string}`, string>;
  const styleVars: CSSVars = {
    "--hero-bg": THEME.pageBg,
    "--light-bg": THEME.lightBg,
    "--light-text": THEME.lightText,
    "--light-muted": THEME.lightMuted,
    "--hairline": THEME.hairline,
  };

  return (
    <div style={styleVars}>
      <CommunityHero title="Community" subtitle="Advisers, members, and alumni of the group." />

      <div className="homeLight communityPage">
        {admins.length ? (
          <section id="advisers" className="homeSection" style={{ borderTop: "none" }}>
            <div className="homeContainer">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Community" },
                ]}
              />
              <SectionHeading title="Advisers" />
              <MemberGrid members={admins} showSearch={false} />
            </div>
          </section>
        ) : (
          <section className="homeSection" style={{ borderTop: "none" }}>
            <div className="homeContainer">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Community" },
                ]}
              />
            </div>
          </section>
        )}

        {members.length ? (
          <section id="members" className="homeSection">
            <div className="homeContainer">
              <SectionHeading title="Members" />
              <MemberGrid members={members} showSearch />
            </div>
          </section>
        ) : null}

        {alumni.length ? (
          <section id="alumni" className="homeSection">
            <div className="homeContainer">
              <SectionHeading title="Alumni" />
              <MemberGrid members={alumni} showSearch={false} />
            </div>
          </section>
        ) : null}
      </div>
      <style jsx>{`
        @media (max-width: 640px) {
          .communityPage :global(.homeSection) {
            padding: 34px 0;
          }
        }
      `}</style>
    </div>
  );
}
