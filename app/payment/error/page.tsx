import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

export default function PaymentError() {
  return (
    <div style={{
      background: "#f8fafc", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{
        background: "#1a0d0d", border: "1px solid #ef4444",
        borderRadius: 20, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ödəniş Uğursuz Oldu</h1>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
          Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin və ya bizimlə əlaqə saxlayın.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a href={waLink("Salam, ödənişim uğursuz oldu, kömək lazımdır")}
            target="_blank" rel="noopener noreferrer"
            style={{
              background: "#25D366", borderRadius: 12,
              padding: "14px 24px", fontSize: 14, fontWeight: 700,
              textDecoration: "none", display: "block",
            }}>
            WhatsApp-da Kömək Al
          </a>
          <Link href="/turlar" style={{ color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>Turlara Qayıt</Link>
        </div>
      </div>
    </div>
  );
}
