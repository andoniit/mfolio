// Types for the vendored `liquid-glass.js` (kept byte-identical to the skill's
// source, so it stays a plain browser script that assigns `window.liquidGlass`).

export {};

export type LiquidGlassOptions = {
  /** Displacement strength; negative = magnifying bulge. Subtle -60, default -112, dramatic -180. */
  scale?: number;
  /** Per-channel scale stagger for the prism fringe; 0 disables it. */
  chroma?: number;
  /** Neutral interior inset, as a fraction of the smaller side. Higher = wider crisp centre. */
  border?: number;
  /** Edge-curvature softness (px) of the map's gray inset. */
  mapBlur?: number;
  /** Backdrop blur (px) behind the glass interior. */
  blur?: number;
  /** Backdrop saturation boost. */
  saturate?: number;
  /** Corner radius override (px); defaults to the element's computed border-radius. */
  radius?: number;
  /** Frosted blur (px) used where SVG-filtered backdrops aren't supported. */
  fallbackBlur?: number;
};

export type LiquidGlassHandle = {
  /** False on Safari/Firefox, where the frosted-blur fallback is applied instead. */
  supported: boolean;
  /** Rebuild the displacement map (call after a size change). */
  refresh: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    liquidGlass?: (el: Element, opts?: LiquidGlassOptions) => LiquidGlassHandle;
  }
}
