import { getSupabase } from "./supabase";

export async function logActivity(
  entityType: string,
  entityId: string,
  action: string,
  oldValue?: object,
  newValue?: object
) {
  try {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    await sb.from("activity_logs").insert([{
      user_id: session.user.id,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: oldValue || null,
      new_value: newValue || null,
    }]);
  } catch {
    // Log xətası əsas işi dayandırmasın
  }
}
