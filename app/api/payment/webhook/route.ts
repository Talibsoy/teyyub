import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
      .select("id, booking_id")
      .eq("epoint_order_id", orderId)
      .single();

    if (payment) {
      await supabase.from("payments").update({
        status:  dbStatus,
        paid_at: dbStatus === "paid" ? new Date().toISOString() : null,
      }).eq("id", payment.id);

      if (dbStatus === "paid" && payment.booking_id) {
        await supabase.from("bookings")
          .update({ status: "confirmed" })
          .eq("id", payment.booking_id);
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
