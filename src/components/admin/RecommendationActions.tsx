"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  NOTE_COLORS,
  NOTE_COLOR_KEYS,
  normalizeColor,
  type RecommendationStatus,
} from "@/lib/recommendations";

type Props = {
  id: string;
  status: RecommendationStatus;
  color: string;
};

export default function RecommendationActions({ id, status, color }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const current = normalizeColor(color);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => null);
        alert(r?.error || "Update failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this recommendation permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/recommendations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const r = await res.json().catch(() => null);
        alert(r?.error || "Delete failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Color picker */}
      <div className="flex items-center gap-1.5">
        {NOTE_COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={busy}
            onClick={() => patch({ color: key })}
            title={key}
            aria-label={`Set color ${key}`}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50 ${
              current === key ? "border-gray-900 scale-110" : "border-white"
            }`}
            style={{ background: NOTE_COLORS[key].bg, boxShadow: `inset 0 0 0 1px ${NOTE_COLORS[key].edge}` }}
          />
        ))}
      </div>

      {/* Status actions */}
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "approved" })}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {status === "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "pending" })}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Unpublish
          </button>
        )}
        {status !== "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "rejected" })}
            className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50"
          >
            Reject
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
