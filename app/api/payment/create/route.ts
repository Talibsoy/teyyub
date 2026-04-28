import { NextRequest, NextResponse } from "next/server";
import { createEpointOrder } from "@/lib/epoint";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, description } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId tələb olunur" }, { status: 400 });
    }

    // Auth istifadəçini müəyyən et
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
      if (user) userId = user.id;
    }

    // Amount-u DB-dən al — client-dən gələn dəyərə etibar etmə
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("total_price, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Rezervasiya tapılmadı" }, { status: 404 });
    }

    const amount: number = booking.total_price;
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Rezervasiya məbləği yanlışdır" }, { status: 400 });
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
    return NextResponse.json({ error: "Ödəniş yaradıla bilmədi" }, { status: 500 });
  }
}
