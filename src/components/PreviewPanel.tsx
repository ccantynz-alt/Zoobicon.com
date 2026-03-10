"use client";

import { useMemo, useRef, useEffect } from "react";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
}

/** Particle field — scattered glowing dots across the entire canvas */
function ParticleField({ count, speed }: { count: number; speed: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      delay: Math.random() * 6,
      duration: (3 + Math.random() * 5) / speed,
      drift: 15 + Math.random() * 40,
      opacity: 0.2 + Math.random() * 0.5,
      hue: 195 + Math.random() * 35,
    }));
  }, [count, speed]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `hsl(${p.hue}, 85%, 65%)`,
            boxShadow: `0 0 ${p.size * 4}px hsla(${p.hue}, 85%, 65%, 0.7)`,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: p.opacity,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </>
  );
}

/** Rising light streaks that move upward like energy being created */
function RisingStreaks({ count, speed }: { count: number; speed: number }) {
  const streaks = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      width: 1 + Math.random() * 2,
      height: 40 + Math.random() * 120,
      delay: Math.random() * 8,
      duration: (4 + Math.random() * 6) / speed,
      hue: 200 + Math.random() * 30,
      opacity: 0.06 + Math.random() * 0.14,
    }));
  }, [count, speed]);

  return (
    <>
      {streaks.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`,
            bottom: "-20%",
            width: s.width,
            height: s.height,
            background: `linear-gradient(to top, transparent, hsla(${s.hue}, 80%, 60%, ${s.opacity}), transparent)`,
            animation: `streak-rise ${s.duration}s ease-in-out ${s.delay}s infinite`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </>
  );
}

/**
 * Animated tiger made of blue glowing dots — walks around, sits, gets up, walks again.
 * Full-screen canvas overlay that represents Zoobic Safari (the Philippines zoo).
 */
function TigerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Dot type: [relX, relY, radius, brightness, group]
    // group: 'body'|'head'|'leg-fl'|'leg-fr'|'leg-bl'|'leg-br'|'tail'|'stripe'|'ear'|'eye'|'whisker'
    type Dot = { rx: number; ry: number; r: number; b: number; g: string };
    type Pose = { dots: Dot[]; w: number; h: number };

    const line = (dots: Dot[], x1: number, y1: number, x2: number, y2: number, n: number, r: number, b: number, g: string) => {
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        dots.push({ rx: x1 + (x2 - x1) * t, ry: y1 + (y2 - y1) * t, r, b, g });
      }
    };
    const arc = (dots: Dot[], cx: number, cy: number, rad: number, a1: number, a2: number, n: number, r: number, b: number, g: string) => {
      for (let i = 0; i <= n; i++) {
        const a = a1 + (a2 - a1) * (i / n);
        dots.push({ rx: cx + Math.cos(a) * rad, ry: cy + Math.sin(a) * rad, r, b, g });
      }
    };
    const scatter = (dots: Dot[], cx: number, cy: number, rx: number, ry: number, n: number, r: number, b: number, g: string) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random());
        dots.push({ rx: cx + Math.cos(a) * d * rx, ry: cy + Math.sin(a) * d * ry, r, b, g });
      }
    };

    // Build side-view walking tiger (facing right) — origin at center-bottom
    function buildTiger(): Pose {
      const dots: Dot[] = [];
      // Body — elongated oval
      arc(dots, 0, -40, 55, 0, Math.PI * 2, 50, 1.5, 0.6, "body");
      arc(dots, 0, -40, 48, 0, Math.PI * 2, 40, 1.2, 0.4, "body");
      scatter(dots, 0, -40, 45, 28, 40, 1.0, 0.3, "body");

      // Body stripes (vertical dark bands)
      line(dots, -20, -65, -25, -18, 6, 1.4, 0.9, "stripe");
      line(dots, -5, -68, -8, -15, 6, 1.4, 0.9, "stripe");
      line(dots, 10, -66, 8, -16, 6, 1.4, 0.9, "stripe");
      line(dots, 25, -62, 22, -20, 5, 1.4, 0.9, "stripe");

      // Head — circle, offset right (facing direction)
      const hx = 62, hy = -52;
      arc(dots, hx, hy, 26, 0, Math.PI * 2, 30, 1.5, 0.7, "head");
      arc(dots, hx, hy, 22, 0, Math.PI * 2, 24, 1.2, 0.5, "head");
      scatter(dots, hx, hy, 18, 18, 15, 1.0, 0.35, "head");

      // Ears
      line(dots, hx - 12, hy - 22, hx - 20, hy - 40, 6, 1.3, 0.8, "ear");
      line(dots, hx - 20, hy - 40, hx - 5, hy - 32, 5, 1.3, 0.8, "ear");
      line(dots, hx + 8, hy - 24, hx + 14, hy - 42, 6, 1.3, 0.8, "ear");
      line(dots, hx + 14, hy - 42, hx + 22, hy - 30, 5, 1.3, 0.8, "ear");

      // Face stripes
      line(dots, hx - 5, hy - 24, hx - 10, hy - 8, 4, 1.2, 0.85, "stripe");
      line(dots, hx + 5, hy - 24, hx + 10, hy - 8, 4, 1.2, 0.85, "stripe");

      // Eyes — bright dots
      dots.push({ rx: hx + 12, ry: hy - 6, r: 2.5, b: 1.0, g: "eye" });
      dots.push({ rx: hx + 12, ry: hy - 7, r: 1.5, b: 1.0, g: "eye" });

      // Nose
      dots.push({ rx: hx + 24, ry: hy + 2, r: 2.5, b: 0.95, g: "head" });
      // Muzzle
      arc(dots, hx + 18, hy + 4, 10, -0.5, 0.5, 6, 1.2, 0.6, "head");

      // Whiskers (facing right)
      line(dots, hx + 20, hy - 2, hx + 45, hy - 10, 6, 0.8, 0.5, "whisker");
      line(dots, hx + 22, hy + 2, hx + 48, hy + 2, 6, 0.8, 0.5, "whisker");
      line(dots, hx + 20, hy + 6, hx + 44, hy + 12, 6, 0.8, 0.5, "whisker");

      // Front legs (will be animated via leg group offset)
      line(dots, 30, -15, 35, 0, 6, 1.4, 0.65, "leg-fr");
      line(dots, 28, -15, 28, 0, 5, 1.3, 0.55, "leg-fr");

      line(dots, 20, -15, 22, 0, 6, 1.4, 0.65, "leg-fl");
      line(dots, 18, -15, 15, 0, 5, 1.3, 0.55, "leg-fl");

      // Back legs
      line(dots, -32, -18, -30, 0, 6, 1.4, 0.65, "leg-br");
      line(dots, -34, -18, -38, 0, 5, 1.3, 0.55, "leg-br");

      line(dots, -42, -18, -45, 0, 6, 1.4, 0.65, "leg-bl");
      line(dots, -44, -18, -48, 0, 5, 1.3, 0.55, "leg-bl");

      // Paws — small clusters at leg bottoms
      scatter(dots, 33, 2, 4, 3, 4, 1.0, 0.6, "leg-fr");
      scatter(dots, 19, 2, 4, 3, 4, 1.0, 0.6, "leg-fl");
      scatter(dots, -31, 2, 4, 3, 4, 1.0, 0.6, "leg-br");
      scatter(dots, -46, 2, 4, 3, 4, 1.0, 0.6, "leg-bl");

      // Tail — curved upward from back
      const tailPts: [number, number][] = [[-55, -35], [-65, -50], [-72, -60], [-76, -68], [-78, -74], [-75, -80]];
      for (let i = 0; i < tailPts.length - 1; i++) {
        line(dots, tailPts[i][0], tailPts[i][1], tailPts[i + 1][0], tailPts[i + 1][1], 3, 1.3, 0.6, "tail");
      }
      // Tail stripes
      dots.push({ rx: -68, ry: -56, r: 1.5, b: 0.9, g: "stripe" });
      dots.push({ rx: -75, ry: -72, r: 1.5, b: 0.9, g: "stripe" });

      return { dots, w: 180, h: 100 };
    }

    const tiger = buildTiger();

    // Behavior state machine: walk-right → sit → walk-left → sit → repeat
    type State = "walk-right" | "sitting-down" | "sitting" | "standing-up" | "walk-left";
    let state: State = "walk-right";
    let stateTime = 0;
    let posX = -100;
    let posY = 0; // bottom offset
    let facingRight = true;
    let walkCycle = 0;
    let sitProgress = 0; // 0 = standing, 1 = fully sitting

    const WALK_SPEED = 0.8;
    const SIT_DURATION = 240; // frames sitting
    const TRANSITION_FRAMES = 40; // sit/stand transition

    let frame = 0;
    let animId: number;

    const draw = () => {
      frame++;
      stateTime++;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const groundY = H * 0.72; // tiger walks in lower portion, above the text
      const scale = Math.min(W, H) / 450; // responsive scale

      // State machine
      switch (state) {
        case "walk-right":
          posX += WALK_SPEED;
          walkCycle += 0.06;
          sitProgress = Math.max(0, sitProgress - 0.03);
          if (posX > W * 0.6 / scale) {
            state = "sitting-down";
            stateTime = 0;
          }
          break;
        case "sitting-down":
          sitProgress = Math.min(1, stateTime / TRANSITION_FRAMES);
          walkCycle += 0.01; // slow to stop
          if (sitProgress >= 1) {
            state = "sitting";
            stateTime = 0;
          }
          break;
        case "sitting":
          if (stateTime > SIT_DURATION) {
            state = "standing-up";
            stateTime = 0;
          }
          break;
        case "standing-up":
          sitProgress = Math.max(0, 1 - stateTime / TRANSITION_FRAMES);
          if (sitProgress <= 0) {
            state = "walk-left";
            stateTime = 0;
            facingRight = false;
          }
          break;
        case "walk-left":
          posX -= WALK_SPEED;
          walkCycle += 0.06;
          if (posX < W * 0.25 / scale) {
            state = "sitting-down";
            stateTime = 0;
            facingRight = true;
          }
          // Wrap if gone off screen
          if (posX < -150) {
            posX = -100;
            state = "walk-right";
            facingRight = true;
            stateTime = 0;
          }
          break;
      }

      // Leg animation offsets based on walk cycle
      const legSwing = (state === "sitting" || sitProgress > 0.5) ? 0 : 8;
      const legOffsets: Record<string, [number, number]> = {
        "leg-fl": [Math.sin(walkCycle) * legSwing, Math.abs(Math.sin(walkCycle)) * -3 * (1 - sitProgress)],
        "leg-fr": [Math.sin(walkCycle + Math.PI * 0.5) * legSwing, Math.abs(Math.sin(walkCycle + Math.PI * 0.5)) * -3 * (1 - sitProgress)],
        "leg-bl": [Math.sin(walkCycle + Math.PI) * legSwing, Math.abs(Math.sin(walkCycle + Math.PI)) * -3 * (1 - sitProgress)],
        "leg-br": [Math.sin(walkCycle + Math.PI * 1.5) * legSwing, Math.abs(Math.sin(walkCycle + Math.PI * 1.5)) * -3 * (1 - sitProgress)],
      };

      // Sitting: back legs tuck, body lowers, tail wraps
      const bodyDip = sitProgress * 12;
      const backLegTuck = sitProgress * 15;
      const tailCurl = sitProgress;

      // Draw each dot
      for (let i = 0; i < tiger.dots.length; i++) {
        const d = tiger.dots[i];
        let dx = d.rx;
        let dy = d.ry;

        // Apply sitting deformation
        if (d.g === "leg-bl" || d.g === "leg-br") {
          dx += (d.g === "leg-bl" ? -1 : 1) * backLegTuck * 0.5;
          dy += backLegTuck * 0.3;
        }
        if (d.g === "body" || d.g === "stripe" || d.g === "head" || d.g === "ear" || d.g === "eye" || d.g === "whisker") {
          dy += bodyDip;
        }
        if (d.g === "tail") {
          dx += tailCurl * 15;
          dy += bodyDip * 0.5 + tailCurl * 8;
        }

        // Leg walk offsets
        const lo = legOffsets[d.g];
        if (lo) {
          dx += lo[0];
          dy += lo[1];
        }

        // Mirror if facing left
        const fx = facingRight ? dx : -dx;

        // Transform to screen coords
        const sx = posX * scale + fx * scale + W * 0.15;
        const sy = groundY + dy * scale;

        // Skip if off screen
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;

        // Subtle floating per dot
        const ox = Math.sin(frame * 0.015 + i * 0.7) * 0.8;
        const oy = Math.cos(frame * 0.012 + i * 0.5) * 0.8;
        const pulse = 0.7 + 0.3 * Math.sin(frame * 0.03 + i * 0.3);
        const alpha = d.b * pulse;
        const hue = 200 + (i % 30);
        const dotR = d.r * scale;

        // Glow
        const grad = ctx.createRadialGradient(sx + ox, sy + oy, 0, sx + ox, sy + oy, dotR * 4);
        grad.addColorStop(0, `hsla(${hue}, 85%, 65%, ${alpha * 0.5})`);
        grad.addColorStop(0.4, `hsla(${hue}, 80%, 55%, ${alpha * 0.15})`);
        grad.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(sx + ox, sy + oy, dotR * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(sx + ox, sy + oy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 85%, 70%, ${alpha})`;
        ctx.fill();
      }

      // Faint ground line / reflection under the tiger
      const gx = posX * scale + W * 0.15;
      const groundGrad = ctx.createRadialGradient(gx, groundY + 5 * scale, 0, gx, groundY + 5 * scale, 80 * scale);
      groundGrad.addColorStop(0, "rgba(59,130,246,0.06)");
      groundGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(gx, groundY + 5 * scale, 80 * scale, 0, Math.PI * 2);
      ctx.fillStyle = groundGrad;
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[5]"
      style={{ pointerEvents: "none" }}
    />
  );
}

