"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useQuiz } from "@/stores/quiz";
import { api, apiRoutes } from "@/lib/api";
import type { Product, QuizQuestion } from "@/lib/types";
import { familyLabel } from "@/lib/format";
import { Button } from "./Button";
import { ProductCard } from "./ProductCard";

export function QuizModal() {
  const open = useQuiz((s) => s.open);
  const closeQuiz = useQuiz((s) => s.closeQuiz);
  const questions = useQuiz((s) => s.questions);
  const setQuestions = useQuiz((s) => s.setQuestions);
  const answers = useQuiz((s) => s.answers);
  const answer = useQuiz((s) => s.answer);
  const reset = useQuiz((s) => s.reset);

  const [step, setStep] = useState(0);
  const [recommendations, setRecommendations] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setRecommendations(null);
    setError(null);
    if (questions.length === 0) {
      api<QuizQuestion[]>(apiRoutes.quizQuestions)
        .then(setQuestions)
        .catch(() => setError("Could not load the fragrance quiz. Please try again later."));
    }
  }, [open, questions.length, setQuestions]);

  const current: QuizQuestion | undefined = questions[step];
  const answered = Object.keys(answers).length;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeQuiz();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeQuiz]);

  const complete = useMemo(
    () => questions.length > 0 && answered >= questions.length,
    [questions.length, answered]
  );

  async function finish() {
    if (!complete) return;
    setLoading(true);
    setError(null);
    try {
      const products = await api<Product[]>(apiRoutes.quizRecommendations, {
        method: "POST",
        body: { answers },
      });
      setRecommendations(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong with the quiz.");
    } finally {
      setLoading(false);
    }
  }

  function progress() {
    return questions.length ? Math.round(((step + 1) / questions.length) * 100) : 0;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Fragrance finder quiz">
      <button type="button" className="absolute inset-0 bg-ink-deep/50 backdrop-blur-md" onClick={closeQuiz} aria-label="Close quiz" />
      <div className="glass relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] p-8 shadow-float">
        <button type="button" onClick={closeQuiz} className="glass-soft absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-pill text-ink/70 dark:text-ivory/70" aria-label="Close">
          <X size={16} />
        </button>

        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-aura-600 dark:text-aura-300">
          <Sparkles size={14} /> Scent Alchemy
        </div>

        {recommendations ? (
          <div>
            <h2 className="font-serif text-3xl text-ink dark:text-ivory">Aura picked {recommendations.length} for you</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-ivory/60">Each pairing is built from your answers.</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {recommendations.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={() => { reset(); setQuestions([]); setRecommendations(null); setStep(0); }} className="text-sm text-ink/50 underline-offset-4 hover:underline dark:text-ivory/50">
                Retake quiz
              </button>
              <Link href="/products" onClick={closeQuiz} className="btn-aura px-5 py-2.5 text-sm">
                Browse all <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : error && questions.length === 0 ? (
          <div>
            <h2 className="font-serif text-3xl text-ink dark:text-ivory">A note of trouble</h2>
            <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">{error}</p>
            <Button variant="ghost-glass" className="mt-6 w-full" onClick={closeQuiz}>Close</Button>
          </div>
        ) : current ? (
          <>
            <div aria-hidden className="mb-6 h-1.5 w-full overflow-hidden rounded-pill bg-ink/10 dark:bg-ivory/10">
              <div className="h-full rounded-pill bg-gradient-to-r from-aura-300 via-aura-500 to-aura-400 transition-all duration-300" style={{ width: `${progress()}%` }} />
            </div>

            <h2 className="font-serif text-3xl leading-snug text-ink dark:text-ivory">{current.prompt}</h2>

            <div className="mt-6 grid gap-3">
              {current.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    answer(current.id, option.value);
                    if (step + 1 >= questions.length) void finish();
                    else setStep((s) => s + 1);
                  }}
                  className={`glass-soft flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:shadow-glow-soft ${answers[current.id] === option.value ? "ring-2 ring-aura-400" : ""}`}
                >
                  <span className="text-sm font-medium text-ink dark:text-ivory">{option.label}</span>
                  <span className="text-xl" aria-hidden>{option.emoji}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between text-sm">
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-ink/50 transition hover:text-ink disabled:opacity-40 dark:text-ivory/50 dark:hover:text-ivory">
                Back
              </button>
              <span className="text-ink/40 dark:text-ivory/40">{step + 1} of {questions.length}</span>
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-aura-500 border-t-transparent" />
            <p className="mt-4 text-sm text-ink/50 dark:text-ivory/50">Pouring the questions…</p>
          </div>
        )}
      </div>
    </div>
  );
}