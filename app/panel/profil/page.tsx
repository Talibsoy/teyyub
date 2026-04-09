"use client";
import { useState, useEffect } from "react";
import { usePanelContext } from "@/lib/panel-context";
import { getSupabase } from "@/lib/supabase";

const TRAVEL_STYLES = [
  { value: "adventure",  label: "Macəra",              emoji: "🧗" },
  { value: "luxury",     label: "Lüks",                emoji: "💎" },
  { value: "budget",     label: "Büdcə",               emoji: "💰" },
  { value: "cultural",   label: "Mədəniyyət",          emoji: "🏛️" },
  { value: "relaxation", label: "Dincəlmə",            emoji: "🏖️" },
  { value: "family",     label: "Ailə",                emoji: "👨‍👩‍👧" },
  { value: "romantic",   label: "Romantik",            emoji: "💑" },
  { value: "balanced",   label: "Balanslaşdırılmış",  emoji: "⚖️" },
];

const VISITED_COUNTRIES = [
  { flag: "🇹🇷", name: "Türkiyə" },
  { flag: "🇦🇪", name: "BƏƏ" },
  { flag: "🇮🇹", name: "İtaliya" },
  { flag: "🇫🇷", name: "Fransa" },
  { flag: "🇩🇪", name: "Almaniya" },
  { flag: "🇬🇧", name: "Böyük Britaniya" },
  { flag: "🇬🇷", name: "Yunanıstan" },
  { flag: "🇪🇸", name: "İspaniya" },
  { flag: "🇵🇹", name: "Portuqaliya" },
  { flag: "🇯🇵", name: "Yaponiya" },
  { flag: "🇹🇭", name: "Tailand" },
  { flag: "🇮🇩", name: "Bali/İndoneziya" },
  { flag: "🇲🇻", name: "Maldiv" },
  { flag: "🇪🇬", name: "Misir" },
  { flag: "🇲🇦", name: "Marokko" },
  { flag: "🇺🇸", name: "ABŞ" },
  { flag: "🇷🇺", name: "Rusiya" },
  { flag: "🇨🇳", name: "Çin" },
  { flag: "🇸🇬", name: "Sinqapur" },
  { flag: "🇲🇾", name: "Malayziya" },
];

