import { NextRequest, NextResponse } from "next/server";
import { createEpointWidget } from "@/lib/epoint";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, description } = await req.json();

    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json({ error: "bookingId və amount tələb olunur" }, { status: 400 });
    }

    const widget = await createEpointWidget({ amount, bookingId, description });

    await supabase.from("payments").insert({
      booking_id:       bookingId,
      amount,
      currency:         "AZN",
      status:           "pending",
      payment_method:   "wallet",
      epoint_order_id:  widget.orderId,
    });

    return NextResponse.json({ widgetUrl: widget.paymentUrl, orderId: widget.orderId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Epoint Widget] Xəta:", msg);
    return NextResponse.json({ error: "Widget URL alına bilmədi", detail: msg }, { status: 500 });
  }
}
