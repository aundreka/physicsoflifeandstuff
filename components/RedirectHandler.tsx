// components/RedirectHandler.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams?.get("redirect");
    if (!raw) return;

    let target = "";
    try {
      target = decodeURIComponent(raw);
    } catch {
      target = raw;
    }

    if (!target.startsWith("/")) return;

    router.replace(target);
  }, [router, searchParams]);

  return null;
}
