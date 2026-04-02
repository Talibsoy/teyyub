"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

const CHILD_PRICE_RATIO = 0.5; // 50%

function RezervasiyaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourId = searchParams.get("tour");

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // 1: Sərnişinlər, 2: Əlaqə

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);

  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    if (!tourId) { setLoading(false); return; }
    supabase
      .from("tours")
      .select("id,name,destination,price_azn,start_date,end_date,max_seats,booked_seats,image_url")
      .eq("id", tourId)
      .eq("is_active", true)
      .single()
      .then(({ data }) => { setTour(data); setLoading(false); });
  }, [tourId]);

  function setChildCount(n: number) {
    setChildren(n);
    setChildAges(Array.from({ length: n }, (_, i) => childAges[i] ?? 5));
  }

  function setChildAge(idx: number, age: number) {
    setChildAges(prev => prev.map((a, i) => i === idx ? age : a));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tour) return;
    setSubmitting(true);
    setError("");

    try {
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tour_id: tour.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone,
          email: contact.email || undefined,
          adults,
          children,
          child_ages: childAges,
          notes: contact.notes || undefined,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) { setError((bookData.detail || bookData.error) || "Rezervasiya xətası"); setSubmitting(false); return; }

      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookData.booking.id,
          amount: bookData.total_price,
          description: `${tour.name} — ${adults}B${children > 0 ? ` + ${children}U` : ""}`,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) { setError(payData.error || "Ödəniş xətası"); setSubmitting(false); return; }

      router.push(payData.paymentUrl);
    } catch {
      setError("Xəta baş verdi, yenidən cəhd edin");
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!tour) return <NotFound />;

  const seatsLeft = tour.max_seats - tour.booked_seats;
  const childPrice = Math.round(tour.price_azn * CHILD_PRICE_RATIO);
  const totalPrice = tour.price_azn * adults + childPrice * children;

  const startDate = tour.start_date
    ? new Date(tour.start_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const endDate = tour.end_date
    ? new Date(tour.end_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", color: "#fff", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => step === 2 ? setStep(1) : router.back()}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>
            ←
          </button>
          <div>
            <p style={{ color: "#555", fontSize: 12, margin: 0 }}>
              {step === 1 ? "Addım 1 / 2 — Sərnişin məlumatları" : "Addım 2 / 2 — Əlaqə məlumatları"}
            </p>
            <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{tour.name}</h1>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex" }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3,
              background: s <= step ? "#D4AF37" : "#1a1a1a",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>

        {/* Tour summary card */}
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {tour.image_url && (
              <img src={tour.image_url} alt={tour.name}
                style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>{tour.destination}</p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>{tour.name}</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {startDate && <span style={{ color: "#777", fontSize: 12 }}>📅 {startDate}{endDate ? ` — ${endDate}` : ""}</span>}
                <span style={{ color: seatsLeft > 5 ? "#4ade80" : "#facc15", fontSize: 12 }}>💺 {seatsLeft} boş yer</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: Passengers */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Sərnişinlər</h2>

            {/* Adults */}
            <PassengerRow
              label="Böyük"
              sublabel="12 yaş və yuxarı"
              price={tour.price_azn}
              count={adults}
              min={1}
              max={Math.min(seatsLeft, 9)}
              onChange={setAdults}
            />

            {/* Children */}
            <PassengerRow
              label="Uşaq"
              sublabel="2–11 yaş"
              price={childPrice}
              priceNote="50% endirim"
              count={children}
              min={0}
              max={Math.min(seatsLeft - adults, 6)}
              onChange={setChildCount}
            />

            {/* Child ages */}
            {children > 0 && (
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px", marginTop: 12 }}>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>Uşaqların yaşı</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {childAges.map((age, i) => (
                    <div key={i}>
                      <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>Uşaq {i + 1}</p>
                      <select
                        value={age}
                        onChange={e => setChildAge(i, parseInt(e.target.value))}
                        style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", padding: "8px 12px", fontSize: 13 }}
                      >
                        {Array.from({ length: 10 }, (_, y) => y + 2).map(y => (
                          <option key={y} value={y}>{y} yaş</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <p style={{ color: "#444", fontSize: 11, marginTop: 10 }}>
                  * 0–1 yaş körpə — yataq tutmur, pulsuz
                </p>
              </div>
            )}

            {/* Price summary */}
            <PriceSummary adults={adults} children={children} adultPrice={tour.price_azn} childPrice={childPrice} total={totalPrice} />

            <button
              onClick={() => setStep(2)}
              disabled={adults + children > seatsLeft}
              style={btnStyle(adults + children > seatsLeft)}
            >
              Davam Et →
            </button>
          </div>
        )}

        {/* STEP 2: Contact */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Əlaqə məlumatları</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Ad *" value={contact.first_name}
                  onChange={v => setContact({ ...contact, first_name: v })} placeholder="Əli" required />
                <Field label="Soyad" value={contact.last_name}
                  onChange={v => setContact({ ...contact, last_name: v })} placeholder="Həsənov" />
              </div>
              <Field label="Telefon *" value={contact.phone} type="tel"
                onChange={v => setContact({ ...contact, phone: v })} placeholder="+994 50 000 00 00" required />
              <Field label="Email" value={contact.email} type="email"
                onChange={v => setContact({ ...contact, email: v })} placeholder="email@example.com" />
              <div>
                <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>Qeyd</label>
                <textarea
                  value={contact.notes}
                  onChange={e => setContact({ ...contact, notes: e.target.value })}
                  placeholder="Xüsusi tələblər, suallar..."
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
            </div>

            <PriceSummary adults={adults} children={children} adultPrice={tour.price_azn} childPrice={childPrice} total={totalPrice} />

            {error && (
              <div style={{ background: "#1a0000", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} style={btnStyle(submitting)}>
              {submitting ? "Emal edilir..." : `Ödənişə Keç — ${totalPrice} ₼`}
            </button>
            <p style={{ color: "#333", fontSize: 12, textAlign: "center", marginTop: 10 }}>
              🔒 Epoint.az təhlükəsiz ödəniş
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function PassengerRow({ label, sublabel, price, priceNote, count, min, max, onChange }: {
  label: string; sublabel: string; price: number; priceNote?: string;
  count: number; min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0 }}>{label}</p>
        <p style={{ color: "#555", fontSize: 12, margin: "2px 0 0" }}>{sublabel}</p>
        <p style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700, margin: "4px 0 0" }}>
          {price} ₼
          {priceNote && <span style={{ color: "#4ade80", fontSize: 11, marginLeft: 6 }}>{priceNote}</span>}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <button type="button"
          onClick={() => count > min && onChange(count - 1)}
          disabled={count <= min}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #333", background: "#1a1a1a", color: count <= min ? "#333" : "#fff", fontSize: 20, cursor: count <= min ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          −
        </button>
        <span style={{ width: 36, textAlign: "center", fontSize: 16, fontWeight: 700 }}>{count}</span>
        <button type="button"
          onClick={() => count < max && onChange(count + 1)}
          disabled={count >= max}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #333", background: "#1a1a1a", color: count >= max ? "#333" : "#fff", fontSize: 20, cursor: count >= max ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          +
        </button>
      </div>
    </div>
  );
}

function PriceSummary({ adults, children, adultPrice, childPrice, total }: {
  adults: number; children: number; adultPrice: number; childPrice: number; total: number;
}) {
  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
      <p style={{ color: "#555", fontSize: 12, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Qiymət hesablaması</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#888", fontSize: 13 }}>Böyük × {adults}</span>
          <span style={{ color: "#fff", fontSize: 13 }}>{adultPrice * adults} ₼</span>
        </div>
        {children > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#888", fontSize: 13 }}>Uşaq × {children}</span>
            <span style={{ color: "#fff", fontSize: 13 }}>{childPrice * children} ₼</span>
          </div>
        )}
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700 }}>Cəmi</span>
          <span style={{ color: "#D4AF37", fontSize: 22, fontWeight: 800 }}>{total} ₼</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#555" }}>Yüklənir...</p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#f87171" }}>Tur tapılmadı</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#111", border: "1px solid #1a1a1a",
  borderRadius: 10, padding: "12px 14px", color: "#fff",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "15px 0", borderRadius: 12,
    background: disabled ? "#333" : "#D4AF37",
    color: disabled ? "#666" : "#000",
    fontWeight: 800, fontSize: 16, border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  };
}

export default function RezervasiyaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#555" }}>Yüklənir...</p></div>}>
      <RezervasiyaForm />
    </Suspense>
  );
}
