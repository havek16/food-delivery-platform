import { Prisma, OlfactoryFamily, Concentration, GenderCategory, ProductType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/http";

export type ProductQuery = {
  q?: string;
  family?: OlfactoryFamily;
  concentration?: Concentration;
  gender?: GenderCategory;
  type?: ProductType;
  note?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
};

export type PyramidNotes = { top: string[]; heart: string[]; base: string[] };

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  brand: string;
  family: OlfactoryFamily;
  concentration: Concentration;
  gender: GenderCategory;
  type: ProductType;
  priceCents: number;
  sizeMl: number;
  stock: number;
  inStock: boolean;
  isFeatured: boolean;
  images: string[];
  notes: PyramidNotes;
};

type ProductWithNotes = Prisma.ProductGetPayload<{ include: { notes: { include: { note: true } } } }>;

export function toProductDTO(p: ProductWithNotes): ProductDTO {
  const top: string[] = [];
  const heart: string[] = [];
  const base: string[] = [];
  for (const pn of [...p.notes].sort((a, b) => b.intensity - a.intensity)) {
    if (pn.position === "TOP") top.push(pn.note.name);
    else if (pn.position === "HEART") heart.push(pn.note.name);
    else base.push(pn.note.name);
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    brand: p.brand,
    family: p.family,
    concentration: p.concentration,
    gender: p.gender,
    type: p.type,
    priceCents: p.priceCents,
    sizeMl: p.sizeMl,
    stock: p.stock,
    inStock: p.stock > 0,
    isFeatured: p.isFeatured,
    images: p.images,
    notes: { top, heart, base },
  };
}

const INCLUDE_NOTES = { notes: { include: { note: true } } } satisfies Prisma.ProductInclude;

function buildWhere(q: ProductQuery, includeQNoteBoost = false): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (q.family) where.family = q.family;
  if (q.concentration) where.concentration = q.concentration;
  if (q.gender) where.gender = q.gender;
  if (q.type) where.type = q.type;
  if (q.featured) where.isFeatured = true;
  if (q.inStock) where.stock = { gt: 0 };

  if (q.priceMin !== undefined || q.priceMax !== undefined) {
    where.priceCents = {
      ...(q.priceMin !== undefined ? { gte: q.priceMin } : {}),
      ...(q.priceMax !== undefined ? { lte: q.priceMax } : {}),
    };
  }

  if (q.note) {
    where.notes = { some: { note: { name: { contains: q.note, mode: "insensitive" } } } };
  }

  if (q.q) {
    const term = q.q.trim();
    if (term) {
      const textOr: Prisma.ProductWhereInput[] = [
        { name: { contains: term, mode: "insensitive" } },
        { tagline: { contains: term, mode: "insensitive" } },
        { brand: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
      // Find products whose accord contains a note matching the query text.
      if (includeQNoteBoost) {
        textOr.push({ notes: { some: { note: { name: { contains: term, mode: "insensitive" } } } } });
      }
      where.OR = textOr;
    }
  }

  return where;
}

function buildOrder(sort: ProductQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceCents: "asc" }];
    case "price_desc":
      return [{ priceCents: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  }
}

export const productService = {
  async list(query: ProductQuery, pagination: { skip: number; take: number }) {
    const where = buildWhere(query, true);
    const orderBy = buildOrder(query.sort);
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, include: INCLUDE_NOTES, orderBy, skip: pagination.skip, take: pagination.take }),
      prisma.product.count({ where }),
    ]);
    return { items: items.map(toProductDTO), total };
  },

  async getBySlug(slug: string): Promise<ProductDTO> {
    const product = await prisma.product.findUnique({ where: { slug }, include: INCLUDE_NOTES });
    if (!product || !product.isActive) throw HttpError.notFound("Product not found", "PRODUCT_NOT_FOUND");
    return toProductDTO(product);
  },

  async featured(limit = 6) {
    const items = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: INCLUDE_NOTES,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return items.map(toProductDTO);
  },

  async related(slug: string, limit = 3): Promise<ProductDTO[]> {
    const product = await this.getBySlug(slug);
    const items = await prisma.product.findMany({
      where: {
        isActive: true,
        family: product.family,
        slug: { not: slug },
      },
      include: INCLUDE_NOTES,
      take: limit,
    });
    return items.map(toProductDTO);
  },

  async notesIndex() {
    const notes = await prisma.olfactoryNote.findMany({
      orderBy: [{ family: "asc" }, { name: "asc" }],
      include: { products: true },
    });
    return notes.map((n) => ({
      id: n.id,
      name: n.name,
      family: n.family,
      intensity: n.base,
      productCount: n.products.length,
    }));
  },

  async findByIds(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: INCLUDE_NOTES,
    });
  },
};