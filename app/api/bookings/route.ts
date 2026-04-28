import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/require-auth";

function generateBookingNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NAT-${y}${m}-${rand}`;
}

export async function POST(req: NextRequest) {
  // Auth məcburidir — qeydiyyatsız istifadəçi booking yarada bilməz
  const authResult = await requireAuth(req);
  if (isAuthError(authResult)) return authResult;
  const authUserId = authResult.userId;

  try {
    const {
      tour_id,
      first_name, last_name, phone, email,
      adults, children, child_ages,
      passengers: passengersInput,
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

    // Optimistic locking — atomic seat reservation
    // booked_seats yalnız oxuduğumuz dəyərdədirsə update edir (race condition qorunması)
    const { data: reserved } = await supabaseAdmin
      .from("tours")
      .update({ booked_seats: tour.booked_seats + totalPersons })
      .eq("id", tour_id)
      .eq("booked_seats", tour.booked_seats) // başqa request eyni anda dəyişibsə bu fail olur
      .select("id")
      .maybeSingle();

    if (!reserved) {
      return NextResponse.json(
        { error: "Yer rezerv edilərkən xəta baş verdi. Yenidən cəhd edin." },
        { status: 409 }
      );
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

    // Sərnişin məlumatları — formadan gəlirsə istifadə et, yoxdursa minimal data
    const passengersData = passengersInput?.length
      ? passengersInput
      : [
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
        auth_user_id: authUserId,
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
      // Seat rezervini geri al — booking yaranmadı
      await supabaseAdmin
        .from("tours")
        .update({ booked_seats: tour.booked_seats })
        .eq("id", tour_id);
      return NextResponse.json({ error: "Rezervasiya yaradıla bilmədi" }, { status: 500 });
    }

    return NextResponse.json({ booking, total_price });
  } catch (err) {
    console.error("[Bookings] Xəta:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
