"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe } from "lucide-react";

const navLinks = [
  { href: "/turlar", label: "Turlar" },
  { href: "/melumatlar", label: "Məlumatlar" },
  { href: "/haqqimizda", label: "Haqqımızda" },
  { href: "/elaqe", label: "Əlaqə" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
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
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Globe size={20} color="white" />
          </div>
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
        </nav>
      )}
    </header>
  );
}
