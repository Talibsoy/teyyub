"use client";

// Faza 3 — Experience package admin.
// Writes go through /api/crm/experiences (staff-guarded, service-role);
// the table's RLS blocks direct client writes on purpose.

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Mountain, Plus, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ExperienceRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  destination: string;
  destination_query: string | null;
  destination_iata: string | null;
  hero_image_url: string | null;
  summary: string | null;
  highlights: string[] | null;
  included: string[] | null;
  excluded: string[] | null;
  duration_days: number;
  difficulty: string | null;
  best_season: string | null;
  base_price_usd: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface FormState {
  slug: string;
  title: string;
  subtitle: string;
  destination: string;
  destination_query: string;
  destination_iata: string;
  hero_image_url: string;
  summary: string;
  highlights: string;
  included: string;
  excluded: string;
  duration_days: number;
  difficulty: string;
  best_season: string;
  base_price_usd: number;
}

const EMPTY: FormState = {
  slug: "", title: "", subtitle: "",
  destination: "", destination_query: "", destination_iata: "",
  hero_image_url: "", summary: "",
  highlights: "", included: "", excluded: "",
  duration_days: 7, difficulty: "moderate", best_season: "",
  base_price_usd: 0,
};

/** Newline-separated textarea → string[] */
function toList(value: string): string[] {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function ExperiencesAdminPage() {
  const [rows, setRows] = useState<ExperienceRow[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/experiences", { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load experiences");
      setRows(data.experiences ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load experiences");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/experiences", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          ...form,
          slug: form.slug || slugify(form.title),
          destination_query: form.destination_query || null,
          destination_iata: form.destination_iata.toUpperCase() || null,
          hero_image_url: form.hero_image_url || null,
          subtitle: form.subtitle || null,
          summary: form.summary || null,
          best_season: form.best_season || null,
          highlights: toList(form.highlights),
          included: toList(form.included),
          excluded: toList(form.excluded),
          base_price_usd: form.base_price_usd || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: ExperienceRow) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)));
    const res = await fetch(`/api/crm/experiences/${row.id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    if (!res.ok) await load(); // revert to server truth on failure
  }

  async function remove(row: ExperienceRow) {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/crm/experiences/${row.id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (res.ok) setRows((prev) => prev.filter((r) => r.id !== row.id));
    else await load();
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900">Experiences</h1>
          <span className="text-sm text-slate-400">({rows.length})</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Close" : "New experience"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title *">
              <input
                required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="7-Day Alaska Wildlife Adventure" className="inp"
              />
            </Field>
            <Field label="Slug" hint="auto from title if blank">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="alaska-wildlife-adventure" className="inp"
              />
            </Field>
            <Field label="Destination *" hint="shown to users">
              <input
                required value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Anchorage, Alaska" className="inp"
              />
            </Field>
            <Field label="Hotel search city" hint="what RateHawk searches">
              <input
                value={form.destination_query}
                onChange={(e) => setForm({ ...form, destination_query: e.target.value })}
                placeholder="Anchorage" className="inp"
              />
            </Field>
            <Field label="Airport code" hint="prefills flight search">
              <input
                value={form.destination_iata} maxLength={3}
                onChange={(e) => setForm({ ...form, destination_iata: e.target.value.toUpperCase() })}
                placeholder="ANC" className="inp"
              />
            </Field>
            <Field label="Duration (days)">
              <input
                type="number" min={1} max={60} value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
                className="inp"
              />
            </Field>
            <Field label="Difficulty">
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="inp"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </select>
            </Field>
            <Field label="Best season">
              <input
                value={form.best_season}
                onChange={(e) => setForm({ ...form, best_season: e.target.value })}
                placeholder="June–August" className="inp"
              />
            </Field>
            <Field label="From price (USD)" hint="marketing estimate only">
              <input
                type="number" min={0} value={form.base_price_usd}
                onChange={(e) => setForm({ ...form, base_price_usd: Number(e.target.value) })}
                className="inp"
              />
            </Field>
            <Field label="Hero image URL">
              <input
                value={form.hero_image_url}
                onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                placeholder="https://…" className="inp"
              />
            </Field>
          </div>

          <Field label="Subtitle">
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Glaciers, grizzlies and the last great wilderness" className="inp"
            />
          </Field>

          <Field label="Summary">
            <textarea
              rows={3} value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="inp" placeholder="Short paragraph shown under the hero."
            />
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Highlights" hint="one per line">
              <textarea
                rows={4} value={form.highlights}
                onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                className="inp" placeholder={"Glacier cruise\nDenali wildlife drive"}
              />
            </Field>
            <Field label="Included" hint="one per line">
              <textarea
                rows={4} value={form.included}
                onChange={(e) => setForm({ ...form, included: e.target.value })}
                className="inp" placeholder={"7 nights accommodation\nPark entry fees"}
              />
            </Field>
            <Field label="Not included" hint="one per line">
              <textarea
                rows={4} value={form.excluded}
                onChange={(e) => setForm({ ...form, excluded: e.target.value })}
                className="inp" placeholder={"International flights\nTravel insurance"}
              />
            </Field>
          </div>

          <button
            type="submit" disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Create experience"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 rounded-xl">
          <Mountain className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No experiences yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`flex items-center gap-4 bg-white border rounded-xl p-4 ${
                row.is_active ? "border-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">{row.title}</h3>
                  {!row.is_active && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {row.destination} · {row.duration_days} days
                  {row.base_price_usd ? ` · from $${Math.round(row.base_price_usd)}` : ""}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">/experience/{row.slug}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={`/experience/${row.slug}`} target="_blank" rel="noopener noreferrer"
                  title="Open landing page"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => toggleActive(row)}
                  title={row.is_active ? "Unpublish" : "Publish"}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {row.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => remove(row)} title="Delete"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .inp {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.5rem 0.7rem;
          font-size: 0.875rem;
          color: #0f172a;
          background: #fff;
        }
        .inp:focus { outline: 2px solid #10b981; outline-offset: 1px; border-color: #10b981; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label} {hint && <span className="text-slate-400 font-normal">— {hint}</span>}
      </span>
      {children}
    </label>
  );
}
