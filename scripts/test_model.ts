
import Anthropic from "@anthropic-ai/sdk";
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

async function testModel() {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log("Testing model: claude-sonnet-4-6");
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("Success:", (msg.content[0] as any).text);
  } catch (err: any) {
    console.error("Error:", err.status, err.message);
  }
}

testModel();
