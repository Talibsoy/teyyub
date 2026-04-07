"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function QeydiyyatPage() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Şifrə ən az 6 simvol olmalıdır.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: "member" },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Bu email artıq qeydiyyatdadır. Giriş edin.");
      } else {
        setError("Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
      }
    } else {
      setSuccess(true);
    }
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
          <h1 style={{ color: "white", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>Natoure-yə Qoşulun</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>
            Xüsusi təkliflər və endirimlər üçün qeydiyyatdan keçin
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
                Qeydiyyat tamamlandı!
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
                Emailinizə təsdiq linki göndərildi.<br />
                Zəhmət olmasa emailinizi yoxlayın.
              </p>
              <Link href="/" style={{
                display: "block", padding: "13px", borderRadius: 14,
                background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", fontWeight: 700, textDecoration: "none",
                textAlign: "center", fontSize: 15,
              }}>
                Ana Səhifəyə Qayıt
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Ad Soyad
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Nurlan Əfəndiyev"
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
                  Email
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
                  Şifrə
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Ən az 6 simvol"
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
                {loading ? "Gözləyin..." : "Qeydiyyatdan Keç"}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                Artıq üzvsünüz?{" "}
                <Link href="/login" style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none" }}>
                  Daxil olun
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
