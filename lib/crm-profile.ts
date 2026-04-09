/**
 * CRM Müştəri Profili
 * Yazışmağa başlayan müştərinin profilini CRM-dən çəkir.
 * WhatsApp: telefon nömrəsinə görə
 * Sayt chatbot: auth user ID-yə görə
 * Instagram/Facebook: email və ya sender ID-yə görə
 */

import { getSupabaseAdmin } from "./supabase";

export interface CRMProfile {
  id:                   string;
  full_name:            string;
  first_name:           string;
  phone:                string | null;
  email:                string | null;
  loyalty_points:       number;
  tier:                 string;           // "Bronze", "Silver", "Gold", "Platinum"
  tags:                 string[];
  previous_bookings:    number;
  is_registered:        boolean;          // auth_user_id var → saytda qeydiyyatı var
  passport_country:     string | null;
  travel_preferences:   string | null;
  registration_url:     string;           // qeydiyyata dəvət linki
}

// Loyallıq səviyyəsi
function getTier(points: number): string {
  if (points >= 10000) return "Platinum";
  if (points >= 5000)  return "Gold";
  if (points >= 1000)  return "Silver";
  return "Bronze";
}

// Telefon nömrəsini normallaşdır — müxtəlif formatları tutur
function normalizePhone(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  const variants: string[] = [digits];

  // 994501234567 → +994501234567, 0501234567, 501234567
  if (digits.startsWith("994") && digits.length >= 12) {
    variants.push(`+${digits}`);
    variants.push(`0${digits.slice(3)}`);
    variants.push(digits.slice(3));
  }
  // 0501234567 → +994501234567
  if (digits.startsWith("0") && digits.length === 10) {
    variants.push(`+994${digits.slice(1)}`);
    variants.push(`994${digits.slice(1)}`);
    variants.push(digits.slice(1));
  }
  return [...new Set(variants)];
}

// WhatsApp nömrəsinə görə axtar
export async function getCRMProfileByPhone(waPhone: string): Promise<CRMProfile | null> {
  try {
    const admin = getSupabaseAdmin();
    const phones = normalizePhone(waPhone);

    // OR sorğusu — bütün format variantlarını yoxla
    const { data } = await admin
      .from("customers")
      .select("id, first_name, last_name, phone, email, loyalty_points, tags, auth_user_id, nationality, source")
      .or(phones.map(p => `phone.eq.${p}`).join(","))
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return buildProfile(data);
  } catch {
    return null;
  }
}

// Sayt chatbotu üçün — auth user ID-yə görə
export async function getCRMProfileByUserId(userId: string): Promise<CRMProfile | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("customers")
      .select("id, first_name, last_name, phone, email, loyalty_points, tags, auth_user_id, nationality, source")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return buildProfile(data);
  } catch {
    return null;
  }
}

// Email-ə görə (Instagram)
export async function getCRMProfileByEmail(email: string): Promise<CRMProfile | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("customers")
      .select("id, first_name, last_name, phone, email, loyalty_points, tags, auth_user_id, nationality, source")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return buildProfile(data);
  } catch {
    return null;
  }
}

function buildProfile(data: Record<string, unknown>): CRMProfile {
  const points = (data.loyalty_points as number) || 0;
  const tags   = (data.tags as string[]) || [];
  const firstName = (data.first_name as string) || "";
  const lastName  = (data.last_name  as string) || "";

  return {
    id:                 data.id as string,
    full_name:          [firstName, lastName].filter(Boolean).join(" "),
    first_name:         firstName,
    phone:              (data.phone  as string) || null,
    email:              (data.email  as string) || null,
    loyalty_points:     points,
    tier:               getTier(points),
    tags,
    previous_bookings:  tags.includes("repeat") ? 1 : 0,
    is_registered:      !!(data.auth_user_id),
    passport_country:   (data.nationality as string) || null,
    travel_preferences: null,
    registration_url:   "https://natourefly.com/qeydiyyat",
  };
}

// AI-a verilmək üçün profili mətn formatına çevir
export function formatProfileForAI(profile: CRMProfile): string {
  const lines: string[] = [
    `=== MÜŞTƏRİ PROFİLİ (CRM) ===`,
    `Ad: ${profile.full_name || "Məlum deyil"}`,
    `Loyallıq: ${profile.tier} üzv · ${profile.loyalty_points} xal`,
  ];

  if (profile.previous_bookings > 0) {
    lines.push(`Əvvəlki sifarişlər: Var (geri qayıdan müştəri)`);
  }
  if (profile.tags.includes("vip")) {
    lines.push(`Status: VIP müştəri — xüsusi diqqət`);
  }
  if (profile.passport_country) {
    lines.push(`Vətəndaşlıq: ${profile.passport_country}`);
  }
  if (!profile.is_registered) {
    lines.push(`Qeydiyyat: YOX — söhbət əsnasında qeydiyyata dəvət et`);
    lines.push(`Qeydiyyat linki: ${profile.registration_url}`);
  } else {
    lines.push(`Qeydiyyat: Var (saytda hesabı mövcuddur)`);
  }

  return lines.join("\n");
}
