import { NextRequest, NextResponse } from "next/server";
import { createEpointOrder } from "@/lib/epoint";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, description } = await req.json();

    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json({ error: "bookingId və amount tələb olunur" }, { status: 400 });
    }

    const order = await createEpointOrder({ amount, bookingId, description });

    await supabase.from("payments").insert({
      booking_id:       bookingId,
      amount,
      currency:         "AZN",
      status:           "pending",
      payment_method:   "card",
      epoint_order_id:  order.orderId,
    });

    return NextResponse.json({ paymentUrl: order.paymentUrl, orderId: order.orderId });
  } catch (err) {
    console.error("[Epoint] Create order xətası:", err);
    return NextResponse.json({ error: "Ödəniş yaradıla bilmədi" }, { status: 500 });
  }
}
