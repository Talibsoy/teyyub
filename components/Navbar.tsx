"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";

const navLinks = [
  { href: "/turlar", label: "Turlar" },
  { href: "/oteller", label: "Otellər" },
  { href: "/melumatlar", label: "Məlumatlar" },
  { href: "/haqqimizda", label: "Haqqımızda" },
  { href: "/elaqe", label: "Əlaqə" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email?: string; isAdmin?: boolean } | null>(null);

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
          <span style={{
            fontWeight: 700, fontSize: 20,
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Natoure
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
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
            Rezervasiya Et
          </Link>
          {user ? (
            user.isAdmin ? (
              <Link href="/crm"
                className="font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none", fontSize: 14 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0284c7"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#0284c7"; }}>
                Panel
              </Link>
            ) : null
          ) : (
            <>
              <Link href="/qeydiyyat"
                className="font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none", fontSize: 14 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#0284c7"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#0284c7"; }}>
                Qeydiyyat
              </Link>
              <Link href="/login"
                className="transition-colors duration-200"
                style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0284c7")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                Giriş
              </Link>
            </>
          )}
        </nav>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menyu"
        >
          <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <nav
          className="md:hidden px-6 pb-4 flex flex-col gap-2 text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.95)", borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="py-3 transition-colors border-b"
              style={{ color: "#475569", textDecoration: "none", borderColor: "rgba(0,0,0,0.06)" }}
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/elaqe"
            className="mt-2 text-center font-semibold px-5 py-3 rounded-xl"
            style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", textDecoration: "none" }}
            onClick={() => setMenuOpen(false)}>
            Rezervasiya Et
          </Link>
          {user ? (
            user.isAdmin ? (
              <Link href="/crm"
                className="mt-1 text-center font-semibold px-4 py-3 rounded-xl"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}>
                Panel
              </Link>
            ) : null
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Link href="/qeydiyyat"
                className="flex-1 text-center font-semibold px-4 py-3 rounded-xl"
                style={{ border: "1.5px solid #0284c7", color: "#0284c7", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}>
                Qeydiyyat
              </Link>
              <Link href="/login"
                className="flex-1 text-center py-3 rounded-xl"
                style={{ color: "#475569", textDecoration: "none", border: "1.5px solid #e2e8f0" }}
                onClick={() => setMenuOpen(false)}>
                Giriş
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
