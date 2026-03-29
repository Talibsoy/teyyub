import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

export default function PaymentDecline() {
  return (
    <div style={{
      background: "#0b0b0b", minHeight: "100vh", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#1a0a0a", border: "1px solid #c0392b",
        borderRadius: 20, padding: "48px 40px", maxWidth: 480,
        width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "#fff" }}>
          Ödəniş Rədd Edildi
        </h1>
        <p style={{ color: "#aaa", fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
          Kart məlumatlarınızı yoxlayıb yenidən cəhd edin. Problem davam edərsə
          bankınızla əlaqə saxlayın.
        </p>

        <div style={{
          background: "#111", border: "1px solid #2a1a1a",
          borderRadius: 12, padding: "16px 20px", marginBottom: 28,
        }}>
          <div style={{ color: "#e74c3c", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Ola biləcək səbəblər
          </div>
          <ul style={{ color: "#888", fontSize: 12, lineHeight: 2, listStyle: "none", padding: 0, margin: 0 }}>
            <li>• Kartda kifayət qədər balans yoxdur</li>
            <li>• Kart məlumatları yanlış daxil edilib</li>
            <li>• Bank tərəfindən bloklanıb</li>
            <li>• 3D Secure kodu yanlışdır</li>
          </ul>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href={waLink("Salam, ödənişim rədd olundu, kömək lazımdır")}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#25D366", color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 24px", fontSize: 14,
              fontWeight: 700, cursor: "pointer", textDecoration: "none",
              display: "block",
            }}
          >
            WhatsApp-da Kömək Al
          </a>
          <Link href="/" style={{
            color: "#666", fontSize: 13, textDecoration: "none",
          }}>
            Ana Səhifəyə Qayıt
          </Link>
        </div>
      </div>
    </div>
  );
}
