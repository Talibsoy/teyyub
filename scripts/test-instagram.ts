import fs from "fs";
import path from "path";

// Env yükləyici
function loadEnv() {
  const paths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env")
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log(`[Diagnostic] ${p} tapıldı, oxunur...`);
      const content = fs.readFileSync(p, "utf-8");
      content.split("\n").forEach(line => {
        const [key, ...rest] = line.split("=");
        if (key && rest.length > 0) {
          const k = key.trim();
          let v = rest.join("=").trim();
          if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
          process.env[k] = v;
        }
      });
      return;
    }
  }
  console.log("[Diagnostic] Yerli .env.local faylı tapılmadı. Mövcud process.env istifadə olunur.");
}

async function testInstagramIntegration() {
  loadEnv();

  const token = process.env.FB_PAGE_TOKEN;
  const igUserId = process.env.IG_USER_ID || process.env.META_IG_USER_ID;

  console.log("\n=== INSTAGRAM DIQNOSTIKA ===");
  console.log("1. Dəyişənlərin yoxlanılması:");
  console.log(`- FB_PAGE_TOKEN: ${token ? `Mövcuddur (Uzunluq: ${token.length})` : "TAPILMADI ❌"}`);
  console.log(`- IG_USER_ID/META_IG_USER_ID: ${igUserId ? `Mövcuddur (${igUserId})` : "TAPILMADI ❌"}`);

  if (!token) {
    console.error("\nXƏTA: FB_PAGE_TOKEN tapılmadı! Zəhmət olmasa .env.local faylında quraşdırın.");
    return;
  }

  // 1. Tokenin statusunu yoxla
  console.log("\n2. Meta API-yə qoşulma yoxlanılır...");
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${token}`);
    const data = await res.json() as any;

    if (data.error) {
      console.error("❌ Meta API Xətası (Token etibarsız ola bilər):");
      console.error(JSON.stringify(data.error, null, 2));
      
      if (data.error.code === 190) {
        console.error("\n💡 HƏLLİ: Sizin Facebook Access Token-inizin (FB_PAGE_TOKEN) vaxtı bitib (Expired) və ya ləğv edilib. Yeni Page Access Token generasiya etməlisiniz.");
      }
      return;
    }

    console.log(`✅ Qoşulma uğurludur! Səhifə Adı: "${data.name}" (ID: ${data.id})`);
  } catch (err) {
    console.error("❌ Şəbəkə və ya API xətası:", err);
    return;
  }

  // 2. Instagram Səhifə Bağlantısını yoxla
  if (igUserId) {
    console.log(`\n3. Instagram ID (${igUserId}) üçün birbaşa əlaqə yoxlanılır...`);
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${igUserId}?fields=username,name&access_token=${token}`);
      const data = await res.json() as any;

      if (data.error) {
        console.error("❌ Instagram Hesab Xətası:");
        console.error(JSON.stringify(data.error, null, 2));
      } else {
        console.log(`✅ Instagram hesabı tapıldı! İstifadəçi adı: @${data.username} ("${data.name}")`);
      }
    } catch (err) {
      console.error("❌ Instagram API xətası:", err);
    }
  }

  console.log("\n4. Meta-dan avtomatik olaraq bu tokenə bağlı Instagram hesabları axtarılır...");
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/me/accounts?fields=instagram_business_account{id,username,name}&access_token=${token}`);
    const data = await res.json() as any;

    if (data.data && data.data.length > 0) {
      console.log("Bağlı olan Facebook Səhifələri və Instagram Hesabları:");
      data.data.forEach((acc: any) => {
        console.log(`- Səhifə: "${acc.name}" (ID: ${acc.id})`);
        if (acc.instagram_business_account) {
          console.log(`  ✅ Bağlı Instagram Hesabı ID-si: ${acc.instagram_business_account.id} (@${acc.instagram_business_account.username})`);
        } else {
          console.log("  ❌ Bu Facebook səhifəsinə bağlı Instagram Business hesabı tapılmadı.");
        }
      });
    } else {
      console.log("❌ Heç bir Facebook səhifəsi və ya bağlı Instagram hesabı tapılmadı.");
    }
  } catch (err) {
    console.error("❌ Axtarış zamanı xəta:", err);
  }
}

testInstagramIntegration();
