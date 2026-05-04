"use client";

import { useCopilotShowcaseContext } from "@/context/CopilotShowcaseContext";

export default function AgUiEventInspector() {
  const { events, clearEvents, showInspector, setShowInspector } = useCopilotShowcaseContext();

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">AG-UI events</span>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-400">
          <input
            type="checkbox"
            checked={showInspector}
            onChange={(e) => setShowInspector(e.target.checked)}
            className="rounded border-white/20 bg-transparent"
          />
          Show stream
        </label>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
        Client-side mirror of the event-driven run (RUN_*, TEXT_*, TOOL_*, STATE_*). Handy for demos on{" "}
        <span className="text-zinc-400">anikap.tech</span>.
      </p>
      {showInspector ? (
        <div className="mt-2 space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearEvents}
              className="text-[11px] text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Clear log
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-white/5 bg-black/40 font-mono text-[10px] leading-relaxed">
            {events.length === 0 ? (
              <div className="p-3 text-zinc-600">Send a message to populate events…</div>
            ) : (
              events.map((e) => (
                <div key={e.id} className="border-b border-white/5 px-2 py-1.5 last:border-0">
                  <div className="flex flex-wrap gap-x-2 text-zinc-500">
                    <span className="text-zinc-600">{new Date(e.at).toLocaleTimeString()}</span>
                    <span className="font-semibold text-cyan-300/90">{e.type}</span>
                    {e.detail ? <span className="text-zinc-500">{e.detail}</span> : null}
                  </div>
                  {e.payload ? (
                    <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words text-zinc-500">
                      {e.payload}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
