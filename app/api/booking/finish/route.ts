import { NextRequest, NextResponse } from "next/server";
import { bookingFinish, pollBookingStatus } from "@/lib/ratehawk-booking";
import { supabase } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { book_hash, phone, email, comment, guests, payment_type } = body;

    if (!book_hash || !phone || !guests?.length) {
      return NextResponse.json(
        { error: "book_hash, phone, guests lazımdır" },
        { status: 400 }
      );
    }

    // 1. Booking finish — bron yarat
    const finishResult = await bookingFinish({
      book_hash,
      phone,
      email,
      comment,
      guests,
      payment_type: payment_type || "deposit",
    });

    // Finish xətaları: booking_form_expired, rate_not_found → yenidən axtarış lazımdır
    if (!finishResult.ok) {
      const fatal = ["booking_form_expired", "rate_not_found", "return_path_required"];
      const isFatal = fatal.includes(finishResult.error || "");
      return NextResponse.json(
        { error: finishResult.error, retry_search: isFatal },
        { status: isFatal ? 409 : 422 }
      );
    }

    const orderIds = finishResult.order_ids!;

    // 2. Status polling — "processing" bitənə qədər gözlə (max 60s)
    const statusResult = await pollBookingStatus(orderIds);

    // 3. Supabase-ə yaz
    const primaryOrderId = orderIds[0];
    await supabase.from("bookings").insert([{
      booking_number: primaryOrderId,
      status:         statusResult.status === "ok" ? "confirmed" : "failed",
      notes:          JSON.stringify({ order_ids: orderIds, etg_status: statusResult.status }),
      total_price:    body.price || 0,
      currency:       body.currency || "USD",
    }]).select().single();

    // 4. Uğursuzluq halları
    if (!statusResult.ok) {
      const userMessage: Record<string, string> = {
        soldout:    "Otaq artıq satılıb. Zəhmət olmasa başqa tarix seçin.",
        book_limit: "Bu oteldə limit dolub. Başqa otel seçin.",
        timeout:    "Rezervasiya vaxtında tamamlanmadı. Yenidən cəhd edin.",
        unknown:    "Naməlum xəta. Dəstəklə əlaqə saxlayın.",
      };
      return NextResponse.json(
        {
          error:    statusResult.status,
          message:  userMessage[statusResult.status || ""] || "Rezervasiya uğursuz oldu.",
          order_ids: orderIds,
        },
        { status: 422 }
      );
    }

    // 5. Telegram bildirişi
    sendTelegramAlert("Booking", `Yeni rezervasiya: ${primaryOrderId}`, {
      name:        guests[0] ? `${guests[0].first_name} ${guests[0].last_name}` : "",
      phone,
      email:       email || "",
      destination: body.destination || "",
      travel_date: body.checkin || "",
    }).catch(() => {});

    return NextResponse.json({
      ok:       true,
      order_id: primaryOrderId,
      order_ids: orderIds,
      status:   statusResult.status,
    });
  } catch (err) {
    console.error("[Booking Finish]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
