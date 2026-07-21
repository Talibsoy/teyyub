"use client";

// Faza 4 UI — Confirmation-gate booking wizard.
//
// Every option shown here comes from the grounded planner (/api/planner), which
// only returns real provider inventory. The user confirms each service in its own
// window before the next unlocks; nothing is ever auto-selected or auto-booked.

import { Suspense, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  bookingReducer,
  buildSession,
  getActiveGate,
  getConfirmedSelections,
  getTotalUsd,
  REQUIRED_SERVICES,
  type GateOption,
  type ServiceType,
} from "@/lib/booking/confirmation-gate";
import type { GroundedPlan, ServiceOptions } from "@/lib/grounded-planner";

const SERVICE_LABEL: Record<ServiceType, string> = {
  flight: "Flights",
  hotel: "Stay",
  tour: "Guided experience",
  car: "Rental car",
  train: "Train",
  cruise: "Cruise",
  insurance: "Insurance",
};

interface TripForm {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  travelers: number;
}

const EMPTY_FORM: TripForm = {
  origin: "",
  destination: "",
  departDate: "",
  returnDate: "",
  travelers: 2,
};

/** Details the providers require before anything can be booked. */
interface TravellerForm {
  firstName: string;
  lastName: string;
  bornOn: string;      // YYYY-MM-DD — Duffel requires a date of birth
  citizenship: string; // ISO-2 — ETG requires guest citizenship
  email: string;
  phone: string;
}

const EMPTY_TRAVELLER: TravellerForm = {
  firstName: "",
  lastName: "",
  bornOn: "",
  citizenship: "US",
  email: "",
  phone: "",
};

export default function PlanPage() {
  return (
    <Suspense fallback={<Shell><p className="text-slate-500">Loading…</p></Shell>}>
      <PlanWizard />
    </Suspense>
  );
}

