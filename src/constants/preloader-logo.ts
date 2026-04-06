/**
 * Logo GSAP intro timeline delay (seconds), tuned to overlap the home Preloader.
 * When the Preloader unmounts, `src/app/page.tsx` dispatches `mf:preloader-exited` (for optional listeners).
 * @see src/components/home/Preloader.jsx
 * @see src/components/layout/header/header.jsx (AnimatedSvgLogo)
 */
export const LOGO_INTRO_DELAY_SEC = 3.4;

export const LOGO_INTRO_SESSION_KEY = "mf_logo_intro_done";

export function hasLogoIntroPlayedSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(LOGO_INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLogoIntroPlayedSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LOGO_INTRO_SESSION_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
