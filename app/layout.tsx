import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { LanguageProvider } from "@/components/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.natourefly.com"),
  title: {
    default: "Natoure — Premium Tours to the World",
    template: "%s | Natoure",
  },
  description:
    "Natoure — Trusted premium travel agency. Tours to Turkey, Dubai, Egypt, Europe. Flight + hotel + transfer — full service. Free consultation on WhatsApp.",
  keywords: [
    "tour", "tourism", "Baku", "Azerbaijan",
    "Turkey tour", "Istanbul tour", "Dubai tour",
    "Egypt tour", "Europe tour", "cheap tours",
    "all inclusive tour", "natoure", "flynatoure",
  ],
  authors: [{ name: "Natoure", url: "https://www.natourefly.com" }],
  creator: "Natoure",
  publisher: "Natoure",
  category: "travel",
  openGraph: {
    title: "Natoure — Premium Tours to the World",
    description: "Tours to Turkey, Dubai, Egypt, Europe. Flight + hotel + transfer. Free consultation on WhatsApp.",
    url: "https://www.natourefly.com",
    siteName: "Natoure",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Natoure — Premium Tours to the World",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Natoure — Premium Tours to the World",
    description: "Tours to Turkey, Dubai, Egypt, Europe. Free consultation.",
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
  description: "Trusted premium travel agency. Tours to Turkey, Dubai, Egypt, Europe.",
  telephone: "+447828721748",
  email: "info@natourefly.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Baku",
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <SiteShell>{children}</SiteShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
