"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { api, apiRoutes, ApiError } from "@/lib/api";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<{ sent: boolean }>(apiRoutes.forgotPassword, { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not request a reset.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="glass rounded-[32px] p-8 text-center shadow-float">
          <MailCheck size={28} className="mx-auto text-aura-500" />
          <h1 className="mt-4 font-serif text-3xl text-ink dark:text-ivory">Check your inbox.</h1>
          <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">
            If an account exists for that address, a reset link is on its way. It expires in 30 minutes.
          </p>
          <Link href="/login" className="btn-ghost-glass mt-8 inline-flex px-6 py-3 text-sm">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="glass rounded-[32px] p-8 shadow-float">
        <h1 className="font-serif text-4xl text-ink dark:text-ivory">Reset password</h1>
        <p className="mt-1 text-sm text-ink/50 dark:text-ivory/50">We will email you a secure reset link.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
        <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-ink/50 hover:underline dark:text-ivory/50">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}