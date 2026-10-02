"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, apiRoutes, ApiError } from "@/lib/api";
import type { Page, Order } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { ProductArt } from "@/components/ProductCard";

function OrdersInner() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await api<Page<Order>>(apiRoutes.orders);
      setOrders(page.items);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Please sign in to view your orders." : (err instanceof Error ? err.message : "Could not load orders."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-aura-600 dark:text-aura-300">Member zone</p>
      <h1 className="section-title mt-2">Order history</h1>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {!orders && !error && <p className="mt-10 text-sm text-ink/50 dark:text-ivory/50">Loading…</p>}

      {orders && orders.length === 0 && (
        <p className="glass-soft mt-10 rounded-3xl p-8 text-center text-sm text-ink/50 dark:text-ivory/50">
          Nothing here yet. <Link href="/products" className="font-medium text-aura-700 dark:text-aura-300">Browse the collection</Link>.
        </p>
      )}

      <div className="mt-8 space-y-6">
        {orders?.map((o) => (
          <div key={o.id} className={`glass rounded-[28px] p-6 ${highlight === o.id ? "ring-2 ring-aura-400" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl text-ink dark:text-ivory">{o.orderNumber}</p>
                <p className="text-xs text-ink/50 dark:text-ivory/50">Placed {formatDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink dark:text-ivory">{formatPrice(o.totalCents, o.currency)}</p>
                <p className="text-xs capitalize text-aura-700 dark:text-aura-300">{o.status.toLowerCase().replaceAll("_", " ")}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {o.items.map((it) => (
                <div key={it.id} className="glass-soft flex items-center gap-4 rounded-2xl p-3">
                  <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl">
                    <ProductArt product={{ imageColor: it.imageColor, imageEmblem: it.imageEmblem, sizeMl: 0, name: it.name }} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink dark:text-ivory">{it.name}</p>
                    <p className="text-xs text-ink/50 dark:text-ivory/50">Qty {it.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink dark:text-ivory">{formatPrice(it.lineTotalCents, o.currency)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink/50 dark:text-ivory/50">
              <span>Subtotal {formatPrice(o.subtotalCents, o.currency)}</span>
              <span>Shipping {formatPrice(o.shippingCents, o.currency)}</span>
              <span>Tax {formatPrice(o.taxCents, o.currency)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-ink/50 dark:text-ivory/50">Loading…</p>}>
      <OrdersInner />
    </Suspense>
  );
}