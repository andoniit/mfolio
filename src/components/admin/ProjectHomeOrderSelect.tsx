"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

type Props = {
  projectId: string;
  initialValue: number | null;
};

export default function ProjectHomeOrderSelect({ projectId, initialValue }: Props) {
  const [value, setValue] = useState<string>(initialValue ? String(initialValue) : "");
  const [saving, setSaving] = useState(false);

  const save = async (next: string) => {
    setSaving(true);
    setValue(next);

    const res = await adminFetch(`/api/projects/${projectId}/home-feature-order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ home_feature_order: next ? Number(next) : null }),
    });

    const result = await res.json().catch(() => null);

    if (!res.ok) {
      alert(result?.error || "Failed to update home order");
      setValue(initialValue ? String(initialValue) : "");
    } else {
      // Reload to reflect any slot-clearing on other projects.
      window.location.reload();
    }

    setSaving(false);
  };

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-xs text-gray-500">Home slot</span>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => void save(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white disabled:opacity-60"
        aria-label="Home feature order"
      >
        <option value="">—</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </label>
  );
}

