import { NextRequest, NextResponse } from "next/server";
import { createPayriffOrder } from "@/lib/payriff";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, description } = await req.json();

    if (!bookingId || !amount) {
      return NextResponse.json({ error: "bookingId və amount tələb olunur" }, { status: 400 });
    }

    const order = await createPayriffOrder({ amount, description: description || "Tur ödənişi", bookingId });

    // Ödənişi DB-də yarat
    await supabase.from("payments").insert({
      booking_id: bookingId,
      amount,
      currency: "AZN",
      status: "pending",
      payment_method: "card",
      payriff_order_id: order.orderId,
      payriff_session_id: order.sessionId,
    });

    return NextResponse.json({ paymentUrl: order.paymentUrl, orderId: order.orderId });
  } catch (err) {
    console.error("[Payriff] Create order xətası:", err);
    return NextResponse.json({ error: "Ödəniş yaradıla bilmədi" }, { status: 500 });
  }
}
