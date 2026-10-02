"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, MailCheck } from "lucide-react";
import { api, apiRoutes, ApiError } from "@/lib/api";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api<{ ok: boolean }>(apiRoutes.resetPassword, { method: "POST", body: { token, newPassword: form.password } });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="glass rounded-[32px] p-8 text-center shadow-float">
          <MailCheck size={28} className="mx-auto text-aura-500" />
          <h1 className="mt-4 font-serif text-3xl text-ink dark:text-ivory">Password updated.</h1>
          <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">All other sessions were signed out for safety.</p>
          <Link href="/login" className="btn-aura mt-8 inline-flex px-6 py-3 text-sm">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="glass rounded-[32px] p-8 shadow-float">
        <p className="chip w-fit text-aura-700 dark:text-aura-300"><Lock size={12} /> Reset</p>
        <h1 className="mt-4 font-serif text-4xl text-ink dark:text-ivory">New password</h1>
        <p className="mt-1 text-sm text-ink/50 dark:text-ivory/50">Min 8 chars, one upper, one lower, one number.</p>
        {!token && <p className="mt-4 text-sm text-red-500">This reset link is missing its token.</p>}
        {token && (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <Input label="New password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" disabled={busy}>{busy ? "Saving…" : "Set password"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-ink/50 dark:text-ivory/50">Loading…</p>}>
      <ResetPasswordInner />
    </Suspense>
  );
}