import { formatPrice } from "@/lib/format";

export function Price({
  cents,
  currency = "USD",
  compareAtCents,
  size = "md",
}: {
  cents: number;
  currency?: string;
  compareAtCents?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={`inline-flex items-baseline gap-2 ${text}`}>
      <span className="font-semibold text-ink dark:text-ivory">{formatPrice(cents, currency)}</span>
      {compareAtCents && compareAtCents > cents && (
        <span className="text-sm text-ink/40 line-through">{formatPrice(compareAtCents, currency)}</span>
      )}
    </span>
  );
}