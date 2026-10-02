const CURRENCIES: Record<string, { symbol: string; position: "before" | "after" }> = {
  USD: { symbol: "$", position: "before" },
  EUR: { symbol: "€", position: "after" },
  GBP: { symbol: "£", position: "before" },
  CHF: { symbol: "CHF ", position: "before" },
};

export function formatPrice(cents: number, currency = "USD"): string {
  const spec = CURRENCIES[currency] ?? CURRENCIES.USD;
  const value = (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return spec.position === "before" ? `${spec.symbol}${value}` : `${value} ${spec.symbol}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function familyLabel(family: string): string {
  const map: Record<string, string> = {
    FLORAL: "Floral",
    WOODY: "Woody",
    ORIENTAL: "Oriental",
    FRESH: "Fresh",
    GOURMAND: "Gourmand",
    CHYPRE: "Chypre",
    CITRUS: "Citrus",
  };
  return map[family] ?? family;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}