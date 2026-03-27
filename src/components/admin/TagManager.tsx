"use client";

import { useState } from "react";

export default function TagManager({ tags }: { tags: any[] }) {
  const [name, setName] = useState("");

  const handleAdd = async () => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to create tag");
      return;
    }

    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag"
          className="border rounded-lg p-3 flex-1"
        />
        <button onClick={handleAdd} className="px-4 py-3 rounded-lg bg-black text-white">
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <div key={tag.id} className="border rounded-full px-4 py-2">
            {tag.name}
          </div>
        ))}
      </div>
    </div>
  );
}