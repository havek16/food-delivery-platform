import Link from "next/link";

export default function OwnerLoginPage() {
  return <div><div style={{ maxWidth: 500, margin: "0 auto", padding: "80px 20px 30px", textAlign: "center" }}><h1 style={{ fontSize: 34, marginBottom: 8 }}>Restaurant partner login</h1><p style={{ color: "#78716c" }}>Access your orders, menu, and sales dashboard.</p><Link className="button-primary" href="/login?role=owner" style={{ marginTop: 20 }}>Continue to owner login</Link></div></div>;
}
