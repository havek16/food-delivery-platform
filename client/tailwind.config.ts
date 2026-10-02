import type { Config } from "tailwindcss";
import tailwindPreset from "../config/tailwind.preset.js";

const config = {
  presets: [tailwindPreset],
  content: ["./src/**/*.{ts,tsx}"],
} satisfies Config;

export default config;