import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ChatWidget from "@/components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.natourefly.com"),
  title: {
    default: "Natoure — Bakıdan Dünyaya Premium Turlar",
    template: "%s | Natoure",
  },
  description:
    "Natoure — Azərbaycanın etibarlı turizm şirkəti. Türkiyə, Dubai, Misir, Avropa turları. Uçuş + otel + transfer — tam xidmət. WhatsApp-da pulsuz məsləhət.",
  keywords: [
    "tur", "turizm", "Bakı", "Azərbaycan",
    "Türkiyə turu", "İstanbul turu", "Dubai turu",
    "Misir turu", "Avropa turu", "ucuz turlar",
    "all inclusive tur", "natoure", "flynatoure",
  ],
  authors: [{ name: "Natoure", url: "https://www.natourefly.com" }],
  creator: "Natoure",
  publisher: "Natoure",
  category: "travel",
  openGraph: {
    title: "Natoure — Bakıdan Dünyaya Premium Turlar",
    description: "Türkiyə, Dubai, Misir, Avropa turları. Uçuş + otel + transfer. Bakıdan. Pulsuz məsləhət.",
    url: "https://www.natourefly.com",
    siteName: "Natoure",
    locale: "az_AZ",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Natoure — Bakıdan Dünyaya Turlar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Natoure — Bakıdan Dünyaya Premium Turlar",
    description: "Türkiyə, Dubai, Misir, Avropa turları. Pulsuz məsləhət.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://www.natourefly.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Natoure",
  url: "https://www.natourefly.com",
  logo: "https://www.natourefly.com/logo.png",
  description: "Azərbaycanın etibarlı turizm şirkəti. Türkiyə, Dubai, Misir, Avropa turları.",
  telephone: "+994517769632",
  email: "info@natourefly.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bakı",
    addressCountry: "AZ",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    opens: "09:00",
    closes: "19:00",
  },
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <ChatWidget />
      </body>
    </html>
  );
}
