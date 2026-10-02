"use client";

import { X } from "lucide-react";
import { useCart, cartTotals } from "@/stores/cart";
import { useDrawer } from "@/stores/drawer";
import { formatPrice } from "@/lib/format";
import { ButtonLink } from "./Button";
import { ProductArt } from "./ProductCard";

export function CartDrawer() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const open = useDrawer((s) => s.cartOpen);
  const setOpen = useDrawer((s) => s.setCartOpen);
  const { totalCents } = cartTotals(items);

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-ink-deep/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden
        tabIndex={-1}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory/95 shadow-float backdrop-blur-2xl transition-transform duration-300 dark:bg-ink-deep/95 ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5 dark:border-ivory/10">
          <h2 className="font-serif text-2xl text-ink dark:text-ivory">Your Bag</h2>
          <button type="button" onClick={() => setOpen(false)} className="glass-soft grid h-9 w-9 place-items-center rounded-pill text-ink/70 dark:text-ivory/70" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {items.length === 0 && (
            <div className="pt-16 text-center">
              <p className="font-serif text-2xl text-ink/70 dark:text-ivory/70">Your bag is empty.</p>
              <p className="mt-2 text-sm text-ink/50 dark:text-ivory/50">Explore the collection and add a first scent.</p>
            </div>
          )}
          {items.map((item) => (
            <div key={item.productId} className="glass-soft flex gap-4 rounded-3xl p-3">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-2xl">
                <ProductArt
                  product={{ imageColor: item.imageColor, imageEmblem: item.imageEmblem, sizeMl: item.sizeMl, name: item.name }}
                  className="h-full w-full"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-serif text-lg text-ink dark:text-ivory">{item.name}</p>
                  <button type="button" onClick={() => remove(item.productId)} className="text-ink/35 hover:text-red-500 dark:text-ivory/35" aria-label={`Remove ${item.name}`}>
                    <X size={15} />
                  </button>
                </div>
                <p className="text-xs text-ink/50 dark:text-ivory/50">{item.sizeMl} ml</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="glass-soft flex items-center gap-2 rounded-pill px-2 py-1">
                    <button type="button" className="h-6 w-6 rounded-pill text-ink/60 hover:text-ink dark:text-ivory/60 dark:hover:text-ivory" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                    <button type="button" className="h-6 w-6 rounded-pill text-ink/60 hover:text-ink dark:text-ivory/60 dark:hover:text-ivory" onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <span className="text-sm font-semibold text-ink dark:text-ivory">{formatPrice(item.priceCents * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-soft space-y-4 rounded-t-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink/60 dark:text-ivory/60">Subtotal</span>
            <span className="font-serif text-2xl text-ink dark:text-ivory">{formatPrice(totalCents)}</span>
          </div>
          <ButtonLink href="/checkout" className="w-full" onClick={() => setOpen(false)}>
            Proceed to Checkout
          </ButtonLink>
        </div>
      </aside>
    </>
  );
}