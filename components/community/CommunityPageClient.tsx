// components/community/CommunityPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import CommunityHero from "@/components/community/CommunityHero";
import MemberGrid from "@/components/community/MemberGrid";
import SectionHeading from "@/components/community/SectionHeading";
import { THEME } from "@/components/theme";
import { splitMembersByType, type Member } from "@/lib/communityContent";
import { getCommunityTablesClient } from "@/lib/communityContentClient";

export default function CommunityPageClient() {
  const [admins, setAdmins] = useState<Member[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [alumni, setAlumni] = useState<Member[]>([]);

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

  return (
    <div
      style={
        {
          ["--hero-bg" as any]: THEME.pageBg,
          ["--light-bg" as any]: THEME.lightBg,
          ["--light-text" as any]: THEME.lightText,
          ["--light-muted" as any]: THEME.lightMuted,
          ["--hairline" as any]: THEME.hairline,
        } as React.CSSProperties
      }
    >
      <CommunityHero title="Community" subtitle="Advisers, members, and alumni of the group." />

      <div className="homeLight">
        <section id="advisers" className="homeSection" style={{ borderTop: "none" }}>
          <div className="homeContainer">
            <SectionHeading title="Advisers" />
            {admins.length ? <MemberGrid members={admins} /> : <p className="lead">No advisers listed yet.</p>}
          </div>
        </section>

        <section id="members" className="homeSection">
          <div className="homeContainer">
            <SectionHeading title="Members" />
            {members.length ? <MemberGrid members={members} /> : <p className="lead">No members listed yet.</p>}
          </div>
        </section>

        <section id="alumni" className="homeSection">
          <div className="homeContainer">
            <SectionHeading title="Alumni" />
            {alumni.length ? <MemberGrid members={alumni} /> : <p className="lead">No alumni listed yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
