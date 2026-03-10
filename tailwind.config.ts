import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          100: "#16161e",
          200: "#111118",
          300: "#0b0b11",
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
          cyan: "#7dd3fc",
          purple: "#a5b4fc",
          pink: "#f0abfc",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 4px 24px rgba(37, 99, 235, 0.15), 0 0 48px rgba(37, 99, 235, 0.06)",
        "glow-lg": "0 8px 40px rgba(37, 99, 235, 0.2), 0 0 80px rgba(37, 99, 235, 0.08)",
        "glow-cyan": "0 4px 24px rgba(125, 211, 252, 0.15), 0 0 48px rgba(125, 211, 252, 0.06)",
        "glow-blue": "0 4px 24px rgba(96, 165, 250, 0.15), 0 0 48px rgba(96, 165, 250, 0.06)",
        "premium": "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04)",
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
      },
    },
  },
  plugins: [],
};

export default config;
