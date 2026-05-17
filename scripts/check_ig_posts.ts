
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

async function checkTravelPosts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  console.log("Fetching travel_posts with ig_post_id...");
  const { data, error } = await supabase
    .from("travel_posts")
    .select("created_at, country, ig_post_id")
    .not("ig_post_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Last 5 successful IG posts:", JSON.stringify(data, null, 2));
  }
}

checkTravelPosts();
