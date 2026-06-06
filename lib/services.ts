import {
  Plane, Hotel, Car, Ship, Train, Palmtree,
  Briefcase, Target, Map, Globe, CreditCard, Headphones,
  type LucideIcon,
} from "lucide-react";
import { waLink } from "./whatsapp";
import type { Locale } from "./i18n";

export interface ServiceItem {
  key: string;
  icon: LucideIcon;
  /** İkon rəngi (Tailwind text-*) */
  iconClass: string;
  /** İkon fon tonu (Tailwind bg-*) */
  bgClass: string;
  label: Record<Locale, string>;
  /** Daxili səhifə/anchor. Boş olsa, xidmət WhatsApp-a yönəlir. */
  href?: string;
  /** Ana səhifədəki "Xidmətlərimiz" kart bölməsində göstərilsin. */
  featured?: boolean;
}

// Vahid mənbə: həm yuxarıdakı ServicesTicker, həm ana səhifə kartları buradan qidalanır.
export const SERVICES: ServiceItem[] = [
  { key: "flights",   icon: Plane,       iconClass: "text-sky-600",     bgClass: "bg-sky-50",     label: { az: "Aviabilet",           en: "Flights",         tr: "Uçuş Bileti" },         href: "/#planner", featured: true },
  { key: "hotels",    icon: Hotel,       iconClass: "text-indigo-600",  bgClass: "bg-indigo-50",  label: { az: "Otellər",             en: "Hotels",          tr: "Oteller" },             href: "/oteller",  featured: true },
  { key: "car",       icon: Car,         iconClass: "text-amber-600",   bgClass: "bg-amber-50",   label: { az: "Rent a Car",          en: "Car Rental",      tr: "Araç Kiralama" },                          featured: true },
  { key: "cruise",    icon: Ship,        iconClass: "text-cyan-600",    bgClass: "bg-cyan-50",    label: { az: "Kruiz Turları",        en: "Cruise Tours",    tr: "Kruvaziyer Turları" },                     featured: true },
  { key: "train",     icon: Train,       iconClass: "text-rose-600",    bgClass: "bg-rose-50",    label: { az: "Qatar Biletləri",      en: "Train Tickets",   tr: "Tren Biletleri" },                         featured: true },
  { key: "package",   icon: Palmtree,    iconClass: "text-emerald-600", bgClass: "bg-emerald-50", label: { az: "Paket Turlar",         en: "Package Tours",   tr: "Paket Turlar" },        href: "/turlar",   featured: true },
  { key: "business",  icon: Briefcase,   iconClass: "text-slate-600",   bgClass: "bg-slate-100",  label: { az: "Biznes Səyahəti",      en: "Business Travel", tr: "İş Seyahati" },                            featured: true },
  { key: "private",   icon: Target,      iconClass: "text-violet-600",  bgClass: "bg-violet-50",  label: { az: "Fərdi Turlar",         en: "Private Tours",   tr: "Özel Turlar" },         href: "/turlar",   featured: true },
  { key: "custom",    icon: Map,         iconClass: "text-sky-600",     bgClass: "bg-sky-50",     label: { az: "Xüsusi Planlaşdırma",  en: "Custom Planning", tr: "Özel Planlama" },       href: "/#planner" },
  { key: "worldwide", icon: Globe,       iconClass: "text-teal-600",    bgClass: "bg-teal-50",    label: { az: "Dünya Üzrə",           en: "Worldwide",       tr: "Dünya Geneli" },        href: "/turlar" },
  { key: "epoint",    icon: CreditCard,  iconClass: "text-indigo-600",  bgClass: "bg-indigo-50",  label: { az: "Epoint ödəniş",        en: "Epoint Payment",  tr: "Epoint Ödeme" },        href: "/turlar" },
  { key: "support",   icon: Headphones,  iconClass: "text-emerald-600", bgClass: "bg-emerald-50", label: { az: "24/7 Dəstək",          en: "24/7 Support",    tr: "7/24 Destek" },         href: "/elaqe" },
];

const WA_MSG: Record<Locale, (name: string) => string> = {
  az: (n) => `Salam, ${n} xidməti haqqında məlumat almaq istəyirəm.`,
  en: (n) => `Hi, I'd like more information about your ${n} service.`,
  tr: (n) => `Merhaba, ${n} hizmeti hakkında bilgi almak istiyorum.`,
};

/** Xidmətin dilə uyğun yönləndiyi ünvanı qaytarır (daxili səhifə və ya WhatsApp). */
export function serviceHref(s: ServiceItem, lang: Locale): string {
  if (s.href) return s.href;
  return waLink(WA_MSG[lang](s.label[lang]));
}

/** Xidmət xarici hədəfə (WhatsApp) açılırsa true — target="_blank" lazımdır. */
export function serviceIsExternal(s: ServiceItem): boolean {
  return !s.href;
}
