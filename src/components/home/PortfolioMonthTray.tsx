"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import Matter from "matter-js";
import styles from "./PortfolioMarbleTray.module.scss";

const { Engine, Runner, World, Bodies, Composite, Events, Body, Vector } = Matter;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WALL_THICK = 48;

type Obstacle = { x: number; y: number; w: number; h: number };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Responsive pill size: builds a comfortable baseline, **×3** for display,
 * then clamps / scales so all months fit in the red tile.
 */
function computeResponsivePillSize(width: number, height: number, n: number) {
  const short = Math.min(width, height);
  const maxWFromRow0 =
    (width * 0.91 - 4 * Math.max(0, n - 1)) / Math.max(n, 1) - 1;

  let pillH = (12 + height * 0.12) * 2.95;
  pillH = clamp(pillH, 16, Math.min(58, height * 0.34, short * 0.32));

  let pillW = Math.min(maxWFromRow0, pillH * 2.45, width * 0.46);
  pillW = clamp(pillW, 24, 180);

  if (pillW < pillH * 1.82) {
    pillH = clamp(pillW / 1.78, 14, pillH);
  }

  const TRIPLE = 3;
  pillH *= TRIPLE;
  pillW *= TRIPLE;

  let gap = clamp(short * 0.03 + pillH * 0.1, 8, 28);
  let maxW = (width * 0.95 - gap * Math.max(0, n - 1)) / Math.max(n, 1) - 0.25;
  pillW = Math.min(pillW, maxW, width * 0.48);
  pillH = Math.min(pillH, height * 0.48, short * 0.46);

  if (pillW < pillH * 1.68) {
    pillH = Math.min(pillH, pillW / 1.62);
  }

  let rowW = pillW * n + gap * Math.max(0, n - 1);
  if (rowW > width * 0.96) {
    const s = (width * 0.96) / rowW;
    pillW *= s;
    pillH *= s;
    gap *= s;
  }

  pillH = Math.max(14, pillH);
  pillW = Math.max(20, pillW);
  gap = Math.max(6, gap);

  const fontSize = clamp(pillH * 0.72, 14, 62);

  return { pillW, pillH, gap, fontSize };
}

function labelsForYearToDate(): string[] {
  const now = new Date();
  const m = now.getMonth();
  return Array.from(MONTH_SHORT.slice(0, m + 1));
}

type PillBody = Matter.Body & {
  monthLabel?: string;
  pillW?: number;
  pillH?: number;
  pillFontSize?: number;
};

function measureObstacle(
  root: HTMLElement,
  portfolioEl: HTMLElement | null
): Obstacle | null {
  if (!portfolioEl) return null;
  const rr = root.getBoundingClientRect();
  const pr = portfolioEl.getBoundingClientRect();
  const x = pr.left - rr.left;
  const y = pr.top - rr.top;
  const w = pr.width;
  const h = pr.height;
  if (w < 4 || h < 4) return null;
  return { x, y, w, h };
}

