import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail, bookingConfirmHtml, paymentReceiptHtml } from "@/lib/email";
import { requireAuth, isAuthError } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const { type, bookingId } = await req.json();
    if (!type || !bookingId) return NextResponse.json({ error: "Məlumatlar tam deyil" }, { status: 400 });

    const admin = getSupabaseAdmin();

    const { data: booking } = await admin
      .from("bookings")
      .select("*, customers(first_name, last_name, email), tours(name, destination, start_date)")
      .eq("id", bookingId)
      .single();

    if (!booking) return NextResponse.json({ error: "Rezervasiya tapılmadı" }, { status: 404 });

    const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
    const tour = Array.isArray(booking.tours) ? booking.tours[0] : booking.tours;

    if (!customer?.email) return NextResponse.json({ error: "Müştərinin emaili yoxdur" }, { status: 400 });

    const customerName = `${customer.first_name} ${customer.last_name || ""}`.trim();

    let subject = "";
    let html = "";

    if (type === "booking_confirm") {
      subject = `Rezervasiyanız təsdiqləndi — ${booking.booking_number}`;
      html = bookingConfirmHtml({
        customerName,
        bookingNumber: booking.booking_number,
        tourName: tour?.name || "Tur",
        destination: tour?.destination || "",
        startDate: tour?.start_date ? new Date(tour.start_date).toLocaleDateString("az-AZ") : undefined,
        totalPrice: booking.total_price,
        currency: booking.currency,
      });
    } else if (type === "payment_receipt") {
      const { data: payment } = await admin
        .from("payments")
        .select("amount, currency, payment_method")
        .eq("booking_id", bookingId)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      subject = `Ödəniş qəbzi — ${booking.booking_number}`;
      html = paymentReceiptHtml({
        customerName,
        bookingNumber: booking.booking_number,
        amount: payment?.amount || booking.total_price,
        currency: payment?.currency || booking.currency,
        paymentMethod: payment?.payment_method || "—",
      });
    } else {
      return NextResponse.json({ error: "Naməlum email tipi" }, { status: 400 });
    }

    const ok = await sendEmail({ to: customer.email, subject, html });
    if (!ok) return NextResponse.json({ error: "Email göndərilmədi" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
