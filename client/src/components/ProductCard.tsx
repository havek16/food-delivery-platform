import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { familyLabel, initialsOf } from "@/lib/format";
import { Price } from "./Price";
import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";

interface ProductCardProps {
  product: Product;
  rank?: number;
}

export interface ProductArtProps {
  imageColor?: string | null;
  imageEmblem?: string | null;
  sizeMl?: number | null;
  name: string;
}

export function ProductArt({ product, className = "" }: { product: ProductArtProps; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${product.imageColor ?? "#d9942f"} 0%, rgba(0,0,0,0.18) 130%)` }}
    >
      <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(120% 90% at 80% 10%, rgba(255,255,255,0.45), transparent 55%)" }} />
      <span className="font-serif text-5xl font-medium tracking-wide text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
        {product.imageEmblem || initialsOf(product.name)}
      </span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">
        {product.sizeMl ?? ""} {product.sizeMl ? "ml" : ""}
      </span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const isWishlisted = useWishlist((s) => s.isWishlisted(product.id));
  const add = useCart((s) => s.add);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group glass-card block overflow-hidden text-left"
      aria-label={product.name}
    >
      <div className="relative">
        <ProductArt product={product} className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex gap-2">
          {product.isBestseller && <span className="chip text-aura-700 dark:text-aura-300">Bestseller</span>}
          {product.isNew && <span className="chip text-emerald-700 dark:text-emerald-300">New</span>}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            add(product);
          }}
          className="absolute bottom-3 right-3 rounded-pill px-4 py-2 text-xs font-semibold text-ink-deep shadow-glow transition hover:brightness-105 active:scale-95"
          style={{ backgroundImage: "linear-gradient(120deg,#f2dca6,#e2ac4c 40%,#d9942f 75%,#eac575)" }}
        >
          Add
        </button>
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aura-600 dark:text-aura-300">
          {familyLabel(product.olfactoryFamily)}
        </span>
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-xl text-ink dark:text-ivory">{product.name}</h3>
          <span className="text-ink/35" aria-hidden>
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-ink/60">{product.tagline}</p>
        <Price cents={product.priceCents} compareAtCents={product.compareAtPriceCents} size="md" />
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="aspect-[4/5] w-full animate-pulse bg-ink/10" />
      <div className="space-y-2 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-ink/10" />
        <div className="h-5 w-2/3 animate-pulse rounded-full bg-ink/10" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-ink/10" />
      </div>
    </div>
  );
}