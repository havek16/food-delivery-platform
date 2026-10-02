"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Button } from "@/components/Button";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

function PaymentForm({ clientSecret, checkoutId }: { clientSecret: string; checkoutId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${origin}/success?checkoutId=${checkoutId}` },
    });
    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setBusy(false);
    }
    // Success → browser follows the return_url redirect.
  }

  return (
    <div className="space-y-4">
      <PaymentElement id="payment-element" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button className="w-full" disabled={busy || !stripe || !elements} onClick={pay}>
        {busy ? "Processing…" : `Pay now`}
      </Button>
    </div>
  );
}

export default function StripePaymentForm({ clientSecret, checkoutId }: { clientSecret: string; checkoutId: string }) {
  const [stripe, setStripe] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  if (!stripe) return <p className="text-sm text-ink/50 dark:text-ivory/50">Loading payment form…</p>;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#c17925",
        colorBackground: "#ffffff",
        colorText: "#1f1812",
        fontFamily: "Manrope, ui-sans-serif, system-ui",
        borderRadius: "9999px",
      },
    },
  };

  return (
    <Elements stripe={stripe} options={options}>
      <PaymentForm clientSecret={clientSecret} checkoutId={checkoutId} />
    </Elements>
  );
}