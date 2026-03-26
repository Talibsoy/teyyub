import { getSupabaseAdmin } from "./supabase";

export type TriggerEvent =
  | "lead.created"
  | "lead.status_changed"
  | "booking.status_changed"
  | "payment.created";

interface TriggerData {
  id?: string;
  platform?: string;
  status?: string;
  old_status?: string;
  name?: string;
  phone?: string;
  destination?: string;
  booking_number?: string;
  amount?: number;
  currency?: string;
  sender_id?: string;
}

interface Action {
  type: "telegram_notify" | "whatsapp_reply";
  template: string; // {{name}}, {{status}}, {{destination}}, {{booking_number}} dəyişənlər
}

function fillTemplate(template: string, data: TriggerData): string {
  return template
    .replace(/\{\{name\}\}/g, data.name || "Müştəri")
    .replace(/\{\{platform\}\}/g, data.platform || "")
    .replace(/\{\{status\}\}/g, data.status || "")
    .replace(/\{\{old_status\}\}/g, data.old_status || "")
    .replace(/\{\{destination\}\}/g, data.destination || "")
    .replace(/\{\{booking_number\}\}/g, data.booking_number || "")
    .replace(/\{\{amount\}\}/g, data.amount ? `${data.amount} ${data.currency || "AZN"}` : "");
}

async function execAction(action: Action, data: TriggerData) {
  const text = fillTemplate(action.template, data);

  if (action.type === "telegram_notify") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  }

  if (action.type === "whatsapp_reply" && data.sender_id && data.platform === "whatsapp") {
    const waToken = process.env.WA_ACCESS_TOKEN!;
    const waPhoneId = process.env.WA_PHONE_NUMBER_ID!;
    await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${waToken}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: data.sender_id,
        type: "text",
        text: { body: text },
      }),
    });
  }
}

export async function runWorkflows(event: TriggerEvent, data: TriggerData) {
  try {
    const admin = getSupabaseAdmin();

    // Aktiv workflow-ları al
    const { data: workflows } = await admin
      .from("workflows")
      .select("*")
      .eq("trigger_event", event)
      .eq("is_active", true);

    if (!workflows || workflows.length === 0) return;

    for (const wf of workflows) {
      let status = "success";
      let error = null;

      try {
        // Condition yoxla
        const cond = wf.trigger_condition || {};
        if (cond.platform && cond.platform !== data.platform) continue;
        if (cond.status && cond.status !== data.status) continue;

        // Actionları icra et
        const actions: Action[] = wf.actions || [];
        for (const action of actions) {
          await execAction(action, data);
        }

        // Run count artır
        await admin.from("workflows").update({ run_count: (wf.run_count || 0) + 1 }).eq("id", wf.id);
      } catch (err) {
        status = "error";
        error = String(err);
      }

      // Log yaz
      await admin.from("workflow_logs").insert([{
        workflow_id: wf.id,
        trigger_data: data,
        status,
        error,
      }]);
    }
  } catch {
    // Workflow xətası əsas işi dayandırmasın
  }
}
