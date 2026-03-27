"use client";

import { useState } from "react";

export default function CategoryManager({ categories }: { categories: any[] }) {
  const [name, setName] = useState("");

  const handleAdd = async () => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to create category");
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
          placeholder="New category"
          className="border rounded-lg p-3 flex-1"
        />
        <button onClick={handleAdd} className="px-4 py-3 rounded-lg bg-black text-white">
          Add
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-xl p-4">
            {category.name}
          </div>
        ))}
      </div>
    </div>
  );
}