function PlanWizard() {
  // Prefilled when arriving from an experience landing page (Flow 1).
  const searchParams = useSearchParams();
  const experienceSlug = searchParams.get("experience");
  const [form, setForm] = useState<TripForm>(() => ({
    ...EMPTY_FORM,
    destination: searchParams.get("destination") ?? "",
    origin: searchParams.get("from")?.toUpperCase() ?? "",
  }));
  const [plan, setPlan] = useState<GroundedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, dispatch] = useReducer(bookingReducer, undefined, () => buildSession());
  // One entry per seat: Duffel needs a passenger per seat in the offer and ETG
  // needs a guest per person in the room.
  const [travellers, setTravellers] = useState<TravellerForm[]>([{ ...EMPTY_TRAVELLER }]);
  const [payLoading, setPayLoading] = useState(false);

  function updateTraveller(index: number, patch: Partial<TravellerForm>) {
    setTravellers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  // Sized when leaving review so the form always matches the booked party size.
  function goToPayment() {
    const count = Math.max(1, plan?.input.travelers ?? form.travelers ?? 1);
    setTravellers((prev) =>
      Array.from({ length: count }, (_, i) => prev[i] ?? { ...EMPTY_TRAVELLER }),
    );
    dispatch({ type: "CONFIRM_REVIEW" });
  }

  const activeGate = getActiveGate(session);
  const confirmed = getConfirmedSelections(session);
  const total = getTotalUsd(session);

  function planFor(service: ServiceType): ServiceOptions | undefined {
    return plan?.services.find((s) => s.service === service);
  }

  async function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: form.origin.trim() || undefined,
          destination: form.destination.trim(),
          departDate: form.departDate,
          returnDate: form.returnDate || undefined,
          travelers: form.travelers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not build a plan.");
      setPlan(data as GroundedPlan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Hands the confirmed trip to Stripe Checkout. The server re-validates that
  // every selected service is actually bookable before taking any money.
  async function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    setPayLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;

      if (!token) {
        setError("Please sign in before paying — your booking needs an account.");
        setPayLoading(false);
        return;
      }

      // Duffel rejects an order whose passenger ids don't come from the offer,
      // so map each traveller onto the offer's own passenger ids.
      const flightSelection = confirmed.find((c) => c.service === "flight");
      const rawIds = flightSelection?.option.meta?.passengerIds;
      const passengerIds = Array.isArray(rawIds) ? (rawIds as string[]) : [];

      if (flightSelection && passengerIds.length !== travellers.length) {
        setError(
          `This flight is priced for ${passengerIds.length} traveller(s) but you entered ${travellers.length}. Please restart the search with the correct number of travellers.`,
        );
        setPayLoading(false);
        return;
      }

      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selections: confirmed.map(({ service, option }) => ({
            service,
            optionId: option.id,
            priceUsd: option.priceUsd,
          })),
          passengers: travellers.map((t, i) => ({
            passenger_id: passengerIds[i] ?? "",
            given_name: t.firstName,
            family_name: t.lastName,
            born_on: t.bornOn,
            email: t.email || travellers[0].email,
            phone: t.phone || travellers[0].phone,
          })),
          guests: travellers.map((t) => ({
            first_name: t.firstName,
            last_name: t.lastName,
            citizenship: t.citizenship,
          })),
          phone: travellers[0].phone,
          email: travellers[0].email,
          experienceSlug: experienceSlug ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Could not start checkout.");
        setPayLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Could not reach the payment service.");
      setPayLoading(false);
    }
  }

  // Confirming the search parameters loads the real options already fetched for this trip.
  function confirmParams(service: ServiceType) {
    dispatch({
      type: "CONFIRM_PARAMS",
      service,
      params: {
        origin: form.origin,
        destination: form.destination,
        departDate: form.departDate,
        returnDate: form.returnDate,
        travelers: form.travelers,
      },
    });
    dispatch({
      type: "LOAD_OPTIONS",
      service,
      options: planFor(service)?.options ?? [],
    });
  }

  // ── Step 1: trip form ──────────────────────────────────────────────────────
  if (!plan) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Plan your trip</h1>
        <p className="text-slate-600 mb-6">
          We search live flight and hotel inventory. You approve every step — nothing is booked
          until you say so.
        </p>

        {experienceSlug && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Planning your <b className="capitalize">{experienceSlug.replace(/-/g, " ")}</b> trip — add
            your dates and departure city to see live availability.
          </div>
        )}

        <form onSubmit={handlePlan} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="From (airport code)" hint="e.g. AUS">
              <input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value.toUpperCase() })}
                maxLength={3}
                placeholder="AUS"
                className="input"
              />
            </Field>
            <Field label="Destination" hint="City or airport">
              <input
                required
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Los Angeles"
                className="input"
              />
            </Field>
            <Field label="Departure">
              <input
                required
                type="date"
                value={form.departDate}
                onChange={(e) => setForm({ ...form, departDate: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Return">
              <input
                type="date"
                value={form.returnDate}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Travelers">
              <input
                type="number"
                min={1}
                max={9}
                value={form.travelers}
                onChange={(e) => setForm({ ...form, travelers: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Searching live availability…" : "Find real options"}
          </button>
        </form>
        <Styles />
      </Shell>
    );
  }

  // ── Step 2: plan summary → approve ────────────────────────────────────────
  if (!session.planApproved) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Your trip plan</h1>
        <p className="text-slate-600 mb-6">
          Here is what is actually available for {plan.input.destination}. Approve to start
          confirming each service.
        </p>

        <div className="space-y-3 mb-6">
          {plan.services.map((s) => (
            <div key={s.service} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800">{SERVICE_LABEL[s.service]}</span>
                {s.available ? (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {s.options.length} live option{s.options.length === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    Not available
                  </span>
                )}
              </div>
              {!s.available && s.note && <p className="text-sm text-slate-500 mt-2">{s.note}</p>}
            </div>
          ))}
        </div>

        <button onClick={() => dispatch({ type: "APPROVE_PLAN" })} className="btn-primary w-full">
          Approve plan &amp; start booking
        </button>
        <Styles />
      </Shell>
    );
  }

  // ── Step 4: review / payment ──────────────────────────────────────────────
  if (session.stage === "review" || session.stage === "payment") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Final review</h1>
        <p className="text-slate-600 mb-6">Confirm everything below before payment.</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4">
          {confirmed.map(({ service, option }) => (
            <div key={service} className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">{SERVICE_LABEL[service]}</div>
                <div className="text-sm text-slate-800">{option.label}</div>
              </div>
              <div className="text-sm font-semibold text-slate-900 tabular-nums">${option.priceUsd}</div>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-bold text-emerald-600 tabular-nums">${total}</span>
          </div>
        </div>

        {session.stage === "review" ? (
          <button onClick={goToPayment} className="btn-primary w-full">
            Confirm and continue to payment
          </button>
        ) : (
          <form onSubmit={startCheckout} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900">
                Traveller details
                {travellers.length > 1 && (
                  <span className="text-slate-400 font-normal"> · {travellers.length} people</span>
                )}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Airlines and hotels require these exactly as they appear on each passport.
              </p>
            </div>

            {travellers.map((t, index) => (
              <div key={index} className={index > 0 ? "pt-4 border-t border-slate-100" : ""}>
                {travellers.length > 1 && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                    Traveller {index + 1}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="First name">
                    <input
                      required value={t.firstName}
                      onChange={(e) => updateTraveller(index, { firstName: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      required value={t.lastName}
                      onChange={(e) => updateTraveller(index, { lastName: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Date of birth">
                    <input
                      required type="date" value={t.bornOn}
                      onChange={(e) => updateTraveller(index, { bornOn: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Citizenship" hint="2-letter code">
                    <input
                      required value={t.citizenship} maxLength={2}
                      onChange={(e) => updateTraveller(index, { citizenship: e.target.value.toUpperCase() })}
                      className="input"
                    />
                  </Field>
                  {index === 0 && (
                    <>
                      <Field label="Email" hint="booking contact">
                        <input
                          required type="email" value={t.email}
                          onChange={(e) => updateTraveller(index, { email: e.target.value })}
                          className="input"
                        />
                      </Field>
                      <Field label="Phone" hint="booking contact">
                        <input
                          required type="tel" value={t.phone}
                          onChange={(e) => updateTraveller(index, { phone: e.target.value })}
                          className="input"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={payLoading} className="btn-primary w-full disabled:opacity-50">
              {payLoading ? "Opening secure checkout…" : `Pay $${total} securely`}
            </button>

            <p className="text-xs text-slate-500 text-center">
              You&apos;ll pay on Stripe&apos;s secure page. Nothing is booked until payment succeeds —
              then we book each service and show you the result.
            </p>
          </form>
        )}
        <Styles />
      </Shell>
    );
  }

  // ── Step 3: confirmation gates ────────────────────────────────────────────
  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Confirm each service</h1>
        {total > 0 && (
          <span className="text-sm font-semibold text-slate-700 tabular-nums">Total ${total}</span>
        )}
      </div>

      <ol className="space-y-3 mb-6">
        {session.gates.map((gate) => {
          const isActive = activeGate?.service === gate.service;
          const svc = planFor(gate.service);
          const selected = gate.options.find((o) => o.id === gate.selectedId) ?? null;

          return (
            <li
              key={gate.service}
              className={`rounded-xl border p-4 transition-colors ${
                isActive ? "border-emerald-400 bg-white shadow-sm" : "border-slate-200 bg-white/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800">{SERVICE_LABEL[gate.service]}</span>
                <StatusChip status={gate.status} />
              </div>

              {/* Confirmed summary */}
              {gate.status === "confirmed" && selected && (
                <p className="text-sm text-slate-600 mt-2">
                  {selected.label} — <b className="tabular-nums">${selected.priceUsd}</b>
                </p>
              )}

              {/* Active: confirm search parameters */}
              {isActive && gate.status === "params" && (
                <div className="mt-3">
                  <p className="text-sm text-slate-600 mb-3">
                    {gate.service === "flight"
                      ? `${form.origin || "—"} → ${plan.input.destination} · ${plan.input.departDate}${plan.input.returnDate ? ` – ${plan.input.returnDate}` : ""} · ${plan.input.travelers ?? 2} travelers`
                      : `${plan.input.destination} · ${plan.input.departDate}${plan.input.returnDate ? ` – ${plan.input.returnDate}` : ""} · ${plan.input.travelers ?? 2} travelers`}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => confirmParams(gate.service)} className="btn-primary">
                      Confirm &amp; see options
                    </button>
                    {!REQUIRED_SERVICES.includes(gate.service) && (
                      <button
                        onClick={() => dispatch({ type: "SKIP_SERVICE", service: gate.service })}
                        className="btn-ghost"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Active: choose a real option */}
              {isActive && gate.status === "results" && (
                <div className="mt-3">
                  {gate.options.length === 0 ? (
                    <div>
                      <p className="text-sm text-slate-500 mb-3">
                        {svc?.note ?? "No live options available for this service."}
                      </p>
                      {!REQUIRED_SERVICES.includes(gate.service) && (
                        <button
                          onClick={() => dispatch({ type: "SKIP_SERVICE", service: gate.service })}
                          className="btn-ghost"
                        >
                          Skip and continue
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
                        {gate.options.map((opt: GateOption) => (
                          <label
                            key={opt.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              gate.selectedId === opt.id
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`opt-${gate.service}`}
                                checked={gate.selectedId === opt.id}
                                onChange={() =>
                                  dispatch({ type: "SELECT_OPTION", service: gate.service, optionId: opt.id })
                                }
                              />
                              <span className="text-sm text-slate-800">{opt.label}</span>
                            </span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                              ${opt.priceUsd}
                            </span>
                          </label>
                        ))}
                      </div>
                      <button
                        disabled={!gate.selectedId}
                        onClick={() => dispatch({ type: "CONFIRM_SELECTION", service: gate.service })}
                        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Confirm this {SERVICE_LABEL[gate.service].toLowerCase()}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Unavailable services are stated honestly, never faked */}
              {gate.status === "unavailable" && (
                <p className="text-sm text-slate-400 mt-2">Not bookable online yet.</p>
              )}
            </li>
          );
        })}
      </ol>

      {!activeGate && confirmed.length > 0 && (
        <button onClick={() => dispatch({ type: "GO_TO_REVIEW" })} className="btn-primary w-full">
          Go to final review
        </button>
      )}
      <Styles />
    </Shell>
  );
}

// ─── Small presentational helpers ───────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10">{children}</div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label} {hint && <span className="text-slate-400 font-normal">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    locked: "bg-slate-100 text-slate-400 border-slate-200",
    params: "bg-sky-50 text-sky-700 border-sky-200",
    searching: "bg-sky-50 text-sky-700 border-sky-200",
    results: "bg-sky-50 text-sky-700 border-sky-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    skipped: "bg-slate-100 text-slate-500 border-slate-200",
    unavailable: "bg-slate-100 text-slate-400 border-slate-200",
  };
  const label: Record<string, string> = {
    locked: "Waiting",
    params: "Your turn",
    searching: "Searching…",
    results: "Choose one",
    confirmed: "Confirmed",
    skipped: "Skipped",
    unavailable: "Coming soon",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${map[status] ?? map.locked}`}>
      {label[status] ?? status}
    </span>
  );
}

function Styles() {
  return (
    <style>{`
      .input {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 0.55rem 0.75rem;
        font-size: 0.9rem;
        color: #0f172a;
        background: #fff;
      }
      .input:focus { outline: 2px solid #10b981; outline-offset: 1px; border-color: #10b981; }
      .btn-primary {
        background: #059669; color: #fff; font-weight: 600; font-size: 0.9rem;
        padding: 0.65rem 1.1rem; border-radius: 0.65rem; transition: background .15s;
      }
      .btn-primary:hover:not(:disabled) { background: #047857; }
      .btn-ghost {
        background: #fff; color: #475569; font-weight: 500; font-size: 0.9rem;
        padding: 0.65rem 1.1rem; border-radius: 0.65rem; border: 1px solid #cbd5e1;
      }
      .btn-ghost:hover { background: #f8fafc; }
    `}</style>
  );
}