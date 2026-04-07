"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  MapPin,
  CreditCard,
  LogOut,
  Menu,
  X,
  UsersRound,
  Activity,
  Zap,
  BarChart2,
  Star,
  PackageIcon,
} from "lucide-react";

const nav = [
  { href: "/crm",            label: "Dashboard",        icon: LayoutDashboard },
  { href: "/crm/leads",      label: "Leadlər",          icon: UserCheck },
  { href: "/crm/customers",  label: "Müştərilər",       icon: Users },
  { href: "/crm/bookings",   label: "Rezervasiyalar",   icon: CalendarCheck },
  { href: "/crm/tours",      label: "Turlar",           icon: MapPin },
  { href: "/crm/packages",   label: "Gizli Paketlər",   icon: PackageIcon },
  { href: "/crm/payments",   label: "Ödənişlər",        icon: CreditCard },
  { href: "/crm/staff",      label: "İşçilər",          icon: UsersRound },
  { href: "/crm/workflows",  label: "Workflowlar",      icon: Zap },
  { href: "/crm/reports",    label: "Hesabatlar",       icon: BarChart2 },
  { href: "/crm/reviews",    label: "Müştəri Rəyləri",  icon: Star },
  { href: "/crm/activity",   label: "Fəaliyyət Loqu",   icon: Activity },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    client.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
      else router.replace("/login");
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else setUser(session.user);
    });
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.push("/login");
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f9ff,#e0f2fe,#f0f4ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #0284c7", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "#64748b", fontSize: 14 }}>Yüklənir...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Natoure" width={36} height={36}
            style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", objectFit: "cover" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>Natoure</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Admin Panel</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 10,
                textDecoration: "none", fontSize: 13, fontWeight: 500,
                transition: "all 0.15s",
                background: active ? "rgba(255,255,255,0.2)" : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.65)",
                backdropFilter: active ? "blur(10px)" : "none",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <button onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "9px 12px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
            fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}>
          <LogOut size={16} />
          Çıxış
        </button>
      </div>
    </div>
  );

  const sidebarStyle: React.CSSProperties = {
    width: 240,
    background: "linear-gradient(180deg, #1e40af 0%, #0284c7 60%, #0369a1 100%)",
    boxShadow: "4px 0 24px rgba(2,132,199,0.2)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex" }}>
      {/* Desktop sidebar */}
      <aside style={{ ...sidebarStyle, position: "fixed", top: 0, left: 0, zIndex: 20 }}
        className="hidden lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }}>
          <div style={{ ...sidebarStyle, width: 240, position: "relative" }}>
            <button onClick={() => setSidebarOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
            <SidebarContent />
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
        className="lg:ml-60">
        {/* Mobile topbar */}
        <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "white", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#0284c7", display: "flex" }}>
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Natoure CRM</span>
        </div>

        <div style={{ flex: 1, padding: "28px 28px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
