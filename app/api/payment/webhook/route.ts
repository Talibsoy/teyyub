import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { verifyEpointWebhook, decodeEpointData } from "@/lib/epoint";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, signature } = body;

    if (!data || !signature) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (!verifyEpointWebhook(data, signature)) {
      console.warn("[Epoint Webhook] İmza yanlışdır");
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payload = decodeEpointData(data);
    const orderId     = payload.order_id as string;
    const status      = payload.status   as string;    // success | error | canceled

    if (!orderId || !status) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const dbStatus = status === "success" ? "paid" : "failed";

    const { data: payment } = await supabase
      .from("payments")
      .select("id, booking_id, user_id, amount")
      .eq("epoint_order_id", orderId)
      .single();

    if (payment) {
      await supabase.from("payments").update({
        status:  dbStatus,
        paid_at: dbStatus === "paid" ? new Date().toISOString() : null,
      }).eq("id", payment.id);

      if (dbStatus === "paid") {
        // Booking statusunu yenilə
        if (payment.booking_id) {
          await supabase.from("bookings")
            .update({ status: "confirmed" })
            .eq("id", payment.booking_id);
        }

        // Panel istifadəçisi varsa — loyalty xal əlavə et + CRM yenilə
        if (payment.user_id) {
          const pointsEarned = Math.floor(payment.amount); // $1 = 1 xal

          // loyalty_transactions-a yaz
          await supabaseAdmin.from("loyalty_transactions").insert({
            user_id:       payment.user_id,
            type:          "earn",
            amount_points: pointsEarned,
            description:   `Ödəniş — $${payment.amount.toFixed(2)}`,
            booking_id:    payment.booking_id || null,
          });

          // CRM customers cədvəlindəki loyalty_points-i yenilə
          const { data: crmCustomer } = await supabaseAdmin
            .from("customers")
            .select("id, loyalty_points")
            .eq("auth_user_id", payment.user_id)
            .maybeSingle();

          if (crmCustomer) {
            await supabaseAdmin.from("customers").update({
              loyalty_points: (crmCustomer.loyalty_points || 0) + pointsEarned,
            }).eq("id", crmCustomer.id);

            // "repeat" tagini əlavə et (ilk ödənişdən sonra)
            const { data: tagData } = await supabaseAdmin
              .from("customers")
              .select("tags")
              .eq("id", crmCustomer.id)
              .single();
            if (tagData && !tagData.tags?.includes("repeat")) {
              await supabaseAdmin.from("customers").update({
                tags: [...(tagData.tags || []), "repeat"],
              }).eq("id", crmCustomer.id);
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Epoint Webhook] Xəta:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
