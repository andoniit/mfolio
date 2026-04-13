"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const DEFAULT_TITLE = "home-Andon poteflio";
const HIDDEN_TITLE = "hey!! click here";

const getVisibleTitle = (pathname: string | null) => {
  if (!pathname || pathname === "/") {
    return "home-Andon poteflio";
  }

  if (pathname === "/projects") {
    return "andon-projects";
  }

  if (pathname.startsWith("/projects/")) {
    const slug = decodeURIComponent(pathname.split("/")[2] || "");
    return slug ? `project-${slug}` : "andon-projects";
  }

  if (pathname === "/blog") {
    return "andon-blog";
  }

  if (pathname.startsWith("/blog/")) {
    const slug = decodeURIComponent(pathname.split("/")[2] || "");
    return slug ? `blog-${slug}` : "andon-blog";
  }

  return DEFAULT_TITLE;
};

export default function TabTitleWatcher() {
  const pathname = usePathname();
  const visibleTitleRef = useRef(DEFAULT_TITLE);

  useEffect(() => {
    visibleTitleRef.current = getVisibleTitle(pathname);
    document.title = visibleTitleRef.current;

    const handleVisibilityChange = () => {
      document.title = document.hidden ? HIDDEN_TITLE : visibleTitleRef.current;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!document.hidden) {
        document.title = visibleTitleRef.current;
      }
    };
  }, [pathname]);

  return null;
}
