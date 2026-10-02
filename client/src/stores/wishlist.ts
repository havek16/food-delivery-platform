"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem } from "@/lib/types";

interface WishlistState {
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  setItems: (items: WishlistItem[]) => void;
  toggleLocal: (item: WishlistItem) => void;
  clearLocal: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isWishlisted: (productId) => get().items.some((i) => i.product.id === productId),
      setItems: (items) => set({ items }),
      toggleLocal: (item) =>
        set((state) => ({
          items: state.items.some((i) => i.product.id === item.product.id)
            ? state.items.filter((i) => i.product.id !== item.product.id)
            : [...state.items, item],
        })),
      clearLocal: () => set({ items: [] }),
    }),
    { name: "aura-wishlist" }
  )
);