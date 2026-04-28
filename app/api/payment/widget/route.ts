import { NextRequest, NextResponse } from "next/server";
import { createEpointWidget } from "@/lib/epoint";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, description } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId tələb olunur" }, { status: 400 });
    }

    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
      if (user) userId = user.id;
    }

    // Məbləği client-dən deyil, DB-dən al — client manipulation-dan qorunma
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("total_price")
      .eq("id", bookingId)
      .single();

    if (!booking || !booking.total_price || booking.total_price <= 0) {
      return NextResponse.json({ error: "Rezervasiya tapılmadı" }, { status: 404 });
    }
    const amount = booking.total_price;

    const widget = await createEpointWidget({ amount, bookingId, description });

    await supabase.from("payments").insert({
      booking_id:       bookingId,
      amount,
      currency:         "AZN",
      status:           "pending",
      payment_method:   "wallet",
      epoint_order_id:  widget.orderId,
      user_id:          userId,
    });

    return NextResponse.json({ widgetUrl: widget.paymentUrl, orderId: widget.orderId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Epoint Widget] Xəta:", msg);
    return NextResponse.json({ error: "Widget URL alına bilmədi" }, { status: 500 });
  }
}
