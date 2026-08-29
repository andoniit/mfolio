"use client";

import { adminFetch } from "@/lib/admin-fetch";

type Props = {
  projectId: string;
  title: string;
};

export default function ProjectListTrashButton({ projectId, title }: Props) {
  const handleTrash = async () => {
    const label = title?.trim() || "this project";
    if (!confirm(`Move "${label}" to trash? It will be removed from the live site.`)) {
      return;
    }

    const res = await adminFetch(`/api/projects/${projectId}`, { method: "DELETE" });
    const result = await res.json().catch(() => null);

    if (!res.ok) {
      alert(result?.error || "Failed to move project to trash");
      return;
    }

    window.location.href = "/admin/projects/trash";
  };

  return (
    <button
      type="button"
      onClick={handleTrash}
      className="px-4 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-all sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
    >
      Trash
    </button>
  );
}
