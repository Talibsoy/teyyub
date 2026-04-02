import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateInvoicePDF } from "@/lib/invoice";
import { requireAuth, isAuthError } from "@/lib/require-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const bookingId = req.nextUrl.searchParams.get("id");
  if (!bookingId) return NextResponse.json({ error: "id lazımdır" }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: booking, error } = await admin
    .from("bookings")
    .select(`
      booking_number, created_at, status, total_price, currency, notes,
      customers (first_name, last_name, phone, email),
      tours (name, destination, start_date, end_date, hotel)
    `)
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Rezervasiya tapılmadı" }, { status: 404 });
  }

  // Ödəniş statusunu yoxla
  const { data: payment } = await admin
    .from("payments")
    .select("status")
    .eq("booking_id", bookingId)
    .eq("status", "paid")
    .single();

  const invoiceData = {
    booking_number: booking.booking_number,
    created_at: booking.created_at,
    status: booking.status,
    total_price: booking.total_price,
    currency: booking.currency,
    notes: booking.notes,
    customer: Array.isArray(booking.customers) ? booking.customers[0] : booking.customers,
    tour: Array.isArray(booking.tours) ? booking.tours[0] : booking.tours,
    payment_status: payment ? "paid" : "pending",
  };

  const pdfBuffer = await generateInvoicePDF(invoiceData);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${booking.booking_number}.pdf"`,
    },
  });
}