function buildWorld(
  engine: Matter.Engine,
  width: number,
  height: number,
  rng: () => number,
  obstacle: Obstacle | null,
  monthLabels: string[]
) {
  World.clear(engine.world, false);

  const n = monthLabels.length;
  const { pillW, pillH, gap, fontSize } = computeResponsivePillSize(width, height, n);

  /** Room below pill centers so rotated/chamfered hull stays inside the tile (overflow hidden). */
  const halfDiag = Math.hypot(pillW * 0.5, pillH * 0.5) * 1.12;
  const bottomPad = clamp(halfDiag + 14, 26, height * 0.22);
  const floorTop = height - bottomPad;

  const wallOpts = {
    isStatic: true,
    friction: 0.14,
    restitution: 0.14,
  };

  const hw = WALL_THICK / 2;
  const bottom = Bodies.rectangle(
    width / 2,
    floorTop + hw,
    width + WALL_THICK * 2,
    WALL_THICK,
    wallOpts
  );
  const top = Bodies.rectangle(width / 2, -hw + 1, width * 2, WALL_THICK, wallOpts);
  const left = Bodies.rectangle(-hw + 1, height / 2, WALL_THICK, height * 3, wallOpts);
  const right = Bodies.rectangle(width + hw - 1, height / 2, WALL_THICK, height * 3, wallOpts);

  const statics: Matter.Body[] = [bottom, top, left, right];

  if (obstacle) {
    const cx = obstacle.x + obstacle.w / 2;
    const cy = obstacle.y + obstacle.h / 2;
    const chamferR = Math.min(12, obstacle.w, obstacle.h) * 0.12;
    const block = Bodies.rectangle(cx, cy, obstacle.w, obstacle.h, {
      isStatic: true,
      friction: 0.2,
      restitution: 0.45,
      label: "portfolio-block",
      chamfer: { radius: chamferR },
    });
    statics.push(block);
  }

  World.add(engine.world, statics);

  const pills: Matter.Body[] = [];
  for (let i = 0; i < n; i++) {
    const spread = Math.max(0.12, (width - (pillW * n + gap * (n - 1))) / 2);
    const x =
      spread +
      pillW / 2 +
      i * (pillW + gap) +
      (rng() - 0.5) * Math.min(10, width * 0.03);
    const yLo = pillH * 0.55 + 8;
    const yHi = Math.max(yLo + 10, floorTop - halfDiag - 16);
    const y = yLo + rng() * Math.max(0, yHi - yLo);
    const pill = Bodies.rectangle(x, y, pillW, pillH, {
      friction: 0.08,
      frictionAir: 0.028,
      restitution: 0.32,
      density: 0.0034,
      label: "pill",
      chamfer: { radius: pillH * 0.42 },
      angle: (rng() - 0.5) * 0.35,
      angularVelocity: (rng() - 0.5) * 0.04,
    }) as PillBody;
    pill.monthLabel = monthLabels[i] ?? MONTH_SHORT[i % 12];
    pill.pillW = pillW;
    pill.pillH = pillH;
    pill.pillFontSize = fontSize;
    pills.push(pill);
  }
  World.add(engine.world, pills);
}

type Props = {
  portfolioBlockRef: RefObject<HTMLDivElement | null>;
};