export default function ProfilPage() {
  const { user, profile, tier, totalPoints, darkMode, refreshProfile } = usePanelContext();
  const d = darkMode;

  const [form, setForm] = useState({
    full_name:                "",
    phone:                    "",
    birth_date:               "",
    nationality:              "",
    // pasport
    passport_issuing_country: "",
    passport_number:          "",
    passport_surname:         "",
    passport_given_name:      "",
    passport_gender:          "",
    passport_issue_date:      "",
    passport_expiry:          "",
    // dna
    travel_style:             "balanced",
  });
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<"personal" | "passport" | "dna">("personal");

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:                profile.full_name                || "",
        phone:                    profile.phone                    || "",
        birth_date:               profile.birth_date               || "",
        nationality:              profile.nationality              || "",
        passport_issuing_country: profile.passport_issuing_country || "",
        passport_number:          profile.passport_number          || "",
        passport_surname:         profile.passport_surname         || "",
        passport_given_name:      profile.passport_given_name      || "",
        passport_gender:          profile.passport_gender          || "",
        passport_issue_date:      profile.passport_issue_date      || "",
        passport_expiry:          profile.passport_expiry          || "",
        travel_style:             profile.travel_style             || "balanced",
      });
      setVisitedCountries(profile.visited_countries || []);
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    const supabase = getSupabase();

    // Boş string-ləri null-a çevir — DATE sütunları "" qəbul etmir
    const payload = {
      id:                       user.id,
      full_name:                form.full_name                || null,
      phone:                    form.phone                    || null,
      birth_date:               form.birth_date               || null,
      nationality:              form.nationality              || null,
      passport_issuing_country: form.passport_issuing_country || null,
      passport_number:          form.passport_number          || null,
      passport_surname:         form.passport_surname         || null,
      passport_given_name:      form.passport_given_name      || null,
      passport_gender:          form.passport_gender          || null,
      passport_issue_date:      form.passport_issue_date      || null,
      passport_expiry:          form.passport_expiry          || null,
      travel_style:             form.travel_style,
      visited_countries:        visitedCountries,
      updated_at:               new Date().toISOString(),
    };

    const { error } = await supabase
      .from("customer_profiles")
      .upsert(payload, { onConflict: "id" });

    setSaving(false);
    if (error) {
      setSaveError(error.message);
    } else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: `1px solid ${d ? "#334155" : "#e2e8f0"}`,
    background: d ? "#1e293b" : "#f8fafc",
    color: d ? "#e2e8f0" : "#0f172a",
    fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: 11, fontWeight: 600 as const,
    color: d ? "#64748b" : "#94a3b8",
    marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em",
  };

  const travelStyleInfo = TRAVEL_STYLES.find((s) => s.value === form.travel_style);

  // Pasport bitmə tarixi hesabı
  const passportDaysLeft = form.passport_expiry
    ? Math.ceil((new Date(form.passport_expiry).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div>
      {/* Profile Header */}
      <div style={{
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        background: d ? "#0f172a" : "#ffffff",
        border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 800, fontSize: 28,
        }}>
          {(form.full_name?.[0] || user?.email?.[0] || "?").toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: d ? "#e2e8f0" : "#0f172a" }}>
            {form.full_name || "Adınızı daxil edin"}
          </div>
          <div style={{ fontSize: 13, color: d ? "#64748b" : "#94a3b8", marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20, fontWeight: 600, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
              {tier.icon} {tier.name}
            </span>
            <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20, fontWeight: 600, background: d ? "#1e293b" : "#f1f5f9", color: d ? "#94a3b8" : "#475569" }}>
              {totalPoints.toLocaleString()} xal
            </span>
            {travelStyleInfo && (
              <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 20, fontWeight: 600, background: d ? "#1e293b" : "#f0fdf4", color: "#16a34a" }}>
                {travelStyleInfo.emoji} {travelStyleInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: d ? "#0f172a" : "#f1f5f9", borderRadius: 12, padding: 4 }}>
        {([
          { key: "personal", label: "👤 Şəxsi" },
          { key: "passport", label: "🛂 Pasport" },
          { key: "dna",      label: "🧬 Səyahət DNT" },
        ] as { key: "personal" | "passport" | "dna"; label: string }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: "10px 6px", borderRadius: 9, border: "none",
            background: activeTab === tab.key ? (d ? "#1e293b" : "#ffffff") : "transparent",
            color: activeTab === tab.key ? (d ? "#e2e8f0" : "#0f172a") : (d ? "#64748b" : "#94a3b8"),
            fontWeight: activeTab === tab.key ? 700 : 500,
            fontSize: 13, cursor: "pointer",
            boxShadow: activeTab === tab.key ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        borderRadius: 18, padding: "24px",
        background: d ? "#0f172a" : "#ffffff",
        border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        marginBottom: 20,
      }}>

        {/* ── PERSONAL TAB ── */}
        {activeTab === "personal" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div>
              <label style={labelStyle}>Ad Soyad</label>
              <input style={inputStyle} value={form.full_name} onChange={f("full_name")} placeholder="Ad Soyad" />
            </div>
            <div>
              <label style={labelStyle}>Telefon</label>
              <input style={inputStyle} value={form.phone} onChange={f("phone")} placeholder="+994 50 XXX XX XX" />
            </div>
            <div>
              <label style={labelStyle}>Doğum Tarixi</label>
              <input type="date" style={inputStyle} value={form.birth_date} onChange={f("birth_date")} />
            </div>
            <div>
              <label style={labelStyle}>Vətəndaşlıq / Citizenship</label>
              <input
                style={inputStyle}
                value={form.nationality}
                onChange={f("nationality")}
                placeholder="məs. Azərbaycan, ABŞ, Türkiyə, Rusiya..."
              />
              <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8", marginTop: 4 }}>
                Ölkəni öz dilinizdə yazın
              </div>
            </div>
          </div>
        )}

        {/* ── PASSPORT TAB ── */}
        {activeTab === "passport" && (
          <div>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: d ? "#1e293b" : "#fef9c3", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <p style={{ margin: 0, fontSize: 13, color: d ? "#94a3b8" : "#78350f" }}>
                Pasport məlumatlarınız şifrələnmiş şəkildə saxlanılır. Yalnız siz görə bilərsiniz.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Pasportu verən ölkə / Issuing Country</label>
                <input
                  style={inputStyle}
                  value={form.passport_issuing_country}
                  onChange={f("passport_issuing_country")}
                  placeholder="məs. Azerbaijan, United States, Turkey, Russia..."
                />
              </div>
              <div>
                <label style={labelStyle}>Soyadı (pasportdakı kimi) / Surname</label>
                <input style={inputStyle} value={form.passport_surname} onChange={f("passport_surname")} placeholder="ALIYEV" />
              </div>
              <div>
                <label style={labelStyle}>Adı (pasportdakı kimi) / Given Name</label>
                <input style={inputStyle} value={form.passport_given_name} onChange={f("passport_given_name")} placeholder="MURAD" />
              </div>
              <div>
                <label style={labelStyle}>Pasport Nömrəsi</label>
                <input style={inputStyle} value={form.passport_number} onChange={f("passport_number")} placeholder="AA1234567" />
              </div>
              <div>
                <label style={labelStyle}>Cins / Gender</label>
                <select style={inputStyle} value={form.passport_gender} onChange={f("passport_gender")}>
                  <option value="">Seçin</option>
                  <option value="M">M — Kişi</option>
                  <option value="F">F — Qadın</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Verilmə Tarixi / Issue Date</label>
                <input type="date" style={inputStyle} value={form.passport_issue_date} onChange={f("passport_issue_date")} />
              </div>
              <div>
                <label style={labelStyle}>Bitmə Tarixi / Expiry Date</label>
                <input type="date" style={inputStyle} value={form.passport_expiry} onChange={f("passport_expiry")} />
              </div>
            </div>

            {passportDaysLeft !== null && (
              <div style={{ marginTop: 16 }}>
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: passportDaysLeft < 180 ? "#fef2f2" : d ? "#1e293b" : "#f0fdf4",
                  border: `1px solid ${passportDaysLeft < 180 ? "#fca5a5" : d ? "#334155" : "#86efac"}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: passportDaysLeft < 180 ? "#dc2626" : "#16a34a" }}>
                    {passportDaysLeft > 0
                      ? `${passportDaysLeft} gün qalıb${passportDaysLeft < 180 ? " — Tezliklə yenilənməlidir!" : ""}`
                      : "⚠️ Pasportun müddəti bitib!"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DNA TAB ── */}
        {activeTab === "dna" && (
          <div>
            <p style={{ fontSize: 14, color: d ? "#94a3b8" : "#64748b", margin: "0 0 20px" }}>
              Səyahət üslubunuzu seçin — AI tövsiyələri buna uyğun verilir.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setForm({ ...form, travel_style: style.value })}
                  style={{
                    padding: "14px 10px", borderRadius: 14, border: "none",
                    background: form.travel_style === style.value
                      ? "linear-gradient(135deg, rgba(2,132,199,0.15), rgba(79,70,229,0.12))"
                      : d ? "#1e293b" : "#f8fafc",
                    cursor: "pointer",
                    outline: form.travel_style === style.value ? "2px solid #0284c7" : `1px solid ${d ? "#334155" : "#e2e8f0"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 5 }}>{style.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: form.travel_style === style.value ? "#0284c7" : d ? "#94a3b8" : "#475569" }}>
                    {style.label}
                  </div>
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 12px" }}>
              🌍 Getdiyim Ölkələr
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VISITED_COUNTRIES.map((country) => {
                const selected = visitedCountries.includes(country.name);
                return (
                  <button
                    key={country.name}
                    onClick={() => setVisitedCountries((prev) =>
                      selected ? prev.filter((c) => c !== country.name) : [...prev, country.name]
                    )}
                    style={{
                      padding: "7px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600,
                      border: "none", cursor: "pointer",
                      background: selected ? "linear-gradient(135deg, #0284c7, #4f46e5)" : d ? "#1e293b" : "#f1f5f9",
                      color: selected ? "white" : d ? "#94a3b8" : "#475569",
                      display: "flex", alignItems: "center", gap: 5,
                      transition: "all 0.15s",
                    }}
                  >
                    {country.flag} {country.name}
                  </button>
                );
              })}
            </div>
            {visitedCountries.length > 0 && (
              <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: d ? "#1e293b" : "#f0fdf4", border: `1px solid ${d ? "#334155" : "#86efac"}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                  🌍 {visitedCountries.length} ölkə ziyarət etmisiniz!
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Error */}
      {saveError && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
          ⚠️ Xəta: {saveError}
        </div>
      )}

      {/* Save Button — bütün tablarda görünür */}
      <button
        onClick={save}
        disabled={saving}
        style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: saved ? "#16a34a" : saving ? "#94a3b8" : "linear-gradient(135deg, #0284c7, #4f46e5)",
          color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer",
          fontWeight: 700, fontSize: 16, transition: "all 0.2s",
        }}
      >
        {saved ? "✓ Saxlanıldı" : saving ? "Saxlanılır..." : "Dəyişiklikləri Saxla"}
      </button>

      {/* Referral Code */}
      {profile?.referral_code && (
        <div style={{ marginTop: 20, borderRadius: 16, padding: "16px 20px", background: d ? "#0f172a" : "#ffffff", border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: d ? "#94a3b8" : "#64748b", marginBottom: 6 }}>Sizin Referral Kodunuz</div>
          <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#0284c7", letterSpacing: "0.1em" }}>
            {profile.referral_code.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginTop: 4 }}>
            Dostu dəvət edin → o ilk $100+ rezervasiya etdikdə siz alışın 3%-i qədər xal qazanırsınız
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={async () => {
            const supabase = getSupabase();
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#dc2626", fontWeight: 600 }}
        >
          Çıxış et
        </button>
      </div>
    </div>
  );
}
