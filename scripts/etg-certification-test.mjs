#!/usr/bin/env node
/**
 * ETG Certification Test Scenarios
 * Sandbox-da 4 məcburi test ssenarisi yaradır və order ID-lərini çıxarır.
 *
 * İstifadə: node scripts/etg-certification-test.mjs
 */

import { readFileSync } from "fs";

// .env.local + .env.vercel-dən env yüklə
const loadEnv = (path) => {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v.replace(/\\n/g, "");
    }
  } catch {}
};
loadEnv("C:/Users/lenovo/projects/flynatoure/.env.local");
loadEnv("C:/Users/lenovo/projects/flynatoure/.env.vercel");

const BASE = "https://api-sandbox.worldota.net/api/b2b/v3";
const AUTH = Buffer.from(`${process.env.RATEHAWK_API_KEY}:${process.env.RATEHAWK_SECRET}`).toString("base64");

async function etgPost(endpoint, body) {
  const r = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${AUTH}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  return r.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pollStatus(orderIds, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const r = await etgPost("/hotel/order/booking/finish/status/", { order_ids: orderIds });
    const status = r.data?.orders?.[0]?.status;
    console.log(`   poll ${i+1}: ${status}`);
    if (status !== "processing") return { status, order_id: r.data?.orders?.[0]?.order_id };
    if (i < maxAttempts - 1) await sleep(5000);
  }
  return { status: "timeout" };
}

// Hotel üçün HP-dən book_hash al (SERP → HP → prebook)
async function getBookHashForHotel(hid, residency = "az", children = []) {
  const today = new Date();
  today.setDate(today.getDate() + 30);
  const checkin  = today.toISOString().split("T")[0];
  const checkout = new Date(today.getTime() + 2 * 86400000).toISOString().split("T")[0];

  // 1. SERP ilə hotel tap
  const serp = await etgPost("/search/serp/hotels/", {
    checkin, checkout, residency, language: "en", currency: "USD",
    guests: [{ adults: 2, children }],
    hids: [hid],
  });
  if (serp.status !== "ok") { console.error("SERP xəta:", serp.error); return null; }

  const hotel = serp.data?.hotels?.[0];
  if (!hotel) { console.error("Hotel tapılmadı"); return null; }
  console.log(`   SERP: ${hotel.id} | rates: ${hotel.rates?.length}`);

  // 2. HP (hotel page) ilə book_hash al
  const hp = await etgPost("/search/hp/", {
    id: hotel.id,
    checkin, checkout, residency, language: "en", currency: "USD",
    guests: [{ adults: 2, children }],
  });
  if (hp.status !== "ok") { console.error("HP xəta:", hp.error); return null; }

  const hpRate = hp.data?.hotels?.[0]?.rates?.[0];
  const bookHash = hpRate?.book_hash;
  if (!bookHash) { console.error("book_hash yoxdur. HP rate keys:", JSON.stringify(Object.keys(hpRate||{}))); return null; }

  console.log(`   book_hash: ${bookHash.slice(0, 35)}...`);

  // 3. Prebook — cavab: data.hotels[0].rates[0].book_hash (p- prefiksi)
  const pb = await etgPost("/hotel/prebook/", { hash: bookHash, language: "en" });
  if (pb.status !== "ok") { console.error("Prebook xəta:", pb.error); return null; }
  const pbRate = pb.data?.hotels?.[0]?.rates?.[0];
  const pbHash = pbRate?.book_hash;
  if (!pbHash) { console.error("p-hash tapılmadı"); return null; }
  // Payment məlumatını da al — finish-də currency_code lazımdır
  const payType = pbRate?.payment_options?.payment_types?.[0];
  console.log(`   prebook_hash (p-): ${pbHash.slice(0, 40)}...`);
  console.log(`   payment: ${payType?.type} ${payType?.amount} ${payType?.currency_code}`);
  return { pbHash, payType };
}

async function getBookHash() {
  console.log("\n1️⃣  Hotel 10004834 (Conrad Los Angeles, Monaco, 2 böyük + 0+17 uşaq)...");
  return getBookHashForHotel(10004834, "mc", [0, 17]);
}

const GUESTS = [
  { first_name: "Anna", last_name: "Smith", citizenship: "MC" },
  { first_name: "John", last_name: "Smith", citizenship: "MC" },
];
const GUESTS_AZ = [
  { first_name: "Anna", last_name: "Smith", citizenship: "AZ" },
];

const USER = { email: "test@natourefly.com", phone: "+99451776963" };

const results = {};

// ─── SSENARI 1: Uğurlu booking ───────────────────────────────────────────────
async function scenario1() {
  console.log("\n═══ SSENARI 1: Uğurlu booking (hotel 10004834, Monaco) ═══");
  const result = await getBookHash();
  if (!result) return;
  const { pbHash: bookHash, payType } = result;

  const finish = await etgPost("/hotel/order/booking/finish/", {
    book_hash: bookHash,
    language: "en",
    user: { ...USER },
    guests: GUESTS,
    rooms: [{ guests: GUESTS }],
    payment_type: { type: payType?.type || "deposit", amount: payType?.amount, currency_code: payType?.currency_code || "USD" },
    partner: { partner_order_id: `natoure_${Date.now()}_success` },
  });

  console.log("   finish status:", finish.status, finish.error || "");
  const orderIds = finish.data?.order_ids;
  if (!orderIds?.length) { console.error("   Order ID yoxdur"); return; }

  const status = await pollStatus(orderIds);
  console.log(`   ✅ Final status: ${status.status} | Order ID: ${orderIds[0]}`);
  results.scenario1 = { order_id: orderIds[0], status: status.status };
}

