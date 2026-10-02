"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LocalCartItem, MenuItem, Product } from "@/lib/types";

interface CartState {
  items: LocalCartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  add: (item: MenuItem | Product, restaurantId?: string | number, restaurantName?: string) => boolean;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}
export const useCart = create<CartState>()(persist((set, get) => ({
  items: [], restaurantId: null, restaurantName: null,
  add: (item, restaurantArg = "legacy", restaurantName = "Restaurant") => {
    const restaurantId = typeof restaurantArg === "number" ? "legacy" : restaurantArg;
    const state = get();
    if (state.restaurantId && state.restaurantId !== restaurantId) return false;
    const menuItem = "category" in item ? item : { id: item.id, name: item.name, description: item.description, priceCents: item.priceCents, image: "", category: "Menu" };
    const quantity = typeof restaurantArg === "number" ? restaurantArg : 1;
    set({ restaurantId, restaurantName, items: state.items.some((i) => i.id === menuItem.id) ? state.items.map((i) => i.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i) : [...state.items, { ...menuItem, productId: menuItem.id, imageColor: "", imageEmblem: "", sizeMl: 0, lineTotalCents: 0, quantity }] });
    return true;
  },
  setQuantity: (id, quantity) => set((state) => ({ items: quantity < 1 ? state.items.filter((i) => i.id !== id) : state.items.map((i) => i.id === id ? { ...i, quantity } : i) })),
  remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [], restaurantId: null, restaurantName: null }),
}), { name: "table-and-tomato-cart" }));
export const cartTotals = (items: LocalCartItem[]) => { const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0); return { subtotal, totalCents: subtotal, count: items.reduce((sum, i) => sum + i.quantity, 0) }; };
