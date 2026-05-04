"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import FloatingBottomNav from "@/components/layout/bottom-nav/FloatingBottomNav";
import ConditionalFooter from "@/components/layout/footer/ConditionalFooter";

/**
 * Global chrome (floating nav + footer) is omitted on `/andon-copilot` so the AI workspace is full-height.
 */
export default function SiteChrome() {
  const pathname = usePathname() ?? "";
  if (pathname === "/andon-copilot") {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <FloatingBottomNav />
      </Suspense>
      <Suspense fallback={null}>
        <ConditionalFooter />
      </Suspense>
    </>
  );
}
