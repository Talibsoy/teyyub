"use client";

import { useState, Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

function SignupForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || null;
  const { language } = useLanguage();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  const t = {
    title:         language === "tr" ? "Natoure'ye Katılın" : language === "en" ? "Join Natoure" : "Natoure-yə Qoşulun",
    subtitle:      language === "tr" ? "Özel teklifler ve indirimler için kayıt olun" : language === "en" ? "Register for exclusive offers and discounts" : "Xüsusi təkliflər və endirimlər üçün qeydiyyatdan keçin",
    nameLabel:     language === "tr" ? "Ad Soyad" : language === "en" ? "Full Name" : "Ad Soyad",
    namePH:        language === "tr" ? "Ahmet Yılmaz" : language === "en" ? "John Smith" : "Nurlan Əfəndiyev",
    emailLabel:    "Email",
    pwLabel:       language === "tr" ? "Şifre" : language === "en" ? "Password" : "Şifrə",
    pwPH:          language === "tr" ? "En az 6 karakter" : language === "en" ? "At least 6 characters" : "Ən az 6 simvol",
    submitBtn:     language === "tr" ? "Kayıt Ol" : language === "en" ? "Create Account" : "Qeydiyyatdan Keç",
    loadingBtn:    language === "tr" ? "Bekleyin..." : language === "en" ? "Please wait..." : "Gözləyin...",
    alreadyMember: language === "tr" ? "Zaten üye misiniz?" : language === "en" ? "Already have an account?" : "Artıq üzvsünüz?",
    signIn:        language === "tr" ? "Giriş Yapın" : language === "en" ? "Sign In" : "Daxil olun",
    shortPw:       language === "tr" ? "Şifre en az 6 karakter olmalıdır." : language === "en" ? "Password must be at least 6 characters." : "Şifrə ən az 6 simvol olmalıdır.",
    alreadyReg:    language === "tr" ? "Bu email zaten kayıtlı. Giriş yapın." : language === "en" ? "This email is already registered. Please sign in." : "Bu email artıq qeydiyyatdadır. Giriş edin.",
    genericErr:    language === "tr" ? "Bir hata oluştu. Lütfen tekrar deneyin." : language === "en" ? "An error occurred. Please try again." : "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.",
    successTitle:  language === "tr" ? "Kayıt tamamlandı!" : language === "en" ? "Registration complete!" : "Qeydiyyat tamamlandı!",
    successDesc:   language === "tr" ? "Email adresinize onay linki gönderildi.\nLütfen emailinizi kontrol edin." : language === "en" ? "A confirmation link has been sent to your email.\nPlease check your inbox." : "Emailinizə təsdiq linki göndərildi.\nZəhmət olmasa emailinizi yoxlayın.",
    signInBtn:     language === "tr" ? "Giriş Yap" : language === "en" ? "Sign In" : "Daxil Ol",
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError(t.shortPw);
      return;
    }
    setLoading(true);
    setError("");
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: "member" },
        emailRedirectTo: redirect
          ? `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}`
          : `${window.location.origin}/panel`,
      },
    });

    if (error) {
      setLoading(false);
      if (error.message.includes("already registered")) {
        setError(t.alreadyReg);
      } else {
        setError(t.genericErr);
      }
      return;
    }

    // CRM customers cədvəlinə sinxronizasiya
    if (data.user) {
      try {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId:   data.user.id,
            email:    data.user.email,
            fullName: name,
          }),
        });
      } catch {
        // CRM sync error should not block registration
      }
    }

    setLoading(false);
    setSuccess(true);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f4ff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        background: "white", borderRadius: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        width: "100%", maxWidth: 440, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          padding: "32px 40px 28px", textAlign: "center",
        }}>
          <Image src="/logo.png" alt="Natoure" width={52} height={52}
            style={{ borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", marginBottom: 12, objectFit: "cover" }} />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{t.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ padding: "32px 40px 36px" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 700, fontSize: 20, color: "#0f172a", margin: "0 0 10px" }}>
                {t.successTitle}
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px", whiteSpace: "pre-line" }}>
                {t.successDesc}
              </p>
              <Link href={loginHref} style={{
                display: "block", padding: "13px", borderRadius: 14,
                background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", fontWeight: 700, textDecoration: "none",
                textAlign: "center", fontSize: 15,
              }}>
                {t.signInBtn}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  {t.nameLabel}
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder={t.namePH}
                  required
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  {t.emailLabel}
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  required
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  {t.pwLabel}
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={t.pwPH}
                  required
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 10, padding: "10px 14px",
                  color: "#dc2626", fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 4, padding: "13px", borderRadius: 14, border: "none",
                background: loading ? "#cbd5e1" : "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", fontWeight: 700, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 8px 25px rgba(2,132,199,0.35)",
                transition: "all 0.2s",
              }}>
                {loading ? t.loadingBtn : t.submitBtn}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {t.alreadyMember}{" "}
                <Link href={loginHref} style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>
                  {t.signIn}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QeydiyyatPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
