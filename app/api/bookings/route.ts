import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { tour_id, customer_name, customer_phone, customer_email, persons, notes } = await req.json();

    if (!tour_id || !customer_name || !customer_phone || !persons) {
      return NextResponse.json({ error: "Tələb olunan sahələr doldurulmayıb" }, { status: 400 });
    }

    // Turu yoxla
    const { data: tour } = await supabase
      .from("tours")
      .select("id, name, price_azn, max_seats, booked_seats, is_active")
      .eq("id", tour_id)
      .eq("is_active", true)
      .single();

    if (!tour) {
      return NextResponse.json({ error: "Tur tapılmadı" }, { status: 404 });
    }

    const seatsLeft = tour.max_seats - tour.booked_seats;
    if (seatsLeft < persons) {
      return NextResponse.json({ error: "Kifayət qədər boş yer yoxdur" }, { status: 400 });
    }

    const total_amount = tour.price_azn * persons;

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        tour_id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        persons,
        notes: notes || null,
        status: "pending",
        total_amount,
      })
      .select()
      .single();

    if (error || !booking) {
      console.error("[Bookings] Supabase xəta:", error);
      return NextResponse.json({ error: "Rezervasiya yaradıla bilmədi" }, { status: 500 });
    }

    return NextResponse.json({ booking, total_amount });
  } catch (err) {
    console.error("[Bookings] Xəta:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
