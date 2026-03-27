import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Payriff webhook → ödəniş statusunu yenilə
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Payriff Webhook]", JSON.stringify(body));

    const orderId = body?.payload?.orderId || body?.orderId;
    const orderStatus = body?.payload?.orderStatus || body?.orderStatus;

    if (!orderId || !orderStatus) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      APPROVED: "paid",
      DECLINED: "failed",
      CANCELED: "failed",
      WAITING: "pending",
    };

    const dbStatus = statusMap[orderStatus] || "pending";

    const { data: payment } = await supabase
      .from("payments")
      .select("id, booking_id")
      .eq("payriff_order_id", orderId)
      .single();

    if (payment) {
      await supabase.from("payments").update({
        status: dbStatus,
        paid_at: dbStatus === "paid" ? new Date().toISOString() : null,
      }).eq("id", payment.id);

      // Rezervasiyanı da yenilə
      if (dbStatus === "paid" && payment.booking_id) {
        await supabase.from("bookings").update({ status: "confirmed" }).eq("id", payment.booking_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Payriff Webhook] Xəta:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
