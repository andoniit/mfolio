/**
 * Spring-follow drag physics for the floating nav pill.
 *
 * Ported from the GlassCard controller: the element chases a target with a
 * stiffness/damping spring (so it lags, overshoots, and settles), squashes along
 * its direction of travel, and tracks the pointer as `--gx`/`--gy` so the CSS
 * glare can follow the cursor across the glass.
 *
 * Two things differ from the standalone GlassCard, because the pill is not a
 * free-floating card:
 *   - Coordinates are OFFSETS from the pill's flex-centered resting spot, so
 *     (0, 0) is home and returning is just a spring target — no layout math.
 *   - The loop parks itself when the spring settles and wakes on interaction,
 *     rather than running requestAnimationFrame for the life of the page.
 */

export type GlassPillOptions = {
  /** Drag only starts on this element (the rest of the pill stays clickable). */
  handle: HTMLElement;
  /** Keep-out margin from the viewport edges. */
  margin?: number;
  /** Release inside this radius of home and the pill springs back. */
  snapThreshold?: number;
  stiffness?: number;
  damping?: number;
  /** Skip the overshoot and squash entirely. */
  reducedMotion?: boolean;
  /** Fires when dragging starts/stops or the pill crosses the snap radius. */
  onDragState?: (state: { dragging: boolean; nearHome: boolean }) => void;
};

/** Below this much movement and velocity, the spring has visually settled. */
const SETTLE_EPSILON = 0.05;

export class GlassPill {
  private el: HTMLElement;
  private handle: HTMLElement;
  private margin: number;
  private snapThreshold: number;
  private stiffness: number;
  private damping: number;
  private reducedMotion: boolean;
  private onDragState?: GlassPillOptions["onDragState"];

  private w = 0;
  private h = 0;
  /** Viewport position of the resting spot, used to clamp offsets. */
  private baseLeft = 0;
  private baseTop = 0;

  private x = 0;
  private y = 0;
  private tx = 0;
  private ty = 0;
  private vx = 0;
  private vy = 0;

  private dragging = false;
  private grabDX = 0;
  private grabDY = 0;
  private nearHome = true;
  private raf = 0;
  private running = false;

  constructor(el: HTMLElement, opts: GlassPillOptions) {
    this.el = el;
    this.handle = opts.handle;
    this.margin = opts.margin ?? 12;
    this.snapThreshold = opts.snapThreshold ?? 70;
    this.stiffness = opts.stiffness ?? 0.12;
    this.damping = opts.damping ?? 0.72;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.onDragState = opts.onDragState;

    this.refresh();
    this.render();

    this.handle.addEventListener("pointerdown", this.onDown);
    this.el.addEventListener("pointermove", this.onMove);
    this.el.addEventListener("pointerup", this.onUp);
    this.el.addEventListener("pointercancel", this.onUp);
    window.addEventListener("resize", this.onResize, { passive: true });
  }

  /** Re-measure after a size change (intro width animation, hover padding). */
  refresh = () => {
    this.w = this.el.offsetWidth;
    this.h = this.el.offsetHeight;
    const rect = this.el.getBoundingClientRect();
    this.baseLeft = rect.left - this.x;
    this.baseTop = rect.top - this.y;
    this.clampTarget();
  };

  /** Spring back to the resting spot. */
  home = () => {
    this.tx = 0;
    this.ty = 0;
    this.setNearHome(true);
    this.wake();
  };

  destroy = () => {
    this.handle.removeEventListener("pointerdown", this.onDown);
    this.el.removeEventListener("pointermove", this.onMove);
    this.el.removeEventListener("pointerup", this.onUp);
    this.el.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("resize", this.onResize);
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.el.style.transform = "";
    this.el.style.removeProperty("--gx");
    this.el.style.removeProperty("--gy");
  };

  private onDown = (e: PointerEvent) => {
    // Interactive elements keep their own behavior; drag from anywhere else.
    if ((e.target as Element | null)?.closest("input, button, a, label")) return;
    this.refresh();
    this.dragging = true;
    this.grabDX = e.clientX - this.tx;
    this.grabDY = e.clientY - this.ty;
    this.onDragState?.({ dragging: true, nearHome: this.nearHome });
    try {
      this.handle.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer */
    }
    this.wake();
  };

  private onMove = (e: PointerEvent) => {
    // Glare follows the cursor across the glass, dragging or not.
    const rect = this.el.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) / rect.width) * 100;
    const gy = ((e.clientY - rect.top) / rect.height) * 100;
    this.el.style.setProperty("--gx", gx.toFixed(1) + "%");
    this.el.style.setProperty("--gy", gy.toFixed(1) + "%");
    if (!this.dragging) return;
    this.tx = e.clientX - this.grabDX;
    this.ty = e.clientY - this.grabDY;
    this.clampTarget();
    this.setNearHome(Math.hypot(this.tx, this.ty) < this.snapThreshold);
    this.wake();
  };

  private onUp = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.handle.hasPointerCapture(e.pointerId)) {
      this.handle.releasePointerCapture(e.pointerId);
    }
    // Dropped close to home: let the spring pull it back into place.
    if (Math.hypot(this.tx, this.ty) < this.snapThreshold) this.home();
    this.onDragState?.({ dragging: false, nearHome: this.nearHome });
    this.wake();
  };

  private onResize = () => {
    this.refresh(); // map regeneration is handled by liquid-glass.js
    this.wake();
  };

  private setNearHome(next: boolean) {
    if (next === this.nearHome) return;
    this.nearHome = next;
    this.onDragState?.({ dragging: this.dragging, nearHome: next });
  }

  private clampTarget() {
    const m = this.margin;
    const minX = m - this.baseLeft;
    const maxX = window.innerWidth - this.w - m - this.baseLeft;
    const minY = m - this.baseTop;
    const maxY = window.innerHeight - this.h - m - this.baseTop;
    this.tx = Math.min(Math.max(this.tx, Math.min(minX, maxX)), Math.max(minX, maxX));
    this.ty = Math.min(Math.max(this.ty, Math.min(minY, maxY)), Math.max(minY, maxY));
  }

  /** Start the loop if it parked itself after settling. */
  private wake() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = () => {
    if (this.reducedMotion) {
      this.x = this.tx;
      this.y = this.ty;
      this.vx = 0;
      this.vy = 0;
    } else {
      this.vx = (this.vx + (this.tx - this.x) * this.stiffness) * this.damping;
      this.vy = (this.vy + (this.ty - this.y) * this.stiffness) * this.damping;
      this.x += this.vx;
      this.y += this.vy;
    }
    this.render();

    const settled =
      !this.dragging &&
      Math.hypot(this.vx, this.vy) < SETTLE_EPSILON &&
      Math.hypot(this.tx - this.x, this.ty - this.y) < SETTLE_EPSILON;

    if (settled) {
      // Land exactly on target so no sub-pixel drift is left behind.
      this.x = this.tx;
      this.y = this.ty;
      this.render();
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private render() {
    // Gentler squash than a droplet — this is a solid widget of glass.
    const speed = Math.hypot(this.vx, this.vy);
    const squash = this.reducedMotion ? 0 : Math.min(speed / 120, 0.08);
    if (squash < 0.001) {
      this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
      return;
    }
    const angle = Math.atan2(this.vy, this.vx);
    this.el.style.transform =
      `translate(${this.x}px, ${this.y}px) ` +
      `rotate(${angle}rad) scale(${1 + squash}, ${1 - squash}) rotate(${-angle}rad)`;
  }
}