// ─── SSENARI 2: unknown → success (istənilən otel) ───────────────────────────
async function scenario2() {
  console.log("\n═══ SSENARI 2: unknown xəta (istənilən otel) ═══");
  const result = await getBookHashForHotel(10047711, "az", []);
  if (!result) { console.error("Prebook xəta"); return; }
  const { pbHash, payType } = result;

  const finish = await etgPost("/hotel/order/booking/finish/", {
    book_hash: pbHash,
    language: "en",
    user: { ...USER },
    guests: GUESTS_AZ,
    rooms: [{ guests: GUESTS_AZ }],
    payment_type: { type: payType?.type || "deposit", amount: payType?.amount, currency_code: payType?.currency_code || "USD" },
    partner: { partner_order_id: `natoure_${Date.now()}_unknown` },
  });

  console.log("   finish status:", finish.status, finish.error || "");
  const orderIds = finish.data?.order_ids;
  if (!orderIds?.length) { console.error("   Order ID yoxdur"); return; }

  const status = await pollStatus(orderIds);
  console.log(`   ✅ Final status: ${status.status} | Order ID: ${orderIds[0]}`);
  results.scenario2 = { order_id: orderIds[0], status: status.status };
}

// ─── SSENARI 3: timeout → soldout ────────────────────────────────────────────
async function scenario3() {
  console.log("\n═══ SSENARI 3: timeout → soldout ═══");
  const result = await getBookHashForHotel(10047711, "az", []);
  if (!result) { console.error("Prebook xəta"); return; }
  const { pbHash, payType } = result;

  const finish = await etgPost("/hotel/order/booking/finish/", {
    book_hash: pbHash,
    language: "en",
    user: { ...USER },
    guests: GUESTS_AZ,
    rooms: [{ guests: GUESTS_AZ }],
    payment_type: { type: payType?.type || "deposit", amount: payType?.amount, currency_code: payType?.currency_code || "USD" },
    partner: { partner_order_id: `natoure_${Date.now()}_unknown_soldout` },
  });

  console.log("   finish status:", finish.status, finish.error || "");
  const orderIds = finish.data?.order_ids;
  if (!orderIds?.length) { console.error("   Order ID yoxdur"); return; }

  const status = await pollStatus(orderIds);
  console.log(`   ✅ Final status: ${status.status} | Order ID: ${orderIds[0]}`);
  results.scenario3 = { order_id: orderIds[0], status: status.status };
}

// ─── SSENARI 4: unknown → book_limit ─────────────────────────────────────────
async function scenario4() {
  console.log("\n═══ SSENARI 4: unknown → book_limit ═══");
  const result = await getBookHashForHotel(10047711, "az", []);
  if (!result) { console.error("Prebook xəta"); return; }
  const { pbHash, payType } = result;

  const finish = await etgPost("/hotel/order/booking/finish/", {
    book_hash: pbHash,
    language: "en",
    user: { ...USER },
    guests: GUESTS_AZ,
    rooms: [{ guests: GUESTS_AZ }],
    payment_type: { type: payType?.type || "deposit", amount: payType?.amount, currency_code: payType?.currency_code || "USD" },
    partner: { partner_order_id: `natoure_${Date.now()}_unknown_book_limit` },
  });

  console.log("   finish status:", finish.status, finish.error || "");
  const orderIds = finish.data?.order_ids;
  if (!orderIds?.length) { console.error("   Order ID yoxdur"); return; }

  const status = await pollStatus(orderIds);
  console.log(`   ✅ Final status: ${status.status} | Order ID: ${orderIds[0]}`);
  results.scenario4 = { order_id: orderIds[0], status: status.status };
}

// ─── ANA AXIN ─────────────────────────────────────────────────────────────────
console.log("🚀 ETG Certification Tests başlayır...");
console.log(`   Sandbox: ${BASE}`);
console.log(`   API Key: ${process.env.RATEHAWK_API_KEY || "YOX!"}`);

await scenario1();
await scenario2();
await scenario3();
await scenario4();

console.log("\n\n═══════════════════════════════════════");
console.log("  📋 ETG CERTİFİKASİYA TEST NƏTİCƏLƏRİ");
console.log("═══════════════════════════════════════");
console.log("Ssenari 1 (Uğurlu):          ", results.scenario1 || "UĞURSUZ");
console.log("Ssenari 2 (unknown→ok):       ", results.scenario2 || "UĞURSUZ");
console.log("Ssenari 3 (timeout→soldout):  ", results.scenario3 || "UĞURSUZ");
console.log("Ssenari 4 (unknown→book_limit):", results.scenario4 || "UĞURSUZ");
console.log("═══════════════════════════════════════");
