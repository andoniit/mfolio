"use client";

import { usePathname, useSearchParams } from "next/navigation";
import SiteFooter from "./SiteFooter";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname?.startsWith("/admin") || pathname === "/andon-copilot") {
    return null;
  }
  /** Portfolio preview iframe (`/?mfEmbed=1`) — hide footer so chrome does not stack. */
  if (searchParams.get("mfEmbed") === "1") {
    return null;
  }

  return <SiteFooter />;
}
