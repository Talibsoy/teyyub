#!/usr/bin/env node
/**
 * Natoure System Health Check — fetch only, no npm deps
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const SITE_URL     = "https://www.natourefly.com";

const ok  = (s) => `✅ ${s}`;
const err = (s) => `❌ ${s}`;
const warn= (s) => `⚠️  ${s}`;

async function checkSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return err("Supabase env var yoxdur");
  try {
    const tables = ["tours", "bookings", "customers", "payments"];
    const counts = await Promise.all(
      tables.map(async (t) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=count`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "count=exact",
            "Range-Unit": "items",
            Range: "0-0",
          },
          signal: AbortSignal.timeout(6000),
        });
        const range = res.headers.get("content-range") || "?";
        const total = range.split("/")[1] || "?";
        return `${t}:${total}`;
      })
    );
    return ok(`Supabase — ${counts.join(" | ")}`);
  } catch (e) {
    return err(`Supabase xəta: ${e.message}`);
  }
}

async function checkRedis() {
  if (!REDIS_URL || !REDIS_TOKEN) return warn("Redis env var yoxdur");
  try {
    const res = await fetch(`${REDIS_URL}/ping`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      signal: AbortSignal.timeout(4000),
    });
    const json = await res.json();
    return json.result === "PONG" ? ok("Redis — bağlantı quruldu") : err("Redis cavab vermədi");
  } catch (e) {
    return err(`Redis xəta: ${e.message}`);
  }
}

async function checkHealth() {
  try {
    const res = await fetch(`${SITE_URL}/api/health`, { signal: AbortSignal.timeout(8000) });
    return res.ok ? ok(`Health endpoint — ${res.status} OK`) : err(`Health endpoint — ${res.status}`);
  } catch (e) {
    return err(`Health endpoint: ${e.message}`);
  }
}

async function checkHotelApi() {
  try {
    const res = await fetch(`${SITE_URL}/api/hotels/search?dest=Antalya`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    if (json.step === "OK") return ok("Hotel API (RapidAPI) — işləyir");
    if (json.error?.includes("429") || json.step === "DEST_ERROR") return warn("Hotel API — RapidAPI limit (plan yüksəlt)");
    if (json.step === "KEY_MISSING") return err("Hotel API — RAPIDAPI_KEY yoxdur");
    return warn(`Hotel API — ${json.step || "naməlum vəziyyət"}`);
  } catch (e) {
    return err(`Hotel API: ${e.message}`);
  }
}

async function checkGitStatus() {
  try {
    const { execSync } = await import("child_process");
    const path = "C:/Users/lenovo/projects/flynatoure";
    const branch = execSync(`git -C "${path}" rev-parse --abbrev-ref HEAD`, { encoding: "utf8" }).trim();
    const commit = execSync(`git -C "${path}" log -1 --format="%h %s"`, { encoding: "utf8" }).trim();
    const dirty  = execSync(`git -C "${path}" status --short`, { encoding: "utf8" }).trim();
    const status = dirty ? `${dirty.split("\n").length} dəyişiklik var` : "təmiz";
    return ok(`Git [${branch}] — ${commit} | ${status}`);
  } catch {
    return warn("Git status alınmadı");
  }
}

async function main() {
  const now = new Date().toLocaleString("az-AZ", { timeZone: "Asia/Baku" });
  const lines = [
    ``,
    `═══════════════════════════════════════`,
    `  🔍 Natoure Sistem — ${now}`,
    `═══════════════════════════════════════`,
  ];

  const results = await Promise.all([
    checkSupabase(),
    checkRedis(),
    checkHealth(),
    checkHotelApi(),
    checkGitStatus(),
  ]);

  results.forEach((r) => lines.push(" " + r));
  lines.push(`═══════════════════════════════════════`);
  lines.push(``);
  console.log(lines.join("\n"));
}

main().catch((e) => console.error("Check xəta:", e.message));
