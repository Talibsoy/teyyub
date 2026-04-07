// nurlansfrov@gmail.com hesabını admin et
const SUPABASE_URL     = "https://uixkociwxnjajxrsuaqa.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeGtvY2l3eG5qYWp4cnN1YXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUxMDA2OCwiZXhwIjoyMDkwMDg2MDY4fQ.F70GChHGETzhCerT50_2pPOt_mlOZ4cAFcyBYmNyJdM";

const USER_ID = "40c26f5f-4d75-4a93-9938-f757bcff1edd"; // nurlansfrov@gmail.com

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
  method: "PUT",
  headers: {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    app_metadata: { role: "admin" },
  }),
});

const data = await res.json();
if (res.ok) {
  console.log("✓ Admin rolu təyin edildi:", data.email);
  console.log("  app_metadata:", data.app_metadata);
} else {
  console.error("✗ Xəta:", data);
}
