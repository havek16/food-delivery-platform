/**
 * Aura & Essence — database seed.
 *
 * Seeds:
 *  - Olfactory notes library (with intensity weights used by the quiz matcher)
 *  - 14 luxury perfume bottles + 2 gift sets across all olfactive families
 *  - Pyramid placement for every product (Top / Heart / Base)
 *  - Initial admin / manager / client accounts (credentials from env)
 *
 * Run: npm run db:seed  (or npx tsx prisma/seed.ts)
 * Requires DATABASE_URL + initial-password env vars; see .env.example.
 */
import "dotenv/config";
import { PrismaClient, Prisma, OlfactoryFamily, NotePosition } from "@prisma/client";

const prisma = new PrismaClient();

type NoteSeed = { name: string; family: OlfactoryFamily; base: number };
type ProductSeed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  family: OlfactoryFamily;
  concentration: "PARFUM" | "EDP" | "EDT";
  gender: "WOMEN" | "MEN" | "UNISEX";
  type?: "SINGLE" | "GIFT_SET";
  priceCents: number;
  stock?: number;
  sizeMl?: number;
  featured?: boolean;
  // note -> { position, intensity }
  pyramid: Record<string, { position: NotePosition; intensity: number }>;
};

const NOTES: NoteSeed[] = [
  { name: "Bergamot", family: "FRESH", base: 82 },
  { name: "Lemon Zest", family: "FRESH", base: 78 },
  { name: "Neroli", family: "FRESH", base: 70 },
  { name: "Sea Salt", family: "FRESH", base: 66 },
  { name: "Pink Pepper", family: "FRESH", base: 64 },
  { name: "Green Mandarin", family: "FRESH", base: 72 },
  { name: "White Tea", family: "FRESH", base: 58 },
  { name: "Violet Leaf", family: "FLORAL", base: 62 },
  { name: "Iris", family: "FLORAL", base: 68 },
  { name: "Turkish Rose", family: "FLORAL", base: 74 },
  { name: "Jasmine Sambac", family: "FLORAL", base: 80 },
  { name: "Orange Blossom", family: "FLORAL", base: 68 },
  { name: "Peony", family: "FLORAL", base: 56 },
  { name: "Heliotrope", family: "FLORAL", base: 50 },
  { name: "Cardamom", family: "ORIENTAL", base: 66 },
  { name: "Saffron", family: "ORIENTAL", base: 78 },
  { name: "Amber", family: "ORIENTAL", base: 86 },
  { name: "Vanilla Bourbon", family: "ORIENTAL", base: 84 },
  { name: "Tonka Bean", family: "ORIENTAL", base: 72 },
  { name: "Cinnamon Bark", family: "ORIENTAL", base: 60 },
  { name: "Oud", family: "WOODY", base: 90 },
  { name: "Sandalwood", family: "WOODY", base: 76 },
  { name: "Vetiver", family: "WOODY", base: 70 },
  { name: "Cedarwood", family: "WOODY", base: 62 },
  { name: "Patchouli", family: "WOODY", base: 72 },
  { name: "Figwood", family: "WOODY", base: 58 },
  { name: "Feuille de Cèdre", family: "WOODY", base: 54 },
  { name: "Musk", family: "ORIENTAL", base: 80 },
  { name: "Cashmeran", family: "ORIENTAL", base: 74 },
  { name: "Cacao", family: "ORIENTAL", base: 56 },
];

