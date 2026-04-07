// Natoure Live Chat Server — Socket.io + AI inteqrasiyası
// pm2 ilə işləyir: pm2 start chat-server.js --name natoure-chat
// ENV: ADMIN_SECRET, SITE_URL

const { createServer } = require("http");
const { Server }       = require("socket.io");

const PORT         = process.env.PORT         || 4000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "natoure-admin-2026";
const SITE_URL     = process.env.SITE_URL     || "https://www.natourefly.com";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://www.natourefly.com",
      "https://natourefly.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
  },
});

// sessionId → { userName, messages, adminTook }
const sessions = new Map();

// AI-dan cavab al (Next.js API)
async function getAIReply(sessionId, message) {
  try {
    const res = await fetch(`${SITE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.json();
    return data.reply || "Bağlantı xətası.";
  } catch (e) {
    console.error("[AI]", e.message);
    return "Hal-hazırda cavab verə bilmirəm. Zəhmət olmasa bir az sonra yenidən cəhd edin.";
  }
}

io.on("connection", (socket) => {
  const { sessionId, userName, isAdmin } = socket.handshake.query;

  // ── Admin qoşuldu ──
  if (isAdmin === "true") {
    if (socket.handshake.auth?.secret !== ADMIN_SECRET) {
      socket.emit("error", "İcazə yoxdur");
      socket.disconnect();
      return;
    }
    socket.join("admins");
    // Bütün aktiv sessiyanları göndər
    socket.emit("all_sessions", Array.from(sessions.entries()).map(([id, s]) => ({
      sessionId: id,
      userName:  s.userName,
      messages:  s.messages,
      adminTook: s.adminTook,
    })));
    console.log("[ADMIN] Qoşuldu");

    // Admin bir sessiyanı öz üzərinə götürür (AI dayandırılır)
    socket.on("admin_take", ({ targetSessionId }) => {
      const s = sessions.get(targetSessionId);
      if (s) {
        s.adminTook = true;
        io.to(targetSessionId).emit("admin_joined", {
          text: "Dəstək xidmətimiz söhbətə qoşuldu.",
        });
        console.log(`[ADMIN] ${targetSessionId} sessiyanı öz üzərinə götürdü`);
      }
    });

    // Admin cavab yazır
    socket.on("admin_reply", ({ targetSessionId, text }) => {
      if (!text || !targetSessionId) return;
      const s = sessions.get(targetSessionId);
      if (!s) return;
      const msg = { from: "admin", text: text.trim(), time: Date.now() };
      s.messages.push(msg);
      io.to(targetSessionId).emit("ai_message", msg);
      io.to("admins").emit("new_message", { sessionId: targetSessionId, msg });
    });

    // Admin sessiyanı AI-a qaytarır
    socket.on("admin_release", ({ targetSessionId }) => {
      const s = sessions.get(targetSessionId);
      if (s) s.adminTook = false;
    });

    return;
  }

  // ── İstifadəçi qoşuldu ──
  const sid  = sessionId || socket.id;
  const name = userName  || "Ziyarətçi";

  if (!sessions.has(sid)) {
    sessions.set(sid, { userName: name, messages: [], adminTook: false });
  }

  socket.join(sid);
  console.log(`[USER] ${name} (${sid}) qoşuldu`);

  // Admini xəbərdar et
  io.to("admins").emit("session_started", {
    sessionId: sid,
    userName:  name,
    messages:  sessions.get(sid).messages,
  });

  // İstifadəçi mesaj göndərdi
  socket.on("user_message", async (text) => {
    if (!text || typeof text !== "string" || text.length > 2000) return;
    const userMsg = { from: "user", text: text.trim(), time: Date.now() };
    sessions.get(sid)?.messages.push(userMsg);

    // Admini xəbərdar et
    io.to("admins").emit("new_message", { sessionId: sid, userName: name, msg: userMsg });

    // Mesajı müştəriyə geri təsdiqlə
    socket.emit("user_message_ack", userMsg);

    // Əgər admin sessiyanı öz üzərinə götürübsə — AI cavab vermir
    if (sessions.get(sid)?.adminTook) return;

    // AI cavabı al
    const replyText = await getAIReply(sid, text.trim());
    const aiMsg = { from: "ai", text: replyText, time: Date.now() };
    sessions.get(sid)?.messages.push(aiMsg);

    io.to(sid).emit("ai_message", aiMsg);
    io.to("admins").emit("new_message", { sessionId: sid, msg: aiMsg });
  });

  socket.on("disconnect", () => {
    console.log(`[USER] ${name} ayrıldı`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Natoure Chat Server — port ${PORT} | AI: ${SITE_URL}`);
});
