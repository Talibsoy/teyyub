// lib/booking/confirmation-gate.ts
// Faza 4 core — Confirmation-Gate booking state machine (pure, framework-agnostic).
//
// Enforces the platform's CORE PRINCIPLE in code: the AI/system never advances a
// booking; only explicit user actions (dispatched here) do. Every bookable service
// is confirmed individually before the next gate unlocks. Options always carry a
// REAL provider id + REAL price — this module never invents them (Zero-Hallucination).

export type ServiceType =
  | "flight" | "hotel" | "tour" | "car" | "train" | "cruise" | "insurance";

// Canonical booking order (matches the MASTER PROMPT booking sequence).
export const SERVICE_ORDER: ServiceType[] = [
  "flight", "hotel", "tour", "car", "train", "cruise", "insurance",
];

// Services actually bookable online today. Everything else is honestly "coming
// soon" (see Faza 0) and is marked `unavailable` rather than faked.
export const BOOKABLE_SERVICES: ServiceType[] = ["flight", "hotel", "tour"];

// Services the trip cannot proceed without — cannot be skipped by the user.
export const REQUIRED_SERVICES: ServiceType[] = ["flight", "hotel"];

export type GateStatus =
  | "locked"       // a previous gate is not yet resolved
  | "params"       // active; user is confirming search parameters
  | "searching"    // params confirmed; provider query in flight
  | "results"      // real options loaded, awaiting user selection
  | "confirmed"    // user selected + confirmed a real option
  | "skipped"      // user skipped this optional service
  | "unavailable"; // service not bookable online yet — cannot be entered

export interface GateOption {
  id: string;                        // REAL provider id (Duffel offer, RateHawk book_hash, Viator product)
  label: string;
  priceUsd: number;                  // REAL provider price — never an estimate
  meta?: Record<string, unknown>;
}

export interface GateState {
  service: ServiceType;
  status: GateStatus;
  params: Record<string, unknown> | null; // user-confirmed search params
  options: GateOption[];                   // real, provider-sourced options only
  selectedId: string | null;
}

export type BookingStage =
  | "planning" | "gates" | "review" | "payment" | "booking" | "done";

export interface BookingSession {
  stage: BookingStage;
  planApproved: boolean;
  gates: GateState[];   // ordered by SERVICE_ORDER
  activeIndex: number;  // index of the active gate, or -1 when none is active
}

export type GateAction =
  | { type: "APPROVE_PLAN" }
  | { type: "CONFIRM_PARAMS"; service: ServiceType; params: Record<string, unknown> }
  | { type: "LOAD_OPTIONS"; service: ServiceType; options: GateOption[] }
  | { type: "SELECT_OPTION"; service: ServiceType; optionId: string }
  | { type: "CONFIRM_SELECTION"; service: ServiceType }
  | { type: "SKIP_SERVICE"; service: ServiceType }
  | { type: "GO_TO_REVIEW" }
  | { type: "CONFIRM_REVIEW" }
  | { type: "PAYMENT_SUCCEEDED" }
  | { type: "BOOKING_COMPLETED" }
  | { type: "RESET" };

// ─── Construction ────────────────────────────────────────────────────────────

export function buildSession(enabled: ServiceType[] = BOOKABLE_SERVICES): BookingSession {
  const gates: GateState[] = SERVICE_ORDER.map((service): GateState => ({
    service,
    status: enabled.includes(service) ? "locked" : "unavailable",
    params: null,
    options: [],
    selectedId: null,
  }));
  return { stage: "planning", planApproved: false, gates, activeIndex: -1 };
}

// ─── Internal helpers (immutable) ────────────────────────────────────────────

function nextEnterable(gates: GateState[], from: number): number {
  for (let i = Math.max(0, from); i < gates.length; i++) {
    if (gates[i].status === "locked") return i;
  }
  return -1;
}

function patchGate(
  session: BookingSession,
  service: ServiceType,
  patch: Partial<GateState>,
): BookingSession {
  const gates = session.gates.map((g): GateState =>
    g.service === service ? { ...g, ...patch } : g);
  return { ...session, gates };
}

