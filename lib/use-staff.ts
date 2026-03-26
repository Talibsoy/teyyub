"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface StaffProfile {
  id: string;
  full_name: string;
  role: "admin" | "manager" | "agent";
  phone: string | null;
  is_active: boolean;
}

export function useStaff() {
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("staff")
        .select("*")
        .eq("id", data.session.user.id)
        .single();
      setStaff(profile || null);
      setLoading(false);
    });
  }, []);

  return { staff, loading, isAdmin: staff?.role === "admin", isManager: staff?.role === "admin" || staff?.role === "manager" };
}
