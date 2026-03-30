"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  collapsed?: boolean;
};

// We group the sub-items under the Blogs umbrella
const blogSubItems = [
  { href: "/admin/blogs", label: "All Posts", icon: "notes" as const },
  { href: "/admin/blogs/new", label: "New Post", icon: "plus" as const },
  { href: "/admin/categories", label: "Categories", icon: "folder" as const },
  { href: "/admin/tags", label: "Tags", icon: "tag" as const },
  { href: "/admin/blogs/trash", label: "Trash", icon: "trash" as const },
];

function NavIcon({ kind }: { kind: (typeof blogSubItems)[number]["icon"] | "chevron" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24" };
  switch (kind) {
    case "notes":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v16m8-8H4" strokeLinecap="round" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            strokeLinecap="round"
          />
        </svg>
      );
    case "tag":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M7 7h.01M4 15l8 8 8-8-8-8H4v8z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chevron":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export default function AdminNav({ collapsed = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State to handle the dropdown tab
  const [isBlogsOpen, setIsBlogsOpen] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Automatically keep the dropdown open if we are inside a blog route
  useEffect(() => {
    const isInsideBlogs = blogSubItems.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));
    if (isInsideBlogs) {
      setIsBlogsOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setIsAdminLoggedIn(!!data.session);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAdminLoggedIn(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const ok = confirm("Are you sure you want to logout?");
    if (!ok) return;

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        alert(error.message || "Logout failed. Please try again.");
        return;
      }

      // Optimistically update local state so UI reacts immediately.
      setIsAdminLoggedIn(false);

      router.replace("/admin/login");
      router.refresh();
      // Fallback in case client router state is stale.
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 50);
    } catch (error) {
      console.error(error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div
      className={`h-screen sticky top-0 flex flex-col transition-all duration-300 bg-white/30 backdrop-blur-2xl border-r border-white/40 z-50 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden no-scrollbar flex-1 flex flex-col gap-6">
        
        {/* Neat & Clean Welcome Section */}
        <div
          className={`transition-all duration-300 px-3 pt-2 ${
            collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
          }`}
        >
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Admin Panel
          </h2>
          <p className="text-[13px] text-gray-500 font-medium mt-0.5">
            Welcome, Andon
          </p>
        </div>

        {/* Navigation Wrapper */}
        <nav className="space-y-2">
          
          {/* Main Dropdown Tab: BLOGS */}
          <div className="flex flex-col">
            <button
              onClick={() => setIsBlogsOpen(!isBlogsOpen)}
              className={`group flex items-center justify-between py-2.5 transition-all duration-200 rounded-xl ${
                isBlogsOpen 
                  ? "bg-white/60 text-black shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-white/60" 
                  : "text-gray-500 border border-transparent hover:bg-white/40 hover:text-gray-900"
              } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3"}`}
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center transition-transform duration-200 ${isBlogsOpen ? "text-black scale-105" : "text-gray-400 group-hover:text-gray-700"}`}>
                  <NavIcon kind="notes" />
                </span>
                {!collapsed && (
                  <span className={`text-[14px] tracking-wide ${isBlogsOpen ? "font-semibold" : "font-medium"}`}>
                    Blogs
                  </span>
                )}
              </div>
              
              {!collapsed && (
                <span className={`transition-transform duration-300 text-gray-400 ${isBlogsOpen ? "rotate-180 text-black" : ""}`}>
                  <NavIcon kind="chevron" />
                </span>
              )}
            </button>

            {/* Sub-items (Dropdown Content) */}
            <div 
              className={`grid transition-all duration-300 ease-in-out ${
                isBlogsOpen && !collapsed ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden flex flex-col gap-1 pl-4">
                {/* Subtle vertical line to show nesting */}
                <div className="border-l border-white/60 pl-2 py-1 space-y-1">
                  {blogSubItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin/blogs" && pathname.startsWith(item.href + "/"));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 py-2 px-3 transition-all duration-200 rounded-lg ${
                          isActive
                            ? "bg-white/50 text-black shadow-sm border border-white/40"
                            : "text-gray-500 border border-transparent hover:bg-white/30 hover:text-gray-900"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center transition-transform duration-200 ${
                            isActive ? "text-black scale-105" : "text-gray-400 group-hover:text-gray-700"
                          } scale-90`}
                        >
                          <NavIcon kind={item.icon} />
                        </span>
                        <span
                          className={`text-[13px] tracking-wide ${
                            isActive ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </nav>

        {isAdminLoggedIn && (
          <div className="mt-auto pt-4 border-t border-white/40">
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${
                collapsed
                  ? "justify-center"
                  : "bg-white/30 hover:bg-white/45 text-gray-900"
              }`}
            >
              <span className="inline-flex items-center justify-center w-6">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>

              {!collapsed && (
                <span className="text-[13px] tracking-wide font-medium">
                  Logout
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}