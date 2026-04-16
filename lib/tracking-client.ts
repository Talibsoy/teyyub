// lib/tracking-client.ts
// NatoureFly Personalization Engine — Client-side Behavioral Event Collector
// Hər 5 saniyədə batch göndərir. Səhifə bağlananda da flush edir.

export interface TrackingEvent {
  event_type:
    | "search" | "view_detail" | "view_duration" | "skip"
    | "compare" | "bookmark" | "share" | "filter_change"
    | "quiz_answer" | "booking_start" | "booking_complete";
  entity_type?: "flight" | "hotel" | "package";
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

class TrackingClient {
  private queue: (TrackingEvent & { timestamp: number })[] = [];
  private sessionToken: string = "";
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    this.sessionToken = localStorage.getItem("nf_session_token") ?? "";
    if (!this.sessionToken) return; // Profil olmayan istifadəçi izlənmir

    this.flushTimer = setInterval(() => this.flush(), 5000);
    window.addEventListener("beforeunload", () => this.flush(true));
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush(true);
    });
  }

  track(event: TrackingEvent) {
    if (typeof window === "undefined" || !this.sessionToken) return;
    this.queue.push({ ...event, timestamp: Date.now() });
  }

  // İstifadəçinin bir nəticəyə nə qədər baxdığını izlə
  // Qaytarılan funksiyanı cleanup üçün çağır (useEffect return)
  trackViewDuration(entityType: "hotel" | "flight" | "package", entityId: string, metadata?: Record<string, unknown>) {
    const startTime = Date.now();
    return () => {
      const duration = (Date.now() - startTime) / 1000;
      if (duration > 1.5) {
        this.track({
          event_type: "view_duration",
          entity_type: entityType,
          entity_id: entityId,
          metadata: { duration_seconds: duration, ...metadata },
        });
      }
    };
  }

  private async flush(keepalive = false) {
    if (!this.queue.length || !this.sessionToken) return;
    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch("/api/tracking/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: this.sessionToken, events }),
        keepalive,
      });
    } catch {
      // Silent fail — tracking is non-critical
    }
  }

  destroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
  }
}

// Singleton
export const tracker = new TrackingClient();
