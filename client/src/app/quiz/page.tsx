"use client";

import { useEffect } from "react";
import { Sparkles, FlaskConical, Leaf, Palette } from "lucide-react";
import { useQuiz } from "@/stores/quiz";
import { Button } from "@/components/Button";

export default function QuizPage() {
  const openQuiz = useQuiz((s) => s.openQuiz);

  useEffect(() => {
    const t = window.setTimeout(openQuiz, 450);
    return () => window.clearTimeout(t);
  }, [openQuiz]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="chip mx-auto text-aura-700 dark:text-aura-300"><Sparkles size={12} /> Scent Alchemy</p>
      <h1 className="section-title mt-6">A minute of questions. A lifetime of scent.</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-ink/60 dark:text-ivory/60">
        Our olfactory engine maps your mood, seasons and palette to a shortlist of compositions from the atelier. No accounts, no spam.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: FlaskConical, title: "Composed", body: "Answers are folded into olfactory-family scores." },
          { icon: Palette, title: "Personal", body: "Rankings are rerun live, per questionnaire." },
          { icon: Leaf, title: "Honest", body: "We never sell your scent data." },
        ].map((f) => (
          <div key={f.title} className="glass-soft rounded-3xl p-5">
            <f.icon size={20} className="mx-auto text-aura-500" />
            <h3 className="mt-3 font-serif text-xl text-ink dark:text-ivory">{f.title}</h3>
            <p className="mt-1 text-sm text-ink/60 dark:text-ivory/60">{f.body}</p>
          </div>
        ))}
      </div>

      <Button size="lg" className="mt-10" onClick={openQuiz}>
        <Sparkles size={16} /> Start the quiz
      </Button>
    </div>
  );
}