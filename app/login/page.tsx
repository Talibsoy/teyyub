"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || null;
  const { language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const t = {
    welcome:          language === "tr" ? "Hoş Geldiniz" : language === "en" ? "Welcome Back" : "Xoş Gəldiniz",
    subtitle:         language === "tr" ? "Hesabınıza giriş yapın" : language === "en" ? "Sign in to your account" : "Hesabınıza daxil olun",
    emailLabel:       "Email",
    passwordLabel:    language === "tr" ? "Şifre" : language === "en" ? "Password" : "Şifrə",
    submitBtn:        language === "tr" ? "Giriş Yap" : language === "en" ? "Sign In" : "Daxil Ol",
    loading:          language === "tr" ? "Yükleniyor..." : language === "en" ? "Loading..." : "Yüklənir...",
    noAccount:        language === "tr" ? "Hesabınız yok mu?" : language === "en" ? "Don't have an account?" : "Hələ üzv deyilsiniz?",
    register:         language === "tr" ? "Kayıt Ol" : language === "en" ? "Register" : "Qeydiyyat",
    wrongCreds:       language === "tr" ? "Email veya şifre hatalı." : language === "en" ? "Invalid email or password." : "Email və ya şifrə yanlışdır.",
    loginFailed:      language === "tr" ? "Giriş yapılamadı. Tekrar deneyin." : language === "en" ? "Login failed. Please try again." : "Giriş mümkün olmadı. Yenidən cəhd edin.",
    notConfirmedTitle: language === "tr" ? "Email doğrulanmadı" : language === "en" ? "Email not confirmed" : "Email təsdiqlənməyib",
    notConfirmedDesc:  language === "tr" ? "adresine gönderilen onay linkine tıklayın." : language === "en" ? "Please check and click the confirmation link sent to" : "ünvanına göndərilən təsdiq linkini yoxlayın.",
    resendBtn:        language === "tr" ? "Onay emailini yeniden gönder" : language === "en" ? "Resend confirmation email" : "Təsdiq emailini yenidən göndər",
    resendLoading:    language === "tr" ? "Gönderiliyor..." : language === "en" ? "Sending..." : "Göndərilir...",
    resendDone:       language === "tr" ? "✓ Yeni onay emaili gönderildi" : language === "en" ? "✓ New confirmation email sent" : "✓ Yeni təsdiq emaili göndərildi",
    goBack:           language === "tr" ? "← Geri dön" : language === "en" ? "← Go back" : "← Geri qayıt",
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailNotConfirmed(false);

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      if (
        error.message.toLowerCase().includes("email not confirmed") ||
        error.message.toLowerCase().includes("not confirmed")
      ) {
        setEmailNotConfirmed(true);
      } else if (
        error.message.toLowerCase().includes("invalid login") ||
        error.message.toLowerCase().includes("invalid credentials") ||
        error.message.toLowerCase().includes("wrong password")
      ) {
        setError(t.wrongCreds);
      } else {
        setError(error.message || t.loginFailed);
      }
      return;
    }

    const role = data.user?.app_metadata?.role;
    if (role === "admin") {
      router.push("/crm");
    } else if (redirect) {
      router.push(redirect);
    } else {
      router.push("/panel");
    }
  }

  async function resendConfirmation() {
    setResendLoading(true);
    const supabase = getSupabase();
    await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    setResendDone(true);
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
    outline: "none", boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };

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
        width: "100%", maxWidth: 420, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          padding: "32px 40px 28px", textAlign: "center",
        }}>
          <Image src="/logo.png" alt="Natoure" width={52} height={52}
            style={{ borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", marginBottom: 12, objectFit: "cover" }} />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{t.welcome}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ padding: "32px 36px 36px" }}>
          {emailNotConfirmed ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📧</div>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "#0f172a", margin: "0 0 10px" }}>
                {t.notConfirmedTitle}
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>
                <strong>{email}</strong> {t.notConfirmedDesc}
              </p>
              {resendDone ? (
                <div style={{ padding: "12px 16px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  {t.resendDone}
                </div>
              ) : (
                <button
                  onClick={resendConfirmation}
                  disabled={resendLoading}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12, border: "none",
                    background: resendLoading ? "#cbd5e1" : "linear-gradient(135deg, #0284c7, #4f46e5)",
                    color: "white", fontWeight: 700, fontSize: 14,
                    cursor: resendLoading ? "not-allowed" : "pointer", marginBottom: 12,
                  }}
                >
                  {resendLoading ? t.resendLoading : t.resendBtn}
                </button>
              )}
              <button
                onClick={() => { setEmailNotConfirmed(false); setError(""); }}
                style={{ background: "none", border: "none", color: "#0284c7", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                {t.goBack}
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t.emailLabel}</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@gmail.com" required style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{t.passwordLabel}</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: 4, padding: "13px", borderRadius: 14, border: "none",
                  background: loading ? "#cbd5e1" : "linear-gradient(135deg, #0284c7, #4f46e5)",
                  color: "white", fontWeight: 700, fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 8px 25px rgba(2,132,199,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? t.loading : t.submitBtn}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                {t.noAccount}{" "}
                <Link href="/qeydiyyat" style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>
                  {t.register}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
