import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Əlaqə",
  description:
    "Natoure ilə əlaqə — +44 7828 721748 | info@natourefly.com | Bakı. WhatsApp-da pulsuz məsləhət alın.",
  alternates: { canonical: "https://www.natourefly.com/elaqe" },
  openGraph: {
    title: "Əlaqə | Natoure",
    description: "Natoure ilə əlaqə. WhatsApp, telefon, email.",
    url: "https://www.natourefly.com/elaqe",
  },
};

export default function ElaqeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
