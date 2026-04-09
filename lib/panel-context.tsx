"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";

export interface CustomerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  nationality: string;
  passport_number: string | null;
  passport_expiry: string | null;
  travel_style: string;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  amount_points: number;
  type: "earn" | "redeem" | "bonus" | "referral";
  description: string;
  created_at: string;
  booking_id: string | null;
}

export interface WishlistItem {
  id: string;
  tour_id: string | null;
  destination: string;
  tour_name: string;
  price_usd: number | null;
  image_url: string | null;
  notes: string | null;
  added_at: string;
}

export type TierName = "Silver" | "Gold" | "Platinum";

export interface TierInfo {
  name: TierName;
  color: string;
  bg: string;
  border: string;
  minPoints: number;
  maxPoints: number | null;
  icon: string;
  perks: string[];
}

export const TIERS: TierInfo[] = [
  {
    name: "Silver",
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
    minPoints: 0,
    maxPoints: 4999,
    icon: "🥈",
    perks: ["Baza bonus xalları", "Email dəstək", "Xüsusi təkliflər"],
  },
  {
    name: "Gold",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    minPoints: 5000,
    maxPoints: 19999,
    icon: "🥇",
    perks: ["2× bonus xalları", "Prioritet dəstək", "Pulsuz sığorta məşvərəti", "Erkən rezervasiya endirimləri"],
  },
  {
    name: "Platinum",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    minPoints: 20000,
    maxPoints: null,
    icon: "💎",
    perks: ["3× bonus xalları", "VIP dəstək 24/7", "Pulsuz transfer xidməti", "Eksklüziv paketlər", "Doğum günü hədiyyəsi"],
  },
];

export function getTier(points: number): TierInfo {
  if (points >= 20000) return TIERS[2];
  if (points >= 5000) return TIERS[1];
  return TIERS[0];
}

export function getNextTier(points: number): TierInfo | null {
  if (points >= 20000) return null;
  if (points >= 5000) return TIERS[2];
  return TIERS[1];
}

interface PanelContextValue {
  user: { id: string; email: string } | null;
  profile: CustomerProfile | null;
  totalPoints: number;
  tier: TierInfo;
  nextTier: TierInfo | null;
  transactions: LoyaltyTransaction[];
  wishlist: WishlistItem[];
  darkMode: boolean;
  toggleDark: () => void;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshPoints: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const PanelContext = createContext<PanelContextValue | null>(null);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabase();

  useEffect(() => {
    const stored = localStorage.getItem("panel_dark");
    if (stored === "true") setDarkMode(true);
  }, []);

  const toggleDark = () => {
    setDarkMode((v) => {
      localStorage.setItem("panel_dark", String(!v));
      return !v;
    });
  };

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("id", uid)
      .single();
    if (data) setProfile(data as CustomerProfile);
    else {
      // Auto-create profile if not exists
      await supabase.from("customer_profiles").insert({ id: uid });
      const { data: fresh } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", uid)
        .single();
      if (fresh) setProfile(fresh as CustomerProfile);
    }
  };

  const fetchPoints = async (uid: string) => {
    const { data } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) {
      setTransactions(data as LoyaltyTransaction[]);
      const total = (data as LoyaltyTransaction[]).reduce(
        (sum, t) => (t.type === "redeem" ? sum - t.amount_points : sum + t.amount_points),
        0
      );
      setTotalPoints(Math.max(0, total));
    }
  };

  const fetchWishlist = async (uid: string) => {
    const { data } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", uid)
      .order("added_at", { ascending: false });
    if (data) setWishlist(data as WishlistItem[]);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const u = { id: data.session.user.id, email: data.session.user.email || "" };
        setUser(u);
        await Promise.all([fetchProfile(u.id), fetchPoints(u.id), fetchWishlist(u.id)]);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const u = { id: session.user.id, email: session.user.email || "" };
        setUser(u);
        await Promise.all([fetchProfile(u.id), fetchPoints(u.id), fetchWishlist(u.id)]);
      } else {
        setUser(null);
        setProfile(null);
        setTotalPoints(0);
        setTransactions([]);
        setWishlist([]);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const tier = getTier(totalPoints);
  const nextTier = getNextTier(totalPoints);

  return (
    <PanelContext.Provider
      value={{
        user,
        profile,
        totalPoints,
        tier,
        nextTier,
        transactions,
        wishlist,
        darkMode,
        toggleDark,
        loading,
        refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
        refreshPoints: () => user ? fetchPoints(user.id) : Promise.resolve(),
        refreshWishlist: () => user ? fetchWishlist(user.id) : Promise.resolve(),
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}

export function usePanelContext() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanelContext must be used inside PanelProvider");
  return ctx;
}
