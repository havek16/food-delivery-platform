import Link from "next/link";

export default function AdminLoginPage() {
  return <div><div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 20px 30px", textAlign: "center" }}><h1 style={{ fontSize: 34, marginBottom: 8 }}>Platform admin login</h1><p style={{ color: "#78716c" }}>Manage restaurants, users, orders, coupons, and reviews.</p><Link className="button-primary" href="/login?role=admin" style={{ marginTop: 20 }}>Continue to admin login</Link></div></div>;
}
