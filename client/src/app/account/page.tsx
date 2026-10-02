"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, MapPin, Heart, ShieldCheck, LogOut, Copy, Check } from "lucide-react";
import { api, apiRoutes, ApiError, resetCsrf } from "@/lib/api";
import type { Address, Order } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/stores/auth";

interface DashboardData {
  stats: { orderCount: number; lifetimeSpentCents: number; wishlistCount: number; addressCount: number };
  recentOrders: Order[];
  recentAddresses: Address[];
  twoFactorEnabled: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tfaSecret, setTfaSecret] = useState<string | null>(null);
  const [tfaOtpauth, setTfaOtpauth] = useState<string | null>(null);
  const [tfaCode, setTfaCode] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const dash = await api<DashboardData>(apiRoutes.dashboard);
      setData(dash);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
      } else {
        setError(err instanceof Error ? err.message : "Could not load your dashboard.");
      }
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await api(apiRoutes.logout, { method: "POST" }).catch(() => undefined);
    resetCsrf();
    setUser(null);
    router.push("/");
  }

  async function startTfa() {
    try {
      const res = await api<{ secret: string; otpauthUrl: string }>(apiRoutes.mfaSetup, {
        method: "POST",
        body: { password: prompt("Confirm your password to enable two-factor:") ?? "" },
      });
      setTfaSecret(res.secret);
      setTfaOtpauth(res.otpauthUrl);
      setData((d) => (d ? { ...d, twoFactorEnabled: false } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start two-factor setup.");
    }
  }

  async function confirmTfa() {
    try {
      await api(apiRoutes.mfaConfirm, { method: "POST", body: { code: tfaCode } });
      setTfaSecret(null);
      setTfaOtpauth(null);
      setTfaCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code did not verify.");
    }
  }

  if (!user) {
    return <p className="py-28 text-center text-ink/50">Loading…</p>;
  }

  const mfa = tfaSecret && tfaOtpauth;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-aura-600 dark:text-aura-300">Member zone</p>
          <h1 className="section-title mt-2">Bonjour, {data ? user.email.split("@")[0] : "…"}</h1>
        </div>
        <button type="button" onClick={logout} className="btn-ghost-glass px-4 py-2 text-xs">
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {!data ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-ink/10" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Orders", value: String(data.stats.orderCount), icon: Package },
              { label: "Lifetime value", value: formatPrice(data.stats.lifetimeSpentCents), icon: ShieldCheck },
              { label: "Wishlisted", value: String(data.stats.wishlistCount), icon: Heart },
              { label: "Addresses", value: String(data.stats.addressCount), icon: MapPin },
            ].map((s) => (
              <GlassCard key={s.label} className="p-5">
                <s.icon size={18} className="text-aura-500" />
                <p className="mt-3 font-serif text-3xl text-ink dark:text-ivory">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-ink/50 dark:text-ivory/50">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Recent orders */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-ink dark:text-ivory">Recent orders</h2>
                <Link href="/account/orders" className="text-sm font-medium text-aura-700 hover:underline dark:text-aura-300">View all</Link>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentOrders.length === 0 && (
                  <p className="glass-soft rounded-3xl p-6 text-sm text-ink/50 dark:text-ivory/50">No orders yet — your first scent awaits.</p>
                )}
                {data.recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/account/orders?highlight=${o.id}`}
                    className="glass-soft flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4 transition hover:shadow-glow-soft"
                  >
                    <div>
                      <p className="font-serif text-lg text-ink dark:text-ivory">{o.orderNumber}</p>
                      <p className="text-xs text-ink/50 dark:text-ivory/50">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPrice(o.totalCents)}</p>
                      <p className="text-xs capitalize text-ink/50 dark:text-ivory/50">{o.status.toLowerCase().replace("_", " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              {/* Security */}
              <GlassCard className="p-6">
                <h2 className="flex items-center gap-2 font-serif text-2xl text-ink dark:text-ivory">
                  <ShieldCheck size={18} className="text-aura-500" /> Security
                </h2>
                <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">
                  {data.twoFactorEnabled ? "Two-factor authentication is on." : "Two-factor is off. The maison recommends enabling it."}
                </p>
                {!data.twoFactorEnabled && !mfa && (
                  <Button variant="ghost-glass" className="mt-4 w-full" onClick={startTfa}>Enable two-factor</Button>
                )}

                {mfa && (
                  <div className="mt-4 space-y-3">
                    <div className="glass-soft rounded-2xl p-3 text-xs leading-relaxed text-ink/60 dark:text-ivory/60">
                      <p className="mb-1 font-semibold text-ink dark:text-ivory">Scan this into your authenticator app:</p>
                      <p className="break-all font-mono">{tfaOtpauth}</p>
                    </div>
                    <div className="glass-soft rounded-2xl p-3">
                      <p className="mb-2 font-semibold text-xs text-ink/60 dark:text-ivory/60">Or use setup secret:</p>
                      <p className="break-all font-mono text-xs">{tfaSecret}</p>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-aura-700 hover:underline dark:text-aura-300"
                        onClick={() => { void navigator.clipboard.writeText(tfaSecret); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy secret"}
                      </button>
                    </div>
                    <Input label="6-digit verification code" inputMode="numeric" maxLength={6} value={tfaCode} onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, ""))} />
                    <Button className="w-full" disabled={tfaCode.length !== 6} onClick={confirmTfa}>Confirm &amp; enable</Button>
                  </div>
                )}
              </GlassCard>

              {/* Addresses */}
              <GlassCard className="p-6">
                <h2 className="font-serif text-2xl text-ink dark:text-ivory">Addresses</h2>
                <div className="mt-3 space-y-2">
                  {data.recentAddresses.length === 0 && (
                    <p className="text-sm text-ink/50 dark:text-ivory/50">No saved addresses.</p>
                  )}
                  {data.recentAddresses.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-sm text-ink/60 dark:text-ivory/60">
                      {a.fullName} · {a.line1}, {a.city} {a.postalCode}
                    </p>
                  ))}
                </div>
                <Link href="/account/addresses" className="mt-3 inline-block text-sm font-medium text-aura-700 hover:underline dark:text-aura-300">Manage addresses</Link>
              </GlassCard>
            </section>
          </div>
        </>
      )}
    </div>
  );
}