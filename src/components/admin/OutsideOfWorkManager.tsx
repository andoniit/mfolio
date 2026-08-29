"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { GameHit } from "@/app/api/games/search/route";
import {
  DESCRIPTION_MAX,
  GAME_STATUSES,
  GAME_STATUS_LABEL,
  OUTSIDE_BUCKET,
  OUTSIDE_PREFIX,
  SUBTITLE_MAX,
  TITLE_MAX,
  type GameStatus,
  type OutsideItem,
  type OutsideKind,
} from "@/lib/outside-of-work";
import { adminFetch } from "@/lib/admin-fetch";

type Props = { items: OutsideItem[] };

const KIND_TABS: { kind: OutsideKind; label: string; addLabel: string; blurb: string }[] = [
  { kind: "photo", label: "Photos", addLabel: "photo", blurb: "The first one anchors the mosaic; five show on the site." },
  { kind: "game_photo", label: "PS5 captures", addLabel: "capture", blurb: "Screenshots off the console; same mosaic treatment." },
  { kind: "game", label: "Games", addLabel: "game", blurb: "Search a title to pull its cover art in automatically." },
];

/** Per-kind copy so one form serves photos, food, and games. */
const FIELD_COPY: Record<OutsideKind, { title: string; subtitle: string; link: string }> = {
  photo: { title: "Caption", subtitle: "Where / when", link: "Link (optional)" },
  game_photo: { title: "Caption", subtitle: "Which game", link: "Link (optional)" },
  game: { title: "Game title", subtitle: "Platform (e.g. PS5)", link: "Store or trailer link" },
};

type Draft = {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  storage_path: string | null;
  link_url: string;
  rating: string;
  game_status: string;
  is_published: boolean;
  sort_order: string;
};

const emptyDraft = (): Draft => ({
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  storage_path: null,
  link_url: "",
  rating: "",
  game_status: "",
  is_published: true,
  sort_order: "0",
});

const draftFrom = (item: OutsideItem): Draft => ({
  title: item.title,
  subtitle: item.subtitle ?? "",
  description: item.description ?? "",
  image_url: item.image_url ?? "",
  storage_path: item.storage_path,
  link_url: item.link_url ?? "",
  rating: item.rating == null ? "" : String(item.rating),
  game_status: item.game_status ?? "",
  is_published: item.is_published,
  sort_order: String(item.sort_order),
});

/** Turn a draft into the JSON body the API expects for this kind. */
function toPayload(kind: OutsideKind, draft: Draft) {
  return {
    kind,
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || null,
    description: draft.description.trim() || null,
    image_url: draft.image_url.trim() || null,
    storage_path: draft.storage_path,
    link_url: draft.link_url.trim() || null,
    rating: null,
    game_status: kind === "game" && draft.game_status ? draft.game_status : null,
    is_published: draft.is_published,
    sort_order: Number(draft.sort_order) || 0,
  };
}

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white";
const labelClass = "text-xs font-medium text-gray-500";

/**
 * Type a game, pick it, and the title, platform and cover fill themselves in.
 * Search runs through our own API so the RAWG key stays server-side.
 */
function GameSearch({ onPick }: { onPick: (hit: GameHit) => void }) {
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<GameHit[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [touched, setTouched] = useState(false);

  // Debounced so a fast typist doesn't fire a request per keystroke.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setHits([]);
      setNote(null);
      return;
    }
    let live = true;
    const id = window.setTimeout(async () => {
      setSearching(true);
      setTouched(true);
      try {
        const res = await adminFetch(`/api/games/search?q=${encodeURIComponent(q)}`);
        const body = await res.json();
        if (!live) return;
        if (!res.ok) {
          setNote(body?.error ?? "Search failed.");
          setHits([]);
          return;
        }
        setHits(body.results ?? []);
        setNote(body.note ?? null);
      } catch {
        if (live) setNote("Search failed.");
      } finally {
        if (live) setSearching(false);
      }
    }, 350);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [term]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
      <span className={labelClass}>Find the game</span>
      <div className="flex items-center gap-2">
        <input
          className={inputClass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Start typing a title…"
        />
        {searching && <span className="text-xs text-gray-400 shrink-0">Searching…</span>}
      </div>

      {note && <p className="text-xs text-amber-700 m-0">{note}</p>}

      {hits.length > 0 && (
        <ul className="flex flex-col gap-1 list-none p-0 m-0 max-h-64 overflow-y-auto">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(hit);
                  setTerm("");
                  setHits([]);
                }}
                className="w-full flex items-center gap-3 p-2 text-left bg-white border border-gray-200 rounded-lg hover:border-gray-400"
              >
                <span className="shrink-0 w-10 h-13 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {hit.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hit.image} alt="" className="w-10 h-14 object-cover" />
                  ) : (
                    <span className="text-gray-300 text-xs">?</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900 truncate">{hit.name}</span>
                  <span className="block text-xs text-gray-500 truncate">
                    {[hit.released?.slice(0, 4), hit.platforms.slice(0, 3).join(", ")]
                      .filter(Boolean)
                      .join(" · ") || hit.source}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {touched && !searching && hits.length === 0 && term.trim().length >= 2 && !note && (
        <p className="text-xs text-gray-400 m-0">Nothing found — fill the fields in by hand.</p>
      )}
    </div>
  );
}

