import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

export default function PaymentSuccess() {
  return (
    <div style={{
      background: "#0b0b0b", minHeight: "100vh", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{
        background: "#0d1a0d", border: "1px solid #25D366",
        borderRadius: 20, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ödəniş Uğurlu Keçdi!</h1>
        <p style={{ color: "#aaa", fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
          Rezervasiyanız təsdiqləndi. Yaxın zamanda komandamız sizinlə əlaqə saxlayacaq.
        </p>
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
          <div style={{ color: "#25D366", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Növbəti addım</div>
          <div style={{ color: "#aaa", fontSize: 13 }}>Pasport + uçuş təfərrüatları üçün WhatsApp-da bizimlə əlaqə saxlayın</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a href={waLink("Salam, ödənişim keçdi, rezervasiya təsdiqi üçün yazıram")}
            target="_blank" rel="noopener noreferrer"
            style={{
              background: "#25D366", color: "#fff", borderRadius: 12,
              padding: "14px 24px", fontSize: 14, fontWeight: 700,
              textDecoration: "none", display: "block",
            }}>
            WhatsApp-da Yazın
          </a>
          <Link href="/" style={{ color: "#666", fontSize: 13, textDecoration: "none" }}>Ana Səhifəyə Qayıt</Link>
        </div>
      </div>
    </div>
  );
}
