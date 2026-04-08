import { CustomerData } from "@/lib/ai-agent";
import { google } from "googleapis";
import type { HotelOffer } from "@/lib/ratehawk";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

async function getSheet() {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function addCustomerToSheet(
  platform: string,
  senderId: string,
  customerData: CustomerData,
  message: string
) {
  try {
    const sheets = await getSheet();
    if (!sheets) return;

    const row = [
      new Date().toLocaleString("az-AZ", { timeZone: "Asia/Baku" }),
      platform,
      customerData.name || "",
      customerData.phone || "",
      customerData.email || "",
      customerData.destination || "",
      customerData.travel_date || "",
      message.slice(0, 500),
      senderId,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID!,
      range: "Leads!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  } catch {
    // Sheets xətası webhook-u dayandırmasın
  }
}

// ─── Hotels upsert ───────────────────────────────────────────────────────────
// Eyni hotel_key varsa həmin sətri EDIT edir, yoxdursa yeni sətir APPEND edir.
// Google Sheets "Hotels" tab strukturu: A=hotel_key B=hotel_id C=hotel_name
// D=destination E=checkin F=checkout G=price_usd H=stars I=room_type J=meal K=updated_at L=status

export async function upsertHotelData(hotels: HotelOffer[]): Promise<{ updated: number; added: number }> {
  const sheets = await getSheet();
  if (!sheets || !hotels.length) return { updated: 0, added: 0 };

  const TAB = "Hotels";
  const RANGE = `${TAB}!A:L`;

  // Mövcud bütün sətirləri oxu
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: RANGE,
  });

  const rows: string[][] = (existing.data.values as string[][] | null) || [];

  // hotel_key → sətir nömrəsi (1-indexed, başlıq sətri = 1)
  const keyToRow: Record<string, number> = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i]?.[0];
    if (key) keyToRow[key] = i + 1; // Sheets sətirləri 1-indexed
  }

  // Başlıq sətri yoxdursa yarat
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["hotel_key","hotel_id","hotel_name","destination","checkin","checkout","price_usd","stars","room_type","meal","updated_at","status"]],
      },
    });
  }

  let updated = 0;
  let added = 0;

  for (const h of hotels) {
    const rowData = [
      h.hotel_key,
      h.hotel_id,
      h.hotel_name,
      h.destination,
      h.checkin,
      h.checkout,
      String(h.price_usd),
      String(h.stars),
      h.room_type,
      h.meal,
      h.updated_at,
      "active",
    ];

    if (keyToRow[h.hotel_key]) {
      // Mövcud sətri yenilə (G=price_usd, I=room_type, J=meal, K=updated_at)
      const row = keyToRow[h.hotel_key];
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID!,
        range: `${TAB}!A${row}:L${row}`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
      updated++;
    } else {
      // Yeni sətir əlavə et
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID!,
        range: RANGE,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
      added++;
    }
  }

  return { updated, added };
}