function ItemForm({
  kind,
  draft,
  setDraft,
  onSubmit,
  onCancel,
  busy,
  submitLabel,
}: {
  kind: OutsideKind;
  draft: Draft;
  setDraft: (next: Draft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  busy: boolean;
  submitLabel: string;
}) {
  const [uploading, setUploading] = useState(false);
  const copy = FIELD_COPY[kind];

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${OUTSIDE_PREFIX}/${kind}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${ext}`;

      const { error } = await supabase.storage.from(OUTSIDE_BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        alert(error.message);
        return;
      }
      const { data } = supabase.storage.from(OUTSIDE_BUCKET).getPublicUrl(path);
      setDraft({ ...draft, image_url: data.publicUrl, storage_path: path });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {kind === "game" && (
        <GameSearch
          onPick={(hit) =>
            setDraft({
              ...draft,
              title: hit.name,
              // Prefer a console when the game lists one — this is a PS5 shelf.
              subtitle:
                hit.platforms.find((p) => /playstation|ps5|ps4/i.test(p)) ??
                hit.platforms[0] ??
                draft.subtitle,
              image_url: hit.image ?? draft.image_url,
              storage_path: null,
            })
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{copy.title}</span>
          <input
            className={inputClass}
            value={draft.title}
            maxLength={TITLE_MAX}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder={kind === "game" ? "Unravel Two" : kind === "game_photo" ? "Photo mode shot" : "Evening run"}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{copy.subtitle}</span>
          <input
            className={inputClass}
            value={draft.subtitle}
            maxLength={SUBTITLE_MAX}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            placeholder={kind === "game" ? "PS5" : kind === "game_photo" ? "Ghost of Tsushima" : "Chicago, 2026"}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClass}>{copy.link}</span>
          <input
            className={inputClass}
            value={draft.link_url}
            onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
            placeholder="https://…"
          />
        </label>

        {kind === "game" && (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Status</span>
            <select
              className={inputClass}
              value={draft.game_status}
              onChange={(e) => setDraft({ ...draft, game_status: e.target.value })}
            >
              <option value="">No status</option>
              {GAME_STATUSES.map((status: GameStatus) => (
                <option key={status} value={status}>
                  {GAME_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Order (lower shows first)</span>
          <input
            type="number"
            className={inputClass}
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClass}>Notes (optional)</span>
          <textarea
            className={inputClass}
            rows={2}
            maxLength={DESCRIPTION_MAX}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>
      </div>

      {/* Image: upload to storage, or paste a URL (game cover art usually is one) */}
      <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
        <span className={labelClass}>
          {kind === "game" ? "Cover art" : "Image"}
          {(kind === "photo" || kind === "game_photo") && (
            <span className="text-gray-400"> — required</span>
          )}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {draft.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.image_url}
              alt=""
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
            className="text-sm"
          />
          {uploading && <span className="text-xs text-gray-400">Uploading…</span>}
        </div>
        <input
          className={inputClass}
          value={draft.image_url}
          onChange={(e) => setDraft({ ...draft, image_url: e.target.value, storage_path: null })}
          placeholder="…or paste an image URL"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.is_published}
            onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
          />
          Show on the site
        </label>
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || uploading || !draft.title.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OutsideOfWorkManager({ items }: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<OutsideKind>("photo");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);

  const rows = useMemo(() => items.filter((i) => i.kind === kind), [items, kind]);
  const counts = useMemo(
    () => ({
      photo: items.filter((i) => i.kind === "photo").length,
      game_photo: items.filter((i) => i.kind === "game_photo").length,
      game: items.filter((i) => i.kind === "game").length,
    }),
    [items]
  );

  const create = async () => {
    setBusy(true);
    try {
      const res = await adminFetch("/api/outside-of-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(kind, newDraft)),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => null);
        alert(r?.error || "Could not save.");
        return;
      }
      setNewDraft(emptyDraft());
      setAdding(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await adminFetch(`/api/outside-of-work/${id}`, {
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

  const remove = async (id: string) => {
    if (!confirm("Delete this permanently? An uploaded image is removed too.")) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/api/outside-of-work/${id}`, { method: "DELETE" });
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

  const activeTab = KIND_TABS.find((t) => t.kind === kind)!;

  return (
    <div className="flex flex-col gap-6">
      {/* Kind switcher */}
      <div className="flex flex-wrap gap-2">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            onClick={() => {
              setKind(tab.kind);
              setAdding(false);
              setEditingId(null);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
              kind === tab.kind
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs ${kind === tab.kind ? "text-gray-300" : "text-gray-400"}`}>
              {counts[tab.kind]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">{activeTab.blurb}</p>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
          className="ml-auto px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800"
        >
          {adding ? "Close" : `Add ${activeTab.addLabel}`}
        </button>
      </div>

      {adding && (
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <ItemForm
            kind={kind}
            draft={newDraft}
            setDraft={setNewDraft}
            onSubmit={create}
            onCancel={() => {
              setNewDraft(emptyDraft());
              setAdding(false);
            }}
            busy={busy}
            submitLabel="Add"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 italic px-1">
          Nothing here yet — the tile shows a &ldquo;Coming soon&rdquo; placeholder on the site.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {rows.map((item) => (
            <li
              key={item.id}
              className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm"
            >
              {editingId === item.id ? (
                <ItemForm
                  kind={kind}
                  draft={editDraft}
                  setDraft={setEditDraft}
                  busy={busy}
                  submitLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async () => {
                    if (await patch(item.id, toPayload(kind, editDraft))) setEditingId(null);
                  }}
                />
              ) : (
                <div className="flex items-center gap-4">
                  <span className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-lg font-bold">
                        {item.title.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate m-0">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate m-0 mt-0.5">
                      {[
                        item.subtitle,
                        item.game_status ? GAME_STATUS_LABEL[item.game_status] : null,
                        `order ${item.sort_order}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                      item.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.is_published ? "Live" : "Hidden"}
                  </span>

                  <div className="shrink-0 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patch(item.id, { is_published: !item.is_published })}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      {item.is_published ? "Hide" : "Publish"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditDraft(draftFrom(item));
                        setEditingId(item.id);
                        setAdding(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
