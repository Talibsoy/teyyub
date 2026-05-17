
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function loadEnv(path: string) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, "utf-8");
  content.split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0) {
      const k = key.trim();
      let v = rest.join("=").trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
      process.env[k] = v;
    }
  });
}

loadEnv("c:/Users/lenovo/projects/flynatoure/.env.local");

async function runTravelPostLogic() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log("1. Picking country...");
  const allCountries = ["Tailand", "Bali", "İtaliya", "İspaniya", "Dubay", "Misir", "İsveçrə", "Fransa", "Türkiyə", "Gürcüstan", "Yunanıstan", "Yaponiya", "Maldiv", "Vyetnam", "Portuqaliya"];
  const targetCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
  console.log("Target Country:", targetCountry);

  console.log("2. Generating content with Claude...");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1000,
    messages: [{ role: "user", content: `${targetCountry} haqqında turizm postu yaz. Format: BAŞLIQ: ... MƏZMUN: ...` }]
  });
  
  const text = (msg.content[0] as any).text;
  console.log("Claude Response:", text.substring(0, 50) + "...");

  console.log("3. Fetching Unsplash image...");
  const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${targetCountry}+tourism&per_page=1&orientation=squarish`, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
  });
  const unsplashData = await unsplashRes.json();
  const imageUrl = unsplashData.results?.[0]?.urls?.regular;
  console.log("Image URL:", imageUrl);

  console.log("4. Saving to Supabase...");
  const { data, error } = await db.from("travel_posts").insert({
    country: targetCountry,
    title: "Test Title from Script",
    content: text,
    image_url: imageUrl,
    status: "published"
  }).select();

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Successfully saved! ID:", data[0].id);
  }
}

runTravelPostLogic().catch(console.error);
