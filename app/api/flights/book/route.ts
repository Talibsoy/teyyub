import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/duffel";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const { offer_id, given_name, family_name, born_on, email, phone, tour_booking_id } = await req.json();

    if (!offer_id || !given_name || !family_name || !born_on || !email) {
      return NextResponse.json({ error: "Bütün məlumatlar tələb olunur" }, { status: 400 });
    }

    const order = await createOrder({ offer_id, given_name, family_name, born_on, email, phone });

    // Supabase-ə yaz
    await supabaseAdmin.from("flight_bookings").insert({
      duffel_order_id: order.order_id,
      booking_reference: order.booking_ref,
      offer_id,
      passenger_name: `${given_name} ${family_name}`,
      passenger_email: email,
      tour_booking_id: tour_booking_id || null,
      status: "confirmed",
    }).select().single();

    return NextResponse.json({
      order_id: order.order_id,
      booking_reference: order.booking_ref,
      message: `Bilet təsdiqləndi! Rezervasiya nömrəniz: ${order.booking_ref}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Duffel Book]", msg);
    return NextResponse.json({ error: "Bilet sifariş zamanı xəta baş verdi" }, { status: 500 });
  }
}
