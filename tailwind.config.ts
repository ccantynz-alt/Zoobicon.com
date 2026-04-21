import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy replaces pure black across the platform.
        // Deep ocean navy — clearly blue, premium, Stripe-inspired.
        // `black` is remapped below so every existing bg-black/text-black
        // usage picks up the new tone without 144 file edits.
        navy: {
          50: "#eef2fb",
          100: "#d8e0f3",
          200: "#b4c3e5",
          300: "#8299c9",
          400: "#4f6eaa",
          500: "#2d4d8c",
          600: "#1e3a7a",
          700: "#152e60",
          800: "#0f2148",
          900: "#0a1628",
          950: "#060e1f",
        },
        black: "#060e1f",
        dark: {
          100: "#162044",
          200: "#0f1d3a",
          300: "#0a1628",
        },
        brand: {
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
        accent: {
          cyan: "#22d3ee",
          purple: "#67e8f9",
          pink: "#38bdf8",
        },
        // Signature color — electric violet/indigo that's uniquely Zoobicon
        // Not another blue gradient — this is ownable
        zoo: {
          50: "#f0eeff",
          100: "#ddd8ff",
          200: "#bfb4ff",
          300: "#9b85ff",
          400: "#7c5aff", // Primary signature
          500: "#6d3bff", // Saturated core
          600: "#5a1eff",
          700: "#4a0ed4",
          800: "#3d0eab",
          900: "#2d0a7a",
        },
        // Warm grays — Linear-inspired, not cold blue-gray
        warm: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ['"Plus Jakarta Sans"', '"Space Grotesk"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.03em",
        tight: "-0.02em",
        snug: "-0.011em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      spacing: {
        // 8px grid scale
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      fontSize: {
        // Body — tighter defaults
        "xs": ["0.75rem", { lineHeight: "1.5", letterSpacing: "-0.006em" }],
        "sm": ["0.875rem", { lineHeight: "1.5", letterSpacing: "-0.011em" }],
        "base": ["1rem", { lineHeight: "1.5", letterSpacing: "-0.011em" }],
        "lg": ["1.125rem", { lineHeight: "1.5", letterSpacing: "-0.014em" }],
        "xl": ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.017em" }],
        "2xl": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        "4xl": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.028em" }],
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        // Display sizes for hero headlines
        "6xl": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.035em" }],
        "7xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.035em" }],
        "8xl": ["6rem", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "9xl": ["8rem", { lineHeight: "0.9", letterSpacing: "-0.04em" }],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "slide-up": "slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "counter": "counter 2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      boxShadow: {
        glow: "0 4px 24px rgba(37, 99, 235, 0.15), 0 0 48px rgba(37, 99, 235, 0.06)",
        "glow-lg": "0 8px 40px rgba(37, 99, 235, 0.2), 0 0 80px rgba(37, 99, 235, 0.08)",
        "glow-cyan": "0 4px 24px rgba(125, 211, 252, 0.15), 0 0 48px rgba(125, 211, 252, 0.06)",
        "glow-blue": "0 4px 24px rgba(96, 165, 250, 0.15), 0 0 48px rgba(96, 165, 250, 0.06)",
        "glow-zoo": "0 4px 24px rgba(124, 90, 255, 0.2), 0 0 60px rgba(124, 90, 255, 0.1)",
        "glow-zoo-lg": "0 8px 40px rgba(124, 90, 255, 0.3), 0 0 80px rgba(124, 90, 255, 0.15)",
        "premium": "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04)",
        "card": "0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "breathe": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-zoo": "linear-gradient(135deg, #7c5aff, #3b82f6, #22d3ee)",
        "gradient-zoo-subtle": "linear-gradient(135deg, rgba(124,90,255,0.15), rgba(59,130,246,0.1))",
      },
    },
  },
  plugins: [],
};

export default config;
