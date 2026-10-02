import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 pt-14 pb-10 dark:border-ivory/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="metallic-text font-serif text-3xl font-semibold tracking-display-tight">Aura &amp; Essence</p>
          <p className="mt-3 max-w-xs text-sm text-ink/60 dark:text-ivory/60">
            Small-batch, genderless perfumery composed in our atelier — where light, glass and scent meet.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50 dark:text-ivory/50">Maison</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/70 dark:text-ivory/70">
            <li><Link className="hover:text-aura-600 dark:hover:text-aura-300" href="/products">The Collection</Link></li>
            <li><Link className="hover:text-aura-600 dark:hover:text-aura-300" href="/quiz">Scent Alchemy</Link></li>
            <li><Link className="hover:text-aura-600 dark:hover:text-aura-300" href="/account">Account</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50 dark:text-ivory/50">Care</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/70 dark:text-ivory/70">
            <li>Free shipping over $150</li>
            <li>30-day scent return</li>
            <li>Sample sets available</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50 dark:text-ivory/50">Atelier</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink/70 dark:text-ivory/70">
            <li>Flagship — Rue de la Paix, Paris</li>
            <li>hello@aura-essence.paris</li>
            <li>Mon–Fri, 9h–18h CET</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-ink/10 px-4 pt-6 text-xs text-ink/40 sm:flex-row sm:px-6 dark:border-ivory/10 dark:text-ivory/40">
        <p>© {new Date().getFullYear()} Aura &amp; Essence. Tous droits réservés.</p>
        <p className="flex items-center gap-2">
          Payments secured by <span className="font-semibold">Stripe</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-aura-400" />
          SSL encrypted
        </p>
      </div>
    </footer>
  );
}