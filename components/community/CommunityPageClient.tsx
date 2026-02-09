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

      <div className="homeLight">
        <section id="advisers" className="homeSection" style={{ borderTop: "none" }}>
          <div className="homeContainer">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Community" },
              ]}
            />
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
