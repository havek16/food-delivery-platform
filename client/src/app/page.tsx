"use client";
import Link from "next/link";
import { ArrowRight, Search, Clock3, Star, Plus } from "lucide-react";
import { categories, restaurants, money } from "@/lib/demo-data";
import { useCart } from "@/stores/cart";

export default function HomePage() {
  const add = useCart((s) => s.add);
  const featured = restaurants.slice(0, 4);
  return <div>
    <section style={{ background: "#f4ebe4", borderBottom: "1px solid #eaded5" }}><div className="site-shell" style={{ paddingTop: 62, paddingBottom: 62 }}>
      <div style={{ maxWidth: 650 }}><p style={{ color: "#b7472c", fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>Dinner, sorted</p><h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", lineHeight: 1.03, letterSpacing: -2.5, margin: "12px 0 16px" }}>Good food, right<br />when you want it.</h1><p style={{ fontSize: 18, color: "#675d56", marginBottom: 26 }}>Order from the best local restaurants in your neighborhood.</p>
        <div style={{ maxWidth: 560, position: "relative" }}><Search size={20} style={{ position: "absolute", left: 16, top: 15, color: "#8b817a" }} /><input className="input" style={{ paddingLeft: 48, paddingRight: 120, height: 52 }} placeholder="Search restaurants or dishes" /><button className="button-primary" style={{ position: "absolute", right: 5, top: 5, height: 42 }}>Search</button></div>
      </div>
    </div></section>
    <div className="site-shell" style={{ paddingTop: 34, paddingBottom: 70 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2 style={{ fontSize: 24, margin: 0, letterSpacing: -.6 }}>What are you craving?</h2><Link href="/restaurants" style={{ color: "#c7472d", fontSize: 14, fontWeight: 700 }}>See all <ArrowRight size={15} style={{ verticalAlign: "middle" }} /></Link></div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16 }}>{categories.map((c, i) => <Link href={`/restaurants?cuisine=${c}`} key={c} className="button-light" style={{ whiteSpace: "nowrap", padding: "10px 15px", fontSize: 14 }}>{["🍕", "🍔", "🍛", "🥡", "🍚", "🍰", "🥞", "🥗"][i]} {c}</Link>)}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 34, marginBottom: 18 }}><div><p style={{ color: "#e6532f", fontSize: 12, textTransform: "uppercase", fontWeight: 800, letterSpacing: 1.3, margin: 0 }}>Popular near you</p><h2 style={{ fontSize: 27, margin: "6px 0 0", letterSpacing: -.7 }}>Restaurants worth leaving home for</h2></div><Link href="/restaurants" style={{ color: "#c7472d", fontSize: 14, fontWeight: 700 }}>View all</Link></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>{featured.map((r) => <Link href={`/restaurants/${r.slug}`} key={r.id} className="restaurant-card"><img className="restaurant-image" src={r.image} alt="" /><div style={{ padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><h3 style={{ margin: 0, fontSize: 17 }}>{r.name}</h3><span style={{ color: "#477b45", background: "#eef6eb", padding: "3px 6px", fontSize: 12, borderRadius: 5, fontWeight: 700 }}>★ {r.rating}</span></div><p style={{ margin: "7px 0", color: "#78716c", fontSize: 13 }}>{r.cuisine}</p><p style={{ margin: 0, color: "#78716c", fontSize: 13 }}><Clock3 size={13} style={{ verticalAlign: "-2px" }} /> {r.deliveryTime} · {r.deliveryFeeCents ? money(r.deliveryFeeCents) + " delivery" : "Free delivery"}</p></div></Link>)}</div>
      <div style={{ marginTop: 54, padding: 26, borderRadius: 12, background: "#203f35", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}><div><p style={{ color: "#f3c96d", textTransform: "uppercase", fontSize: 12, fontWeight: 800, letterSpacing: 1.2 }}>New here?</p><h2 style={{ margin: "5px 0", fontSize: 25 }}>Get $10 off your first order</h2><p style={{ margin: 0, color: "#d0ded8", fontSize: 14 }}>Use code <b style={{ color: "#fff" }}>WELCOME10</b> at checkout.</p></div><Link href="/restaurants" className="button-primary" style={{ background: "#f3c96d", color: "#203f35" }}>Start ordering <ArrowRight size={16} /></Link></div>
    </div>
  </div>;
}
