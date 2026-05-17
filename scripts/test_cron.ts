
import Anthropic from "@anthropic-ai/sdk";
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
      // Handle the strange \n and \r cases I saw
      v = v.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
      process.env[k] = v;
    }
  });
}

loadEnv("c:/Users/lenovo/projects/flynatoure/.env.local");
loadEnv("c:/Users/lenovo/projects/flynatoure/.env.vercel");

async function testTravelPost() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY missing!");
    return;
  }

  console.log("Using API Key (first 10 chars):", apiKey.substring(0, 10));
  console.log("Key length:", apiKey.length);
  console.log("Last 5 chars of key:", JSON.stringify(apiKey.substring(apiKey.length - 5)));

  const client = new Anthropic({ apiKey: apiKey.trim() }); // Trim to be safe

  try {
    console.log("Attempting to generate a travel post for Tailand...");
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Tailand haqqında turizm məlumatı yaz. Format: BAŞLIQ: (cəlbedici) MƏZMUN: (1 abzas)`,
        },
      ],
    });

    console.log("Claude response success!");
    console.log("Content type:", msg.content[0].type);
    if (msg.content[0].type === "text") {
        console.log("Preview:", msg.content[0].text.substring(0, 100));
    }
  } catch (err: any) {
    console.error("Claude error:", err.status, err.message);
    if (err.status === 401) {
        console.error("AUTHENTICATION FAILED: Check your API Key.");
    }
  }

  // Check Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) {
    console.error("UNSPLASH_ACCESS_KEY missing!");
  } else {
    console.log("Unsplash key exists.");
  }
}

testTravelPost();
