"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { api, apiRoutes } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/Button";
import { useCart } from "@/stores/cart";

interface Preparation {
  checkoutId: string;
  status: string;
  totals: { amount_cents: number; currency: string };
  items: { productId: string; productName: string; quantity: number; lineTotalCents: number }[];
}

function SuccessInner() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkoutId") ?? searchParams.get("payment_intent") ?? "";
  const clear = useCart((s) => s.clear);
  const [prep, setPrep] = useState<(Preparation & { received?: boolean; orderNumber?: string }) | null>(null);

  useEffect(() => {
    clear();
  }, [clear]);

  const load = useCallback(async () => {
    if (!checkoutId) return;
    try {
      const data = await api<Preparation & { received?: boolean; orderNumber?: string }>(apiRoutes.checkoutPreparation(checkoutId));
      setPrep(data);
    } catch {
      // Session may have expired in the demo flow; the global confirmation still shows.
    }
  }, [checkoutId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-pill bg-gradient-to-br from-aura-300 to-aura-500 text-ink-deep shadow-glow">
        <CheckCircle2 size={36} />
      </span>
      <h1 className="section-title mt-8">Merci — order received.</h1>
      <p className="mt-3 max-w-md text-ink/60 dark:text-ivory/60">
        {prep?.received !== undefined && !prep.received
          ? "Payment is pending. You will receive a receipt once it clears."
          : "We have begun preparing your order. A confirmation email is on its way."}
      </p>

      {prep && (
        <div className="glass mt-10 w-full rounded-[28px] p-6 text-left">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-aura-600 dark:text-aura-300">
            <PackageSearch size={14} /> Your composition
          </p>
          <div className="mt-4 space-y-3">
            {prep.items.map((it) => (
              <div key={it.productId} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink dark:text-ivory">
                  {it.productName} <span className="text-ink/40">× {it.quantity}</span>
                </span>
                <span className="font-semibold">{formatPrice(it.lineTotalCents, prep.totals.currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 dark:border-ivory/10">
            <span className="text-sm text-ink/60 dark:text-ivory/60">Total</span>
            <span className="font-serif text-2xl text-ink dark:text-ivory">{formatPrice(prep.totals.amount_cents, prep.totals.currency)}</span>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <ButtonLink href="/products">Continue shopping</ButtonLink>
        <ButtonLink href="/account/orders" variant="ghost-glass">Track this order</ButtonLink>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-ink/50 dark:text-ivory/50">Loading…</p>}>
      <SuccessInner />
    </Suspense>
  );
}