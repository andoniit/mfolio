"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminNav from "@/components/admin/AdminNav";
 
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // On a phone the 320px sidebar leaves almost nothing for the content, so
  // start collapsed to the icon rail below the breakpoint. This is also what
  // the iOS app's embedded web screens get. Still togglable by hand — only the
  // crossing of the breakpoint reasserts it, so a deliberate expand sticks.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const narrow = window.matchMedia("(max-width: 900px)");
    const apply = (matches: boolean) => setCollapsed(matches);
    apply(narrow.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    narrow.addEventListener("change", onChange);
    return () => narrow.removeEventListener("change", onChange);
  }, []);
 
  const isLogin = useMemo(() => pathname === "/admin/login", [pathname]);
 
  useEffect(() => {
    if (isLogin) {
      setCheckingAuth(false);
      return;
    }
 
    let mounted = true;
 
    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
 
      if (!data.session) {
        router.replace("/admin/login");
      } else {
        setCheckingAuth(false);
      }
    };
 
    verify();
 
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        router.replace("/admin/login");
      } else {
        setCheckingAuth(false);
      }
    });
 
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLogin, router]);
 
  if (isLogin) {
    return <>{children}</>;
  }
 
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Checking admin access…</div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside
          className="bg-transparent border-r"
          style={{
            width: collapsed ? 84 : 320,
            transition: "width 200ms ease",
          }}
        >
          <div className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/admin"
                className={`rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors overflow-hidden ${
                  collapsed ? "w-12 h-12 p-1.5" : "w-full h-12 px-2"
                }`}
                title="Dashboard"
              >
                <img
                  src="/logo/anikap.svg"
                  alt="anikap"
                  className={
                    collapsed
                      ? "h-full w-full object-contain"
                      : "h-9 w-auto max-w-full object-contain object-left"
                  }
                  width={200}
                  height={48}
                  decoding="async"
                />
              </Link>
 
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
                className="ml-3 w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-gray-700 flex items-center justify-center"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease",
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
 
            <AdminNav collapsed={collapsed} />
          </div>
        </aside>
 
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}

