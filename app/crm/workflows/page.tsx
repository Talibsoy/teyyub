"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Zap, Play, Pause, Trash2 } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  trigger_event: string;
  trigger_condition: Record<string, string>;
  actions: { type: string; template: string }[];
  is_active: boolean;
  run_count: number;
  created_at: string;
}

const TRIGGERS: { value: string; label: string; desc: string }[] = [
  { value: "lead.created", label: "Yeni lead gəldi", desc: "WhatsApp/FB-dən yeni müştəri" },
  { value: "lead.status_changed", label: "Lead statusu dəyişdi", desc: "Status dəyişikliyi" },
  { value: "booking.status_changed", label: "Rezervasiya statusu dəyişdi", desc: "Rezervasiya yeniləndi" },
  { value: "payment.created", label: "Ödəniş alındı", desc: "Yeni ödəniş qeydə alındı" },
];

const ACTIONS: { value: string; label: string }[] = [
  { value: "telegram_notify", label: "Telegram bildiriş göndər" },
  { value: "whatsapp_reply", label: "WhatsApp cavabı göndər (leadə)" },
];

const VARIABLES = ["{{name}}", "{{platform}}", "{{destination}}", "{{status}}", "{{booking_number}}", "{{amount}}"];

const TRIGGER_COLOR: Record<string, string> = {
  "lead.created": "bg-blue-900/50 text-blue-400",
  "lead.status_changed": "bg-yellow-900/50 text-yellow-400",
  "booking.status_changed": "bg-emerald-900/50 text-emerald-400",
  "payment.created": "bg-violet-900/50 text-violet-400",
};

const emptyForm = {
  name: "",
  trigger_event: "lead.created",
  action_type: "telegram_notify",
  template: "",
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadWorkflows(); }, []);

  async function loadWorkflows() {
    const { data } = await supabase.from("workflows").select("*").order("created_at", { ascending: false });
    setWorkflows(data || []);
    setLoading(false);
  }

  async function saveWorkflow() {
    if (!form.name || !form.template) return;
    setSaving(true);
    await supabase.from("workflows").insert([{
      name: form.name,
      trigger_event: form.trigger_event,
      trigger_condition: {},
      actions: [{ type: form.action_type, template: form.template }],
      is_active: true,
    }]);
    await loadWorkflows();
    setShowModal(false);
    setForm(emptyForm);
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("workflows").update({ is_active: !current }).eq("id", id);
    setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, is_active: !current } : w));
  }

  async function deleteWorkflow(id: string) {
    await supabase.from("workflows").delete().eq("id", id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  function insertVar(v: string) {
    setForm((f) => ({ ...f, template: f.template + v }));
  }

  const triggerLabel = (event: string) => TRIGGERS.find((t) => t.value === event)?.label || event;
  const actionLabel = (type: string) => ACTIONS.find((a) => a.value === type)?.label || type;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Avtomatik Workflowlar</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Yeni workflow
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Trigger → Action modeli: hadisə baş verəndə avtomatik işlər icra olunur.
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
      ) : workflows.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center h-48 gap-3 text-gray-600">
          <Zap size={32} />
          <span>Hələ workflow yoxdur</span>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf.id} className={`bg-gray-900 border rounded-xl p-5 ${wf.is_active ? "border-gray-800" : "border-gray-800/40 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${wf.is_active ? "bg-blue-600" : "bg-gray-700"}`}>
                    <Zap size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{wf.name}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_COLOR[wf.trigger_event] || "bg-gray-800 text-gray-400"}`}>
                        ⚡ {triggerLabel(wf.trigger_event)}
                      </span>
                      <span className="text-gray-600 text-xs">→</span>
                      {(wf.actions || []).map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                          {actionLabel(a.type)}
                        </span>
                      ))}
                    </div>
                    {wf.actions?.[0]?.template && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2 font-mono line-clamp-2">
                        {wf.actions[0].template}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-2">{wf.run_count} dəfə işlənib</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(wf.id, wf.is_active)}
                    className={`p-1.5 rounded-lg transition-colors ${wf.is_active ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}>
                    {wf.is_active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => deleteWorkflow(wf.id)}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-900/50 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Yeni Workflow</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Workflow adı *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Məs: Yeni lead → Telegram bildiriş"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Trigger — nə baş verəndə?</label>
                <div className="space-y-2">
                  {TRIGGERS.map((t) => (
                    <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.trigger_event === t.value ? "border-blue-500 bg-blue-900/20" : "border-gray-800 hover:border-gray-700"
                    }`}>
                      <input type="radio" name="trigger" value={t.value}
                        checked={form.trigger_event === t.value}
                        onChange={(e) => setForm({ ...form, trigger_event: e.target.value })}
                        className="mt-0.5" />
                      <div>
                        <div className="text-sm text-white font-medium">{t.label}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Action — nə etsin?</label>
                <select value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mesaj şablonu *</label>
                <textarea value={form.template}
                  onChange={(e) => setForm({ ...form, template: e.target.value })}
                  rows={4} placeholder="Mesajı yazın, dəyişənlərdən istifadə edin..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none font-mono" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {VARIABLES.map((v) => (
                    <button key={v} onClick={() => insertVar(v)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-2 py-0.5 rounded font-mono transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-1">Dəyişənlərə tıklayaraq şablona əlavə et</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Ləğv et
              </button>
              <button onClick={saveWorkflow} disabled={saving || !form.name || !form.template}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {saving ? "Saxlanır..." : "Yarat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
