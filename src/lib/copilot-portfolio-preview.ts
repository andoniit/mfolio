/** Iframe used on `/andon-copilot` to mirror the live portfolio for tool-driven scroll/navigation. */
export const COPILOT_PORTFOLIO_IFRAME_SELECTOR = 'iframe[data-copilot-portfolio-preview="true"]';

export function getCopilotPortfolioIframe(): HTMLIFrameElement | null {
  return document.querySelector(COPILOT_PORTFOLIO_IFRAME_SELECTOR);
}

function withPreviewEmbedParam(path: string): string {
  try {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("mfEmbed", "1");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path.includes("?") ? `${path}&mfEmbed=1` : `${path}?mfEmbed=1`;
  }
}

/**
 * Scrolls to a homepage section by id. If the copilot preview iframe is on another route
 * (e.g. `/projects`), navigates it to `/?mfEmbed=1#sectionId` so the fragment can scroll
 * after load, then runs scrollIntoView as a fallback.
 */
export function scrollToSectionInPreviewOrPage(sectionId: string): boolean {
  const direct = document.getElementById(sectionId);
  if (direct) {
    direct.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  const iframe = getCopilotPortfolioIframe();
  if (!iframe || typeof window === "undefined") return false;

  const targetSrc = (() => {
    const u = new URL("/", window.location.origin);
    u.searchParams.set("mfEmbed", "1");
    u.hash = `#${sectionId}`;
    return u.toString();
  })();

  const tryScrollInsideFrame = (): boolean => {
    try {
      const doc = iframe.contentDocument;
      const el = doc?.getElementById(sectionId);
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    } catch {
      return false;
    }
  };

  let onHomeDoc = false;
  try {
    const p = iframe.contentWindow?.location?.pathname ?? "";
    onHomeDoc = p === "/" || p === "";
  } catch {
    onHomeDoc = false;
  }

  if (onHomeDoc && tryScrollInsideFrame()) return true;

  const onLoad = () => {
    window.setTimeout(() => {
      tryScrollInsideFrame();
    }, 80);
    window.setTimeout(() => {
      tryScrollInsideFrame();
    }, 400);
  };
  iframe.addEventListener("load", onLoad, { once: true });
  iframe.src = targetSrc;
  return true;
}

export function navigatePreviewOrApp(path: string, navigateWithRouter: (path: string) => void): void {
  const iframe = getCopilotPortfolioIframe();
  if (iframe) {
    try {
      iframe.src = withPreviewEmbedParam(path);
      return;
    } catch {
      // fall through
    }
  }
  navigateWithRouter(path);
}
