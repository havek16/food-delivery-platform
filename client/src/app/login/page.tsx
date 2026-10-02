"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { api, apiRoutes, ApiError, resetCsrf } from "@/lib/api";
import type { User } from "@/lib/types";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuth } from "@/stores/auth";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<{ loginToken: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ user: User; mfaRequired: boolean; loginToken?: string }>(apiRoutes.login, {
        method: "POST",
        body: form,
      });
      if (res.mfaRequired && res.loginToken) {
        setMfaChallenge({ loginToken: res.loginToken });
      } else {
        setUser(res.user);
        router.push("/account");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMfa(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ user: User }>(apiRoutes.mfaVerify, { method: "POST", body: { loginToken: mfaChallenge?.loginToken, code } });
      setUser(res.user);
      resetCsrf();
      router.push("/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="glass rounded-[32px] p-8 shadow-float">
        <p className="chip w-fit text-aura-700 dark:text-aura-300"><KeyRound size={12} /> Atelier access</p>
        <h1 className="mt-4 font-serif text-4xl text-ink dark:text-ivory">
          {mfaChallenge ? "Two-factor check" : "Welcome back."}
        </h1>
        <p className="mt-1 text-sm text-ink/50 dark:text-ivory/50">
          {mfaChallenge ? "Enter the one-time code from your authenticator app." : "Sign in to your private scent library."}
        </p>

        {mfaChallenge ? (
          <form onSubmit={submitMfa} className="mt-8 space-y-5">
            <Input
              label="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : <>Verify <ArrowRight size={15} /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" disabled={busy}>
              {busy ? "Signing in…" : <>Sign in <ArrowRight size={15} /></>}
            </Button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-ink/50 underline-offset-4 hover:underline dark:text-ivory/50">Forgot password?</Link>
          <Link href="/register" className="font-medium text-aura-700 hover:underline dark:text-aura-300">Create an account</Link>
        </div>
      </div>
    </div>
  );
}