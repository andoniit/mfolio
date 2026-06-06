"use client";

export default function ExperienceTrashActions({ experienceId }: { experienceId: string }) {
  const handleRestore = async () => {
    const res = await fetch(`/api/experiences/${experienceId}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to restore experience");
      return;
    }

    window.location.reload();
  };

  const handlePermanentDelete = async () => {
    const ok = confirm("This will permanently delete the experience. Continue?");
    if (!ok) return;

    const res = await fetch(`/api/experiences/${experienceId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Failed to permanently delete experience");
      return;
    }

    window.location.reload();
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
      <button
        type="button"
        onClick={handleRestore}
        className="px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        Restore
      </button>

      <button
        type="button"
        onClick={handlePermanentDelete}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
      >
        Delete permanently
      </button>
    </div>
  );
}
