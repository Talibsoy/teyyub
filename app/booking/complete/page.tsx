"use client";

// Faza 4 — Return page from Stripe Checkout. Triggers the booking saga.
//
// The customer has already paid by the time they land here, so this page never
// shows a bare error: every outcome tells them exactly what is booked, what is
// not, and what happens next.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

interface StepResultView {
  service: string;
  status: string;
  providerRef?: string;
  reason?: string;
}

interface ExecuteResponse {
  sagaId?: string;
  status?: "completed" | "rolled_back" | "needs_attention";
  steps?: StepResultView[];
  bookedTotalUsd?: number;
  paidTotalUsd?: number;
  failedService?: string | null;
  alreadyProcessed?: boolean;
  error?: string;
}

const SERVICE_LABEL: Record<string, string> = {
  flight: "Flights",
  hotel: "Stay",
  tour: "Guided experience",
  car: "Rental car",
  train: "Train",
  cruise: "Cruise",
  insurance: "Insurance",
};

export default function BookingCompletePage() {
  return (
    <Suspense fallback={<Shell><p className="text-slate-500">Loading…</p></Shell>}>
      <BookingComplete />
    </Suspense>
  );
}

function BookingComplete() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Booking must fire exactly once even if React re-runs the effect.
  const startedRef = useRef(false);

  const execute = useCallback(async () => {
    if (!sessionId) {
      setError("Missing checkout session.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/booking/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ checkoutSessionId: sessionId }),
      });

      const data: ExecuteResponse = await res.json();
      if (!res.ok && !data.status) {
        setError(data.error ?? "We could not complete your booking.");
      } else {
        setResult(data);
      }
    } catch {
      setError("We could not reach the booking service.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    execute();
  }, [execute]);

  if (loading) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Confirming your trip…</h1>
        <p className="text-slate-600">
          We are booking each service with the providers. This can take up to a few minutes —
          please don&apos;t close this page.
        </p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
          {error}
        </div>
        <p className="text-sm text-slate-600">
          Your payment is safe. If anything was charged, our team has been alerted and will contact
          you. You can also reach us on WhatsApp.
        </p>
      </Shell>
    );
  }

  const status = result?.status;

  return (
    <Shell>
      {status === "completed" && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your trip is booked 🎉</h1>
          <p className="text-slate-600 mb-6">
            Everything below is confirmed with the provider. Confirmation emails are on their way.
          </p>
        </>
      )}

      {status === "rolled_back" && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">We could not complete your trip</h1>
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
            <b>
              {result?.failedService ? SERVICE_LABEL[result.failedService] ?? result.failedService : "A service"}
            </b>{" "}
            became unavailable while booking, so we cancelled the rest and nothing is left booked.
            Your payment will be refunded in full.
          </div>
        </>
      )}

      {status === "needs_attention" && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Partly booked — we&apos;re on it</h1>
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
            Part of your trip is confirmed, but one service could not be completed and could not be
            cancelled automatically. Our team has been alerted and will contact you shortly to sort
            it out — you do not need to do anything.
          </div>
        </>
      )}

      {result?.steps && result.steps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
          {result.steps.map((step) => (
            <div
              key={step.service}
              className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0"
            >
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {SERVICE_LABEL[step.service] ?? step.service}
                </div>
                {step.providerRef && (
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{step.providerRef}</div>
                )}
                {step.reason && <div className="text-xs text-amber-700 mt-0.5">{step.reason}</div>}
              </div>
              <StatusBadge status={step.status} />
            </div>
          ))}

          {typeof result.paidTotalUsd === "number" && (
            <div className="flex justify-between pt-3 mt-2 border-t border-slate-200 text-sm">
              <span className="font-semibold text-slate-700">Paid</span>
              <span className="font-bold text-slate-900 tabular-nums">${result.paidTotalUsd}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/panel" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          View my trips
        </Link>
        <Link href="/" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors">
          Back home
        </Link>
      </div>
    </Shell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    compensated: "bg-slate-100 text-slate-500 border-slate-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    manual_intervention: "bg-amber-50 text-amber-800 border-amber-300",
    pending: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const label: Record<string, string> = {
    confirmed: "Confirmed",
    compensated: "Cancelled",
    failed: "Not available",
    manual_intervention: "Being reviewed",
    pending: "Pending",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap ${style[status] ?? style.pending}`}>
      {label[status] ?? status}
    </span>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12">{children}</div>
    </main>
  );
}
