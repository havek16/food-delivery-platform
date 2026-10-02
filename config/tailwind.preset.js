/**
 * Aura & Essence — shared Tailwind design tokens.
 * Consumed by /client/tailwind.config.ts via `presets: [require('../config/tailwind.preset')]`.
 *
 * Homevera-inspired glassmorphic design system:
 *  - warm ambient light surfaces (ivory / ink)
 *  - translucent glass panels with inner highlights
 *  - pill-shaped controls, high-contrast serif display + sans body
 */

const warmNoir = {
  50: "#fbf7f0",
  100: "#f6efe2",
  200: "#ecdfc6",
  300: "#dfc8a0",
  400: "#d0ad78",
  500: "#c49560",
  600: "#b57f4d",
  700: "#96643e",
  800: "#7a5237",
  900: "#63432f",
  950: "#342217",
};

// Aura gold accent (signature)
const aura = {
  50: "#fdf9ef",
  100: "#f9efd6",
  200: "#f2dca6",
  300: "#eac575",
  400: "#e2ac4c",
  500: "#d9942f",
  600: "#c17925",
  700: "#a05d20",
  800: "#834a20",
  900: "#6c3d1f",
  950: "#3e1f0f",
};

module.exports = {
  content: ["./node_modules/../../client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1f1812",
          deep: "#140f0a",
          soft: "#2a211a",
        },
        ivory: {
          DEFAULT: "#f7f1e6",
          soft: "#efe7d8",
          dim: "#d8cdba",
        },
        warm: warmNoir,
        aura,
        glass: {
          light: "rgba(255,255,255,0.55)",
          dark: "rgba(255,255,255,0.06)",
          line: "rgba(28,22,16,0.08)",
          "line-dark": "rgba(255,255,255,0.10)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        display: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
      },
      letterSpacing: {
        "display-tight": "-0.03em",
      },
      boxShadow: {
        glass: "0 8px 40px rgba(31,24,18,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
        "glass-dark": "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        glow: "0 0 0 1px rgba(226,172,76,0.35), 0 12px 48px -8px rgba(217,148,47,0.45)",
        "glow-soft": "0 4px 24px -4px rgba(217,148,47,0.35)",
        pill: "0 2px 12px rgba(31,24,18,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        "inner-hi": "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(31,24,18,0.04)",
        float: "0 24px 80px -24px rgba(31,24,18,0.28)",
      },
      backgroundImage: {
        "glass-light":
          "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 100%)",
        "glass-dark":
          "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 100%)",
        "aura-text":
          "linear-gradient(120deg, #e2ac4c, #b57f4d 38%, #8c5a35 70%, #d9942f)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "floaty-slow": {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-28px) rotate(1.5deg)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        "floaty-slow": "floaty-slow 11s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 3.2s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};