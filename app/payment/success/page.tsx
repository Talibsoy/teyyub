"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";
import { getSupabase } from "@/lib/supabase";

function SuccessContent() {
  const params    = useSearchParams();
  const orderId   = params.get("orderId")   || "";
  const bookingId = params.get("bookingId") || "";

  const [verified, setVerified] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    // orderId format: NAT-{bookingId}-{timestamp}
    const validFormat = orderId.startsWith("NAT-") && bookingId.length > 8;
    if (!validFormat) { setVerified("invalid"); return; }

    // DB-dən ödənişi yoxla — webhook işlənibsə "paid", henüz işlənməyibsə "pending"
    (async () => {
      try {
        const { data } = await getSupabase()
          .from("payments")
          .select("status")
          .eq("epoint_order_id", orderId)
          .maybeSingle();
        // "paid" və ya "pending" (webhook hələ gəlməyib) — hər ikisi keçərlidir
        setVerified(data ? "ok" : "invalid");
      } catch {
        setVerified("ok"); // şəbəkə xətasında səhifəni göstər
      }
    })();
  }, [orderId, bookingId]);

  if (verified === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b" }}>Yüklənir...</p>
    </div>
  );

  if (verified === "invalid") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "#ef4444", fontWeight: 700 }}>Rezervasiya tapılmadı</p>
      <Link href="/" style={{ color: "#0284c7" }}>Ana Səhifəyə Qayıt</Link>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0f4ff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Image src="/logo.png" alt="Natoure" width={36} height={36}
              style={{ borderRadius: "50%", objectFit: "cover" }} />
            <span style={{
              fontWeight: 800, fontSize: 18,
              background: "linear-gradient(135deg,#0284c7,#4f46e5)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Natoure</span>
          </Link>
        </div>

        <div style={{
          background: "white", borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          {/* Green header */}
          <div style={{
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            padding: "36px 32px 28px", textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M8 18l7 7 13-13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>
              Ödəniş Uğurlu Keçdi!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: 0 }}>
              Rezervasiyanız təsdiqləndi
            </p>
          </div>

          <div style={{ padding: "28px 28px 32px" }}>

            {/* Order info */}
            {(orderId || bookingId) && (
              <div style={{
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 12, padding: "14px 16px", marginBottom: 20,
              }}>
                {orderId && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: bookingId ? 8 : 0 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Sifariş nömrəsi</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{orderId}</span>
                  </div>
                )}
                {bookingId && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Rezervasiya ID</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{bookingId}</span>
                  </div>
                )}
              </div>
            )}

            {/* Next step info */}
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: 12, padding: "14px 16px", marginBottom: 24,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>📱</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>
                  Növbəti addım
                </div>
                <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
                  Pasport məlumatları və uçuş təfərrüatlarını tamamlamaq üçün WhatsApp-da bizimlə əlaqə saxlayın.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href={waLink(`Salam, ödənişim uğurla keçdi. Sifariş: ${orderId || bookingId}. Rezervasiya təsdiqi üçün yazıram.`)}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#25D366", borderRadius: 14,
                  padding: "14px 24px", fontSize: 14, fontWeight: 700,
                  color: "white", textDecoration: "none",
                  boxShadow: "0 4px 15px rgba(37,211,102,0.3)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp-da Yazın
              </a>
              <Link href="/panel" style={{
                display: "block", textAlign: "center", padding: "12px",
                borderRadius: 14, border: "1.5px solid #e2e8f0",
                color: "#475569", fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>
                Panelimə Keç
              </Link>
              <Link href="/" style={{
                display: "block", textAlign: "center",
                color: "#94a3b8", fontSize: 13, textDecoration: "none", marginTop: 4,
              }}>
                Ana Səhifəyə Qayıt
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
