
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

async function findInstagramId() {
  const token = process.env.FB_PAGE_TOKEN;
  if (!token) {
    console.error("FB_PAGE_TOKEN tapılmadı!");
    return;
  }

  console.log("Meta API-dən Instagram ID-si axtarılır...");
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${token}`);
    const data = await res.json();
    
    if (data.instagram_business_account) {
      console.log("BƏXTİMİZ GƏTİRDİ! Tapılan Instagram ID:", data.instagram_business_account.id);
    } else {
      console.log("Təəssüf, bu səhifəyə bağlı Instagram Business Account tapılmadı.");
      console.log("API Cavabı:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("API xətası:", err);
  }
}

findInstagramId();
