"use client";

import { useState } from "react";

export default function TagManager({ tags }: { tags: any[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
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
      setLoading(false);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Add New Tag Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Tag</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">#</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. react, marketing, design..."
              className="w-full bg-gray-50 text-gray-900 pl-8 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add Tag"}
          </button>
        </form>
      </div>

      {/* Tags Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Existing Tags</h3>
        
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <div 
                key={tag.id} 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-white transition-all cursor-default"
              >
                <span className="text-gray-400 font-normal">#</span>
                {tag.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm italic py-4">
            No tags created yet.
          </div>
        )}
      </div>
    </div>
  );
}