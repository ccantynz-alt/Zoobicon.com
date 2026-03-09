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
          100: "#1a1a2e",
          200: "#12121a",
          300: "#0a0a0f",
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
          cyan: "#00f0ff",
          purple: "#818cf8",
          pink: "#ec4899",
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
        glow: "0 0 20px rgba(37, 99, 235, 0.3), 0 0 60px rgba(37, 99, 235, 0.1)",
        "glow-lg": "0 0 30px rgba(37, 99, 235, 0.4), 0 0 80px rgba(37, 99, 235, 0.15)",
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.3), 0 0 60px rgba(0, 240, 255, 0.1)",
        "glow-blue": "0 0 20px rgba(96, 165, 250, 0.3), 0 0 60px rgba(96, 165, 250, 0.1)",
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
