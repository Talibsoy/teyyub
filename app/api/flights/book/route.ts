import { NextRequest, NextResponse }       from "next/server";
import { createOrder, OrderPassenger }    from "@/lib/duffel";
import { getSupabaseAdmin }               from "@/lib/supabase";
import { requireAuth, isAuthError }       from "@/lib/require-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  let body: {
    offer_id:        string;
    passengers:      OrderPassenger[];
    tour_booking_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { offer_id, passengers, tour_booking_id } = body;

  // Giriş yoxlaması
  if (!offer_id?.trim()) {
    return NextResponse.json({ error: "offer_id tələb olunur" }, { status: 400 });
  }
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return NextResponse.json({ error: "Ən azı 1 nəfər məlumatı tələb olunur" }, { status: 400 });
  }

  for (const [i, p] of passengers.entries()) {
    if (!p.passenger_id || !p.given_name || !p.family_name || !p.born_on || !p.email) {
      return NextResponse.json(
        { error: `${i + 1}-ci nəfərin məlumatları natamamdır` },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.born_on)) {
      return NextResponse.json(
        { error: `${i + 1}-ci nəfərin doğum tarixi YYYY-MM-DD formatında olmalıdır` },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(p.email)) {
      return NextResponse.json(
        { error: `${i + 1}-ci nəfərin email ünvanı düzgün deyil` },
        { status: 400 }
      );
    }
  }

  const db = getSupabaseAdmin();
  let duffelOrderId: string | null = null;

  try {
    // 1. Duffel-də sifarişi yarat (qiymət server tərəfdən alınır)
    const order = await createOrder({ offer_id, passengers });
    duffelOrderId = order.order_id;

    // 2. Supabase-ə yaz
    const { error: dbError } = await db.from("flight_bookings").insert({
      duffel_order_id:   order.order_id,
      booking_reference: order.booking_ref,
      offer_id,
      auth_user_id:      auth.userId,
      passenger_count:   passengers.length,
      passenger_names:   passengers.map(p => `${p.given_name} ${p.family_name}`),
      contact_email:     passengers[0].email,
      tour_booking_id:   tour_booking_id || null,
      status:            "booked",
    });

    if (dbError) {
      // DB yazılmadı — Duffel sifarişini ləğv etməyə cəhd et
      console.error("[Book] Supabase xətası, Duffel ləğv edilir:", dbError.message);
      try {
        await fetch(`https://api.duffel.com/air/orders/${duffelOrderId}/actions/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
            "Duffel-Version": "v2",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        });
      } catch (cancelErr) {
        // Ləğv uğursuz olsa da log et — manual müdaxilə lazımdır
        console.error(`[Book] KRİTİK: Duffel order ${duffelOrderId} ləğv edilmədi!`, cancelErr);
      }
      return NextResponse.json(
        { error: "Sifariş yaradıldı lakin qeyd edilmədi. Dəstəklə əlaqə saxlayın." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id:          order.order_id,
      booking_reference: order.booking_ref,
      message:           `Bilet təsdiqləndi! Rezervasiya nömrəniz: ${order.booking_ref}`,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Book] Xəta:", msg);
    if (msg === "OFFER_EXPIRED") {
      return NextResponse.json(
        { error: "Bu uçuş artıq mövcud deyil. Zəhmət olmasa yenidən axtarış edin." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Bilet sifarişi zamanı xəta baş verdi" }, { status: 500 });
  }
}
