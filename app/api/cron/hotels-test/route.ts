import { NextRequest, NextResponse } from "next/server";
import https from "https";

// Minimal RateHawk bağlantı testi
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.HOTELS_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RATEHAWK_API_KEY;
  const apiSecret = process.env.RATEHAWK_SECRET;
  const isSandbox = process.env.RATEHAWK_SANDBOX === "true";

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "RATEHAWK credentials missing", apiKey: !!apiKey, apiSecret: !!apiSecret });
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const body = JSON.stringify({
    checkin: "2026-05-08",
    checkout: "2026-05-15",
    residency: "az",
    language: "en",
    currency: "USD",
    guests: [{ adults: 2, children: [] }],
    hids: [10004834],
  });

  try {
    const result = await new Promise<unknown>((resolve, reject) => {
      const req2 = https.request(
        {
          hostname: isSandbox ? "api-sandbox.worldota.net" : "api.worldota.net",
          path: "/api/b2b/v3/search/serp/hotels/",
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
          rejectUnauthorized: false, // sandbox üçün
        },
        (res) => {
          let data = "";
          res.on("data", (c: string) => (data += c));
          res.on("end", () => resolve({ status: res.statusCode, body: data.slice(0, 500) }));
        }
      );
      req2.on("error", (e) => reject(e));
      req2.write(body);
      req2.end();
    });

    return NextResponse.json({ ok: true, isSandbox, result });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    return NextResponse.json({
      ok: false,
      error: e.message,
      code: e.code,
      name: e.name,
      stack: e.stack?.slice(0, 400),
    });
  }
}
