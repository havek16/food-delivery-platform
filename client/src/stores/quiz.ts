"use client";

import { create } from "zustand";
import type { QuizQuestion } from "@/lib/types";

interface QuizState {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  open: boolean;
  setQuestions: (questions: QuizQuestion[]) => void;
  answer: (questionId: string, optionValue: string) => void;
  reset: () => void;
  openQuiz: () => void;
  closeQuiz: () => void;
}

export const useQuiz = create<QuizState>((set) => ({
  questions: [],
  answers: {},
  open: false,
  setQuestions: (questions) => set({ questions }),
  answer: (questionId, optionValue) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: optionValue } })),
  reset: () => set({ answers: {}, questions: [] }),
  openQuiz: () => set({ open: true }),
  closeQuiz: () => set({ open: false }),
}));