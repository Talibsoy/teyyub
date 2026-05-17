
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Simple env loader
function loadEnv(path: string) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, "utf-8");
  content.split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0) {
      const k = key.trim();
      let v = rest.join("=").trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.substring(1, v.length - 1);
      }
      process.env[k] = v.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    }
  });
}

loadEnv("c:/Users/lenovo/projects/flynatoure/.env.local");

async function findIgId() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  console.log("Checking tables for Instagram ID...");
  
  // Try activity_log or similar
  const { data: logs, error: logErr } = await supabase
    .from("activity_log")
    .select("details")
    .ilike("details", "%IG%")
    .limit(10);

  if (logs && logs.length > 0) {
    console.log("Activity logs found:", JSON.stringify(logs, null, 2));
  } else {
    console.log("No IG related logs found.");
  }
}

findIgId();