export default function PortfolioMonthTray({ portfolioBlockRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const monthLabels = labelsForYearToDate();

    if (reduced) {
      const drawStatic = () => {
        const { width, height } = root.getBoundingClientRect();
        if (width < 2 || height < 2) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const { pillW, pillH, gap, fontSize } = computeResponsivePillSize(
          width,
          height,
          monthLabels.length
        );
        const totalW = monthLabels.length * pillW + (monthLabels.length - 1) * gap;
        let x = (width - totalW) / 2 + pillW / 2;
        const bottomPad = clamp(
          Math.hypot(pillW * 0.5, pillH * 0.5) * 1.12 + 14,
          26,
          height * 0.22
        );
        const y = height - bottomPad - pillH / 2;
        ctx.font = `600 ${fontSize}px var(--font-satoshi, ui-sans-serif, system-ui)`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const label of monthLabels) {
          ctx.beginPath();
          const r = pillH * 0.45;
          const px = x - pillW / 2;
          const py = y - pillH / 2;
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(px, py, pillW, pillH, r);
          } else {
            ctx.rect(px, py, pillW, pillH);
          }
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.12)";
          ctx.lineWidth = Math.max(1, Math.min(2, pillH * 0.055));
          ctx.stroke();
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(label, x, y);
          x += pillW + gap;
        }
      };
      drawStatic();
      const ro = new ResizeObserver(drawStatic);
      ro.observe(root);
      return () => ro.disconnect();
    }

    const engine = Engine.create({
      enableSleeping: true,
      gravity: { x: 0, y: 0.5, scale: 0.00072 },
    });

    let rngSeed = 890123;
    const rng = () => {
      rngSeed = (rngSeed * 16807) % 2147483647;
      return (rngSeed - 1) / 2147483646;
    };

    const runner = Runner.create();
    let running = false;

    const readObstacle = (): Obstacle | null =>
      measureObstacle(root, portfolioBlockRef.current);

    const draw = () => {
      const { width: w, height: h } = root.getBoundingClientRect();
      if (w < 2 || h < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.floor(w * dpr);
      const ch = Math.floor(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const bodies = Composite.allBodies(engine.world);
      for (const body of bodies) {
        if (body.isStatic || body.label !== "pill") continue;
        const pill = body as PillBody;
        const pw = pill.pillW ?? 120;
        const ph = pill.pillH ?? 52;
        const label = pill.monthLabel ?? "?";
        const fs = pill.pillFontSize ?? clamp(ph * 0.72, 14, 62);
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        const rx = -pw / 2;
        const ry = -ph / 2;
        const r = ph * 0.42;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(rx, ry, pw, ph, r);
        } else {
          ctx.rect(rx, ry, pw, ph);
        }
        ctx.fillStyle = "rgba(255,252,250,0.94)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.14)";
        ctx.lineWidth = Math.max(1, Math.min(2.2, ph * 0.05));
        ctx.stroke();
        ctx.font = `600 ${fs}px var(--font-satoshi, ui-sans-serif, system-ui)`;
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    };

    const syncSize = () => {
      const { width, height } = root.getBoundingClientRect();
      if (width < 8 || height < 8) return;
      buildWorld(engine, width, height, rng, readObstacle(), monthLabels);
    };

    const onBeforeUpdate = () => {
      const { active, x: mx, y: my } = mouseRef.current;
      if (!active) return;
      const bodies = Composite.allBodies(engine.world);
      const strength = 0.000055;
      const falloff = 22000;
      for (const body of bodies) {
        if (body.isStatic || body.label !== "pill") continue;
        const dx = mx - body.position.x;
        const dy = my - body.position.y;
        const dist2 = dx * dx + dy * dy + 420;
        const f = strength * falloff / dist2;
        Body.applyForce(body, body.position, Vector.create(dx * f, dy * f));
      }
    };

    syncSize();
    draw();
    const onAfterUpdate = () => draw();
    Events.on(engine, "beforeUpdate", onBeforeUpdate);
    Events.on(engine, "afterUpdate", onAfterUpdate);

    const io = new IntersectionObserver(
      ([e]) => {
        const vis = e?.isIntersecting ?? false;
        if (vis && !running) {
          Runner.run(runner, engine);
          running = true;
        } else if (!vis && running) {
          Runner.stop(runner);
          running = false;
        }
      },
      { threshold: 0.05, rootMargin: "80px" }
    );
    io.observe(root);

    const onPointerMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      mouseRef.current.active = true;
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      const nx = mouseRef.current.x / rect.width - 0.5;
      const ny = mouseRef.current.y / rect.height - 0.5;
      engine.gravity.x = nx * 0.82;
      engine.gravity.y = 0.42 + ny * 0.26;
    };

    const onPointerLeave = () => {
      mouseRef.current.active = false;
      engine.gravity.x = 0;
      engine.gravity.y = 0.5;
    };

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", onPointerLeave, { passive: true });
    root.addEventListener("pointerdown", onPointerMove, { passive: true });

    const ro = new ResizeObserver(() => {
      syncSize();
      draw();
    });
    ro.observe(root);
    const blockEl = portfolioBlockRef.current;
    if (blockEl) ro.observe(blockEl);

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerMove);
      Events.off(engine, "beforeUpdate", onBeforeUpdate);
      Events.off(engine, "afterUpdate", onAfterUpdate);
      ro.disconnect();
      io.disconnect();
      Runner.stop(runner);
      World.clear(engine.world, false);
    };
  }, [portfolioBlockRef]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
