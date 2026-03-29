import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

export default function PaymentCancel() {
  return (
    <div style={{
      background: "#0b0b0b", minHeight: "100vh", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a",
        borderRadius: 20, padding: "48px 40px", maxWidth: 480,
        width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>↩️</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "#fff" }}>
          Ödəniş Ləğv Edildi
        </h1>
        <p style={{ color: "#aaa", fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
          Ödəniş prosesini dayandırdınız. Rezervasiyanız hələ aktiv deyil.
          İstəsəniz yenidən cəhd edə bilərsiniz.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href={waLink("Salam, ödəniş prosesini yarımçıq qoydum, kömək lazımdır")}
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
          <Link href="/turlar" style={{
            background: "#1a1a1a", color: "#fff", border: "1px solid #2a2a2a",
            borderRadius: 12, padding: "13px 24px", fontSize: 14,
            fontWeight: 600, textDecoration: "none", display: "block",
          }}>
            Turlara Bax
          </Link>
        </div>
      </div>
    </div>
  );
}
