import { Concentration, GenderCategory, OlfactoryFamily } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { toProductDTO, type ProductDTO, type PyramidNotes } from "./product.service";

export type QuizAnswers = {
  families?: OlfactoryFamily[];
  concentrations?: Concentration[];
  gender?: GenderCategory;
  notes?: string[];
  priceMax?: number;
  occasion?: "day" | "evening" | "office" | "special";
};

export type Match = { note: string; role: "top" | "heart" | "base" };

export type QuizResult = {
  product: ProductDTO;
  score: number;
  reasons: string[];
};

const FAMILY_POINTS = 34;
const NOTE_POINTS = 16;
const CONCENTRATION_POINTS = 12;
const GENDER_POINTS = 10;
const UNISEX_NEUTRAL = 5;

function noteMap(n: PyramidNotes): Map<string, "top" | "heart" | "base"> {
  const m = new Map<string, "top" | "heart" | "base">();
  n.top.forEach((x) => m.set(x, "top"));
  n.heart.forEach((x) => m.set(x, "heart"));
  n.base.forEach((x) => m.set(x, "base"));
  return m;
}

function occasionInfluence(occasion: QuizAnswers["occasion"], family: OlfactoryFamily): number {
  switch (occasion) {
    case "evening":
      return family === "ORIENTAL" || family === "WOODY" ? 10 : 0;
    case "day":
      return family === "FRESH" ? 10 : 0;
    case "office":
      return family === "FRESH" || family === "FLORAL" ? 8 : 0;
    case "special":
      return family === "ORIENTAL" ? 8 : 0;
    default:
      return 0;
  }
}

/**
 * "Find Your Signature Scent" matcher.
 * Scores every active product against the quiz answers. Notes carry the most
 * weight so profile text like "warm vanilla with woody undertones" surfaces the
 * right compositions.
 */
export const quizService = {
  async score(answers: QuizAnswers, limit = 6): Promise<QuizResult[]> {
    const families = answers.families ?? [];
    const concentrations = answers.concentrations ?? [];
    const selectedNotes = (answers.notes ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean);
    const selectedSet = new Set(selectedNotes);

    if (selectedSet.size && selectedNotes.some((n) => n.includes(" "))) {
      // Accept multi-word phrases: "warm vanilla" should still match vanilla.
      for (const phrase of selectedNotes) {
        for (const frag of phrase.split(" ")) {
          if (frag.length > 3) selectedSet.add(frag);
        }
      }
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, ...(answers.priceMax ? { priceCents: { lte: answers.priceMax } } : {}) },
      include: { notes: { include: { note: true } } },
    });

    const results: QuizResult[] = products.map((p) => {
      const dto = toProductDTO(p);
      let score = 0;
      const reasons: string[] = [];

      if (families.includes(p.family)) {
        score += FAMILY_POINTS;
        reasons.push(`Founded in the ${p.family.toLowerCase()} olfactive family`);
      }

      const pyramid = noteMap(dto.notes);
      for (const pn of p.notes) {
        const name = pn.note.name;
        if (selectedSet.has(name.toLowerCase())) {
          score += NOTE_POINTS + pn.intensity * 2;
          reasons.push(`Carries your ${name.toLowerCase()} note in its ${pn.position.toLowerCase()}`);
        }
      }

      if (concentrations.includes(p.concentration)) {
        score += CONCENTRATION_POINTS;
        reasons.push(p.concentration === "PARFUM" ? "Extrait de Parfum concentration" : `${p.concentration} concentration`);
      }

      if (answers.gender) {
        if (p.gender === answers.gender) score += GENDER_POINTS;
        else if (p.gender === "UNISEX") score += UNISEX_NEUTRAL;
        if (p.gender !== "UNISEX" && p.gender !== answers.gender) reasons.push(`Composed for ${p.gender.toLowerCase()}`);
      }

      const occasionBonus = occasionInfluence(answers.occasion, p.family);
      score += occasionBonus;
      if (occasionBonus) reasons.push(`Breathes easily for an ${answers.occasion} moment`);

      return { product: dto, score, reasons };
    });

    return results
      .filter((r) => r.score > 0 || (families.length === 0 && concentrations.length === 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  async explore(noteName: string, limit = 8) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        notes: { some: { note: { name: { contains: noteName ?? "", mode: "insensitive" } } } },
      },
      include: { notes: { include: { note: true } } },
      take: limit,
    });
    return { note: noteName, items: products.map(toProductDTO) };
  },
};