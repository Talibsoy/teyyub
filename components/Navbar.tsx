"use client";
import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Ana Səhifə" },
  { href: "/turlar", label: "Turlar" },
  { href: "/haqqimizda", label: "Haqqımızda" },
  { href: "/elaqe", label: "Əlaqə" },
  { href: "/privacy-policy", label: "Gizlilik Siyasəti" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0057A8] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-[#D4AF37] text-2xl">✈</span>
          <span>FlyNaToure</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#D4AF37] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/elaqe"
            className="bg-[#D4AF37] text-[#0057A8] font-bold px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors"
          >
            Rezervasiya Et
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menyu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-[#004a90] px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2 border-b border-[#0057A8] hover:text-[#D4AF37] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/elaqe"
            className="mt-2 text-center bg-[#D4AF37] text-[#0057A8] font-bold px-4 py-2 rounded-full"
            onClick={() => setMenuOpen(false)}
          >
            Rezervasiya Et
          </Link>
        </nav>
      )}
    </header>
  );
}
