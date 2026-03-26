import { CustomerData } from "./ai-agent";
import { getSupabaseAdmin } from "./supabase";
import { runWorkflows } from "./workflow-engine";

export async function saveLead(
  platform: string,
  senderId: string,
  customerData: CustomerData,
  message: string
) {
  try {
    const admin = getSupabaseAdmin();

    // Eyni sender_id varsa yenilə, yoxdursa yeni lead yarat
    const { data: existing } = await admin
      .from("leads")
      .select("id, name, phone, email, destination")
      .eq("sender_id", senderId)
      .eq("platform", platform.toLowerCase())
      .single();

    if (existing) {
      // Mövcud lead yenilənir — workflow işlətmə
      // Yeni məlumat gəlibsə yenilə
      const updates: Record<string, string> = {};
      if (customerData.name && !existing.name) updates.name = customerData.name;
      if (customerData.phone && !existing.phone) updates.phone = customerData.phone;
      if (customerData.email && !existing.email) updates.email = customerData.email;
      if (customerData.destination && !existing.destination) updates.destination = customerData.destination;
      updates.message = message.substring(0, 500);

      if (Object.keys(updates).length > 0) {
        await admin.from("leads").update(updates).eq("id", existing.id);
      }
    } else {
      // Yeni lead
      await admin.from("leads").insert([{
        platform: platform.toLowerCase(),
        sender_id: senderId,
        name: customerData.name || null,
        phone: customerData.phone || null,
        email: customerData.email || null,
        destination: customerData.destination || null,
        message: message.substring(0, 500),
        status: "new",
      }]);

      // Workflow trigger
      await runWorkflows("lead.created", {
        platform: platform.toLowerCase(),
        sender_id: senderId,
        name: customerData.name || undefined,
        phone: customerData.phone || undefined,
        destination: customerData.destination || undefined,
      });
    }
  } catch (error) {
    console.error("CRM lead save xətası:", error);
  }
}
