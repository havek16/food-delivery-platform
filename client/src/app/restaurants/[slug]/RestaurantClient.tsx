"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { restaurants, money } from "@/lib/demo-data";
import { useCart } from "@/stores/cart";

export default function RestaurantClient({ slug }: { slug: string }) {
  const restaurant = restaurants.find((item) => item.slug === slug);
  const [notice, setNotice] = useState("");
  const add = useCart((state) => state.add);

  if (!restaurant) return <div className="site-shell" style={{ paddingTop: 80 }}>Restaurant not found.</div>;

  const grouped = restaurant.menu.reduce<Record<string, typeof restaurant.menu>>((result, item) => {
    (result[item.category] ??= []).push(item);
    return result;
  }, {});

  return <div>
    <div style={{ height: 260, backgroundImage: `linear-gradient(0deg,rgba(25,20,17,.75),rgba(25,20,17,.1)),url(${restaurant.image})`, backgroundSize: "cover", backgroundPosition: "center", color: "#fff" }}>
      <div className="site-shell" style={{ height: "100%", display: "flex", alignItems: "end", paddingBottom: 28 }}>
        <div><p style={{ margin: "0 0 8px", color: "#f4c878", fontWeight: 700 }}>{restaurant.open ? "Open now" : "Closed now"}</p><h1 style={{ fontSize: 38, margin: 0, letterSpacing: -1 }}>{restaurant.name}</h1><p style={{ margin: "9px 0 0", color: "#eee" }}>{restaurant.cuisine} · ★ {restaurant.rating} ({restaurant.reviews.toLocaleString()}) · {restaurant.deliveryTime}</p></div>
      </div>
    </div>
    <div className="site-shell" style={{ paddingTop: 30, paddingBottom: 70, maxWidth: 850 }}>
      {notice && <div style={{ background: "#eef6eb", border: "1px solid #cde5c6", padding: "11px 14px", borderRadius: 8, marginBottom: 16, color: "#376b32", fontSize: 14 }}><Check size={16} style={{ verticalAlign: "-3px" }} /> {notice}</div>}
      {Object.entries(grouped).map(([category, items]) => <section key={category} style={{ marginBottom: 30 }}><h2 style={{ fontSize: 22, margin: "0 0 4px" }}>{category}</h2><p style={{ color: "#78716c", fontSize: 13, margin: "0 0 10px" }}>{items.length} items</p>{items.map((item) => <div className="menu-row" key={item.id}><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><h3 style={{ margin: 0, fontSize: 17 }}>{item.name}</h3>{item.vegetarian && <span style={{ color: "#4c8a48", border: "1px solid #8fbd88", borderRadius: 3, fontSize: 10, padding: "1px 3px" }}>VEG</span>}</div><p style={{ color: "#78716c", fontSize: 13, lineHeight: 1.5, margin: "8px 0" }}>{item.description}</p><b>{money(item.priceCents)}</b></div><div style={{ position: "relative", width: 118, flexShrink: 0 }}><img src={item.image} alt="" style={{ width: 118, height: 100, objectFit: "cover", borderRadius: 8 }} /><button aria-label={`Add ${item.name}`} onClick={() => { const added = add(item, restaurant.id, restaurant.name); setNotice(added ? `${item.name} added to your order.` : "Your cart has items from another restaurant. Clear it before adding this item."); }} className="button-light" style={{ position: "absolute", right: 5, bottom: -9, padding: "6px 9px", color: "#e6532f", background: "#fff" }}><Plus size={16} /> Add</button></div></div>)}</section>)}
    </div>
  </div>;
}
