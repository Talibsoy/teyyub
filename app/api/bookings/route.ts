import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminAdmin } from "@/lib/supabaseAdmin";

function generateBookingNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NAT-${y}${m}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      tour_id,
      first_name, last_name, phone, email,
      adults, children, child_ages,
      notes,
    } = await req.json();

    if (!tour_id || !first_name || !phone || !adults) {
      return NextResponse.json({ error: "Tələb olunan sahələr doldurulmayıb" }, { status: 400 });
    }

    // Turu yoxla
    const { data: tour } = await supabaseAdmin
      .from("tours")
      .select("id, name, price_azn, max_seats, booked_seats, is_active")
      .eq("id", tour_id)
      .eq("is_active", true)
      .single();

    if (!tour) {
      return NextResponse.json({ error: "Tur tapılmadı" }, { status: 404 });
    }

    const totalPersons = adults + (children || 0);
    const seatsLeft = tour.max_seats - tour.booked_seats;
    if (seatsLeft < totalPersons) {
      return NextResponse.json({ error: "Kifayət qədər boş yer yoxdur" }, { status: 400 });
    }

    // Uşaq qiyməti: 50% endirim (2-11 yaş), körpə (0-1) pulsuz
    const childPrice = Math.round(tour.price_azn * 0.5);
    const adultTotal = tour.price_azn * adults;
    const childTotal = childPrice * (children || 0);
    const total_price = adultTotal + childTotal;

    // Müştəri yarat (və ya tap)
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabaseAdmin
        .from("customers")
        .insert({
          first_name,
          last_name: last_name || null,
          phone,
          email: email || null,
          source: "website",
        })
        .select("id")
        .single();
      customerId = newCustomer?.id || null;
    }

    // Sərnişin məlumatları
    const passengersData = [
      ...Array.from({ length: adults }, (_, i) => ({ type: "adult", index: i + 1 })),
      ...Array.from({ length: children || 0 }, (_, i) => ({
        type: "child", index: i + 1, age: (child_ages || [])[i] ?? null,
      })),
    ];

    // Rezervasiya yarat
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        tour_id,
        customer_id: customerId,
        total_price,
        currency: "AZN",
        status: "new",
        booking_number: generateBookingNumber(),
        notes: notes || null,
        passengers: passengersData,
      })
      .select()
      .single();

    if (error || !booking) {
      console.error("[Bookings] Supabase xəta:", error);
      return NextResponse.json({ error: "Rezervasiya yaradıla bilmədi" }, { status: 500 });
    }

    return NextResponse.json({ booking, total_price });
  } catch (err) {
    console.error("[Bookings] Xəta:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
