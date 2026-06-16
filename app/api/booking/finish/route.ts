import { NextRequest, NextResponse } from "next/server";
import { bookingFinish, pollBookingStatus } from "@/lib/ratehawk-booking";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { book_hash, phone, email, comment, guests } = body;

    if (!book_hash || !phone || !guests?.length) {
      return NextResponse.json(
        { error: "book_hash, phone, guests lazımdır" },
        { status: 400 }
      );
    }

    const partner_order_id = body.partner_order_id || `natoure_${Date.now()}`;

    // 1. Booking finish — bron yarat.
    //    amount + payment_type prebook-dan gəlir; ETG payment_type.amount prebook-dakı ilə
    //    EYNİ olmalıdır, yoxsa "incorrect_chosen_payment_type" (0.00 ≠ 177.00) xətası verir.
    const etgAmount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount || "0");
    const finishResult = await bookingFinish({
      book_hash,
      phone,
      email,
      comment,
      guests,
      payment_type:  body.payment_type || "deposit",
      amount:        etgAmount,
      currency_code: body.currency || "USD",
      partner_order_id,
    });

    let statusResult;
    let orderIds: string[] = [];

    // If finish failed but error is recoverable (5xx, timeout, unknown), we poll /finish/status/
    if (!finishResult.ok) {
      const recoverable = ["server_error", "timeout", "unknown"];
      const isRecoverable = recoverable.includes(finishResult.error || "");

      if (isRecoverable) {
        statusResult = await pollBookingStatus(undefined, partner_order_id);
        if (statusResult.order_id) {
          orderIds = [statusResult.order_id];
        }
      } else {
        // Fatal errors: booking_form_expired, rate_not_found, return_path_required
        const fatal = ["booking_form_expired", "rate_not_found", "return_path_required"];
        const isFatal = fatal.includes(finishResult.error || "");
        return NextResponse.json(
          { error: finishResult.error, retry_search: isFatal },
          { status: isFatal ? 409 : 422 }
        );
      }
    } else {
      orderIds = finishResult.order_ids || [];
      statusResult = await pollBookingStatus(orderIds.length > 0 ? orderIds : undefined, partner_order_id);
      if (statusResult.order_id) {
        orderIds = [statusResult.order_id];
      }
    }

    // 3. Supabase-ə yaz — service-role client (RLS-i keçir; anon client bookings-ə
    //    insert edə bilmir → əvvəllər otel bronları səssizcə yazılmırdı). Xətanı yoxla.
    const primaryOrderId = orderIds[0] || partner_order_id;
    const { error: insertError } = await getSupabaseAdmin().from("bookings").insert([{
      booking_number: primaryOrderId,
      status:         statusResult.ok ? "confirmed" : "failed",
      notes:          JSON.stringify({
        type:        "hotel",
        order_ids:   orderIds,
        etg_status:  statusResult.status,
        hotel:       body.destination || "",
        checkin:     body.checkin || "",
        guest:       guests[0] ? `${guests[0].first_name} ${guests[0].last_name}` : "",
        phone,
      }),
      total_price:    body.price || 0,
      currency:       body.currency || "USD",
    }]);
    if (insertError) {
      // Booking ETG-də artıq yaranıb — DB yazısı uğursuz olsa belə müştəriyə "ok" qaytarırıq,
      // amma itməsin deyə loglayır və Telegram-a xəbər veririk.
      console.error("[Booking Finish] DB insert failed:", insertError.message);
      sendTelegramAlert("Booking DB xətası", `Order ${primaryOrderId} ETG-də yarandı, amma DB-yə yazılmadı: ${insertError.message}`, {
        name: "", phone, email: email || "", destination: body.destination || "", travel_date: body.checkin || "",
      }).catch(() => {});
    }

    // 4. Uğursuzluq halları
    if (!statusResult.ok) {
      const userMessage: Record<string, string> = {
        soldout:    "Otaq artıq satılıb. Zəhmət olmasa başqa tarix seçin.",
        book_limit: "Bu oteldə limit dolub. Başqa otel seçin.",
        timeout:    "Rezervasiya vaxtında tamamlanmadı. Yenidən cəhd edin.",
        unknown:    "Naməlum xəta. Dəstəklə əlaqə saxlayın.",
        server_error: "Server xətası baş verdi. Dəstəklə əlaqə saxlayın.",
      };
      return NextResponse.json(
        {
          error:    statusResult.status || statusResult.error || "failed",
          message:  userMessage[statusResult.status || ""] || userMessage[statusResult.error || ""] || "Rezervasiya uğursuz oldu.",
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
    }).catch((e) => console.warn("[Telegram]", e?.message ?? e));

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
