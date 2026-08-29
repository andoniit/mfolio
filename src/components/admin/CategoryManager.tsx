"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

export default function CategoryManager({ categories }: { categories: any[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    const res = await adminFetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to create category");
      setLoading(false);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Add New Category Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Technology, Lifestyle..."
            className="flex-1 bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Existing Categories</h3>
        </div>
        
        {categories.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                    📁
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {category.postCount ? `${category.postCount} posts` : "0 posts"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    /{category.slug}
                  </span>

                  {category.postCount === 0 && (
                    <button
                      type="button"
                      disabled={deletingId === category.id}
                      onClick={async () => {
                        const ok = confirm(
                          `Delete category "${category.name}"? This cannot be undone.`
                        );
                        if (!ok) return;

                        setDeletingId(category.id);
                        try {
                          const res = await adminFetch(`/api/categories/${category.id}`, {
                            method: "DELETE",
                          });

                          const result = await res.json().catch(() => null);

                          if (!res.ok) {
                            alert(result?.error || "Failed to delete category");
                            return;
                          }

                          window.location.reload();
                        } catch (error) {
                          console.error(error);
                          alert("Something went wrong while deleting the category.");
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {deletingId === category.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm italic">
            No categories created yet.
          </div>
        )}
      </div>
    </div>
  );
}