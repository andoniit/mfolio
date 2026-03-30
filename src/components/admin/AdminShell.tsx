"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isLogin = useMemo(() => pathname === "/admin/login", [pathname]);

  if (isLogin) return <>{children}</>;

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
              <div
                className={`rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center ${
                  collapsed ? "w-12 h-12" : "w-full h-12 px-3"
                }`}
              >
                <span
                  className={`font-bold text-sm ${
                    collapsed ? "" : "text-gray-900"
                  }`}
                >
                  {collapsed ? "A" : "Admin"}
                </span>
              </div>

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

