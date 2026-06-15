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

const projectSubItems = [
  { href: "/admin/projects", label: "All projects", icon: "notes" as const },
  { href: "/admin/projects/new", label: "New project", icon: "plus" as const },
  { href: "/admin/projects/trash", label: "Trash", icon: "trash" as const },
];

const experienceSubItems = [
  { href: "/admin/experience", label: "All experience", icon: "notes" as const },
  { href: "/admin/experience/new", label: "New experience", icon: "plus" as const },
  { href: "/admin/experience/trash", label: "Trash", icon: "trash" as const },
];

const volunteerSubItems = [
  { href: "/admin/volunteer", label: "All roles", icon: "notes" as const },
  { href: "/admin/volunteer/new", label: "New role", icon: "plus" as const },
  { href: "/admin/volunteer/trash", label: "Trash", icon: "trash" as const },
];

function NavIcon({
  kind,
}: {
  kind:
    | (typeof blogSubItems)[number]["icon"]
    | (typeof projectSubItems)[number]["icon"]
    | "chevron"
    | "resume"
    | "grid"
    | "home"
    | "mail"
    | "briefcase"
    | "heart"
    | "quote";
}) {
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
    case "resume":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" strokeLinejoin="round" />
        </svg>
      );
    case "home":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="7" width="18" height="13" rx="2" strokeLinejoin="round" />
          <path
            d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "quote":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export default function AdminNav({ collapsed = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State to handle the dropdown tab
  const [isBlogsOpen, setIsBlogsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    if (pathname === "/admin") {
      setIsBlogsOpen(false);
      setIsProjectsOpen(false);
      setIsExperienceOpen(false);
      setIsVolunteerOpen(false);
      return;
    }
    const isInsideBlogs = blogSubItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (isInsideBlogs) {
      setIsBlogsOpen(true);
    }
    const isInsideProjects = projectSubItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (isInsideProjects) {
      setIsProjectsOpen(true);
    }
    const isInsideExperience = experienceSubItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (isInsideExperience) {
      setIsExperienceOpen(true);
    }
    const isInsideVolunteer = volunteerSubItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (isInsideVolunteer) {
      setIsVolunteerOpen(true);
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
          <Link
            href="/admin"
            className={`group flex items-center gap-3 py-2.5 px-3 transition-all duration-200 rounded-xl ${
              pathname === "/admin"
                ? "bg-white/50 text-black shadow-sm border border-white/40"
                : "text-gray-500 border border-transparent hover:bg-white/30 hover:text-gray-900"
            } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
            title="Dashboard"
          >
            <span
              className={`inline-flex items-center justify-center transition-transform duration-200 ${
                pathname === "/admin"
                  ? "text-black scale-105"
                  : "text-gray-400 group-hover:text-gray-700"
              }`}
            >
              <NavIcon kind="home" />
            </span>
            {!collapsed && (
              <span
                className={`text-[14px] tracking-wide ${
                  pathname === "/admin" ? "font-semibold" : "font-medium"
                }`}
              >
                Dashboard
              </span>
            )}
          </Link>

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

          {/* Projects */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className={`group flex items-center justify-between py-2.5 transition-all duration-200 rounded-xl ${
                isProjectsOpen
                  ? "bg-white/60 text-black shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-white/60"
                  : "text-gray-500 border border-transparent hover:bg-white/40 hover:text-gray-900"
              } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center transition-transform duration-200 ${
                    isProjectsOpen ? "text-black scale-105" : "text-gray-400 group-hover:text-gray-700"
                  }`}
                >
                  <NavIcon kind="grid" />
                </span>
                {!collapsed && (
                  <span
                    className={`text-[14px] tracking-wide ${isProjectsOpen ? "font-semibold" : "font-medium"}`}
                  >
                    Projects
                  </span>
                )}
              </div>

              {!collapsed && (
                <span
                  className={`transition-transform duration-300 text-gray-400 ${
                    isProjectsOpen ? "rotate-180 text-black" : ""
                  }`}
                >
                  <NavIcon kind="chevron" />
                </span>
              )}
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isProjectsOpen && !collapsed ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden flex flex-col gap-1 pl-4">
                <div className="border-l border-white/60 pl-2 py-1 space-y-1">
                  {projectSubItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin/projects" && pathname.startsWith(item.href + "/"));

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

          {/* Experience */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setIsExperienceOpen(!isExperienceOpen)}
              className={`group flex items-center justify-between py-2.5 transition-all duration-200 rounded-xl ${
                isExperienceOpen
                  ? "bg-white/60 text-black shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-white/60"
                  : "text-gray-500 border border-transparent hover:bg-white/40 hover:text-gray-900"
              } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center transition-transform duration-200 ${
                    isExperienceOpen ? "text-black scale-105" : "text-gray-400 group-hover:text-gray-700"
                  }`}
                >
                  <NavIcon kind="briefcase" />
                </span>
                {!collapsed && (
                  <span
                    className={`text-[14px] tracking-wide ${isExperienceOpen ? "font-semibold" : "font-medium"}`}
                  >
                    Experience
                  </span>
                )}
              </div>

              {!collapsed && (
                <span
                  className={`transition-transform duration-300 text-gray-400 ${
                    isExperienceOpen ? "rotate-180 text-black" : ""
                  }`}
                >
                  <NavIcon kind="chevron" />
                </span>
              )}
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isExperienceOpen && !collapsed ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden flex flex-col gap-1 pl-4">
                <div className="border-l border-white/60 pl-2 py-1 space-y-1">
                  {experienceSubItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin/experience" && pathname.startsWith(item.href + "/"));

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

          {/* Voluntary Roles */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setIsVolunteerOpen(!isVolunteerOpen)}
              className={`group flex items-center justify-between py-2.5 transition-all duration-200 rounded-xl ${
                isVolunteerOpen
                  ? "bg-white/60 text-black shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-white/60"
                  : "text-gray-500 border border-transparent hover:bg-white/40 hover:text-gray-900"
              } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center transition-transform duration-200 ${
                    isVolunteerOpen ? "text-black scale-105" : "text-gray-400 group-hover:text-gray-700"
                  }`}
                >
                  <NavIcon kind="heart" />
                </span>
                {!collapsed && (
                  <span
                    className={`text-[14px] tracking-wide ${isVolunteerOpen ? "font-semibold" : "font-medium"}`}
                  >
                    Voluntary Roles
                  </span>
                )}
              </div>

              {!collapsed && (
                <span
                  className={`transition-transform duration-300 text-gray-400 ${
                    isVolunteerOpen ? "rotate-180 text-black" : ""
                  }`}
                >
                  <NavIcon kind="chevron" />
                </span>
              )}
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isVolunteerOpen && !collapsed ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden flex flex-col gap-1 pl-4">
                <div className="border-l border-white/60 pl-2 py-1 space-y-1">
                  {volunteerSubItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin/volunteer" && pathname.startsWith(item.href + "/"));

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

          <Link
            href="/admin/newsletter"
            className={`group flex items-center gap-3 py-2.5 px-3 transition-all duration-200 rounded-xl ${
              pathname === "/admin/newsletter"
                ? "bg-white/50 text-black shadow-sm border border-white/40"
                : "text-gray-500 border border-transparent hover:bg-white/30 hover:text-gray-900"
            } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
            title="Newsletter"
          >
            <span
              className={`inline-flex items-center justify-center transition-transform duration-200 ${
                pathname === "/admin/newsletter"
                  ? "text-black scale-105"
                  : "text-gray-400 group-hover:text-gray-700"
              }`}
            >
              <NavIcon kind="mail" />
            </span>
            {!collapsed && (
              <span
                className={`text-[14px] tracking-wide ${
                  pathname === "/admin/newsletter" ? "font-semibold" : "font-medium"
                }`}
              >
                Newsletter
              </span>
            )}
          </Link>

          <Link
            href="/admin/recommendations"
            className={`group flex items-center gap-3 py-2.5 px-3 transition-all duration-200 rounded-xl ${
              pathname === "/admin/recommendations"
                ? "bg-white/50 text-black shadow-sm border border-white/40"
                : "text-gray-500 border border-transparent hover:bg-white/30 hover:text-gray-900"
            } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
            title="Recommendations"
          >
            <span
              className={`inline-flex items-center justify-center transition-transform duration-200 ${
                pathname === "/admin/recommendations"
                  ? "text-black scale-105"
                  : "text-gray-400 group-hover:text-gray-700"
              }`}
            >
              <NavIcon kind="quote" />
            </span>
            {!collapsed && (
              <span
                className={`text-[14px] tracking-wide ${
                  pathname === "/admin/recommendations" ? "font-semibold" : "font-medium"
                }`}
              >
                Recommendations
              </span>
            )}
          </Link>

          <Link
            href="/admin/resume"
            className={`group flex items-center gap-3 py-2.5 px-3 transition-all duration-200 rounded-xl ${
              pathname === "/admin/resume"
                ? "bg-white/50 text-black shadow-sm border border-white/40"
                : "text-gray-500 border border-transparent hover:bg-white/30 hover:text-gray-900"
            } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
            title="Resume"
          >
            <span
              className={`inline-flex items-center justify-center transition-transform duration-200 ${
                pathname === "/admin/resume"
                  ? "text-black scale-105"
                  : "text-gray-400 group-hover:text-gray-700"
              }`}
            >
              <NavIcon kind="resume" />
            </span>
            {!collapsed && (
              <span
                className={`text-[14px] tracking-wide ${
                  pathname === "/admin/resume" ? "font-semibold" : "font-medium"
                }`}
              >
                Resume
              </span>
            )}
          </Link>

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