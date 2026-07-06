import type { Config } from "tailwindcss";
import path from "path";

const r = (p: string) => path.join(__dirname, p);

const config: Config = {
  darkMode: "class",
  content: [
    r("./app/**/*.{ts,tsx}"),
    r("./app/**/*.css"),
    r("./components/**/*.{ts,tsx}"),
    r("./lib/**/*.{ts,tsx}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'Inter'",
          "'Segoe UI'",
          "sans-serif",
        ],
      },
      colors: {
        aura: {
          50: "#f2f1ff",
          100: "#e6e4ff",
          200: "#c9c3ff",
          300: "#a99dff",
          400: "#8a72ff",
          500: "#7048ff",
          600: "#5c2fe0",
          700: "#4a24b8",
          800: "#391c8f",
          900: "#291566",
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
        snappy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      boxShadow: {
        "glow-sm": "0 4px 20px -4px rgba(112, 72, 255, 0.35)",
        glow: "0 8px 40px -8px rgba(112, 72, 255, 0.45)",
        "glow-lg": "0 20px 60px -12px rgba(112, 72, 255, 0.5)",
        "inner-glow": "inset 0 1px 1px rgba(255,255,255,0.4)",
      },
      keyframes: {
        blob: {
          "0%, 100%": { borderRadius: "42% 58% 65% 35% / 45% 45% 55% 55%" },
          "25%": { borderRadius: "58% 42% 35% 65% / 55% 60% 40% 45%" },
          "50%": { borderRadius: "50% 50% 40% 60% / 60% 40% 60% 40%" },
          "75%": { borderRadius: "35% 65% 55% 45% / 40% 55% 45% 60%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.045)" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.08)" },
        },
        listenPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(112,72,255,0.5)" },
          "70%": { boxShadow: "0 0 0 24px rgba(112,72,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(112,72,255,0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "33%": { transform: "translate(10px, -12px)" },
          "66%": { transform: "translate(-8px, 8px)" },
        },
        popTick: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        blob: "blob 9s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        breathe: "breathe 4.2s ease-in-out infinite",
        blink: "blink 4.5s ease-in-out infinite",
        pulseGlow: "pulseGlow 3.5s ease-in-out infinite",
        listenPulse: "listenPulse 1.6s ease-out infinite",
        fadeUp: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        scaleIn: "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        slideInRight: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        slideInLeft: "slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
        drift: "drift 12s ease-in-out infinite",
        popTick: "popTick 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
