import { CustomerData } from "@/lib/ai-agent";
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, "\n");

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