/** Full-screen atmospheric idle background */
function IdleAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base deep gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, #0c1a30 0%, #080c18 40%, #0a0a0f 70%)",
        }}
      />

      {/* Large aurora sweep — top */}
      <div
        className="absolute w-[180%] h-[400px] -left-[40%] top-[5%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.10) 15%, rgba(14,165,233,0.15) 35%, rgba(0,180,255,0.12) 55%, rgba(59,130,246,0.08) 75%, transparent 100%)",
          filter: "blur(50px)",
          animation: "aurora-drift-1 16s ease-in-out infinite",
          transform: "rotate(-3deg)",
        }}
      />

      {/* Aurora sweep — mid */}
      <div
        className="absolute w-[160%] h-[350px] -left-[30%] top-[30%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.08) 20%, rgba(37,99,235,0.14) 45%, rgba(96,165,250,0.10) 65%, rgba(0,220,255,0.06) 85%, transparent 100%)",
          filter: "blur(60px)",
          animation: "aurora-drift-2 20s ease-in-out infinite",
          transform: "rotate(2deg)",
        }}
      />

      {/* Aurora sweep — bottom */}
      <div
        className="absolute w-[150%] h-[300px] -left-[25%] bottom-[5%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.08) 25%, rgba(14,165,233,0.12) 50%, rgba(37,99,235,0.07) 75%, transparent 100%)",
          filter: "blur(55px)",
          animation: "aurora-drift-3 14s ease-in-out infinite",
          transform: "rotate(-1.5deg)",
        }}
      />

      {/* Floating orb — left side */}
      <div
        className="absolute w-[300px] h-[300px] top-[20%] left-[10%]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 60%)",
          filter: "blur(40px)",
          animation: "orb-float-1 12s ease-in-out infinite",
        }}
      />

      {/* Floating orb — right side */}
      <div
        className="absolute w-[250px] h-[250px] top-[40%] right-[15%]"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.08) 0%, transparent 60%)",
          filter: "blur(40px)",
          animation: "orb-float-2 15s ease-in-out infinite",
        }}
      />

      {/* Particles */}
      <ParticleField count={40} speed={1} />

      {/* Gentle rising streaks */}
      <RisingStreaks count={8} speed={0.7} />

      {/* Horizontal light lines */}
      <div
        className="absolute top-[25%] left-0 w-full h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.15) 25%, rgba(0,200,255,0.25) 50%, rgba(96,165,250,0.15) 75%, transparent 100%)",
          animation: "line-glow 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[60%] left-0 w-full h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.12) 20%, rgba(14,165,233,0.20) 50%, rgba(37,99,235,0.12) 80%, transparent 100%)",
          animation: "line-glow 10s ease-in-out 4s infinite",
        }}
      />

      {/* Bottom blue pool glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: "linear-gradient(to top, rgba(37,99,235,0.06) 0%, rgba(14,165,233,0.02) 50%, transparent 100%)",
          animation: "bottom-breathe 10s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Full-screen generating atmosphere — intense, alive, energetic */
function GeneratingAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base — warmer, more alive */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #0d1f3c 0%, #080e1e 50%, #0a0a0f 80%)",
        }}
      />

      {/* Aurora band 1 — FAST, BRIGHT */}
      <div
        className="absolute w-[200%] h-[400px] -left-[50%] top-[0%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.18) 10%, rgba(14,165,233,0.28) 25%, rgba(0,220,255,0.22) 40%, rgba(59,130,246,0.16) 60%, rgba(37,99,235,0.12) 80%, transparent 100%)",
          filter: "blur(40px)",
          animation: "aurora-gen-1 6s ease-in-out infinite",
          transform: "rotate(-4deg)",
        }}
      />

      {/* Aurora band 2 — mid, wider, counter-direction */}
      <div
        className="absolute w-[180%] h-[380px] -left-[40%] top-[25%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.14) 15%, rgba(37,99,235,0.24) 35%, rgba(96,165,250,0.18) 55%, rgba(0,240,255,0.12) 75%, transparent 100%)",
          filter: "blur(45px)",
          animation: "aurora-gen-2 8s ease-in-out infinite",
          transform: "rotate(3deg)",
        }}
      />

      {/* Aurora band 3 — bottom, warm blue wash */}
      <div
        className="absolute w-[170%] h-[350px] -left-[35%] bottom-[0%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.14) 20%, rgba(14,165,233,0.22) 40%, rgba(0,180,255,0.18) 60%, rgba(37,99,235,0.10) 80%, transparent 100%)",
          filter: "blur(50px)",
          animation: "aurora-gen-3 5s ease-in-out infinite",
          transform: "rotate(-2deg)",
        }}
      />

      {/* Pulsing central glow — like a forge */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.04) 30%, transparent 60%)",
          animation: "core-pulse 2.5s ease-in-out infinite",
        }}
      />

      {/* Fast-moving orbs */}
      <div
        className="absolute w-[350px] h-[350px] top-[10%] left-[5%]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 50%)",
          filter: "blur(30px)",
          animation: "orb-gen-1 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] top-[30%] right-[5%]"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 50%)",
          filter: "blur(30px)",
          animation: "orb-gen-2 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[280px] h-[280px] bottom-[10%] left-[30%]"
        style={{
          background: "radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 50%)",
          filter: "blur(30px)",
          animation: "orb-gen-3 3.5s ease-in-out infinite",
        }}
      />

      {/* LOTS of particles, FAST */}
      <ParticleField count={80} speed={2.5} />

      {/* Rising energy streaks — fast, plentiful */}
      <RisingStreaks count={20} speed={2} />

      {/* Energy wave pulses — horizontal bands washing across */}
      <div
        className="absolute top-[15%] left-0 w-full h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.3) 25%, rgba(0,240,255,0.5) 50%, rgba(96,165,250,0.3) 75%, transparent 100%)",
          animation: "energy-wave 2.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[40%] left-0 w-full h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.25) 20%, rgba(14,165,233,0.40) 50%, rgba(37,99,235,0.25) 80%, transparent 100%)",
          animation: "energy-wave 3.5s ease-in-out 0.8s infinite",
        }}
      />
      <div
        className="absolute top-[65%] left-0 w-full h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.20) 15%, rgba(59,130,246,0.35) 50%, rgba(0,200,255,0.20) 85%, transparent 100%)",
          animation: "energy-wave 3s ease-in-out 1.6s infinite",
        }}
      />
      <div
        className="absolute top-[85%] left-0 w-full h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.20) 30%, rgba(0,220,255,0.30) 50%, rgba(96,165,250,0.20) 70%, transparent 100%)",
          animation: "energy-wave 2.8s ease-in-out 2.2s infinite",
        }}
      />

      {/* Bottom glow — intensified */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50%]"
        style={{
          background: "linear-gradient(to top, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.04) 40%, transparent 100%)",
          animation: "bottom-breathe-fast 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export default function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html || "", [html]);

  const sharedStyles = `
    @keyframes particle-float {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(calc(var(--drift) * -1)) translateX(calc(var(--drift) * 0.5));
        opacity: 0.8;
      }
      50% {
        transform: translateY(calc(var(--drift) * -0.5)) translateX(calc(var(--drift) * -0.3));
        opacity: 0.15;
      }
      75% {
        transform: translateY(calc(var(--drift) * 0.3)) translateX(calc(var(--drift) * -0.8));
        opacity: 0.7;
      }
    }
    @keyframes streak-rise {
      0% { transform: translateY(0); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { transform: translateY(-120vh); opacity: 0; }
    }
    @keyframes aurora-drift-1 {
      0%, 100% { transform: rotate(-3deg) translateX(-60px); }
      50% { transform: rotate(-3deg) translateX(100px); }
    }
    @keyframes aurora-drift-2 {
      0%, 100% { transform: rotate(2deg) translateX(40px); }
      50% { transform: rotate(2deg) translateX(-80px); }
    }
    @keyframes aurora-drift-3 {
      0%, 100% { transform: rotate(-1.5deg) translateX(-40px) scaleY(1); }
      50% { transform: rotate(-1.5deg) translateX(60px) scaleY(1.4); }
    }
    @keyframes aurora-gen-1 {
      0%, 100% { transform: rotate(-4deg) translateX(-80px); opacity: 0.6; }
      50% { transform: rotate(-4deg) translateX(150px); opacity: 1; }
    }
    @keyframes aurora-gen-2 {
      0%, 100% { transform: rotate(3deg) translateX(60px); opacity: 0.5; }
      50% { transform: rotate(3deg) translateX(-120px); opacity: 1; }
    }
    @keyframes aurora-gen-3 {
      0%, 100% { transform: rotate(-2deg) translateX(-50px) scaleY(1); opacity: 0.6; }
      50% { transform: rotate(-2deg) translateX(100px) scaleY(1.5); opacity: 1; }
    }
    @keyframes orb-float-1 {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(40px, -30px); }
      66% { transform: translate(-20px, 20px); }
    }
    @keyframes orb-float-2 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-30px, -40px); }
    }
    @keyframes orb-gen-1 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
      50% { transform: translate(60px, -40px) scale(1.3); opacity: 1; }
    }
    @keyframes orb-gen-2 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
      50% { transform: translate(-50px, 30px) scale(1.2); opacity: 1; }
    }
    @keyframes orb-gen-3 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
      50% { transform: translate(30px, -50px) scale(1.4); opacity: 1; }
    }
    @keyframes line-glow {
      0%, 100% { opacity: 0.2; transform: scaleX(0.7); }
      50% { opacity: 1; transform: scaleX(1); }
    }
    @keyframes bottom-breathe {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes bottom-breathe-fast {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    @keyframes energy-wave {
      0% { opacity: 0; transform: scaleX(0.2) translateX(-40%); }
      50% { opacity: 1; transform: scaleX(1) translateX(0); }
      100% { opacity: 0; transform: scaleX(0.2) translateX(40%); }
    }
    @keyframes core-pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes text-shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 300% 50%; }
    }
    @keyframes text-breathe {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `;

  if (isGenerating) {
    return (
      <div className="relative h-full overflow-hidden">
        <GeneratingAtmosphere />

        {/* Animated walking tiger */}
        <TigerCanvas />

        {/* Centered text — floating over the atmosphere */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <p
            className="text-lg font-bold uppercase tracking-[8px]"
            style={{
              background: "linear-gradient(90deg, #60a5fa, #00ddff, #3b82f6, #60a5fa)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "text-shimmer 2s linear infinite",
              filter: "drop-shadow(0 0 20px rgba(37,99,235,0.4))",
            }}
          >
            Creating
          </p>
          <p
            className="text-[11px] text-blue-300/40 mt-4 tracking-[3px] uppercase"
            style={{ animation: "text-breathe 3s ease-in-out infinite" }}
          >
            AI agents building your site
          </p>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="relative h-full overflow-hidden">
        <IdleAtmosphere />

        {/* Centered text — floating over the atmosphere */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <p
              className="text-sm uppercase tracking-[6px] mb-3"
              style={{
                background: "linear-gradient(90deg, rgba(96,165,250,0.5), rgba(0,200,255,0.6), rgba(96,165,250,0.5))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ready to build
            </p>
            <p className="text-xs text-blue-300/20 leading-relaxed max-w-xs mx-auto">
              Describe your website and watch it come to life
            </p>
          </div>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  // Safety check — if html exists but doesn't look like valid HTML, show diagnostic
  const looksLikeHtml = srcDoc.includes("<html") || srcDoc.includes("<!doctype") || srcDoc.includes("<!DOCTYPE");

  if (!looksLikeHtml && srcDoc.length > 0) {
    return (
      <div className="h-full overflow-auto bg-gray-950 p-6">
        <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-lg p-4 mb-4">
          <p className="text-yellow-300 text-sm font-medium mb-2">Preview Issue — Generated output is not valid HTML</p>
          <p className="text-yellow-200/60 text-xs">The AI returned text that doesn&apos;t appear to be a complete HTML document. First 200 characters shown below:</p>
        </div>
        <pre className="text-xs text-blue-300/70 whitespace-pre-wrap break-all font-mono">{srcDoc.substring(0, 500)}</pre>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={srcDoc}
      className="w-full h-full border-0 bg-white"
      title="Website preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