const PRODUCTS: ProductSeed[] = [
  {
    slug: "noir-lumiere",
    name: "Noir Lumière",
    tagline: "Light folding through midnight",
    description:
      "A nocturnal glimmer of saffron over smoked oud, wrapped in a veil of creamy sandalwood. Noir Lumière reads like candlelight on lacquered wood — opulent, close-wearing, unforgettable.",
    family: "ORIENTAL",
    concentration: "PARFUM",
    gender: "UNISEX",
    priceCents: 38500,
    stock: 14,
    featured: true,
    pyramid: {
      Saffron: { position: "TOP", intensity: 4 },
      "Pink Pepper": { position: "TOP", intensity: 3 },
      "Cinnamon Bark": { position: "HEART", intensity: 3 },
      Oud: { position: "HEART", intensity: 5 },
      Sandalwood: { position: "BASE", intensity: 4 },
      Amber: { position: "BASE", intensity: 5 },
    },
  },
  {
    slug: "amber-catharsis",
    name: "Amber Catharsis",
    tagline: "Resin cleared by rain",
    description:
      "An embracing amber blanket lifted by cool bergamot and a whisper of iris. A study in release — the scent of a deep exhale.",
    family: "ORIENTAL",
    concentration: "PARFUM",
    gender: "UNISEX",
    priceCents: 34500,
    stock: 21,
    featured: true,
    pyramid: {
      Bergamot: { position: "TOP", intensity: 3 },
      "Green Mandarin": { position: "TOP", intensity: 2 },
      Iris: { position: "HEART", intensity: 4 },
      Amber: { position: "BASE", intensity: 5 },
      "Tonka Bean": { position: "BASE", intensity: 4 },
    },
  },
  {
    slug: "velvet-verge",
    name: "Velvet Verge",
    tagline: "At the edge of softness",
    description:
      "Powdery violet and peony drifting on a base of cashmere woods. Velvet Verge is restraint made tactile — a gloved hand, a closed door.",
    family: "FLORAL",
    concentration: "EDP",
    gender: "WOMEN",
    priceCents: 29500,
    stock: 32,
    featured: true,
    pyramid: {
      "Peony": { position: "TOP", intensity: 3 },
      "Violet Leaf": { position: "HEART", intensity: 4 },
      Heliotrope: { position: "HEART", intensity: 3 },
      Cashmeran: { position: "BASE", intensity: 4 },
      Musk: { position: "BASE", intensity: 3 },
    },
  },
  {
    slug: "ocean-reverie",
    name: "Ocean Reverie",
    tagline: "The tide at first light",
    description:
      "Crushed neroli, sea salt and white tea suspended in cool mineral air. Bright, weightless and astonishingly clean.",
    family: "FRESH",
    concentration: "EDT",
    gender: "UNISEX",
    priceCents: 20500,
    stock: 40,
    featured: false,
    pyramid: {
      "Sea Salt": { position: "TOP", intensity: 4 },
      Neroli: { position: "TOP", intensity: 3 },
      "White Tea": { position: "HEART", intensity: 3 },
      "Orange Blossom": { position: "HEART", intensity: 3 },
      Musk: { position: "BASE", intensity: 3 },
      "Feuille de Cèdre": { position: "BASE", intensity: 2 },
    },
  },
  {
    slug: "saffron-suite",
    name: "Saffron Suite",
    tagline: "Gilded seconds",
    description:
      "Saffron and cardamom opening into a warm rose heart, resting on ambered woods. A scent composed for slow evenings and louder conversations.",
    family: "ORIENTAL",
    concentration: "EDP",
    gender: "UNISEX",
    priceCents: 36500,
    stock: 18,
    featured: true,
    pyramid: {
      Cardamom: { position: "TOP", intensity: 4 },
      Saffron: { position: "TOP", intensity: 4 },
      "Turkish Rose": { position: "HEART", intensity: 5 },
      Amber: { position: "BASE", intensity: 4 },
      Cedarwood: { position: "BASE", intensity: 3 },
    },
  },
  {
    slug: "musk-eclipse",
    name: "Musk Éclipse",
    tagline: "A private magnetism",
    description:
      "A solar musk — bougie skin accord built on amber, cacao and clean woods. Close to the body, louder in memory.",
    family: "ORIENTAL",
    concentration: "PARFUM",
    gender: "UNISEX",
    priceCents: 32000,
    stock: 26,
    featured: false,
    pyramid: {
      Bergamot: { position: "TOP", intensity: 2 },
      Cacao: { position: "HEART", intensity: 3 },
      Musk: { position: "BASE", intensity: 5 },
      Amber: { position: "BASE", intensity: 4 },
      Sandalwood: { position: "BASE", intensity: 3 },
    },
  },
  {
    slug: "iris-aria",
    name: "Iris Aria",
    tagline: "Powder, light, gravity",
    description:
      "A cold, elegant iris lifted by warm heliotrope and a cashmere-woollen dry-down. The fragrance equivalent of a whispered aria.",
    family: "FLORAL",
    concentration: "EDP",
    gender: "WOMEN",
    priceCents: 31000,
    stock: 22,
    featured: false,
    pyramid: {
      "Violet Leaf": { position: "TOP", intensity: 3 },
      Iris: { position: "HEART", intensity: 5 },
      Heliotrope: { position: "HEART", intensity: 3 },
      "Tonka Bean": { position: "BASE", intensity: 3 },
      Musk: { position: "BASE", intensity: 4 },
    },
  },
  {
    slug: "citrus-solstice",
    name: "Citrus Solstice",
    tagline: "Heat, squeezed",
    description:
      "A scorching citrus celebration — lemon, mandarin and pink pepper over a cool juniper base. Sharp as high noon.",
    family: "FRESH",
    concentration: "EDT",
    gender: "MEN",
    priceCents: 19500,
    stock: 45,
    featured: false,
    pyramid: {
      "Lemon Zest": { position: "TOP", intensity: 4 },
      "Green Mandarin": { position: "TOP", intensity: 4 },
      "Pink Pepper": { position: "HEART", intensity: 3 },
      Vetiver: { position: "BASE", intensity: 4 },
      "Feuille de Cèdre": { position: "BASE", intensity: 2 },
    },
  },
  {
    slug: "oud-obsidian",
    name: "Oud Obsidian",
    tagline: "Glass under pressure",
    description:
      "Uncompromising oud cut with black saffron and a bed of dark patchouli. Sharp, mineral, volcanic.",
    family: "WOODY",
    concentration: "PARFUM",
    gender: "MEN",
    priceCents: 44500,
    stock: 9,
    featured: true,
    pyramid: {
      Saffron: { position: "TOP", intensity: 4 },
      "Pink Pepper": { position: "TOP", intensity: 2 },
      Oud: { position: "HEART", intensity: 5 },
      Patchouli: { position: "BASE", intensity: 4 },
      Amber: { position: "BASE", intensity: 4 },
    },
  },
  {
    slug: "vetiver-muse",
    name: "Vetiver Muse",
    tagline: "The earth remembers",
    description:
      "Graphite, soil, greens — vetiver at focus with figwood and cedar smoke. Grounding without weight.",
    family: "WOODY",
    concentration: "EDT",
    gender: "MEN",
    priceCents: 22500,
    stock: 28,
    featured: false,
    pyramid: {
      "Green Mandarin": { position: "TOP", intensity: 3 },
      Vetiver: { position: "HEART", intensity: 5 },
      Figwood: { position: "HEART", intensity: 3 },
      Cedarwood: { position: "BASE", intensity: 4 },
      Musk: { position: "BASE", intensity: 2 },
    },
  },
  {
    slug: "fig-smoke",
    name: "Fig & Smoke",
    tagline: "Sweetness through the fire",
    description:
      "Green fig lacquered in cardamom smoke, drying to a toasted sandalwood. Tender and stubborn at once.",
    family: "WOODY",
    concentration: "EDP",
    gender: "UNISEX",
    priceCents: 27500,
    stock: 24,
    featured: false,
    pyramid: {
      Cardamom: { position: "TOP", intensity: 4 },
      Figwood: { position: "HEART", intensity: 4 },
      "Violet Leaf": { position: "HEART", intensity: 2 },
      Sandalwood: { position: "BASE", intensity: 5 },
      "Cacao": { position: "BASE", intensity: 2 },
    },
  },
  {
    slug: "rose-nocturne",
    name: "Rose Nocturne",
    tagline: "Dark roses, wider hours",
    description:
      "Damask rose steeped in saffron and oud, floating over a musk-cashmeran accord. A rose that stays up late.",
    family: "FLORAL",
    concentration: "PARFUM",
    gender: "WOMEN",
    priceCents: 35500,
    stock: 16,
    featured: true,
    pyramid: {
      "Turkish Rose": { position: "TOP", intensity: 4 },
      Saffron: { position: "TOP", intensity: 3 },
      "Jasmine Sambac": { position: "HEART", intensity: 4 },
      Oud: { position: "HEART", intensity: 4 },
      Musk: { position: "BASE", intensity: 4 },
      Cashmeran: { position: "BASE", intensity: 3 },
    },
  },
  {
    slug: "white-tea-waltz",
    name: "White Tea Waltz",
    tagline: "A slow clean minute",
    description:
      "Steaming white tea, neroli and a mineral musk — the calm refresh of a linen curtain in afternoon light.",
    family: "FRESH",
    concentration: "EDT",
    gender: "UNISEX",
    priceCents: 17800,
    stock: 36,
    featured: false,
    pyramid: {
      Neroli: { position: "TOP", intensity: 3 },
      "White Tea": { position: "HEART", intensity: 5 },
      "Orange Blossom": { position: "HEART", intensity: 2 },
      Musk: { position: "BASE", intensity: 4 },
    },
  },
  {
    slug: "santal-suite-gift",
    name: "The Settling Ritual — Duet",
    tagline: "Amber Catharsis & Fig & Smoke in a lacquered coffret",
    description:
      "Two full bottles bound by one mood: resin and smoke for slow evenings. Presented in our signature lacquered coffret with a linen travel pouch.",
    family: "WOODY",
    concentration: "EDP",
    gender: "UNISEX",
    type: "GIFT_SET",
    priceCents: 58000,
    stock: 12,
    featured: true,
    pyramid: {
      Bergamot: { position: "TOP", intensity: 3 },
      Figwood: { position: "HEART", intensity: 4 },
      Amber: { position: "BASE", intensity: 5 },
      Sandalwood: { position: "BASE", intensity: 4 },
    },
  },
  {
    slug: "atlas-discovery-set",
    name: "The Atlas Discovery Set",
    tagline: "Five 8ml travel sprays across the Aura & Essence map",
    description:
      "Noir Lumière, Ocean Reverie, Iris Aria, Vetiver Muse and Rose Nocturne — five horizons in a glass and canvas case.",
    family: "FRESH",
    concentration: "EDP",
    gender: "UNISEX",
    type: "GIFT_SET",
    priceCents: 12500,
    stock: 60,
    featured: false,
    pyramid: {
      "White Tea": { position: "TOP", intensity: 3 },
      "Turkish Rose": { position: "HEART", intensity: 3 },
      Vetiver: { position: "BASE", intensity: 3 },
      Musk: { position: "BASE", intensity: 3 },
    },
  },
];

