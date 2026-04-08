"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DEFAULT_TITLE = "Anirudha Kapileshwari - Software Engineer";
const HIDDEN_TITLE = "hey!! click here";

export default function TabTitleWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    const getVisibleTitle = () => {
      if (pathname?.startsWith("/projects")) {
        return "Projects - ANDON";
      }

      if (pathname?.startsWith("/blog")) {
        return "blog-Andon";
      }

      return DEFAULT_TITLE;
    };

    const handleVisibilityChange = () => {
      document.title = document.hidden ? HIDDEN_TITLE : getVisibleTitle();
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.title = getVisibleTitle();
    };
  }, [pathname]);

  return null;
}
