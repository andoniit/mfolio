"use client";

const CAPS = [
  { title: "Streaming responses", body: "Assistant text streams over AG-UI TEXT_MESSAGE_CHUNK events." },
  { title: "Tool calling", body: "searchProjects, filterProjectsByTech, getProjectDetails, blogs, resume, scroll, highlight, navigate." },
  { title: "Shared state", body: "STATE_SNAPSHOT keeps filters, highlights, and generative cards in sync with the UI." },
  { title: "Generative UI", body: "Project cards materialize from tool results + shared `generatedCards`." },
  { title: "Human approval", body: "Internal navigation from the agent waits for your OK on this page." },
  { title: "Event inspector", body: "Toggle “Show stream” to see a client-side AG-UI-style event log." },
  { title: "Portfolio search", body: "Live iframe preview updates when tools scroll or open routes." },
  { title: "Domain", body: "Built for anikap.tech — swap copy, keep the same AG-UI wiring." },
];

type Props = {
  onClose: () => void;
};

export default function CapabilityDiscovery({ onClose }: Props) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">AG-UI capability map</h3>
          <p className="mt-1 text-[11px] text-zinc-400">What this copilot demonstrates on top of your portfolio.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/5"
        >
          Close
        </button>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {CAPS.map((c) => (
          <li
            key={c.title}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left shadow-inner"
          >
            <div className="text-xs font-medium text-zinc-100">{c.title}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
