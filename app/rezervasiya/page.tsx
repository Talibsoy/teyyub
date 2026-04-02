"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  image_url: string | null;
}

function RezervasiyaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourId = searchParams.get("tour");

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    persons: 1,
    notes: "",
  });

  useEffect(() => {
    if (!tourId) { setLoading(false); return; }
    supabase
      .from("tours")
      .select("id, name, destination, price_azn, start_date, end_date, max_seats, booked_seats, image_url")
      .eq("id", tourId)
      .eq("is_active", true)
      .single()
      .then(({ data }) => { setTour(data); setLoading(false); });
  }, [tourId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tour) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Rezervasiya yarat
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tour_id: tour.id,
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email || undefined,
          persons: form.persons,
          notes: form.notes || undefined,
        }),
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok) {
        setError(bookData.error || "Rezervasiya xətası");
        setSubmitting(false);
        return;
      }

      // 2. Ödəniş yarat
      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookData.booking.id,
          amount: bookData.total_amount,
          description: `${tour.name} — ${form.persons} nəfər`,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.error || "Ödəniş xətası");
        setSubmitting(false);
        return;
      }

      // 3. Epoint-ə yönləndir
      router.push(payData.paymentUrl);
    } catch {
      setError("Xəta baş verdi, yenidən cəhd edin");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555" }}>Yüklənir...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#f87171" }}>Tur tapılmadı</p>
      </div>
    );
  }

  const seatsLeft = tour.max_seats - tour.booked_seats;
  const totalPrice = tour.price_azn * form.persons;

  const dateStr = tour.start_date
    ? new Date(tour.start_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "20px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13, marginBottom: 12, padding: 0 }}
          >
            ← Geri
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Rezervasiya</h1>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 24px" }}>
        {/* Tour summary */}
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
          <p style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
            {tour.destination}
          </p>
          <p style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{tour.name}</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 2 }}>QİYMƏT / NƏFƏR</p>
              <p style={{ color: "#D4AF37", fontSize: 18, fontWeight: 800 }}>{tour.price_azn} ₼</p>
            </div>
            {dateStr && (
              <div>
                <p style={{ color: "#555", fontSize: 11, marginBottom: 2 }}>TARİX</p>
                <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{dateStr}</p>
              </div>
            )}
            <div>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 2 }}>BOŞ YER</p>
              <p style={{ color: seatsLeft > 5 ? "#4ade80" : "#facc15", fontSize: 14, fontWeight: 600 }}>{seatsLeft}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Ad Soyad *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Müştəri adı"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Telefon *</label>
              <input
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+994 50 000 00 00"
                type="tel"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Email</label>
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                type="email"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Nəfər sayı *</label>
              <select
                value={form.persons}
                onChange={e => setForm({ ...form, persons: parseInt(e.target.value) })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {Array.from({ length: Math.min(seatsLeft, 10) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} nəfər</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Qeyd (istəyə bağlı)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Xüsusi tələblər, suallar..."
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

          </div>

          {/* Total */}
          <div style={{
            background: "#111", border: "1px solid #1a1a1a", borderRadius: 12,
            padding: "16px 20px", marginTop: 24, marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ color: "#555", fontSize: 12, marginBottom: 2 }}>Cəmi məbləğ</p>
              <p style={{ color: "#555", fontSize: 12 }}>{form.persons} nəfər × {tour.price_azn} ₼</p>
            </div>
            <p style={{ color: "#D4AF37", fontSize: 26, fontWeight: 800 }}>{totalPrice} ₼</p>
          </div>

          {error && (
            <div style={{
              background: "#1a0000", border: "1px solid #7f1d1d", borderRadius: 10,
              padding: "12px 16px", marginBottom: 16
            }}>
              <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 12,
              background: submitting ? "#555" : "#D4AF37",
              color: "#000", fontWeight: 800, fontSize: 16,
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Emal edilir..." : `Ödənişə Keç — ${totalPrice} ₼`}
          </button>

          <p style={{ color: "#444", fontSize: 12, textAlign: "center", marginTop: 12 }}>
            Epoint.az təhlükəsiz ödəniş sistemi ilə
          </p>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid #1a1a1a",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export default function RezervasiyaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555" }}>Yüklənir...</p>
      </div>
    }>
      <RezervasiyaForm />
    </Suspense>
  );
}
