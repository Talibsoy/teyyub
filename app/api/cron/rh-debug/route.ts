import { NextRequest, NextResponse } from "next/server";
import { getDefaultDates } from "@/lib/ratehawk";
import https from "node:https";

function getAuth() {
  return Buffer.from(
    `${process.env.RATEHAWK_API_ID}:${process.env.RATEHAWK_API_KEY}`
  ).toString("base64");
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.HOTELS_CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { checkin, checkout } = getDefaultDates();
  const isSandbox = process.env.RATEHAWK_SANDBOX === "true";

  const body = JSON.stringify({
    checkin, checkout,
    residency: "az", language: "en", currency: "USD",
    guests: [{ adults: 2, children: [] }],
    hids: [10004834], // tek otel
  });

  const raw = await new Promise<string>((resolve, reject) => {
    const req2 = https.request({
      hostname: isSandbox ? "api-sandbox.worldota.net" : "api.worldota.net",
      path: "/api/b2b/v3/search/serp/hotels/",
      method: "POST",
      headers: {
        Authorization: `Basic ${getAuth()}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      rejectUnauthorized: false,
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });
    req2.on("error", reject);
    req2.write(body);
    req2.end();
  });

  const parsed = JSON.parse(raw);
  // Yalnız ilk oteli göstər (böyük datanı azalt)
  const firstHotel = parsed?.data?.hotels?.[0];
  const topKeys = Object.keys(parsed ?? {});
  const dataKeys = parsed?.data ? Object.keys(parsed.data) : [];

  return NextResponse.json({
    topKeys,
    dataKeys,
    hotelsLength: parsed?.data?.hotels?.length ?? parsed?.hotels?.length ?? "?",
    firstHotel: firstHotel ?? parsed?.hotels?.[0],
    keys: firstHotel ? Object.keys(firstHotel) : [],
    raw_preview: raw.slice(0, 500),
  });
}
