"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageContext";
import { Locale } from "@/lib/i18n";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string; isAdmin?: boolean } | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: "az" as Locale, label: "AZ", flagCode: "az" },
    { code: "en" as Locale, label: "EN", flagCode: "gb" },
    { code: "tr" as Locale, label: "TR", flagCode: "tr" },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const navLinks = [
    { href: "/turlar",    label: t("tours") },
    { href: "/oteller",   label: t("hotels") },
    { href: "/melumatlar", label: t("wishlist") },
    { href: "/haqqimizda", label: t("about") },
    { href: "/elaqe", label: t("contact") },
  ];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const client = getSupabase();
    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        const isAdmin = data.session.user.app_metadata?.role === "admin";
        setUser({ email: data.session.user.email, isAdmin });
      }
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const isAdmin = session.user.app_metadata?.role === "admin";
        setUser({ email: session.user.email, isAdmin });
      } else {
        setUser(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(0,0,0,0.04)",
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Image src="/logo.png" alt="Natoure" width={38} height={38} className="object-contain" />
          <span className="notranslate" translate="no" style={{
            fontWeight: 700, fontSize: 20,
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Natoure
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="transition-colors duration-200"
              style={{ color: "#475569", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0284c7")}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
              {link.label}
            </Link>
          ))}
          <Link href="/elaqe"
            className="font-semibold px-5 py-2 rounded-xl transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #0284c7, #4f46e5)",
              color: "white", textDecoration: "none",
              boxShadow: "0 4px 15px rgba(2,132,199,0.3)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(2,132,199,0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 15px rgba(2,132,199,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
            {t("reserveWhatsApp").split(" ").slice(0, 2).join(" ")}
          </Link>
          {user ? (
            user.isAdmin ? (
              <Link href="/crm"
                className="font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none", fontSize: 14 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0284c7"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#0284c7"; }}>
                {t("panel")}
              </Link>
            ) : (
              <Link href="/panel"
                className="font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none", fontSize: 14 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0284c7"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#0284c7"; }}>
                {t("panel")}
              </Link>
            )
          ) : (
            <>
              <Link href="/login"
                className="transition-colors duration-200"
                style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0284c7")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                {t("login")}
              </Link>
            </>
          )}

          {/* Desktop Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/50 hover:bg-slate-100/80 transition-all font-bold text-xs text-slate-600 focus:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/16x12/${currentLang.flagCode}.png`} width={16} height={12} alt={currentLang.label} className="rounded-[2px]" />
              <span translate="no">{currentLang.label}</span>
              <span className="text-[9px] text-slate-400">▼</span>
            </button>
            {langDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-28 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 flex flex-col gap-0.5" style={{ animation: "fadeIn .2s ease" }}>
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-all w-full text-left ${language === l.code ? "text-sky-600 bg-sky-50/50" : "text-slate-600"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://flagcdn.com/16x12/${l.flagCode}.png`} width={16} height={12} alt={l.label} className="rounded-[2px]" />
                      <span translate="no">{l.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="md:hidden flex items-center gap-3">
          {/* Mobile Direct Flag Switcher */}
          <div className="flex gap-1.5">
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border transition-all ${language === l.code ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/16x12/${l.flagCode}.png`} width={16} height={12} alt={l.label} className="rounded-[2px]" />
              </button>
            ))}
          </div>
          <button
            className="flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menyu"
          >
            <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="md:hidden px-6 pb-6 flex flex-col gap-2 text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.98)", borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="py-3.5 transition-colors border-b font-semibold"
              style={{ color: "#475569", textDecoration: "none", borderColor: "rgba(0,0,0,0.06)" }}
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/elaqe"
            className="mt-2 text-center font-bold px-5 py-3 rounded-xl"
            style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", textDecoration: "none" }}
            onClick={() => setMenuOpen(false)}>
            {t("reserveWhatsApp").split(" ").slice(0, 2).join(" ")}
          </Link>
          {user ? (
            user.isAdmin ? (
              <Link href="/crm"
                className="mt-1 text-center font-bold px-4 py-3 rounded-xl"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}>
                {t("panel")}
              </Link>
            ) : (
              <Link href="/panel"
                className="mt-1 text-center font-bold px-4 py-3 rounded-xl"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}>
                {t("panel")}
              </Link>
            )
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Link href="/login"
                className="flex-1 text-center py-3 rounded-xl font-bold"
                style={{ color: "#475569", textDecoration: "none", border: "1.5px solid #e2e8f0" }}
                onClick={() => setMenuOpen(false)}>
                {t("login")}
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

