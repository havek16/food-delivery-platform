import type { Restaurant } from "./types";

const images = {
  pizza: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  bowl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
  dosa: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
};

export const restaurants: Restaurant[] = [
  { id: "r1", slug: "olio-pizza", name: "Olio Pizza", cuisine: "Italian · Pizza", rating: 4.8, reviews: 1240, deliveryTime: "25–35 min", deliveryFeeCents: 199, minOrderCents: 1200, image: images.pizza, accent: "#e9b949", open: true, tags: ["Top rated", "Free delivery"], menu: [
    { id: "m1", name: "Spicy soppressata", description: "Tomato, fior di latte, Calabrian chilli, basil", priceCents: 1699, image: images.pizza, category: "Pizzas", popular: true },
    { id: "m2", name: "Mushroom & truffle", description: "Cremini mushrooms, taleggio, truffle oil", priceCents: 1799, image: images.pizza, category: "Pizzas", vegetarian: true },
    { id: "m3", name: "Garlic knots", description: "Wood-fired dough, garlic butter, parmesan", priceCents: 699, image: images.pizza, category: "Sides", vegetarian: true },
    { id: "m4", name: "Tiramisu", description: "Espresso-soaked ladyfingers, mascarpone cream", priceCents: 799, image: images.dessert, category: "Desserts", vegetarian: true },
  ] },
  { id: "r2", slug: "the-green-bowl", name: "The Green Bowl", cuisine: "Healthy · Salads", rating: 4.7, reviews: 836, deliveryTime: "20–30 min", deliveryFeeCents: 0, minOrderCents: 1000, image: images.bowl, accent: "#9cbf86", open: true, tags: ["Free delivery", "Vegan options"], menu: [
    { id: "m5", name: "Miso salmon bowl", description: "Sushi rice, roasted salmon, edamame, sesame greens", priceCents: 1599, image: images.bowl, category: "Bowls", popular: true },
    { id: "m6", name: "Green goddess salad", description: "Avocado, cucumber, herbs, toasted seeds, lemon tahini", priceCents: 1299, image: images.bowl, category: "Salads", vegetarian: true },
    { id: "m7", name: "Crispy tofu bowl", description: "Five spice tofu, pickled carrot, brown rice, ginger", priceCents: 1399, image: images.bowl, category: "Bowls", vegetarian: true },
  ] },
  { id: "r3", slug: "maharaja-kitchen", name: "Maharaja Kitchen", cuisine: "Indian · Biryani", rating: 4.6, reviews: 2104, deliveryTime: "30–40 min", deliveryFeeCents: 249, minOrderCents: 1500, image: images.indian, accent: "#dd8860", open: true, tags: ["Popular nearby"], menu: [
    { id: "m8", name: "Hyderabadi chicken biryani", description: "Basmati rice, saffron, fried onions, raita", priceCents: 1499, image: images.indian, category: "Biryani", popular: true },
    { id: "m9", name: "Paneer tikka masala", description: "Charred paneer in a rich tomato and fenugreek gravy", priceCents: 1399, image: images.indian, category: "Mains", vegetarian: true },
    { id: "m10", name: "Garlic naan", description: "Tandoor baked, brushed with garlic butter", priceCents: 399, image: images.indian, category: "Breads", vegetarian: true },
  ] },
  { id: "r4", slug: "hana-sushi", name: "Hana Sushi", cuisine: "Japanese · Sushi", rating: 4.5, reviews: 672, deliveryTime: "35–45 min", deliveryFeeCents: 299, minOrderCents: 2000, image: images.sushi, accent: "#d19a90", open: false, tags: ["Premium"], menu: [
    { id: "m11", name: "Salmon signature roll", description: "Salmon, avocado, cucumber, yuzu mayo", priceCents: 1599, image: images.sushi, category: "Sushi", popular: true },
    { id: "m12", name: "Spicy tuna roll", description: "Bluefin tuna, scallion, sesame, house spice", priceCents: 1499, image: images.sushi, category: "Sushi" },
  ] },
  { id: "r5", slug: "southside-dosa", name: "Southside Dosa", cuisine: "South Indian · Vegetarian", rating: 4.8, reviews: 943, deliveryTime: "20–30 min", deliveryFeeCents: 149, minOrderCents: 1000, image: images.dosa, accent: "#d8a34e", open: true, tags: ["Best value"], menu: [
    { id: "m13", name: "Masala dosa", description: "Crisp rice crepe, potato masala, sambar, chutneys", priceCents: 1099, image: images.dosa, category: "Dosas", vegetarian: true, popular: true },
    { id: "m14", name: "Idli sambar", description: "Steamed rice cakes, lentil stew, coconut chutney", priceCents: 799, image: images.dosa, category: "Breakfast", vegetarian: true },
  ] },
];

export const categories = ["Pizza", "Burgers", "Indian", "Chinese", "Biryani", "Desserts", "South Indian", "Healthy"];
export function money(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
