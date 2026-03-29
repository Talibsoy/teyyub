"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
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
} from "lucide-react";

const nav = [
  { href: "/crm", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm/leads", label: "Leadlər", icon: UserCheck },
  { href: "/crm/customers", label: "Müştərilər", icon: Users },
  { href: "/crm/bookings", label: "Rezervasiyalar", icon: CalendarCheck },
  { href: "/crm/tours", label: "Turlar", icon: MapPin },
  { href: "/crm/payments", label: "Ödənişlər", icon: CreditCard },
  { href: "/crm/staff", label: "İşçilər", icon: UsersRound },
  { href: "/crm/workflows", label: "Workflowlar", icon: Zap },
  { href: "/crm/reports", label: "Hesabatlar", icon: BarChart2 },
  { href: "/crm/reviews", label: "Müştəri Rəyləri", icon: Star },
  { href: "/crm/activity", label: "Fəaliyyət loqu", icon: Activity },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const client = getSupabase();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Yüklənir...</div>
      </div>
    );
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Natoure CRM</h1>
        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Çıxış
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col fixed h-full z-20">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-400" />
          </button>
          <span className="text-white font-semibold">Natoure CRM</span>
        </div>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
