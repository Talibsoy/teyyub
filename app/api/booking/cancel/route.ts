import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/ratehawk-booking";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ error: "order_id lazımdır" }, { status: 400 });
    }

    const result = await cancelBooking(order_id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    // Supabase-də statusu yenilə
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("booking_number", order_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Cancel Booking]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
