import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlyNaToure — Bakıdan Dünyaya Turlar",
  description:
    "FlyNaToure — Azərbaycan turizm şirkəti. Türkiyə, Ərəb ölkələri və Avropa turları. Bakı ofisi ilə etibarlı, rahat, sərfəli turlar.",
  keywords: "tur, turizm, Bakı, Türkiyə turu, Avropa turu, Ərəb ölkələri turu, Azərbaycan turizm",
  openGraph: {
    title: "FlyNaToure — Bakıdan Dünyaya Turlar",
    description: "Türkiyə, Ərəb ölkələri və Avropa turları. Etibarlı, rahat, sərfəli.",
    locale: "az_AZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