// After a gate is confirmed/skipped, unlock the next enterable gate.
function activateNext(session: BookingSession, fromService: ServiceType): BookingSession {
  const curIdx = session.gates.findIndex((g) => g.service === fromService);
  const idx = nextEnterable(session.gates, curIdx + 1);
  const gates = idx >= 0
    ? session.gates.map((g, i): GateState => (i === idx ? { ...g, status: "params" } : g))
    : session.gates;
  return { ...session, gates, activeIndex: idx };
}

function findGate(session: BookingSession, service: ServiceType): GateState | undefined {
  return session.gates.find((g) => g.service === service);
}

function hasAnyConfirmed(session: BookingSession): boolean {
  return session.gates.some((g) => g.status === "confirmed");
}

// ─── Reducer (pure) ──────────────────────────────────────────────────────────

export function bookingReducer(session: BookingSession, action: GateAction): BookingSession {
  switch (action.type) {
    case "APPROVE_PLAN": {
      if (session.stage !== "planning") return session;
      const idx = nextEnterable(session.gates, 0);
      const gates = session.gates.map((g, i): GateState =>
        i === idx ? { ...g, status: "params" } : g);
      return { ...session, stage: "gates", planApproved: true, gates, activeIndex: idx };
    }

    case "CONFIRM_PARAMS": {
      const g = findGate(session, action.service);
      if (!g || g.status !== "params") return session;
      return patchGate(session, action.service, { status: "searching", params: action.params });
    }

    case "LOAD_OPTIONS": {
      const g = findGate(session, action.service);
      if (!g || g.status !== "searching") return session;
      return patchGate(session, action.service, { status: "results", options: action.options });
    }

    case "SELECT_OPTION": {
      const g = findGate(session, action.service);
      if (!g || g.status !== "results") return session;
      // A selection must reference a real, already-loaded option.
      if (!g.options.some((o) => o.id === action.optionId)) return session;
      return patchGate(session, action.service, { selectedId: action.optionId });
    }

    case "CONFIRM_SELECTION": {
      const g = findGate(session, action.service);
      if (!g || g.status !== "results" || !g.selectedId) return session;
      const confirmed = patchGate(session, action.service, { status: "confirmed" });
      return activateNext(confirmed, action.service);
    }

    case "SKIP_SERVICE": {
      const g = findGate(session, action.service);
      if (!g) return session;
      if (REQUIRED_SERVICES.includes(action.service)) return session; // required — cannot skip
      if (g.status === "confirmed" || g.status === "unavailable") return session;
      const skipped = patchGate(session, action.service, { status: "skipped" });
      return activateNext(skipped, action.service);
    }

    case "GO_TO_REVIEW": {
      if (!hasAnyConfirmed(session)) return session; // nothing booked yet
      return { ...session, stage: "review", activeIndex: -1 };
    }

    case "CONFIRM_REVIEW":
      return session.stage === "review" ? { ...session, stage: "payment" } : session;

    case "PAYMENT_SUCCEEDED":
      return session.stage === "payment" ? { ...session, stage: "booking" } : session;

    case "BOOKING_COMPLETED":
      return session.stage === "booking" ? { ...session, stage: "done" } : session;

    case "RESET": {
      const enabled = session.gates
        .filter((g) => g.status !== "unavailable")
        .map((g) => g.service);
      return buildSession(enabled);
    }

    default:
      return session;
  }
}

// ─── Selectors ───────────────────────────────────────────────────────────────

export function getActiveGate(session: BookingSession): GateState | null {
  return session.activeIndex >= 0 ? session.gates[session.activeIndex] : null;
}

export function getConfirmedSelections(
  session: BookingSession,
): { service: ServiceType; option: GateOption }[] {
  const out: { service: ServiceType; option: GateOption }[] = [];
  for (const g of session.gates) {
    if (g.status === "confirmed" && g.selectedId) {
      const option = g.options.find((o) => o.id === g.selectedId);
      if (option) out.push({ service: g.service, option });
    }
  }
  return out;
}

export function getTotalUsd(session: BookingSession): number {
  return getConfirmedSelections(session).reduce((sum, x) => sum + (x.option.priceUsd || 0), 0);
}

// True once every enterable gate has been resolved (confirmed or skipped).
export function allGatesResolved(session: BookingSession): boolean {
  return session.activeIndex === -1 && session.gates.every(
    (g) => g.status === "confirmed" || g.status === "skipped" || g.status === "unavailable",
  );
}
