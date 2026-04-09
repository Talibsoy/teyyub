"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

type Method = "card" | "google" | "apple";

function CheckoutForm() {
  const params      = useSearchParams();
  const router      = useRouter();

  const bookingId   = params.get("bookingId")   || "";
  const amount      = parseFloat(params.get("amount") || "0");
  const description = params.get("description") || "Tur ödənişi";
  const tourName    = params.get("tourName")    || description;

  const [method,  setMethod]  = useState<Method>("card");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handlePay() {
    if (!bookingId || amount <= 0) {
      setError("Rezervasiya məlumatları tapılmadı.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Auth token-i götür — loyalty + CRM sinxronizasiyası üçün
      const { data: { session } } = await getSupabase().auth.getSession();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
      };

      if (method === "card") {
        const res  = await fetch("/api/payment/create", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ bookingId, amount, description }),
        });
        const json = await res.json();
        if (!res.ok || !json.paymentUrl) throw new Error(json.error || "Ödəniş yaradıla bilmədi");
        window.location.href = json.paymentUrl;
      } else {
        const res  = await fetch("/api/payment/widget", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ bookingId, amount, description }),
        });
        const json = await res.json();
        if (!res.ok || !json.widgetUrl) throw new Error(json.error || "Widget URL alına bilmədi");
        window.location.href = json.widgetUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
      setLoading(false);
    }
  }

  const methodCard = (id: Method, label: string, sub: string, icon: React.ReactNode) => {
    const active = method === id;
    return (
      <button
        onClick={() => setMethod(id)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          width: "100%", padding: "16px 18px", borderRadius: 14,
          border: active ? "2px solid #0284c7" : "2px solid #e2e8f0",
          background: active ? "linear-gradient(135deg,#f0f9ff,#e0f2fe)" : "white",
          cursor: "pointer", textAlign: "left", transition: "all 0.18s",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: active ? "white" : "#f8fafc",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: active ? "0 2px 8px rgba(2,132,199,0.15)" : "none",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{label}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: active ? "2px solid #0284c7" : "2px solid #cbd5e1",
          background: active ? "#0284c7" : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {active && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </button>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 50%,#f0f4ff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Image src="/logo.png" alt="Natoure" width={36} height={36}
              style={{ borderRadius: "50%", objectFit: "cover" }} />
            <span style={{
              fontWeight: 800, fontSize: 18,
              background: "linear-gradient(135deg,#0284c7,#4f46e5)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Natoure</span>
          </Link>
          <div style={{ color: "#64748b", fontSize: 13 }}>Təhlükəsiz ödəniş · SSL şifrələnmiş</div>
        </div>

        {/* Order summary card */}
        <div style={{
          background: "white", borderRadius: 20,
          boxShadow: "0 4px 30px rgba(0,0,0,0.06)",
          marginBottom: 16, overflow: "hidden",
        }}>
          <div style={{
            background: "linear-gradient(135deg,#0284c7,#4f46e5)",
            padding: "20px 24px",
          }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Ödəniş Məbləği
            </div>
            <div style={{ color: "white", fontSize: 36, fontWeight: 900, marginTop: 4, letterSpacing: -1 }}>
              {amount.toFixed(2)} <span style={{ fontSize: 20, fontWeight: 700 }}>AZN</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 6 }}>
              {tourName}
            </div>
          </div>

          {/* Secure badges */}
          <div style={{
            padding: "12px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            {["🔒 SSL", "🏦 Epoint.az", "💳 3D Secure"].map(b => (
              <span key={b} style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Payment method selection */}
        <div style={{
          background: "white", borderRadius: 20,
          boxShadow: "0 4px 30px rgba(0,0,0,0.06)",
          padding: "24px",
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 16 }}>
            Ödəniş üsulunu seçin
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {methodCard("card", "Bank Kartı", "Visa, Mastercard, yerli kartlar", (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            ))}
            {methodCard("google", "Google Pay", "Android, Chrome brauzeri", (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            ))}
            {methodCard("apple", "Apple Pay", "iPhone, iPad, Mac", (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0f172a">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            ))}
          </div>

          {error && (
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 12,
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              marginTop: 20, width: "100%", padding: "15px",
              borderRadius: 14, border: "none",
              background: loading
                ? "#cbd5e1"
                : method === "apple"
                  ? "#0f172a"
                  : "linear-gradient(135deg,#0284c7,#4f46e5)",
              color: "white", fontWeight: 800, fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 25px rgba(2,132,199,0.3)",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white",
                  animation: "spin 0.8s linear infinite",
                }} />
                Yönləndirilir...
              </>
            ) : (
              <>
                {method === "card"   && "💳 "}
                {method === "google" && ""}
                {method === "apple"  && " "}
                {amount.toFixed(2)} AZN Ödə
              </>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 14, lineHeight: 1.6 }}>
            Ödəniş Epoint.az platforması vasitəsilə təhlükəsiz şəkildə həyata keçirilir.
            Kart məlumatlarınız bizim serverlərə ötürülmür.
          </p>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}