async function seedNotes() {
  const map = new Map<string, string>();
  for (const n of NOTES) {
    await prisma.olfactoryNote.upsert({
      where: { name: n.name },
      update: {},
      create: n,
    });
    const row = await prisma.olfactoryNote.findUniqueOrThrow({ where: { name: n.name } });
    map.set(n.name, row.id);
  }
  return map;
}

async function seedProducts(noteIds: Map<string, string>) {
  let count = 0;
  for (const p of PRODUCTS) {
    const data: Prisma.ProductUncheckedCreateInput = {
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      family: p.family,
      concentration: p.concentration,
      gender: p.gender,
      type: p.type ?? "SINGLE",
      priceCents: p.priceCents,
      stock: p.stock ?? 20,
      sizeMl: p.sizeMl ?? 100,
      images: [],
      isActive: true,
      isFeatured: p.featured ?? false,
      notes: {
        create: Object.entries(p.pyramid).map(([noteName, cfg]) => ({
          noteId: noteIds.get(noteName) ?? "",
          position: cfg.position,
          intensity: cfg.intensity,
        })),
      },
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...data, notes: undefined },
      create: data,
    });
    count += 1;
  }
  return count;
}

async function seedUsers() {
  // Uses bcryptjs (pure JS, no native deps) with 12 salt rounds.
  const bcrypt = (await import("bcryptjs")).default;
  const users = [
    {
      email: process.env.ADMIN_INITIAL_EMAIL ?? "admin@aura-essence.local",
      password: process.env.ADMIN_INITIAL_PASSWORD ?? "H0mev3ra!Str0ng#2026",
      firstName: "Aura",
      lastName: "Admin",
      role: "SUPERADMIN" as const,
    },
    {
      email: process.env.MANAGER_INITIAL_EMAIL ?? "manager@aura-essence.local",
      password: process.env.MANAGER_INITIAL_PASSWORD ?? "Manag3r!Str0ng#2026",
      firstName: "Margaux",
      lastName: "Marchand",
      role: "MANAGER" as const,
    },
    {
      email: process.env.CLIENT_INITIAL_EMAIL ?? "isabella@aura-essence.local",
      password: process.env.CLIENT_INITIAL_PASSWORD ?? "Isabella!Str0ng#2026",
      firstName: "Isabella",
      lastName: "Vane",
      role: "USER" as const,
    },
  ];

  const created: string[] = [];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        emailVerified: true,
        passwordHash: hash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        cartToken: `guest-${u.email.split("@")[0]}`,
      },
    });
    created.push(`${u.role.toLowerCase()} :: ${u.email}`);
  }
  return created;
}

async function main() {
  console.log("🌱 Seeding Aura & Essence…");
  const noteIds = await seedNotes();
  const productCount = await seedProducts(noteIds);
  const users = await seedUsers();
  console.log(`  ✓ ${NOTES.length} olfactory notes`);
  console.log(`  ✓ ${productCount} products (with pyramid placements)`);
  users.forEach((u) => console.log(`  ✓ ${u}`));
  console.log("Done. Delete dev credentials in production.");
}

export {};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());