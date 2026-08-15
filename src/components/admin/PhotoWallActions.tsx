"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_MAX, type PhotoWallStatus } from "@/lib/photo-wall";

type Props = {
  id: string;
  status: PhotoWallStatus;
  message: string;
};

export default function PhotoWallActions({ id, status, message }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/photo-wall/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => null);
        alert(r?.error || "Update failed.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this photo permanently? The uploaded image is removed too.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/photo-wall/${id}`, { method: "DELETE" });
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
      {/* Caption — editable before publishing (typos, trimming) */}
      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <span className="text-xs font-medium text-gray-500">Caption</span>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              maxLength={MESSAGE_MAX}
              rows={2}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={async () => {
                  if (await patch({ message: draft.trim() })) setEditing(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDraft(message);
                  setEditing(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <span className="text-xs text-gray-400 tabular-nums ml-auto">
                {draft.length}/{MESSAGE_MAX}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm text-gray-700 m-0 break-words">{message}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(true)}
              className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 shrink-0"
            >
              Edit
            </button>
          </div>
        )}
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
