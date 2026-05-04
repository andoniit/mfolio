/** Fetches `/api/resume` JSON and opens the public PDF URL in a new tab. */
export async function openResumePdfFromApi(): Promise<void> {
  try {
    const res = await fetch("/api/resume", { cache: "no-store" });
    const data = (await res.json()) as { url?: string | null };
    const url = typeof data.url === "string" && data.url ? data.url : null;
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore */
  }
}
