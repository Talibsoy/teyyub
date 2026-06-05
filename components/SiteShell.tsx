"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AIChatPanel from "./AIChatPanel";
import ErrorBoundary from "./ErrorBoundary";
import ServicesTicker from "./ServicesTicker";

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
      <ServicesTicker />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
      <AIChatPanel />
    </>
  );
}
