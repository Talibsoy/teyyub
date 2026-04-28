import type { Metadata } from "next";
import PanelClientLayout from "./PanelClientLayout";

export const metadata: Metadata = {
  title: "Şəxsi Kabinet | Natoure",
  description: "Natoure istifadəçi paneli — rezervasiyalar, loyallıq xalları, arzu siyahısı.",
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelClientLayout>{children}</PanelClientLayout>;
}
