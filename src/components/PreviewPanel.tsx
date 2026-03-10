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
 * Tiger HEAD made of blue glowing dots — front-facing, realistic silhouette.
 * Uses an SVG path rendered to an off-screen canvas, then sampled as particles.
 * Represents Zoobic Safari in the Philippines.
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

    // Front-facing tiger head SVG path — carefully traced outline
    // Viewbox: 0 0 400 400, centered tiger face
    const tigerPath = new Path2D();

    // --- Outer face shape (wide at cheeks, narrower at chin & top) ---
    tigerPath.moveTo(200, 360); // chin center
    tigerPath.bezierCurveTo(140, 355, 90, 320, 70, 280); // chin to left jaw
    tigerPath.bezierCurveTo(50, 245, 40, 210, 42, 180); // left jaw to left cheek
    tigerPath.bezierCurveTo(44, 150, 50, 125, 65, 105); // left cheek up to temple

    // Left ear
    tigerPath.bezierCurveTo(55, 80, 40, 45, 60, 15); // outer left ear
    tigerPath.bezierCurveTo(75, 0, 95, 5, 110, 30); // left ear tip
    tigerPath.bezierCurveTo(120, 48, 125, 70, 130, 90); // inner left ear to forehead

    // Forehead
    tigerPath.bezierCurveTo(150, 75, 175, 68, 200, 66); // left forehead to center
    tigerPath.bezierCurveTo(225, 68, 250, 75, 270, 90); // center to right forehead

    // Right ear
    tigerPath.bezierCurveTo(275, 70, 280, 48, 290, 30); // inner right ear
    tigerPath.bezierCurveTo(305, 5, 325, 0, 340, 15); // right ear tip
    tigerPath.bezierCurveTo(360, 45, 345, 80, 335, 105); // outer right ear

    // Right side down
    tigerPath.bezierCurveTo(350, 125, 356, 150, 358, 180); // right temple to cheek
    tigerPath.bezierCurveTo(360, 210, 350, 245, 330, 280); // right cheek to jaw
    tigerPath.bezierCurveTo(310, 320, 260, 355, 200, 360); // right jaw to chin
    tigerPath.closePath();

    // --- Inner features as separate paths for density variation ---
    // Left eye
    const leftEye = new Path2D();
    leftEye.ellipse(148, 185, 28, 18, -0.1, 0, Math.PI * 2);

    // Right eye
    const rightEye = new Path2D();
    rightEye.ellipse(252, 185, 28, 18, 0.1, 0, Math.PI * 2);

    // Nose
    const nose = new Path2D();
    nose.moveTo(200, 240);
    nose.bezierCurveTo(185, 240, 178, 252, 182, 262);
    nose.bezierCurveTo(186, 270, 194, 275, 200, 278);
    nose.bezierCurveTo(206, 275, 214, 270, 218, 262);
    nose.bezierCurveTo(222, 252, 215, 240, 200, 240);
    nose.closePath();

    // --- Sample points from the tiger shape ---
    const offscreen = document.createElement("canvas");
    offscreen.width = 400;
    offscreen.height = 400;
    const offCtx = offscreen.getContext("2d")!;

    type Dot = { x: number; y: number; r: number; b: number; phase: number; hue: number };
    const dots: Dot[] = [];

    // Helper: sample points inside a path
    const samplePath = (path: Path2D, count: number, rMin: number, rMax: number, bMin: number, bMax: number) => {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < count * 20) {
        attempts++;
        const x = Math.random() * 400;
        const y = Math.random() * 400;
        offCtx.clearRect(0, 0, 400, 400);
        offCtx.fill(path);
        if (offCtx.isPointInPath(path, x, y)) {
          dots.push({
            x, y,
            r: rMin + Math.random() * (rMax - rMin),
            b: bMin + Math.random() * (bMax - bMin),
            phase: Math.random() * Math.PI * 2,
            hue: 195 + Math.random() * 35,
          });
          placed++;
        }
      }
    };

    // Sample outline more densely (stroke the path shape's edge)
    // Outline dots — sample near the edge
    const sampleEdge = (path: Path2D, count: number, r: number, b: number, thickness: number) => {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < count * 30) {
        attempts++;
        const x = Math.random() * 400;
        const y = Math.random() * 400;
        const inside = offCtx.isPointInPath(path, x, y);
        // Check if near edge by checking a few pixels away
        if (inside) {
          const nearEdge =
            !offCtx.isPointInPath(path, x - thickness, y) ||
            !offCtx.isPointInPath(path, x + thickness, y) ||
            !offCtx.isPointInPath(path, x, y - thickness) ||
            !offCtx.isPointInPath(path, x, y + thickness);
          if (nearEdge) {
            dots.push({ x, y, r, b, phase: Math.random() * Math.PI * 2, hue: 200 + Math.random() * 30 });
            placed++;
          }
        }
      }
    };

    // Face outline — dense bright dots on the edge
    sampleEdge(tigerPath, 250, 1.6, 0.75, 8);

    // Face fill — scattered softer dots
    samplePath(tigerPath, 350, 0.8, 1.4, 0.15, 0.35);

    // Eyes — very bright, dense
    samplePath(leftEye, 50, 1.2, 2.0, 0.85, 1.0);
    samplePath(rightEye, 50, 1.2, 2.0, 0.85, 1.0);
    // Eye outlines
    sampleEdge(leftEye, 40, 1.5, 0.9, 4);
    sampleEdge(rightEye, 40, 1.5, 0.9, 4);
    // Pupils — center bright points
    dots.push({ x: 148, y: 185, r: 3.5, b: 1.0, phase: 0, hue: 210 });
    dots.push({ x: 252, y: 185, r: 3.5, b: 1.0, phase: 1, hue: 210 });

    // Nose — bright, dense
    samplePath(nose, 35, 1.0, 1.8, 0.8, 1.0);
    sampleEdge(nose, 25, 1.4, 0.9, 3);

    // Forehead stripes — the iconic tiger markings
    const addStripe = (x1: number, y1: number, x2: number, y2: number, count: number) => {
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        dots.push({
          x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 4,
          y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 4,
          r: 1.3 + Math.random() * 0.5,
          b: 0.7 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          hue: 205 + Math.random() * 20,
        });
      }
    };

    // Center V stripe
    addStripe(200, 80, 190, 135, 10);
    addStripe(200, 80, 210, 135, 10);
    // Left forehead stripes
    addStripe(170, 90, 145, 140, 9);
    addStripe(150, 95, 120, 140, 8);
    addStripe(130, 105, 105, 148, 7);
    // Right forehead stripes
    addStripe(230, 90, 255, 140, 9);
    addStripe(250, 95, 280, 140, 8);
    addStripe(270, 105, 295, 148, 7);

    // Cheek stripes
    addStripe(85, 180, 110, 230, 7);
    addStripe(78, 200, 100, 250, 7);
    addStripe(75, 220, 95, 265, 6);
    addStripe(315, 180, 290, 230, 7);
    addStripe(322, 200, 300, 250, 7);
    addStripe(325, 220, 305, 265, 6);

    // Mouth line
    addStripe(200, 278, 200, 300, 4);
    // Mouth curves
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const angle = -0.4 + t * 0.8;
      dots.push({ x: 175 + Math.cos(angle) * 25, y: 305 + Math.sin(angle) * 12, r: 1.2, b: 0.6, phase: Math.random() * 6, hue: 210 });
      dots.push({ x: 225 + Math.cos(Math.PI - angle) * 25, y: 305 + Math.sin(Math.PI - angle) * 12, r: 1.2, b: 0.6, phase: Math.random() * 6, hue: 210 });
    }

    // Whiskers
    const addWhisker = (x1: number, y1: number, x2: number, y2: number) => {
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        dots.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 3,
          r: 0.8 + (1 - t) * 0.4,
          b: 0.4 + (1 - t) * 0.2,
          phase: Math.random() * 6,
          hue: 205 + Math.random() * 15,
        });
      }
    };
    // Left whiskers
    addWhisker(160, 258, 50, 240);
    addWhisker(158, 268, 45, 268);
    addWhisker(160, 278, 52, 295);
    // Right whiskers
    addWhisker(240, 258, 350, 240);
    addWhisker(242, 268, 355, 268);
    addWhisker(240, 278, 348, 295);

    // Inner ear details
    samplePath(tigerPath, 15, 0.9, 1.3, 0.6, 0.8); // sparse inner ear fill

    // Nose bridge
    addStripe(200, 210, 200, 240, 5);

    // Muzzle area — denser dots around nose/mouth
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30;
      const x = 200 + Math.cos(angle) * dist;
      const y = 265 + Math.sin(angle) * dist * 0.7;
      if (offCtx.isPointInPath(tigerPath, x, y)) {
        dots.push({ x, y, r: 0.8 + Math.random() * 0.6, b: 0.3 + Math.random() * 0.2, phase: Math.random() * 6, hue: 200 + Math.random() * 25 });
      }
    }

    // Brow ridges
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const angle = Math.PI + 0.5 + t * (Math.PI - 1);
      dots.push({ x: 148 + Math.cos(angle) * 32, y: 175 + Math.sin(angle) * 10, r: 1.3, b: 0.65, phase: Math.random() * 6, hue: 208 });
      dots.push({ x: 252 + Math.cos(angle) * 32, y: 175 + Math.sin(angle) * 10, r: 1.3, b: 0.65, phase: Math.random() * 6, hue: 208 });
    }

    // --- Animate ---
    let frame = 0;
    let animId: number;

    const draw = () => {
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Tiger head size and position — drifts gently across the screen
      const tigerSize = Math.min(W * 0.5, H * 0.42);
      const scale = tigerSize / 400;

      // Slow drift: moves left-right over ~20 seconds, bobs up-down gently
      const driftX = Math.sin(frame * 0.003) * W * 0.12;
      const driftY = Math.sin(frame * 0.005) * H * 0.03;
      const tilt = Math.sin(frame * 0.004) * 0.03; // very subtle head tilt

      const offsetX = (W - 400 * scale) / 2 + driftX;
      const offsetY = H * 0.06 + driftY;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Subtle floating motion
        const ox = Math.sin(frame * 0.012 + d.phase * 3) * 1.0;
        const oy = Math.cos(frame * 0.010 + d.phase * 2) * 1.0;

        // Pulsing glow
        const pulse = 0.7 + 0.3 * Math.sin(frame * 0.025 + d.phase);
        const alpha = d.b * pulse;

        // Apply subtle tilt rotation around center of tiger
        const cx = 200 * scale, cy = 200 * scale;
        const rx = d.x * scale - cx;
        const ry = d.y * scale - cy;
        const rotX = rx * Math.cos(tilt) - ry * Math.sin(tilt) + cx;
        const rotY = rx * Math.sin(tilt) + ry * Math.cos(tilt) + cy;

        const sx = offsetX + rotX + ox;
        const sy = offsetY + rotY + oy;
        const dotR = d.r * scale;

        // Skip if off screen
        if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;

        // Outer glow
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, dotR * 3.5);
        grad.addColorStop(0, `hsla(${d.hue}, 85%, 65%, ${alpha * 0.5})`);
        grad.addColorStop(0.5, `hsla(${d.hue}, 80%, 55%, ${alpha * 0.12})`);
        grad.addColorStop(1, `hsla(${d.hue}, 80%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(sx, sy, dotR * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue}, 85%, 72%, ${alpha})`;
        ctx.fill();
      }

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

        {/* Text at bottom — below the tiger head */}
        <div className="absolute bottom-[12%] left-0 right-0 flex flex-col items-center z-10">
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
