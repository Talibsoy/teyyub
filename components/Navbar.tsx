"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/turlar", label: "Turlar" },
  { href: "/melumatlar", label: "Məlumatlar" },
  { href: "/haqqimizda", label: "Haqqımızda" },
  { href: "/elaqe", label: "Əlaqə" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{ background: "#0b0b0b", borderBottom: "1px solid #1a1a1a" }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Natoure" width={36} height={36} className="object-contain" />
          <span className="font-bold text-xl text-white tracking-tight">Natoure</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-[#aaa] hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/elaqe" style={{ background: "#00c2ff", color: "#000" }} className="font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Rezervasiya Et
          </Link>
        </nav>

        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menyu">
          <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <nav style={{ background: "#111", borderTop: "1px solid #1a1a1a" }} className="md:hidden px-6 pb-4 flex flex-col gap-4 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 text-[#aaa] hover:text-white transition-colors border-b border-[#1a1a1a]" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/elaqe" style={{ background: "#00c2ff", color: "#000" }} className="mt-2 text-center font-semibold px-5 py-2 rounded-lg" onClick={() => setMenuOpen(false)}>
            Rezervasiya Et
          </Link>
        </nav>
      )}
    </header>
  );
}
