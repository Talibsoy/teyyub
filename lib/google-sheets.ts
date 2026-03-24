import { google } from "googleapis";
import { CustomerData } from "./ai-agent";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function addCustomerToSheet(
  platform: string,
  senderId: string,
  customerData: CustomerData,
  message: string
) {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Başlıqları yoxla, yoxdursa əlavə et
    const header = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A1:H1",
    });

    if (!header.data.values || header.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "A1:H1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["Tarix", "Platform", "Ad", "Telefon", "Email", "İstiqamət", "Tarix", "Son mesaj"]],
        },
      });
    }

    const now = new Date().toLocaleString("az-AZ", { timeZone: "Asia/Baku" });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "A:H",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          now,
          platform,
          customerData.name || "-",
          customerData.phone || "-",
          customerData.email || "-",
          customerData.destination || "-",
          customerData.travel_date || "-",
          message.substring(0, 200),
        ]],
      },
    });

    return true;
  } catch (error) {
    console.error("Google Sheets xətası:", error);
    return false;
  }
}
