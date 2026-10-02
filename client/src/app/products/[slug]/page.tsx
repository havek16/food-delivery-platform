"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Sparkles, Check } from "lucide-react";
import { api, apiRoutes } from "@/lib/api";
import type { Product, WishlistItem } from "@/lib/types";
import { familyLabel } from "@/lib/format";
import { ProductArt } from "@/components/ProductCard";
import { NotePyramid } from "@/components/NotePyramid";
import { Price } from "@/components/Price";
import { Button } from "@/components/Button";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { useDrawer } from "@/stores/drawer";
import { useAuth } from "@/stores/auth";
import { ApiError } from "@/lib/api";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishMsg, setWishMsg] = useState<string | null>(null);

  const addToCart = useCart((s) => s.add);
  const setCartOpen = useDrawer((s) => s.setCartOpen);
  const user = useAuth((s) => s.user);
  const wishlist = useWishlist();

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ product: Product }>(apiRoutes.product(slug));
      setProduct(data.product);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "This fragrance could not be found." : (err instanceof Error ? err.message : "Something went wrong."));
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleWishlist() {
    if (!product) return;
    if (!user) {
      setWishMsg("Sign in to save scents to your wishlist.");
      window.setTimeout(() => setWishMsg(null), 3000);
      return;
    }
    const wasWished = wishlist.isWishlisted(product.id);
    try {
      if (wasWished) {
        const item = wishlist.items.find((i) => i.product.id === product.id);
        if (item) {
          await api(apiRoutes.wishlistItem(item.id), { method: "DELETE" });
          wishlist.toggleLocal(item);
        }
      } else {
        const { items } = await api<{ items: WishlistItem[] }>(apiRoutes.wishlistItem(product.id), { method: "PUT" });
        wishlist.setItems(items);
      }
    } catch (err) {
      setWishMsg(err instanceof Error ? err.message : "Could not update wishlist.");
    }
  }

  function handleAdd() {
    if (!product) return;
    setAdding(true);
    // Optimistic + local-first; a registered user can reconcile server-side later.
    window.setTimeout(() => {
      addToCart(product, qty);
      setCartOpen(true);
      setAdding(false);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    }, 350);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <p className="font-serif text-4xl text-ink dark:text-ivory">Hmm.</p>
        <p className="mt-3 text-ink/60 dark:text-ivory/60">{error}</p>
        <Link href="/products" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-aura-700 hover:underline dark:text-aura-300">
          <ArrowLeft size={14} /> Back to the collection
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-[4/5] w-full animate-pulse rounded-[36px] bg-ink/10" />
          <div className="space-y-4">
            <div className="h-3 w-28 animate-pulse rounded-full bg-ink/10" />
            <div className="h-10 w-3/4 animate-pulse rounded-full bg-ink/10" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-ink/10" />
            <div className="mt-6 h-24 w-full animate-pulse rounded-3xl bg-ink/10" />
          </div>
        </div>
      </div>
    );
  }

  const wished = wishlist.isWishlisted(product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-ink/50 transition hover:text-ink dark:text-ivory/50 dark:hover:text-ivory">
        <ArrowLeft size={14} /> Collection
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-2">
        {/* Art panel */}
        <div className="relative">
          <ProductArt product={product} className="aspect-[4/5] w-full rounded-[36px] shadow-float" />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.isBestseller && <span className="chip text-aura-700 dark:text-aura-300">Bestseller</span>}
            {product.isNew && <span className="chip text-emerald-700 dark:text-emerald-300">New</span>}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-aura-600 dark:text-aura-300">
            {familyLabel(product.olfactoryFamily)} · {product.genderCategory.toLowerCase()}
          </p>
          <h1 className="mt-3 font-serif text-5xl font-medium tracking-display-tight text-ink md:text-6xl dark:text-ivory">
            {product.name}
          </h1>
          <p className="mt-3 font-serif text-xl italic text-ink/60 dark:text-ivory/60">“{product.tagline}”</p>

          <div className="mt-6">
            <Price cents={product.priceCents} compareAtCents={product.compareAtPriceCents} size="lg" />
            <span className="ml-3 text-sm text-ink/50 dark:text-ivory/50">/ {product.sizeMl} ml</span>
          </div>

          <p className="mt-6 max-w-prose leading-relaxed text-ink/70 dark:text-ivory/70">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="glass-soft flex items-center gap-3 rounded-pill px-3 py-2.5">
              <button type="button" className="text-ink/60 hover:text-ink dark:text-ivory/60 dark:hover:text-ivory" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus size={15} />
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button type="button" className="text-ink/60 hover:text-ink dark:text-ivory/60 dark:hover:text-ivory" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Increase quantity">
                <Plus size={15} />
              </button>
            </div>

            <Button className="flex-1" onClick={handleAdd} disabled={adding || product.stock <= 0}>
              {added ? <><Check size={16} /> Added</> : <><ShoppingBag size={16} /> {product.stock <= 0 ? "Sold out" : "Add to bag"}</>}
            </Button>

            <button
              type="button"
              onClick={() => void toggleWishlist()}
              className={`glass-soft grid h-12 w-12 place-items-center rounded-pill transition ${wished ? "text-red-500" : "text-ink/50 hover:text-red-400 dark:text-ivory/50"}`}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} fill={wished ? "currentColor" : "none"} />
            </button>
          </div>

          {wishMsg && <p className="mt-3 text-sm text-aura-700 dark:text-aura-300">{wishMsg}</p>}

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="chip">{product.concentration}</span>
            <span className="chip">{product.sizeMl} ml</span>
            <span className="chip"><Sparkles size={12} /> {product.stock} in stock</span>
          </div>

          <div className="glass-soft mt-8 rounded-3xl p-5">
            <h3 className="flex items-center gap-2 font-serif text-xl text-ink dark:text-ivory">
              <Sparkles size={16} className="text-aura-500" /> The composition
            </h3>
            <div className="mt-5">
              <NotePyramid notes={product.notes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}