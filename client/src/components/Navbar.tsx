"use client";
import Link from "next/link";
import { MapPin, ShoppingBag, UserRound, ChevronDown } from "lucide-react";
import { useCart, cartTotals } from "@/stores/cart";

export function Navbar() {
  const { items } = useCart();
  const count = cartTotals(items).count;
  return <header style={{ background: "#fff", borderBottom: "1px solid #e7e2dc" }}>
    <nav className="site-shell" style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <Link href="/" style={{ fontWeight: 800, fontSize: 21, letterSpacing: -1, color: "#1c1917" }}>table<span style={{ color: "#e6532f" }}>&amp;</span>tomato</Link>
      <button className="button-light" style={{ border: 0, padding: "8px 10px", marginRight: "auto" }}><MapPin size={16} color="#e6532f" /><span className="hidden sm:inline">Deliver to <b>Brooklyn, NY</b></span><ChevronDown size={14} /></button>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Link href="/restaurants" className="hidden sm:inline" style={{ color: "#57534e", fontSize: 14, fontWeight: 600 }}>Browse restaurants</Link>
        <Link href="/orders" aria-label="Orders" style={{ color: "#57534e" }}><UserRound size={19} /></Link>
        <Link href="/checkout" style={{ position: "relative", color: "#57534e" }}><ShoppingBag size={20} />{count > 0 && <span style={{ position: "absolute", right: -9, top: -9, minWidth: 18, height: 18, borderRadius: 12, background: "#e6532f", color: "#fff", fontSize: 11, display: "grid", placeItems: "center", fontWeight: 700 }}>{count}</span>}</Link>
      </div>
    </nav>
  </header>;
}
