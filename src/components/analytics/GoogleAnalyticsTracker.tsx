"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type GoogleAnalyticsTrackerProps = {
  measurementId: string;
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function GoogleAnalyticsTracker({
  measurementId,
}: GoogleAnalyticsTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!measurementId || typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_path: pagePath,
      page_location: window.location.href,
      send_to: measurementId,
    });
  }, [measurementId, pathname, query]);

  return null;
}
