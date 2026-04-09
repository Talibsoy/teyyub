import { NextRequest, NextResponse } from "next/server";
import { createEpointOrder } from "@/lib/epoint";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, description } = await req.json();

    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json({ error: "bookingId və amount tələb olunur" }, { status: 400 });
    }

    // Auth istifadəçini müəyyən et
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
      if (user) userId = user.id;
    }

    const order = await createEpointOrder({ amount, bookingId, description });

    await supabase.from("payments").insert({
      booking_id:       bookingId,
      amount,
      currency:         "AZN",
      status:           "pending",
      payment_method:   "card",
      epoint_order_id:  order.orderId,
      user_id:          userId,
    });

    return NextResponse.json({ paymentUrl: order.paymentUrl, orderId: order.orderId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Epoint] Create order xətası:", msg);
    return NextResponse.json({ error: "Ödəniş yaradıla bilmədi", detail: msg }, { status: 500 });
  }
}
