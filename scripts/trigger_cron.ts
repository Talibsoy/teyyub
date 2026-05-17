
async function triggerCron() {
  const url = "https://www.natourefly.com/api/cron/travel-post?secret=natoure2026";
  console.log("Triggering cron at:", url);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Body:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error triggering cron:", err);
  }
}

triggerCron();
