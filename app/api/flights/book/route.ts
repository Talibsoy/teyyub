import { NextRequest, NextResponse }                    from "next/server";
import { createOrder, OrderPassenger }                   from "@/lib/duffel";
import { getSupabaseAdmin }                              from "@/lib/supabase";
import { requireAuth, isAuthError }                      from "@/lib/require-auth";

const IATA_RE = /^[A-Z]{3}$/;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  let body: {
    offer_id:       string;
    price_raw:      number;
    price_currency: string;
    passengers:     OrderPassenger[];
    tour_booking_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { offer_id, price_raw, price_currency, passengers, tour_booking_id } = body;

  // Giriş yoxlaması
  if (!offer_id?.trim()) {
    return NextResponse.json({ error: "offer_id tələb olunur" }, { status: 400 });
  }
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return NextResponse.json({ error: "Ən azı 1 nəfər məlumatı tələb olunur" }, { status: 400 });
  }
  if (!price_raw || price_raw <= 0) {
    return NextResponse.json({ error: "Düzgün qiymət məlumatı tələb olunur" }, { status: 400 });
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
  }

  const db = getSupabaseAdmin();
  let duffelOrderId: string | null = null;

  try {
    // 1. Duffel-də sifarişi yarat
    const order = await createOrder({ offer_id, passengers, price_raw, price_currency });
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
      price_raw,
      price_currency,
      tour_booking_id:   tour_booking_id || null,
      status:            "confirmed",
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
    // duffelOrderId var amma DB yazılmayıbsa yuxarıda idarə edildi
    return NextResponse.json({ error: "Bilet sifarişi zamanı xəta baş verdi" }, { status: 500 });
  }
}
