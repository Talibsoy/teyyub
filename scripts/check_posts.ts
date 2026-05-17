
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
loadEnv("c:/Users/lenovo/projects/flynatoure/.env.vercel");

async function checkTravelPosts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase credentials missing!");
    console.log("URL:", supabaseUrl);
    console.log("Key exists:", !!supabaseServiceKey);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Fetching latest travel_posts...");
  const { data, error } = await supabase
    .from("travel_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching posts:", error);
  } else {
    console.log("Latest posts count:", data?.length || 0);
    if (data && data.length > 0) {
      data.forEach(p => {
        console.log(`- [${p.created_at}] ${p.country}: ${p.title}`);
        console.log(`  Image URL: ${p.image_url ? "YES" : "NO"}`);
      });
    }
  }
}

checkTravelPosts();
