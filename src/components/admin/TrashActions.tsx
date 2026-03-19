"use client";

export default function TrashActions({ postId }: { postId: string }) {
  const handleRestore = async () => {
    const res = await fetch(`/api/posts/${postId}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to restore post");
      return;
    }

    window.location.reload();
  };

  const handlePermanentDelete = async () => {
    const ok = confirm(
      "This will permanently delete the post. This cannot be undone."
    );
    if (!ok) return;

    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to permanently delete post");
      return;
    }

    window.location.reload();
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={handleRestore}
        className="px-4 py-2 rounded-lg border"
      >
        Restore
      </button>

      <button
        type="button"
        onClick={handlePermanentDelete}
        className="px-4 py-2 rounded-lg bg-red-600 text-white"
      >
        Delete Permanently
      </button>
    </div>
  );
}