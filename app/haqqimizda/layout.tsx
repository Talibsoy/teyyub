import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Haqqımızda",
  description:
    "Natoure haqqında — Bakı əsaslı turizm şirkəti. Türkiyə, Dubai, Misir, Avropa istiqamətlərində peşəkar xidmət. Komandamız, missiyamız, təcrübəmiz.",
  alternates: { canonical: "https://www.natourefly.com/haqqimizda" },
  openGraph: {
    title: "Haqqımızda | Natoure",
    description: "Bakı əsaslı turizm şirkəti. Peşəkar komanda, etibarlı xidmət.",
    url: "https://www.natourefly.com/haqqimizda",
  },
};

export default function HaqqimizdaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
