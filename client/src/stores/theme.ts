"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark";
  toggle: () => void;
  set: (theme: "light" | "dark") => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggle: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      set: (theme) => set({ theme }),
    }),
    { name: "aura-theme" }
  )
);

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}