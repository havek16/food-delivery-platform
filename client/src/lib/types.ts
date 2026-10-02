export type Role = "USER" | "MANAGER" | "SUPERADMIN";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: string;
  vegetarian?: boolean;
  popular?: boolean;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  deliveryFeeCents: number;
  minOrderCents: number;
  image: string;
  accent: string;
  open: boolean;
  tags: string[];
  menu: MenuItem[];
}

export interface LocalCartItem extends MenuItem {
  productId: string;
  imageColor: string;
  imageEmblem: string;
  sizeMl: number;
  lineTotalCents: number;
  quantity: number;
  instructions?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurant: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  createdAt: string;
  items: LocalCartItem[];
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
}

export interface ApiOk<T> { success: true; data: T; meta?: Record<string, unknown> }
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }

// Legacy API shapes retained while the food API is migrated.
export interface Product { id: string; slug: string; name: string; tagline: string; description: string; priceCents: number; sizeMl: number; imageColor: string; imageEmblem: string; stock: number; isActive: boolean; isBestseller: boolean; isNew: boolean; createdAt: string; notes: ProductNote[]; olfactoryFamily: string; genderCategory: string; compareAtPriceCents: number | null; concentration: string; }
export interface ProductNote { id: string; position: "TOP" | "HEART" | "BASE"; intensity: number; note: { id: string; name: string; family: string }; }
export interface WishlistItem { id: string; product: Product; }
export interface Address { id: string; label: string | null; fullName: string; line1: string; line2: string | null; city: string; region: string | null; postalCode: string; country: string; phone: string | null; isDefault: boolean; }
export interface OrderItem { id: string; productId: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number; imageColor: string; imageEmblem: string; }
export interface CheckoutConfig { configured: boolean; currency: string; taxRatePercent: number; freeShippingThresholdCents: number; shippingFlatCents: number; }
export interface QuizQuestion { id: string; prompt: string; options: { value: string; label: string; emoji: string }[]; }
