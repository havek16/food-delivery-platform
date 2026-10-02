"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, apiRoutes, ApiError } from "@/lib/api";
import type { Address } from "@/lib/types";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

interface AddressForm {
  label: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

const empty: AddressForm = { label: "", fullName: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "FR", phone: "" };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [form, setForm] = useState<AddressForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setAddresses(await api<Address[]>(apiRoutes.addresses));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load addresses.");
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await api(apiRoutes.address(editingId), { method: "PATCH", body: form });
        setEditingId(null);
      } else {
        await api(apiRoutes.addresses, { method: "POST", body: form });
      }
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the address.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(apiRoutes.address(id), { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the address.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-aura-600 dark:text-aura-300">Member zone</p>
      <h1 className="section-title mt-2">Address book</h1>

      {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {addresses?.map((a) => (
          <GlassCard key={a.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-lg text-ink dark:text-ivory">{a.fullName}</p>
                {a.label && <p className="text-xs uppercase tracking-wider text-aura-600 dark:text-aura-300">{a.label}</p>}
              </div>
              {a.isDefault && <span className="chip text-emerald-700 dark:text-emerald-300">Default</span>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/70 dark:text-ivory/70">
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}{a.region ? `, ${a.region}` : ""} {a.postalCode}<br />
              {a.country}
            </p>
            <div className="mt-4 flex gap-3 text-sm">
              <button type="button" className="font-medium text-aura-700 hover:underline dark:text-aura-300" onClick={() => { setEditingId(a.id); setForm({ label: a.label ?? "", fullName: a.fullName, line1: a.line1, line2: a.line2 ?? "", city: a.city, region: a.region ?? "", postalCode: a.postalCode, country: a.country, phone: a.phone ?? "" }); }}>
                Edit
              </button>
              <button type="button" className="text-red-500 hover:underline" onClick={() => void remove(a.id)}>Delete</button>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-8 p-6">
        <h2 className="font-serif text-2xl text-ink dark:text-ivory">{editingId ? "Edit address" : "Add an address"}</h2>
        <form onSubmit={submit} className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input label="Label (Home / Office)" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <Input label="Full name" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Street address" required className="sm:col-span-2" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} />
          <Input label="Apartment / suite" className="sm:col-span-2" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} />
          <Input label="City" required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <Input label="Region / province" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
          <Input label="Postal code" required value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
          <Input label="Country (ISO 3166-1 alpha-2)" maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Add address"}</Button>
            {editingId && (
              <button type="button" className="text-sm text-ink/50 hover:underline dark:text-ivory/50" onClick={() => { setEditingId(null); setForm(empty); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}