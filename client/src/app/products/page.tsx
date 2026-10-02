"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { api, apiRoutes } from "@/lib/api";
import type { Page, Product } from "@/lib/types";
import { familyLabel } from "@/lib/format";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";

const FAMILIES = ["FLORAL", "WOODY", "ORIENTAL", "FRESH", "GOURMAND", "CHYPRE", "CITRUS"];
const CONCENTRATIONS = ["Eau de Parfum", "Extrait de Parfum", "Eau de Toilette"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "bestsellers", label: "Bestsellers" },
];

interface Filters {
  family: string;
  concentration: string;
  priceMax: string;
  sort: string;
}

const emptyFilters: Filters = { family: "", concentration: "", priceMax: "", sort: "newest" };

export default function ProductsPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [items, setItems] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);

  const pageSize = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (filters.family) params.set("family", filters.family);
    if (filters.concentration) params.set("concentration", filters.concentration);
    if (filters.priceMax) params.set("maxPrice", String(Number(filters.priceMax) * 100));
    if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
    try {
      const result = await api<Page<Product>>(`${apiRoutes.products}?${params.toString()}`);
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the collection.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeCount = [filters.family, filters.concentration, filters.priceMax].filter(Boolean).length;

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50 dark:text-ivory/50">Family</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FAMILIES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilters((s) => ({ ...s, family: s.family === f ? "" : f }))}
              className={`chip transition ${filters.family === f ? "bg-aura-500 text-ink-deep shadow-glow-soft" : "hover:bg-aura-500/20"}`}
            >
              {familyLabel(f)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50 dark:text-ivory/50">Concentration</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONCENTRATIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilters((s) => ({ ...s, concentration: s.concentration === c ? "" : c }))}
              className={`chip transition ${filters.concentration === c ? "bg-aura-500 text-ink-deep shadow-glow-soft" : "hover:bg-aura-500/20"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50 dark:text-ivory/50">Max price (USD)</p>
        <input
          type="range"
          min="50"
          max="500"
          step="10"
          value={filters.priceMax || "500"}
          onChange={(e) => setFilters((s) => ({ ...s, priceMax: e.target.value }))}
          className="mt-3 w-full accent-aura-500"
        />
        <p className="mt-1 text-sm text-ink/60 dark:text-ivory/60">
          {filters.priceMax ? `$${filters.priceMax}` : "$500"}
        </p>
      </div>

      {(activeCount > 0 || filters.sort !== "newest") && (
        <button
          type="button"
          onClick={() => setFilters(emptyFilters)}
          className="flex items-center gap-1.5 text-sm font-medium text-aura-700 hover:underline dark:text-aura-300"
        >
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-aura-600 dark:text-aura-300">The Collection</p>
        <h1 className="section-title mt-2">Fragrances, composed in glass.</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/60 dark:text-ivory/60">
          Filter by olfactory family and concentration, or let the Scent Alchemy quiz choose for you.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* Desktop filter rail */}
        <aside className="glass sticky top-24 hidden h-fit rounded-3xl p-6 lg:block">{FilterPanel}</aside>

        {/* Mobile filter trigger */}
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => setMobileFilters((v) => !v)} className="btn-ghost-glass px-4 py-2 text-xs lg:hidden">
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((s) => ({ ...s, sort: e.target.value }))}
            className="glass-input w-auto py-2"
            aria-label="Sort products"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {mobileFilters && (
          <div className="glass rounded-3xl p-5 lg:hidden">{FilterPanel}</div>
        )}

        <div>
          <p className="mb-4 text-sm text-ink/50 dark:text-ivory/50">{loading ? "Pouring…" : `${total} piece${total === 1 ? "" : "s"}`}</p>

          {error ? (
            <p className="py-16 text-center text-sm text-red-500">{error}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {loading || items == null
                  ? Array.from({ length: pageSize }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {items != null && items.length === 0 && !loading && (
                <p className="py-16 text-center text-sm text-ink/50 dark:text-ivory/50">
                  No fragrances match. Try clearing a filter.
                </p>
              )}

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-ghost-glass px-4 py-2 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-ink/50 dark:text-ivory/50">Page {page} of {totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-ghost-glass px-4 py-2 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}