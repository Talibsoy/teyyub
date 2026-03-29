import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turlar",
  description:
    "Bakıdan Türkiyə, Dubai, Misir, Avropa turları. Aktual qiymətlər, uçuş + otel + transfer paketləri. Natoure ilə sərfəli turizm.",
  alternates: { canonical: "https://www.natourefly.com/turlar" },
  openGraph: {
    title: "Turlar | Natoure",
    description: "Bakıdan Türkiyə, Dubai, Misir, Avropa turları. Sərfəli paketlər.",
    url: "https://www.natourefly.com/turlar",
  },
};

export default function TurlarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
