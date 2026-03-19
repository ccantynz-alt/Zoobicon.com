"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number; // -1 to 1, negative = slower, positive = faster
  className?: string;
}

/** A layer that moves at a different speed than scroll, creating depth */
export function ParallaxLayer({ children, speed = 0.3, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** Optional blur amount during reveal */
  blur?: boolean;
}

/** Section that reveals with a cinematic scale + fade as it enters viewport */
export function SectionReveal({ children, className, blur }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.3"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const filterBlur = useTransform(scrollYProgress, [0, 0.5, 1], [
    blur ? "blur(8px)" : "blur(0px)",
    blur ? "blur(2px)" : "blur(0px)",
    "blur(0px)",
  ]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, filter: filterBlur }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  /** Range of vertical float in pixels */
  range?: number;
  /** Duration of full cycle in seconds */
  duration?: number;
}

/** Element that continuously floats up and down */
export function FloatingElement({ children, className, range = 20, duration = 6 }: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-range / 2, range / 2, -range / 2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
