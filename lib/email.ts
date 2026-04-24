import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = "Natoure.az <info@natourefly.com>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!resend) {
    console.error("Email göndərilmədi: RESEND_API_KEY konfiqurasiya edilməyib");
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) { console.error("Email xətası:", error); return false; }
    return true;
  } catch (err) {
    console.error("Email göndərilmədi:", err);
    return false;
  }
}

// Rezervasiya təsdiq emaili
export function bookingConfirmHtml(data: {
  customerName: string;
  bookingNumber: string;
  tourName: string;
  destination: string;
  startDate?: string;
  totalPrice: number;
  currency: string;
}) {
  return `
<!DOCTYPE html>
<html lang="az">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
        <!-- Header -->
        <tr>
          <td style="background:#3b82f6;padding:32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold">Natoure.az</h1>
            <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px">Rezervasiyanız təsdiqləndi!</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="color:#374151;font-size:16px;margin:0 0 24px">
              Hörmətli <strong>${data.customerName}</strong>,
            </p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6">
              Rezervasiyanız uğurla təsdiqləndi. Aşağıda rezervasiya məlumatlarınızı tapa bilərsiniz.
            </p>

            <!-- Booking details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                  <span style="color:#9ca3af;font-size:12px">Rezervasiya №</span><br>
                  <strong style="color:#3b82f6;font-size:15px;font-family:monospace">${data.bookingNumber}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                  <span style="color:#9ca3af;font-size:12px">Tur</span><br>
                  <strong style="color:#111827;font-size:14px">${data.tourName}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                  <span style="color:#9ca3af;font-size:12px">Destinasiya</span><br>
                  <strong style="color:#111827;font-size:14px">📍 ${data.destination}</strong>
                </td>
              </tr>
              ${data.startDate ? `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">
                  <span style="color:#9ca3af;font-size:12px">Tarix</span><br>
                  <strong style="color:#111827;font-size:14px">📅 ${data.startDate}</strong>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding:8px 0">
                  <span style="color:#9ca3af;font-size:12px">Ümumi məbləğ</span><br>
                  <strong style="color:#059669;font-size:18px">${data.totalPrice} ${data.currency}</strong>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 24px">
              Suallarınız üçün bizimlə əlaqə saxlayın:<br>
              📞 <a href="tel:+994517769632" style="color:#3b82f6">+994 51 776 96 32</a><br>
              💬 WhatsApp ilə də yaza bilərsiniz
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
            <p style="color:#9ca3af;font-size:12px;margin:0">
              © 2026 Natoure.az · Bakı, Azərbaycan
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Ödəniş qəbz emaili
export function paymentReceiptHtml(data: {
  customerName: string;
  bookingNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}) {
  return `
<!DOCTYPE html>
<html lang="az">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
        <tr>
          <td style="background:#059669;padding:32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:24px">✓ Ödəniş Alındı</h1>
            <p style="color:#a7f3d0;margin:8px 0 0;font-size:14px">Natoure.az</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="color:#374151;font-size:16px;margin:0 0 20px">Hörmətli <strong>${data.customerName}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Ödənişiniz uğurla qeydə alınmışdır.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px">
              <tr><td style="padding:6px 0">
                <span style="color:#9ca3af;font-size:12px">Rezervasiya №</span><br>
                <strong style="color:#374151">${data.bookingNumber}</strong>
              </td></tr>
              <tr><td style="padding:6px 0">
                <span style="color:#9ca3af;font-size:12px">Ödənilən məbləğ</span><br>
                <strong style="color:#059669;font-size:20px">${data.amount} ${data.currency}</strong>
              </td></tr>
              <tr><td style="padding:6px 0">
                <span style="color:#9ca3af;font-size:12px">Ödəniş üsulu</span><br>
                <strong style="color:#374151;text-transform:capitalize">${data.paymentMethod}</strong>
              </td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px">Suallarınız üçün: <a href="tel:+994517769632" style="color:#3b82f6">+994 51 776 96 32</a></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
            <p style="color:#9ca3af;font-size:12px;margin:0">© 2026 Natoure.az · Bakı, Azərbaycan</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
