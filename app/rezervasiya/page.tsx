"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, getSupabase } from "@/lib/supabase";
import { Calendar, Users, Lock, AlertTriangle } from "lucide-react";

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

interface Passenger {
  type: "adult" | "child";
  first_name: string;
  last_name: string;
  dob: string;
  gender: "male" | "female";
  passport_no: string;
  passport_expiry: string;
  nationality: string;
  age?: number;
}

const CHILD_PRICE_RATIO = 0.5;

const emptyPassenger = (type: "adult" | "child", age?: number): Passenger => ({
  type,
  first_name: "",
  last_name: "",
  dob: "",
  gender: "male",
  passport_no: "",
  passport_expiry: "",
  nationality: "Azərbaycan",
  age,
});

function RezervasiyaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourId = searchParams.get("tour");

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Step 1
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);

  // Step 2
  const [passengers, setPassengers] = useState<Passenger[]>([emptyPassenger("adult")]);

  // Step 3
  const [contact, setContact] = useState({ first_name: "", last_name: "", phone: "", email: "", notes: "" });

  useEffect(() => {
    const dest = `/rezervasiya?tour=${tourId || ""}`;
    // Auth yoxlaması — qeydiyyatsız istifadəçiləri login-ə yönləndir
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(dest)}`);
        return;
      }
      setAccessToken(session.access_token);
      if (!tourId) { setLoading(false); return; }
      supabase
        .from("tours")
        .select("id,name,destination,price_azn,start_date,end_date,max_seats,booked_seats,image_url")
        .eq("id", tourId).eq("is_active", true).single()
        .then(({ data }) => { setTour(data); setLoading(false); });
    });
  }, [tourId, router]);

  function setChildCount(n: number) {
    setChildren(n);
    setChildAges(Array.from({ length: n }, (_, i) => childAges[i] ?? 5));
  }

  function goToStep2() {
    const list: Passenger[] = [
      ...Array.from({ length: adults }, () => emptyPassenger("adult")),
      ...Array.from({ length: children }, (_, i) => emptyPassenger("child", childAges[i] ?? 5)),
    ];
    setPassengers(list);
    setStep(2);
  }

  function updatePassenger(idx: number, field: keyof Passenger, value: string) {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function step2Valid() {
    return passengers.every(p =>
      p.first_name.trim() && p.last_name.trim() && p.dob && p.passport_no.trim() && p.passport_expiry
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tour) return;
    setSubmitting(true);
    setError("");
    try {
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          tour_id: tour.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone,
          email: contact.email || undefined,
          adults,
          children,
          child_ages: childAges,
          passengers,
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
          description: `${tour.name} — ${adults}B${children > 0 ? `+${children}U` : ""}`,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) { setError((payData.detail || payData.error) || "Ödəniş xətası"); setSubmitting(false); return; }
      window.location.href = payData.paymentUrl;
    } catch {
      setError("Xəta baş verdi, yenidən cəhd edin");
      setSubmitting(false);
    }
  }

  if (loading) return <Screen><p style={{ color: "#64748b" }}>Yüklənir...</p></Screen>;
  if (!tour) return <Screen><p style={{ color: "#ef4444" }}>Tur tapılmadı</p></Screen>;

  const seatsLeft = tour.max_seats - tour.booked_seats;
  const childPrice = Math.round(tour.price_azn * CHILD_PRICE_RATIO);
  const totalPrice = tour.price_azn * adults + childPrice * children;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : router.back()}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 22, padding: 0 }}>←</button>
          <div>
            <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Addım {step} / 3 — {["Sərnişin sayı", "Sərnişin məlumatları", "Əlaqə və ödəniş"][step - 1]}</p>
            <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>{tour.name}</h1>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", maxWidth: "100%" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: 3,
            background: s <= step
              ? "linear-gradient(90deg, #0284c7, #4f46e5)"
              : "#e2e8f0",
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
        {/* Tour card */}
        <TourCard tour={tour} seatsLeft={seatsLeft} />

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 style={sectionTitle}>Sərnişinlər</h2>
            <PassengerRow label="Böyük" sublabel="12 yaş və yuxarı" price={tour.price_azn}
              count={adults} min={1} max={Math.min(seatsLeft, 9)} onChange={setAdults} />
            <PassengerRow label="Uşaq" sublabel="2–11 yaş" price={childPrice} priceNote="50% endirim"
              count={children} min={0} max={Math.min(seatsLeft - adults, 6)} onChange={setChildCount} />

            {children > 0 && (
              <div style={card}>
                <p style={labelStyle}>Uşaqların yaşı</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
                  {childAges.map((age, i) => (
                    <div key={i}>
                      <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Uşaq {i + 1}</p>
                      <select value={age} onChange={e => {
                        const a = [...childAges]; a[i] = parseInt(e.target.value); setChildAges(a);
                      }} style={selectStyle}>
                        {Array.from({ length: 10 }, (_, y) => y + 2).map(y => (
                          <option key={y} value={y}>{y} yaş</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 10 }}>* 0–1 yaş körpə — yataq tutmur, pulsuz</p>
              </div>
            )}

            <PriceSummary adults={adults} children={children} adultPrice={tour.price_azn} childPrice={childPrice} total={totalPrice} />
            <button onClick={goToStep2} style={btn(false)}>Davam Et →</button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2 style={sectionTitle}>Sərnişin məlumatları</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Pasport məlumatları bilet tərtibatı üçün lazımdır</p>

            {passengers.map((p, idx) => (
              <div key={idx} style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={{ color: "#0284c7", fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {p.type === "adult" ? `Böyük ${idx + 1}` : `Uşaq ${idx - adults + 1}${p.age ? ` (${p.age} yaş)` : ""}`}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["male", "female"] as const).map(g => (
                      <button key={g} type="button" onClick={() => updatePassenger(idx, "gender", g)}
                        style={{
                          padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                          background: p.gender === g ? "#0284c7" : "#f8fafc",
                          color: p.gender === g ? "white" : "#64748b",
                          border: `1px solid ${p.gender === g ? "#0284c7" : "#e2e8f0"}`,
                          fontWeight: 600,
                        }}>
                        {g === "male" ? "Kişi" : "Qadın"}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <F label="Ad *" value={p.first_name} onChange={v => updatePassenger(idx, "first_name", v)} placeholder="Əli" />
                  <F label="Soyad *" value={p.last_name} onChange={v => updatePassenger(idx, "last_name", v)} placeholder="Həsənov" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <F label="Doğum tarixi *" value={p.dob} onChange={v => updatePassenger(idx, "dob", v)} type="date" />
                  <F label="Vətəndaşlıq" value={p.nationality} onChange={v => updatePassenger(idx, "nationality", v)} placeholder="Azərbaycan" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <F label="Pasport nömrəsi *" value={p.passport_no} onChange={v => updatePassenger(idx, "passport_no", v)} placeholder="AA1234567" />
                  <F label="Pasport bitmə tarixi *" value={p.passport_expiry} onChange={v => updatePassenger(idx, "passport_expiry", v)} type="date" />
                </div>
              </div>
            ))}

            <div style={{ ...card, background: "#fefce8", border: "1px solid #fef08a", marginTop: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertTriangle size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "#92400e", fontSize: 12, margin: 0 }}>
                Pasport məlumatları düzgün daxil edilməlidir. Yanlış məlumat bilet ləğvinə səbəb ola bilər.
              </p>
            </div>

            <button onClick={() => step2Valid() ? setStep(3) : setError("Bütün vacib sahələri doldurun")}
              style={btn(false)}>Davam Et →</button>
            {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{error}</p>}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 style={sectionTitle}>Əlaqə məlumatları</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <F label="Ad *" value={contact.first_name} onChange={v => setContact({ ...contact, first_name: v })} placeholder="Əli" required />
                <F label="Soyad" value={contact.last_name} onChange={v => setContact({ ...contact, last_name: v })} placeholder="Həsənov" />
              </div>
              <F label="Telefon *" value={contact.phone} onChange={v => setContact({ ...contact, phone: v })} placeholder="+994 50 000 00 00" type="tel" required />
              <F label="Email" value={contact.email} onChange={v => setContact({ ...contact, email: v })} placeholder="email@example.com" type="email" />
              <div>
                <label style={labelStyle}>Qeyd</label>
                <textarea value={contact.notes} onChange={e => setContact({ ...contact, notes: e.target.value })}
                  placeholder="Xüsusi tələblər, suallar..." rows={3}
                  style={{ ...inputStyle, resize: "none" }} />
              </div>
            </div>

            <PriceSummary adults={adults} children={children} adultPrice={tour.price_azn} childPrice={childPrice} total={totalPrice} />

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} style={btn(submitting)}>
              {submitting ? "Emal edilir..." : `Ödənişə Keç — ${totalPrice} ₼`}
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
              <Lock size={12} color="#94a3b8" />
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Epoint.az təhlükəsiz ödəniş</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function TourCard({ tour, seatsLeft }: { tour: Tour; seatsLeft: number }) {
  const startDate = tour.start_date ? new Date(tour.start_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : null;
  const endDate = tour.end_date ? new Date(tour.end_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long" }) : null;
  return (
    <div style={{ ...card, marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {tour.image_url && <img src={tour.image_url} alt={tour.name} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <p style={{ color: "#0284c7", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>{tour.destination}</p>
          <p style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{tour.name}</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {startDate && (
              <span style={{ color: "#64748b", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={12} />
                {startDate}{endDate ? ` — ${endDate}` : ""}
              </span>
            )}
            <span style={{ color: seatsLeft > 5 ? "#16a34a" : "#ca8a04", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={12} />
              {seatsLeft} boş yer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassengerRow({ label: lbl, sublabel, price, priceNote, count, min, max, onChange }: {
  label: string; sublabel: string; price: number; priceNote?: string;
  count: number; min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <div style={{ ...card, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, margin: 0 }}>{lbl}</p>
        <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0" }}>{sublabel}</p>
        <p style={{ color: "#0284c7", fontSize: 13, fontWeight: 700, margin: "4px 0 0" }}>
          {price} ₼{priceNote && <span style={{ color: "#16a34a", fontSize: 11, marginLeft: 6 }}>{priceNote}</span>}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <button type="button" onClick={() => count > min && onChange(count - 1)} disabled={count <= min}
          style={counterBtn(count <= min)}>−</button>
        <span style={{ width: 36, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{count}</span>
        <button type="button" onClick={() => count < max && onChange(count + 1)} disabled={count >= max}
          style={counterBtn(count >= max)}>+</button>
      </div>
    </div>
  );
}

function PriceSummary({ adults, children, adultPrice, childPrice, total }: {
  adults: number; children: number; adultPrice: number; childPrice: number; total: number;
}) {
  return (
    <div style={{ ...card, margin: "20px 0" }}>
      <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Qiymət</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#64748b", fontSize: 13 }}>Böyük × {adults}</span>
          <span style={{ color: "#0f172a", fontSize: 13 }}>{adultPrice * adults} ₼</span>
        </div>
        {children > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>Uşaq × {children}</span>
            <span style={{ color: "#0f172a", fontSize: 13 }}>{childPrice * children} ₼</span>
          </div>
        )}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#0f172a", fontWeight: 700 }}>Cəmi</span>
          <span style={{ color: "#0284c7", fontSize: 22, fontWeight: 800 }}>{total} ₼</span>
        </div>
      </div>
    </div>
  );
}

function F({ label: lbl, value, onChange, placeholder, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}

/* ── Styles ── */
const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" };
const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#0f172a" };
const labelStyle: React.CSSProperties = { color: "#64748b", fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: "100%", background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#0f172a" };
const selectStyle: React.CSSProperties = { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#0f172a" };
const btn = (disabled: boolean): React.CSSProperties => ({
  width: "100%", padding: "15px 0", borderRadius: 12, marginTop: 8,
  background: disabled ? "#e2e8f0" : "linear-gradient(135deg, #0284c7, #4f46e5)",
  color: disabled ? "#94a3b8" : "white",
  fontWeight: 800, fontSize: 16, border: "none", cursor: disabled ? "not-allowed" : "pointer",
});
const counterBtn = (disabled: boolean): React.CSSProperties => ({
  width: 36, height: 36, borderRadius: "50%", border: "1px solid #e2e8f0",
  background: disabled ? "#f8fafc" : "white", color: disabled ? "#94a3b8" : "#0f172a", fontSize: 20,
  cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
});

export default function RezervasiyaPage() {
  return (
    <Suspense fallback={<Screen><p style={{ color: "#64748b" }}>Yüklənir...</p></Screen>}>
      <RezervasiyaForm />
    </Suspense>
  );
}
