"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, Users, Shield, Lock, CreditCard, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface GuestInfo {
  first_name: string;
  last_name: string;
  citizenship: string;
  gender: "male" | "female";
}

function PrebookForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Query params
  const hotelId = searchParams.get("hotel_id");
  const checkin = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");
  const initialHash = searchParams.get("hash");
  const hotelName = searchParams.get("hotel_name") || "Seçilmiş Otel";
  const markedPrice = searchParams.get("price") || "0";
  const roomType = searchParams.get("room") || "Standart Otaq";
  const mealType = searchParams.get("meal") || "Yemək daxil deyil";
  const adultsCount = parseInt(searchParams.get("adults") || "2", 10);
  const childrenCount = parseInt(searchParams.get("children") || "0", 10);
  const childAgesStr = searchParams.get("child_ages") || "";
  const childAges = childAgesStr ? childAgesStr.split(",").map(Number) : [];

  // Page states
  const [prebookLoading, setPrebookLoading] = useState(true);
  const [prebookError, setPrebookError] = useState("");
  const [prebookData, setPrebookData] = useState<any>(null);

  // Form states
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");

  // Testing sandbox scenario override state
  const [testScenario, setTestScenario] = useState<"1" | "2" | "3" | "4" | "none">("none");

  // Booking submit states
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingStatusText, setBookingStatusText] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  // Step 1: Prebook check on load
  useEffect(() => {
    if (!initialHash) {
      setPrebookError("Axtarış məlumatları tam deyil. Yenidən cəhd edin.");
      setPrebookLoading(false);
      return;
    }

    async function runPrebook() {
      try {
        const res = await fetch("/api/booking/prebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash: initialHash }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setPrebookError(data.error || "Otaq artıq mövcud deyil.");
        } else {
          setPrebookData(data);
          // Initialize passenger list
          const list: GuestInfo[] = [];
          for (let i = 0; i < adultsCount; i++) {
            list.push({ first_name: "", last_name: "", citizenship: "AZ", gender: "male" });
          }
          for (let i = 0; i < childrenCount; i++) {
            list.push({ first_name: "", last_name: "", citizenship: "AZ", gender: "male" });
          }
          setGuests(list);
        }
      } catch {
        setPrebookError("Prebook yoxlanışı zamanı xəta baş verdi.");
      } finally {
        setPrebookLoading(false);
      }
    }

    runPrebook();
  }, [initialHash, adultsCount, childrenCount]);

  // Handle Scenario overrides for Sandbox testing
  const selectScenario = (scen: "1" | "2" | "3" | "4") => {
    setTestScenario(scen);
    setGuests(prev => {
      const citizen = scen === "1" ? "MC" : "AZ";
      return prev.map(g => ({ ...g, citizenship: citizen }));
    });
  };

  // Step 2: Book submit
  async function handleBookSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prebookData || bookingLoading) return;

    // Validation
    const allFilled = guests.every(g => g.first_name.trim() && g.last_name.trim() && g.citizenship.trim());
    if (!allFilled || !phone.trim()) {
      setBookingError("Zəhmət olmasa bütün vacib sahələri doldurun.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingStatusText("Rezervasiya yaradılır və status yoxlanılır (200 saniyəyə qədər çəkə bilər)...");

    // Generate scenario-specific partner_order_id if selected.
    // ETG sandbox sehrli suffix formatı: <finiş_nəticəsi>_<status_nəticəsi>
    let partner_order_id = `natoure_${Date.now()}`;
    if (testScenario === "1") partner_order_id += "_success";              // S1: uğurlu
    else if (testScenario === "2") partner_order_id += "_unknown_success"; // S2: unknown finişdə → ok
    else if (testScenario === "3") partner_order_id += "_timeout_soldout"; // S3: timeout → soldout
    else if (testScenario === "4") partner_order_id += "_unknown_book_limit"; // S4: unknown → book_limit

    // Start UI update simulation for polling
    let secondsLeft = 0;
    const interval = setInterval(() => {
      secondsLeft += 5;
      if (secondsLeft < 200) {
        setBookingStatusText(`Rezervasiya statusu yoxlanılır... Keçən vaxt: ${secondsLeft}s (Maks. 200s)`);
      }
    }, 5000);

    try {
      const res = await fetch("/api/booking/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_hash: prebookData.book_hash,
          phone,
          email: email || undefined,
          comment: comment || undefined,
          guests: guests.map(g => ({
            first_name: g.first_name.trim(),
            last_name: g.last_name.trim(),
            citizenship: g.citizenship.toUpperCase(),
          })),
          partner_order_id,
          price: parseFloat(markedPrice),
          currency: "USD",
          destination: hotelName,
          checkin,
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setBookingError(data.message || data.error || "Rezervasiya tamamlanarkən xəta baş verdi.");
      } else {
        setBookingSuccess(data);
      }
    } catch {
      clearInterval(interval);
      setBookingError("Şəbəkə xətası baş verdi. Yenidən cəhd edin.");
    } finally {
      setBookingLoading(false);
    }
  }

  const handleGuestChange = (idx: number, field: keyof GuestInfo, val: string) => {
    setGuests(prev => prev.map((g, i) => i === idx ? { ...g, [field]: val } : g));
  };

  if (prebookLoading) {
    return (
      <Screen>
        <div style={{ textAlign: "center" }}>
          <RefreshCw className="animate-spin text-[#0284c7] mb-4" size={44} style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Otaq mövcudluğu yoxlanılır</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>RateHawk API vasitəsilə otaq və qiymət statusu yenilənir...</p>
        </div>
      </Screen>
    );
  }

  if (prebookError) {
    return (
      <Screen>
        <div style={{ textAlign: "center", maxWidth: 440, padding: 24, background: "white", borderRadius: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: "1.5px solid #fecaca" }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Otaq mövcud deyil</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Seçdiyiniz otaq və ya qiymət hazırda RateHawk tərəfindən təsdiqlənmədi. Xəta kodu: <code style={{ color: "#dc2626", fontWeight: "bold" }}>{prebookError}</code>. Zəhmət olmasa otellərə qayıdaraq başqa otaq seçin.
          </p>
          <button onClick={() => router.push("/oteller")} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white", fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer" }}>
            Otellərə Qayıt
          </button>
        </div>
      </Screen>
    );
  }

  if (bookingSuccess) {
    return (
      <Screen>
        <div style={{ maxWidth: 640, background: "white", borderRadius: 24, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", overflow: "hidden", width: "100%" }}>
          <div style={{ background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)", padding: "28px 24px", color: "white", textAlign: "center" }}>
            <CheckCircle size={48} style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Rezervasiya Təsdiqləndi!</h2>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 14 }}>Sifarişiniz uğurla tamamlandı və təsdiq kodu alındı.</p>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Təsdiq Kodu (Order ID)</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{bookingSuccess.order_id}</span>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Status</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#16a34a" }}>OK / CONFIRMED</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Otel adı</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{hotelName}</span>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Otaq növü</span>
                  <span style={{ color: "#475569" }}>{roomType}</span>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>Qidalanma</span>
                  <span style={{ color: "#475569" }}>{mealType}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 12, textTransform: "uppercase", color: "#94a3b8", fontWeight: 600 }}>Qonaqlar</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {guests.map((g, i) => (
                  <div key={i} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{g.first_name} {g.last_name}</span>
                    <span style={{ color: "#64748b" }}>{g.citizenship.toUpperCase()} · {g.gender === "male" ? "Kişi" : "Qadın"}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => router.push("/oteller")} style={{ width: "100%", padding: "14px 0", background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white", fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer" }}>
              Yeni Axtarış
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "32px 16px 80px" }}>
      {bookingLoading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", color: "white", padding: 20 }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <RefreshCw className="animate-spin text-[#0284c7] mb-4" size={48} style={{ margin: "0 auto 18px" }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Bron Tamamlanır</h3>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>{bookingStatusText}</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, width: 40, height: 40, cursor: "pointer", fontSize: 18, color: "#475569" }}>←</button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Rezervasiyanın Rəsmiləşdirilməsi</h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "2px 0 0" }}>Zəhmət olmasa sərnişin və əlaqə məlumatlarını daxil edin</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, alignItems: "flex-start" }}>
          {/* Form Side */}
          <form onSubmit={handleBookSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Scenario selector for testing */}
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Shield size={16} color="#0284c7" />
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", margin: 0, letterSpacing: 0.5 }}>Sandbox Test Ssenariləri (ETG Certification)</h3>
              </div>
              <p style={{ color: "#1e40af", fontSize: 12, margin: "0 0 14px", lineHeight: 1.4 }}>
                Sertifikasiya yoxlanışını tamamlamaq üçün aşağıdakı test ssenarilərindən birini seçin. Bu, müvafiq partner_order_id və vətəndaşlığı avtomatik tətbiq edəcək.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { id: "1", label: "Ssenari 1: Uğurlu booking (hid 10004834, Monaco)" },
                  { id: "2", label: "Ssenari 2: Uğurlu (unknown finişdə)" },
                  { id: "3", label: "Ssenari 3: Uğursuz (timeout → soldout)" },
                  { id: "4", label: "Ssenari 4: Uğursuz (unknown → book_limit)" },
                ].map(scen => (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => selectScenario(scen.id as any)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1.5px solid ${testScenario === scen.id ? "#0284c7" : "#e2e8f0"}`,
                      background: testScenario === scen.id ? "#0284c7" : "white",
                      color: testScenario === scen.id ? "white" : "#475569",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      lineHeight: 1.3,
                      transition: "all 0.15s",
                    }}
                  >
                    {scen.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Passengers Form */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>👥 Sərnişin Məlumatları</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {guests.map((guest, idx) => {
                  const isChild = idx >= adultsCount;
                  return (
                    <div key={idx} style={{ borderBottom: idx < guests.length - 1 ? "1px solid #e2e8f0" : "none", paddingBottom: idx < guests.length - 1 ? 20 : 0 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0284c7", margin: "0 0 12px" }}>
                        {isChild ? `Uşaq ${idx - adultsCount + 1} (${childAges[idx - adultsCount] || 12} yaş)` : `Böyük sərnişin ${idx + 1}`}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={lbl}>Ad (İngiliscə) *</label>
                          <input required type="text" placeholder="Məs. ANNA" value={guest.first_name} onChange={e => handleGuestChange(idx, "first_name", e.target.value)} style={inp} />
                        </div>
                        <div>
                          <label style={lbl}>Soyad (İngiliscə) *</label>
                          <input required type="text" placeholder="Məs. ERDNEEVA" value={guest.last_name} onChange={e => handleGuestChange(idx, "last_name", e.target.value)} style={inp} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={lbl}>Vətəndaşlıq (2 hərfli kod) *</label>
                          <input required type="text" placeholder="Məs. MC, AZ, TR" value={guest.citizenship} onChange={e => handleGuestChange(idx, "citizenship", e.target.value)} style={inp} />
                        </div>
                        <div>
                          <label style={lbl}>Cinsiyyət *</label>
                          <select value={guest.gender} onChange={e => handleGuestChange(idx, "gender", e.target.value as any)} style={inp}>
                            <option value="male">Kişi</option>
                            <option value="female">Qadın</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Form */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>📞 Əlaqə məlumatları</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Telefon *</label>
                  <input required type="tel" placeholder="+44 7828 721748" value={phone} onChange={e => setPhone(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>E-mail</label>
                  <input type="email" placeholder="test@natourefly.com" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Qeydlər / İstəklər</label>
                <textarea rows={2} placeholder="Səyahətçi istəkləri..." value={comment} onChange={e => setComment(e.target.value)} style={{ ...inp, resize: "none" }} />
              </div>
            </div>

            {bookingError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", color: "#dc2626", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertTriangle size={16} />
                <span>{bookingError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={bookingLoading}
              style={{
                width: "100%",
                padding: "16px 0",
                background: "linear-gradient(135deg,#0284c7,#4f46e5)",
                color: "white",
                fontWeight: 800,
                fontSize: 16,
                borderRadius: 14,
                border: "none",
                cursor: bookingLoading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(2,132,199,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <Lock size={16} />
              {bookingLoading ? "Emal edilir..." : `Sifarişi Təsdiqlə — ${markedPrice} USD`}
            </button>
          </form>

          {/* Details Card Side */}
          <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Hotel Info Card */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20 }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{hotelName.includes("Conrad") ? "Los Angeles, ABŞ" : "Səyahət Rezervasiyası"}</p>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>{hotelName}</h3>
              
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                  <span>🛏️ Otaq:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{roomType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                  <span>🍳 Qidalanma:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{mealType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                  <span>📅 Giriş tarixi:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{checkin}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                  <span>📅 Çıxış tarixi:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{checkout}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                  <span>👥 Səyahətçilər:</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{adultsCount} böyük {childrenCount > 0 ? `+ ${childrenCount} uşaq` : ""}</span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Qiymət Xülasəsi</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, borderBottom: "1px dashed #e2e8f0", paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>Otaq qiyməti ({adultsCount} böyük):</span>
                  <span>{markedPrice} USD</span>
                </div>
                {Array.isArray(prebookData?.taxes) && prebookData.taxes.length > 0 ? (
                  prebookData.taxes.map((t: { name: string; amount: number; currency: string; included: boolean }, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", color: t.included ? "#16a34a" : "#475569" }}>
                      <span>{t.name} {t.included ? "(qiymətə daxil)" : "(əlavə ödəniş)"}:</span>
                      <span style={{ fontWeight: 600 }}>
                        {t.amount > 0 ? `${t.amount.toFixed(2)} ${t.currency}` : (t.included ? "Daxildir" : "—")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 700 }}>
                    <span>Servis və vergilər:</span>
                    <span>Qiymətə daxildir</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Yekun məbləğ:</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#0284c7" }}>{markedPrice} USD</span>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>bütün vergilər daxil</p>
                </div>
              </div>
            </div>

            {/* Cancellation Policy Card — ETG tələbi: tarix + saat + UTC+0 */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20 }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Ləğv Siyasəti</h4>
              {prebookData?.non_refundable ? (
                <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 700, lineHeight: 1.5 }}>
                  ⚠️ Geri qaytarılmayan tarif — ləğv və ya dəyişiklik mümkün deyil.
                </p>
              ) : prebookData?.cancellation_deadline ? (
                <>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "#16a34a", fontWeight: 700, lineHeight: 1.5 }}>
                    ✓ Pulsuz ləğv: {fmtUtc(prebookData.cancellation_deadline)} tarixinə qədər
                  </p>
                  {Array.isArray(prebookData?.cancellation_policies) && prebookData.cancellation_policies.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, fontSize: 12, color: "#64748b" }}>
                      {prebookData.cancellation_policies.map((p: { end_at: string; charge: number }, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span>{fmtUtc(p.end_at)} tarixinədək ləğv:</span>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>
                            {p.charge > 0 ? `${p.charge.toFixed(2)} USD cərimə` : "Pulsuz"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: "10px 0 0", fontSize: 10, color: "#94a3b8" }}>Bütün vaxtlar UTC+0 (Qrinviç orta vaxtı) zaman qurşağındadır.</p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>Ləğv şərtləri rezervasiya təsdiqi zamanı göstəriləcək.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── UI sub-components ── */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a",
  outline: "none", boxSizing: "border-box", background: "#f8fafc",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 600,
  color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5,
};

// ETG ləğv/vergi vaxtları UTC-dədir. Müştəriyə tam tarix + saat + UTC+0 göstərilir.
function fmtUtc(iso?: string): string {
  if (!iso) return "";
  // ETG timestamp-ları çox vaxt zona suffiksi olmadan gəlir, amma UTC-dir → "Z" əlavə et
  const normalized = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return iso;
  const formatted = d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "UTC", hour12: false,
  });
  return `${formatted} (UTC+0)`;
}

export default function BookingPrebookPage() {
  return (
    <Suspense fallback={<Screen><RefreshCw className="animate-spin text-[#0284c7]" size={32} /></Screen>}>
      <PrebookForm />
    </Suspense>
  );
}
