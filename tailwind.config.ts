import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#0a0a0f",
          dark: "#12121a",
          panel: "#1a1a2e",
          border: "#2a2a4a",
          magenta: "#ff2d7b",
          cyan: "#00f0ff",
          yellow: "#f0ff00",
          purple: "#b829ff",
          green: "#39ff14",
        },
      },
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
        display: ["'Orbitron'", "sans-serif"],
        body: ["'Rajdhani'", "sans-serif"],
      },
      animation: {
        "glitch": "glitch 2s infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "scan-line": "scanLine 4s linear infinite",
        "flicker": "flicker 3s infinite",
        "typing": "typing 1s steps(20) forwards",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "33%": { opacity: "0.8" },
          "66%": { opacity: "0.95" },
        },
        typing: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
