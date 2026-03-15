"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * HeroEffects — Drop-in interactive background for hero sections
 *
 * Features:
 * - Cursor-reactive radial glow that follows the mouse
 * - Floating particles with gentle drift
 * - Interactive grid that brightens near the cursor
 * - Morphing aurora gradient blobs
 * - Parallax depth layers
 *
 * Usage: <HeroEffects variant="default" /> inside a relative-positioned hero
 */

interface HeroEffectsProps {
  /** Color theme: default (blue), purple, cyan, green */
  variant?: "default" | "purple" | "cyan" | "green";
  /** Enable cursor-following glow */
  cursorGlow?: boolean;
  /** Enable floating particles */
  particles?: boolean;
  /** Number of particles (default 40) */
  particleCount?: number;
  /** Enable interactive grid that reacts to cursor */
  interactiveGrid?: boolean;
  /** Enable morphing aurora blobs */
  aurora?: boolean;
  /** Enable beam lines that shoot across */
  beams?: boolean;
}

const VARIANTS = {
  default: {
    primary: "59, 130, 246",    // blue-500
    secondary: "99, 102, 241",  // indigo-500
    accent: "125, 211, 252",    // sky-300
  },
  purple: {
    primary: "139, 92, 246",    // violet-500
    secondary: "167, 139, 250", // violet-400
    accent: "196, 181, 253",    // violet-300
  },
  cyan: {
    primary: "34, 211, 238",    // cyan-400
    secondary: "59, 130, 246",  // blue-500
    accent: "165, 243, 252",    // cyan-200
  },
  green: {
    primary: "34, 197, 94",     // green-500
    secondary: "59, 130, 246",  // blue-500
    accent: "134, 239, 172",    // green-300
  },
};

export default function HeroEffects({
  variant = "default",
  cursorGlow = true,
  particles = true,
  particleCount = 40,
  interactiveGrid = true,
  aurora = true,
  beams = true,
}: HeroEffectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  const colors = VARIANTS[variant];

  // Detect mobile — disable heavy effects
  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove, isMobile]);

  // Canvas particle system
  useEffect(() => {
    if (!particles || isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const pts = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const t = Date.now() * 0.001;

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150;
          p.vx += (dx / dist) * force * 0.15;
          p.vy += (dy / dist) * force * 0.15;
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Pulsing opacity
        const pulseOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));

        // Glow near cursor
        const glowBoost = dist < 200 ? (200 - dist) / 200 * 0.6 : 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + glowBoost), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.primary}, ${pulseOpacity + glowBoost})`;
        ctx.fill();

        // Draw connection lines between nearby particles
        for (const p2 of pts) {
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 100 && d > 0) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${colors.primary}, ${0.06 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [particles, particleCount, colors.primary, isMobile]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ pointerEvents: "none" }}
    >
      {/* Particle canvas */}
      {particles && !isMobile && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Cursor glow */}
      {cursorGlow && !isMobile && (
        <div
          className="hero-cursor-glow"
          style={{
            "--cursor-x": "var(--mx, -1000px)",
            "--cursor-y": "var(--my, -1000px)",
            "--glow-color": colors.primary,
          } as React.CSSProperties}
        />
      )}

      {/* Interactive grid */}
      {interactiveGrid && (
        <div
          className="hero-interactive-grid"
          style={{ "--grid-color": colors.primary } as React.CSSProperties}
        />
      )}

      {/* Aurora blobs */}
      {aurora && (
        <>
          <div
            className="hero-aurora-blob hero-aurora-blob-1"
            style={{
              background: `radial-gradient(ellipse, rgba(${colors.primary}, 0.15), rgba(${colors.secondary}, 0.08), transparent 70%)`,
            }}
          />
          <div
            className="hero-aurora-blob hero-aurora-blob-2"
            style={{
              background: `radial-gradient(ellipse, rgba(${colors.secondary}, 0.12), rgba(${colors.accent}, 0.06), transparent 70%)`,
            }}
          />
          <div
            className="hero-aurora-blob hero-aurora-blob-3"
            style={{
              background: `radial-gradient(ellipse, rgba(${colors.accent}, 0.1), rgba(${colors.primary}, 0.05), transparent 70%)`,
            }}
          />
        </>
      )}

      {/* Light beams */}
      {beams && !isMobile && (
        <>
          <div
            className="hero-beam hero-beam-1"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${colors.primary}, 0.06), transparent)`,
            }}
          />
          <div
            className="hero-beam hero-beam-2"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${colors.accent}, 0.04), transparent)`,
            }}
          />
        </>
      )}
    </div>
  );
}

/**
 * CursorGlowTracker — lightweight script component that updates CSS custom properties
 * Add this ONCE in the hero section's parent to enable cursor glow tracking
 */
export function CursorGlowTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return null;
}
