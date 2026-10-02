"use client";

import dynamic from "next/dynamic";
import type { CheckoutConfig } from "@/lib/types";

const StripePayment = dynamic(() => import("@/components/StripePayment"), { ssr: false });

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface StripePaymentProps {
  config: CheckoutConfig;
  clientSecret: string;
  checkoutId: string;
}

export function CheckoutPayment({ config, clientSecret, checkoutId }: StripePaymentProps) {
  if (config.configured && PUBLISHABLE_KEY && PUBLISHABLE_KEY !== "pk_test_xxx") {
    return <StripePayment clientSecret={clientSecret} checkoutId={checkoutId} />;
  }
  return (
    <div className="glass-soft rounded-3xl p-6">
      <p className="text-sm font-semibold text-ink dark:text-ivory">Demo mode</p>
      <p className="mt-1 text-sm text-ink/60 dark:text-ivory/60">
        Stripe is not configured on this environment, so no card form is shown. In production the Payment Element would appear here.
      </p>
    </div>
  );
}