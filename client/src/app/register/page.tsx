"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, UserPlus } from "lucide-react";
import { api, apiRoutes, ApiError, resetCsrf } from "@/lib/api";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/stores/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = "At least 8 characters with upper, lower and a number.";
    }
    return next;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ user: import("@/lib/types").User }>(apiRoutes.register, { method: "POST", body: form });
      setUser(res.user);
      resetCsrf();
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") ? next : "/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="glass rounded-[32px] p-8 shadow-float">
        <p className="chip w-fit text-aura-700 dark:text-aura-300"><UserPlus size={12} /> Join the maison</p>
        <h1 className="mt-4 font-serif text-4xl text-ink dark:text-ivory">Begin your collection.</h1>
        <p className="mt-1 text-sm text-ink/50 dark:text-ivory/50">Wishlists, order history and faster checkout — all private.</p>

        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="First name" autoComplete="given-name" value={form.firstName} error={errors.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last name" autoComplete="family-name" value={form.lastName} error={errors.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Password" type="password" autoComplete="new-password" value={form.password} error={errors.password} hint="Min 8 chars, one upper, one lower, one number." onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" disabled={busy}>
            {busy ? "Creating account…" : <>Create account <ArrowRight size={15} /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/50 dark:text-ivory/50">
          Already a member?{" "}
          <Link href="/login" className="font-medium text-aura-700 hover:underline dark:text-aura-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
