// googleapis paketi Node 20 + OpenSSL 3 ilə ERR_OSSL_UNSUPPORTED verir.
// Həll: birbaşa Google Sheets REST API + native crypto (JWT RS256).
import { CustomerData } from "@/lib/ai-agent";
import type { HotelOffer } from "@/lib/ratehawk";

const SHEET_ID = process.env.GOOGLE_SHEET_ID?.trim();
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

// ─── JWT ilə Google OAuth2 access token al ────────────────────────────────────
async function getAccessToken(): Promise<string> {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) throw new Error("Google credentials missing");

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;

  // crypto.subtle — newline olmayan PEM key-lərlə də işləyir
  const pemContent = PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const keyBuffer = Buffer.from(pemContent, "base64");
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await globalThis.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    Buffer.from(signingInput)
  );
  const signature = Buffer.from(sigBuffer).toString("base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token)
    throw new Error(`Google OAuth2: ${data.error} — ${data.error_description}`);
  return data.access_token;
}

// ─── Sheets REST köməkçiləri ──────────────────────────────────────────────────
async function sheetsGet(token: string, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Sheets GET ${range}: HTTP ${res.status}`);
  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

async function sheetsUpdate(token: string, range: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Sheets PUT ${range}: HTTP ${res.status}`);
}

async function sheetsAppend(token: string, range: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Sheets APPEND ${range}: HTTP ${res.status}`);
}

// ─── CRM: yeni müştəri əlavə et ──────────────────────────────────────────────
export async function addCustomerToSheet(
  platform: string,
  senderId: string,
  customerData: CustomerData,
  message: string
) {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) return;
  try {
    const token = await getAccessToken();
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
    await sheetsAppend(token, "Leads!A:I", [row]);
  } catch {
    // Sheets xətası webhook-u dayandırmasın
  }
}

// ─── Hotels upsert ────────────────────────────────────────────────────────────
// hotel_key varsa həmin sətri EDIT edir, yoxdursa yeni sətir APPEND edir.
export async function upsertHotelData(
  hotels: HotelOffer[]
): Promise<{ updated: number; added: number }> {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY || !hotels.length)
    return { updated: 0, added: 0 };

  const TAB = "Hotels";
  const RANGE = `${TAB}!A:L`;

  const token = await getAccessToken();
  const rows = await sheetsGet(token, RANGE);

  // hotel_key → sətir nömrəsi (1-indexed, başlıq = 1)
  const keyToRow: Record<string, number> = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i]?.[0];
    if (key) keyToRow[key] = i + 1;
  }

  // Başlıq sətri yoxdursa yarat
  if (rows.length === 0) {
    await sheetsUpdate(token, `${TAB}!A1`, [
      ["hotel_key","hotel_id","hotel_name","destination","checkin","checkout","price_usd","stars","room_type","meal","updated_at","status"],
    ]);
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
      const row = keyToRow[h.hotel_key];
      await sheetsUpdate(token, `${TAB}!A${row}:L${row}`, [rowData]);
      updated++;
    } else {
      await sheetsAppend(token, RANGE, [rowData]);
      added++;
    }
  }

  return { updated, added };
}
