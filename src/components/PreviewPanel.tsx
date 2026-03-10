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
 * Tiger HEAD — clean line-drawn, glowing blue tiger face.
 * Uses direct canvas drawing with bezier curves for a clearly recognizable tiger.
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

    let frame = 0;
    let animId: number;

    const drawTiger = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      time: number
    ) => {
      const s = size / 400; // scale factor (design at 400x400)
      const breathe = Math.sin(time * 0.8) * 2 * s;
      const tilt = Math.sin(time * 0.4) * 0.02;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);

      // --- Helper to draw a glowing stroke ---
      const glowStroke = (
        drawFn: () => void,
        color: string,
        width: number,
        glowSize: number
      ) => {
        // Outer glow
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = glowSize * s;
        ctx.strokeStyle = color;
        ctx.lineWidth = width * s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        drawFn();
        ctx.stroke();
        ctx.restore();

        // Core line
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, "0.9)");
        ctx.lineWidth = width * s * 0.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        drawFn();
        ctx.stroke();
      };

      const glowFill = (
        drawFn: () => void,
        color: string,
        glowSize: number
      ) => {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = glowSize * s;
        ctx.fillStyle = color;
        ctx.beginPath();
        drawFn();
        ctx.fill();
        ctx.restore();
      };

      const blue1 = "hsla(210, 90%, 65%, 0.8)";
      const blue2 = "hsla(200, 85%, 60%, 0.7)";
      const cyan = "hsla(190, 90%, 65%, 0.75)";
      const brightBlue = "hsla(210, 95%, 75%, 0.95)";
      const dimBlue = "hsla(210, 80%, 55%, 0.4)";
      const stripe = "hsla(205, 85%, 50%, 0.6)";

      // ===== FACE OUTLINE =====
      glowStroke(
        () => {
          ctx.moveTo(0, 160 * s + breathe); // chin
          ctx.bezierCurveTo(-60 * s, 155 * s, -110 * s, 120 * s, -130 * s, 80 * s);
          ctx.bezierCurveTo(-150 * s, 40 * s, -158 * s, 0, -155 * s, -30 * s);
          ctx.bezierCurveTo(-150 * s, -65 * s, -138 * s, -90 * s, -120 * s, -105 * s);
          // Left ear
          ctx.bezierCurveTo(-135 * s, -130 * s, -145 * s, -170 * s, -125 * s, -195 * s);
          ctx.bezierCurveTo(-110 * s, -210 * s, -90 * s, -205 * s, -75 * s, -185 * s);
          ctx.bezierCurveTo(-65 * s, -165 * s, -60 * s, -140 * s, -60 * s, -120 * s);
          // Forehead
          ctx.bezierCurveTo(-40 * s, -135 * s, -15 * s, -140 * s, 0, -142 * s);
          ctx.bezierCurveTo(15 * s, -140 * s, 40 * s, -135 * s, 60 * s, -120 * s);
          // Right ear
          ctx.bezierCurveTo(60 * s, -140 * s, 65 * s, -165 * s, 75 * s, -185 * s);
          ctx.bezierCurveTo(90 * s, -205 * s, 110 * s, -210 * s, 125 * s, -195 * s);
          ctx.bezierCurveTo(145 * s, -170 * s, 135 * s, -130 * s, 120 * s, -105 * s);
          // Right side down
          ctx.bezierCurveTo(138 * s, -90 * s, 150 * s, -65 * s, 155 * s, -30 * s);
          ctx.bezierCurveTo(158 * s, 0, 150 * s, 40 * s, 130 * s, 80 * s);
          ctx.bezierCurveTo(110 * s, 120 * s, 60 * s, 155 * s, 0, 160 * s + breathe);
        },
        blue1,
        2.5,
        20
      );

      // ===== INNER EAR LINES =====
      glowStroke(
        () => {
          ctx.moveTo(-110 * s, -155 * s);
          ctx.bezierCurveTo(-100 * s, -175 * s, -88 * s, -180 * s, -80 * s, -165 * s);
          ctx.bezierCurveTo(-72 * s, -148 * s, -70 * s, -130 * s, -72 * s, -115 * s);
        },
        dimBlue,
        1.5,
        8
      );
      glowStroke(
        () => {
          ctx.moveTo(110 * s, -155 * s);
          ctx.bezierCurveTo(100 * s, -175 * s, 88 * s, -180 * s, 80 * s, -165 * s);
          ctx.bezierCurveTo(72 * s, -148 * s, 70 * s, -130 * s, 72 * s, -115 * s);
        },
        dimBlue,
        1.5,
        8
      );

      // ===== EYES =====
      // Eye shapes — almond-shaped
      const drawLeftEye = () => {
        ctx.moveTo(-72 * s, -15 * s);
        ctx.bezierCurveTo(-68 * s, -30 * s, -48 * s, -38 * s, -30 * s, -32 * s);
        ctx.bezierCurveTo(-18 * s, -28 * s, -15 * s, -18 * s, -18 * s, -10 * s);
        ctx.bezierCurveTo(-22 * s, 0, -38 * s, 5 * s, -52 * s, 0);
        ctx.bezierCurveTo(-65 * s, -5 * s, -74 * s, -8 * s, -72 * s, -15 * s);
      };
      const drawRightEye = () => {
        ctx.moveTo(72 * s, -15 * s);
        ctx.bezierCurveTo(68 * s, -30 * s, 48 * s, -38 * s, 30 * s, -32 * s);
        ctx.bezierCurveTo(18 * s, -28 * s, 15 * s, -18 * s, 18 * s, -10 * s);
        ctx.bezierCurveTo(22 * s, 0, 38 * s, 5 * s, 52 * s, 0);
        ctx.bezierCurveTo(65 * s, -5 * s, 74 * s, -8 * s, 72 * s, -15 * s);
      };

      glowStroke(drawLeftEye, brightBlue, 2.2, 15);
      glowStroke(drawRightEye, brightBlue, 2.2, 15);

      // Pupils — glowing dots
      const pupilPulse = 0.8 + 0.2 * Math.sin(time * 2);
      glowFill(
        () => { ctx.arc(-45 * s, -16 * s, 5 * s * pupilPulse, 0, Math.PI * 2); },
        brightBlue,
        25
      );
      glowFill(
        () => { ctx.arc(45 * s, -16 * s, 5 * s * pupilPulse, 0, Math.PI * 2); },
        brightBlue,
        25
      );

      // ===== NOSE =====
      glowStroke(
        () => {
          ctx.moveTo(0, 30 * s);
          ctx.bezierCurveTo(-14 * s, 30 * s, -20 * s, 40 * s, -16 * s, 50 * s);
          ctx.bezierCurveTo(-12 * s, 58 * s, -4 * s, 62 * s, 0, 64 * s);
          ctx.bezierCurveTo(4 * s, 62 * s, 12 * s, 58 * s, 16 * s, 50 * s);
          ctx.bezierCurveTo(20 * s, 40 * s, 14 * s, 30 * s, 0, 30 * s);
        },
        cyan,
        2,
        12
      );
      // Nose fill (subtle)
      glowFill(
        () => {
          ctx.moveTo(0, 32 * s);
          ctx.bezierCurveTo(-12 * s, 32 * s, -17 * s, 40 * s, -14 * s, 48 * s);
          ctx.bezierCurveTo(-10 * s, 55 * s, -3 * s, 59 * s, 0, 60 * s);
          ctx.bezierCurveTo(3 * s, 59 * s, 10 * s, 55 * s, 14 * s, 48 * s);
          ctx.bezierCurveTo(17 * s, 40 * s, 12 * s, 32 * s, 0, 32 * s);
        },
        "hsla(200, 85%, 60%, 0.15)",
        8
      );

      // ===== NOSE BRIDGE =====
      glowStroke(
        () => {
          ctx.moveTo(0, 5 * s);
          ctx.lineTo(0, 30 * s);
        },
        dimBlue,
        1.5,
        6
      );

      // ===== MOUTH =====
      // Center line down from nose
      glowStroke(
        () => {
          ctx.moveTo(0, 64 * s);
          ctx.lineTo(0, 78 * s);
        },
        blue2,
        1.5,
        8
      );
      // Mouth curves
      glowStroke(
        () => {
          ctx.moveTo(0, 78 * s);
          ctx.bezierCurveTo(-8 * s, 85 * s, -22 * s, 90 * s, -35 * s, 85 * s);
        },
        blue2,
        1.8,
        10
      );
      glowStroke(
        () => {
          ctx.moveTo(0, 78 * s);
          ctx.bezierCurveTo(8 * s, 85 * s, 22 * s, 90 * s, 35 * s, 85 * s);
        },
        blue2,
        1.8,
        10
      );

      // ===== CHIN =====
      glowStroke(
        () => {
          ctx.moveTo(-30 * s, 100 * s);
          ctx.bezierCurveTo(-15 * s, 115 * s, 15 * s, 115 * s, 30 * s, 100 * s);
        },
        dimBlue,
        1.2,
        6
      );

      // ===== WHISKERS =====
      const whiskerWave = Math.sin(time * 1.2) * 3 * s;
      // Left whiskers
      glowStroke(() => {
        ctx.moveTo(-30 * s, 60 * s); ctx.quadraticCurveTo(-80 * s, 48 * s + whiskerWave, -145 * s, 42 * s + whiskerWave);
      }, blue2, 1.2, 8);
      glowStroke(() => {
        ctx.moveTo(-28 * s, 68 * s); ctx.quadraticCurveTo(-80 * s, 68 * s - whiskerWave, -148 * s, 65 * s - whiskerWave);
      }, blue2, 1.2, 8);
      glowStroke(() => {
        ctx.moveTo(-26 * s, 76 * s); ctx.quadraticCurveTo(-75 * s, 85 * s + whiskerWave, -140 * s, 90 * s + whiskerWave);
      }, blue2, 1.2, 8);
      // Right whiskers
      glowStroke(() => {
        ctx.moveTo(30 * s, 60 * s); ctx.quadraticCurveTo(80 * s, 48 * s - whiskerWave, 145 * s, 42 * s - whiskerWave);
      }, blue2, 1.2, 8);
      glowStroke(() => {
        ctx.moveTo(28 * s, 68 * s); ctx.quadraticCurveTo(80 * s, 68 * s + whiskerWave, 148 * s, 65 * s + whiskerWave);
      }, blue2, 1.2, 8);
      glowStroke(() => {
        ctx.moveTo(26 * s, 76 * s); ctx.quadraticCurveTo(75 * s, 85 * s - whiskerWave, 140 * s, 90 * s - whiskerWave);
      }, blue2, 1.2, 8);

      // ===== TIGER STRIPES — forehead =====
      // Center V
      glowStroke(() => {
        ctx.moveTo(0, -130 * s); ctx.bezierCurveTo(-5 * s, -110 * s, -12 * s, -85 * s, -8 * s, -60 * s);
      }, stripe, 3, 6);
      glowStroke(() => {
        ctx.moveTo(0, -130 * s); ctx.bezierCurveTo(5 * s, -110 * s, 12 * s, -85 * s, 8 * s, -60 * s);
      }, stripe, 3, 6);

      // Left forehead stripes
      glowStroke(() => {
        ctx.moveTo(-30 * s, -120 * s); ctx.bezierCurveTo(-40 * s, -100 * s, -55 * s, -75 * s, -50 * s, -55 * s);
      }, stripe, 2.5, 5);
      glowStroke(() => {
        ctx.moveTo(-55 * s, -110 * s); ctx.bezierCurveTo(-68 * s, -90 * s, -80 * s, -70 * s, -78 * s, -52 * s);
      }, stripe, 2.2, 5);
      glowStroke(() => {
        ctx.moveTo(-80 * s, -98 * s); ctx.bezierCurveTo(-95 * s, -80 * s, -105 * s, -60 * s, -100 * s, -45 * s);
      }, stripe, 2, 4);

      // Right forehead stripes
      glowStroke(() => {
        ctx.moveTo(30 * s, -120 * s); ctx.bezierCurveTo(40 * s, -100 * s, 55 * s, -75 * s, 50 * s, -55 * s);
      }, stripe, 2.5, 5);
      glowStroke(() => {
        ctx.moveTo(55 * s, -110 * s); ctx.bezierCurveTo(68 * s, -90 * s, 80 * s, -70 * s, 78 * s, -52 * s);
      }, stripe, 2.2, 5);
      glowStroke(() => {
        ctx.moveTo(80 * s, -98 * s); ctx.bezierCurveTo(95 * s, -80 * s, 105 * s, -60 * s, 100 * s, -45 * s);
      }, stripe, 2, 4);

      // ===== CHEEK STRIPES =====
      glowStroke(() => {
        ctx.moveTo(-120 * s, -20 * s); ctx.bezierCurveTo(-110 * s, 0, -105 * s, 25 * s, -108 * s, 45 * s);
      }, stripe, 2, 4);
      glowStroke(() => {
        ctx.moveTo(-128 * s, 5 * s); ctx.bezierCurveTo(-118 * s, 25 * s, -112 * s, 48 * s, -115 * s, 65 * s);
      }, stripe, 2, 4);
      glowStroke(() => {
        ctx.moveTo(-132 * s, 30 * s); ctx.bezierCurveTo(-122 * s, 50 * s, -115 * s, 70 * s, -118 * s, 85 * s);
      }, stripe, 1.8, 4);

      glowStroke(() => {
        ctx.moveTo(120 * s, -20 * s); ctx.bezierCurveTo(110 * s, 0, 105 * s, 25 * s, 108 * s, 45 * s);
      }, stripe, 2, 4);
      glowStroke(() => {
        ctx.moveTo(128 * s, 5 * s); ctx.bezierCurveTo(118 * s, 25 * s, 112 * s, 48 * s, 115 * s, 65 * s);
      }, stripe, 2, 4);
      glowStroke(() => {
        ctx.moveTo(132 * s, 30 * s); ctx.bezierCurveTo(122 * s, 50 * s, 115 * s, 70 * s, 118 * s, 85 * s);
      }, stripe, 1.8, 4);

      // ===== BROW LINES =====
      glowStroke(() => {
        ctx.moveTo(-70 * s, -40 * s); ctx.bezierCurveTo(-55 * s, -48 * s, -35 * s, -48 * s, -18 * s, -42 * s);
      }, blue2, 1.8, 10);
      glowStroke(() => {
        ctx.moveTo(70 * s, -40 * s); ctx.bezierCurveTo(55 * s, -48 * s, 35 * s, -48 * s, 18 * s, -42 * s);
      }, blue2, 1.8, 10);

      ctx.restore();
    };

    const draw = () => {
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const time = frame / 60;
      const tigerSize = Math.min(W * 0.55, H * 0.48);
      const driftX = Math.sin(time * 0.15) * W * 0.06;
      const driftY = Math.sin(time * 0.25) * H * 0.015;

      drawTiger(ctx, W / 2 + driftX, H * 0.42 + driftY, tigerSize, time);

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
