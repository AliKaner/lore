"use client";

import { type CSSProperties, useEffect, useRef } from "react";

type Branch = {
  x: number;
  y: number;
  angle: number;
  width: number;
  life: number;
  depth: number;
  main: boolean;
  rgba: string;
};

const CARAMEL = "227,175,100";
const SAPPHIRE = "81,106,200";
const NAVY = "15,25,57";

const STEP = 1.6;
const MAX_DEPTH = 6;
const IDLE_FRAMES = 240;
const FADE_FRAMES = 170;

// A slowly growing field of branching ink lines: stories forking into
// chapters. Grows, rests, fades, and grows again.
export default function BranchField({
  roots = 10,
  maxBranches = 260,
  originY = 1,
  className,
  style,
}: {
  roots?: number;
  maxBranches?: number;
  originY?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let branches: Branch[] = [];
    let spawned = 0;
    let restFrames = 0;
    let visible = true;
    let raf = 0;

    function seed() {
      ctx!.clearRect(0, 0, width, height);
      branches = [];
      spawned = 0;
      restFrames = 0;
      const baseY = height * originY + 4;
      const reach = Math.min(baseY, 900);
      for (let i = 0; i < roots; i++) {
        const main = i % 4 === 0;
        branches.push({
          x: width * (0.04 + 0.92 * ((i + Math.random() * 0.8) / roots)),
          y: baseY,
          angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.7,
          width: main ? 2.2 : 1.35,
          life: reach * (0.45 + Math.random() * 0.45),
          depth: 0,
          main,
          rgba: main ? `rgba(${CARAMEL},0.95)` : `rgba(${SAPPHIRE},0.6)`,
        });
        spawned++;
      }
      for (const fromLeft of [true, false]) {
        for (let i = 0; i < 2; i++) {
          branches.push({
            x: fromLeft ? -2 : width + 2,
            y: baseY - reach * (0.1 + Math.random() * 0.45),
            angle: fromLeft
              ? -Math.PI / 4 + (Math.random() - 0.5) * 0.5
              : (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.5,
            width: 1.35,
            life: width * (0.18 + Math.random() * 0.14),
            depth: 0,
            main: i === 0,
            rgba: i === 0 ? `rgba(${CARAMEL},0.9)` : `rgba(${SAPPHIRE},0.55)`,
          });
          spawned++;
        }
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawNode(x: number, y: number, branch: Branch) {
      const size = branch.depth < 2 ? 3.4 : 2.2;
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.rotate(Math.PI / 4);
      ctx!.fillStyle =
        branch.main || branch.depth < 2 ? `rgba(${CARAMEL},0.9)` : `rgba(${SAPPHIRE},0.55)`;
      ctx!.fillRect(-size / 2, -size / 2, size, size);
      ctx!.restore();
    }

    function grow() {
      const next: Branch[] = [];
      ctx!.lineCap = "round";
      for (const branch of branches) {
        const nx = branch.x + Math.cos(branch.angle) * STEP;
        const ny = branch.y + Math.sin(branch.angle) * STEP;
        ctx!.strokeStyle = branch.rgba;
        ctx!.lineWidth = branch.width;
        ctx!.beginPath();
        ctx!.moveTo(branch.x, branch.y);
        ctx!.lineTo(nx, ny);
        ctx!.stroke();

        branch.x = nx;
        branch.y = ny;
        branch.angle += (Math.random() - 0.5) * 0.08;
        branch.life -= STEP;

        const outside = ny < -10 || nx < -10 || nx > width + 10;
        if (branch.life <= 0 || outside) {
          if (!outside && branch.depth > 0) drawNode(nx, ny, branch);
          continue;
        }

        const canSplit = branch.depth < MAX_DEPTH && spawned < maxBranches;
        if (canSplit && Math.random() < 0.013) {
          drawNode(nx, ny, branch);
          const spread = 0.32 + Math.random() * 0.38;
          for (const side of [-1, 1]) {
            const keepsMain = branch.main && side === 1;
            const alpha = Math.max(0.24, 0.58 - branch.depth * 0.06);
            const tone = Math.random() < 0.15 ? NAVY : SAPPHIRE;
            next.push({
              x: nx,
              y: ny,
              angle: branch.angle + side * spread,
              width: Math.max(0.5, branch.width * 0.74),
              life: branch.life * (0.55 + Math.random() * 0.35),
              depth: branch.depth + 1,
              main: keepsMain,
              rgba: keepsMain ? branch.rgba : `rgba(${tone},${alpha})`,
            });
            spawned++;
          }
          continue;
        }
        next.push(branch);
      }
      branches = next;
    }

    function frame() {
      if (visible) {
        if (branches.length > 0) {
          grow();
        } else {
          restFrames++;
          if (restFrames > IDLE_FRAMES) {
            ctx!.save();
            ctx!.globalCompositeOperation = "destination-out";
            ctx!.fillStyle = "rgba(0,0,0,0.035)";
            ctx!.fillRect(0, 0, width, height);
            ctx!.restore();
          }
          if (restFrames > IDLE_FRAMES + FADE_FRAMES) seed();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    resize();

    if (reduceMotion) {
      for (let guard = 0; branches.length > 0 && guard < 6000; guard++) grow();
      return;
    }

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(canvas);
    let lastWidth = width;
    const sizing = new ResizeObserver(() => {
      if (Math.abs(canvas.getBoundingClientRect().width - lastWidth) > 1) {
        resize();
        lastWidth = width;
      }
    });
    sizing.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      visibility.disconnect();
      sizing.disconnect();
    };
  }, [roots, maxBranches, originY]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={style} />;
}
