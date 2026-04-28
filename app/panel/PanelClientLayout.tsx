"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { PanelProvider, usePanelContext } from "@/lib/panel-context";

const NAV = [
  { href: "/panel", label: "Ana Səhifə", icon: "⌂", exact: true },
  { href: "/panel/rewards", label: "Xallar & Loyallıq", icon: "⭐" },
  { href: "/panel/wallet", label: "Cüzdan", icon: "💳" },
  { href: "/panel/wishlist", label: "Arzu Siyahısı", icon: "❤️" },
  { href: "/panel/profil", label: "Profil", icon: "👤" },
];

function PanelContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, darkMode, toggleDark, profile, totalPoints, tier, nextTier } = usePanelContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/panel");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0284c7", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  const d = darkMode;

  const progress = nextTier
    ? Math.round(((totalPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
    : 100;

  const activeNav = NAV.find((n) => n.exact ? pathname === n.href : pathname.startsWith(n.href));

  return (
    <div style={{ minHeight: "100vh", background: d ? "#0a0f1e" : "#f8fafc" }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: "fixed", top: 0, left: sidebarOpen ? 0 : -280,
        width: 260, height: "100vh", zIndex: 50,
        background: d ? "#0f172a" : "#ffffff",
        borderRight: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        display: "flex", flexDirection: "column",
        transition: "left 0.25s ease",
        overflowY: "auto",
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${d ? "#1e293b" : "#f1f5f9"}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: "none", background: "linear-gradient(135deg, #0284c7, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Natoure
            </Link>
            <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: d ? "#94a3b8" : "#64748b", lineHeight: 1, padding: 2 }}>
              ×
            </button>
          </div>

          {/* Tier Card */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: tier.bg, border: `1px solid ${tier.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{tier.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: tier.color }}>{tier.name} Üzv</div>
                <div style={{ fontSize: 11, color: d ? "#94a3b8" : "#64748b" }}>{profile?.full_name || "Ad daxil edilməyib"}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tier.color, marginBottom: 6 }}>
              {totalPoints.toLocaleString()} xal
            </div>
            {nextTier && (
              <>
                <div style={{ height: 5, borderRadius: 3, background: d ? "#1e293b" : "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, borderRadius: 3, background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: d ? "#64748b" : "#94a3b8", marginTop: 4 }}>
                  {(nextTier.minPoints - totalPoints).toLocaleString()} xal → {nextTier.icon} {nextTier.name}
                </div>
              </>
            )}
            {!nextTier && (
              <div style={{ fontSize: 10, color: tier.color, fontWeight: 600 }}>✓ Ən yüksək səviyyə</div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "10px 12px" }}>
          {NAV.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10, marginBottom: 2,
                  textDecoration: "none", fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "linear-gradient(135deg, rgba(2,132,199,0.12), rgba(79,70,229,0.1))" : "transparent",
                  color: isActive ? "#0284c7" : d ? "#94a3b8" : "#475569",
                  borderLeft: `3px solid ${isActive ? "#0284c7" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 17 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: "16px 16px", borderTop: `1px solid ${d ? "#1e293b" : "#f1f5f9"}` }}>
          <button
            onClick={toggleDark}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
              background: d ? "#1e293b" : "#f8fafc",
              color: d ? "#94a3b8" : "#64748b",
              fontSize: 13, cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {d ? "☀️ İşıqlı rejim" : "🌙 Qaranlıq rejim"}
          </button>
        </div>
      </aside>

      {/* Top Bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: d ? "rgba(10,15,30,0.9)" : "rgba(248,250,252,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: d ? "#e2e8f0" : "#334155", padding: "4px 6px", lineHeight: 1 }}
          aria-label="Menyu"
        >
          ☰
        </button>

        <span style={{ fontWeight: 600, fontSize: 15, color: d ? "#e2e8f0" : "#0f172a" }}>
          {activeNav ? `${activeNav.icon} ${activeNav.label}` : "Panel"}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            padding: "4px 10px", borderRadius: 20,
            background: tier.bg, border: `1px solid ${tier.border}`,
            fontSize: 12, fontWeight: 600, color: tier.color,
          }}>
            {tier.icon} {totalPoints.toLocaleString()}
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {(profile?.full_name?.[0] || "?").toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "28px 20px", maxWidth: 900, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}

export default function PanelClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelProvider>
      <PanelContent>{children}</PanelContent>
    </PanelProvider>
  );
}
