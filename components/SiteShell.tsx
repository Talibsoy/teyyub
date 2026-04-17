"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import WhatsAppButton from "./WhatsAppButton";

const BARE_ROUTES = ["/prototype"];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = BARE_ROUTES.some(r => path === r || path.startsWith(r + "/"));

  if (bare) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
      <WhatsAppButton />
    </>
  );
}
