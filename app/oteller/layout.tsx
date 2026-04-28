import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Otel Axtarışı | Natoure",
  description:
    "Antalya, Dubai, Istanbul, Bali və daha çox istiqamətdə otel axtarın. Real vaxt qiymətlər, xidmət haqqı daxil. Natoure ilə rahat rezervasiya.",
  alternates: { canonical: "https://www.natourefly.com/oteller" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Otel Axtarışı | Natoure",
    description: "Real vaxt otel qiymətləri — xidmət haqqı daxil. Bakıdan bütün istiqamətlərə.",
    url: "https://www.natourefly.com/oteller",
  },
};

export default function OtellerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
