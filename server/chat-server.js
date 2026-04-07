// Natoure Live Chat Server — Socket.io
// VPS-də işlədilir: node server/chat-server.js
// Port: 4000 (ya da PORT env var)

const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "natoure-admin-2026";

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

// Aktiv söhbətlər: sessionId → { messages, userName }
const sessions = new Map();

io.on("connection", (socket) => {
  const { sessionId, userName, isAdmin } = socket.handshake.query;

  // Admin yoxlaması
  if (isAdmin === "true") {
    const secret = socket.handshake.auth?.secret;
    if (secret !== ADMIN_SECRET) {
      socket.emit("error", "Giriş icazəsi yoxdur");
      socket.disconnect();
      return;
    }
    socket.join("admins");
    // Admin qoşulanda bütün aktiv sessiyanları göndər
    socket.emit("all_sessions", Array.from(sessions.entries()).map(([id, s]) => ({
      sessionId: id,
      userName: s.userName,
      messages: s.messages,
    })));
    console.log(`[ADMIN] Qoşuldu`);
    return;
  }

  // İstifadəçi qoşuldu
  const sid = sessionId || socket.id;
  const name = userName || "Ziyarətçi";

  if (!sessions.has(sid)) {
    sessions.set(sid, { userName: name, messages: [] });
  }

  socket.join(sid);
  console.log(`[USER] ${name} (${sid}) qoşuldu`);

  // Admin-ə yeni sessiya xəbəri
  io.to("admins").emit("session_started", {
    sessionId: sid,
    userName: name,
  });

  // İstifadəçidən mesaj
  socket.on("user_message", (text) => {
    if (!text || typeof text !== "string" || text.length > 1000) return;
    const msg = { from: "user", text: text.trim(), time: Date.now() };
    sessions.get(sid)?.messages.push(msg);
    io.to("admins").emit("new_message", { sessionId: sid, userName: name, msg });
    socket.emit("message_received", msg);
  });

  // Admindən cavab
  socket.on("admin_reply", ({ targetSessionId, text }) => {
    if (!text || !targetSessionId) return;
    const msg = { from: "admin", text: text.trim(), time: Date.now() };
    sessions.get(targetSessionId)?.messages.push(msg);
    io.to(targetSessionId).emit("admin_message", msg);
    io.to("admins").emit("new_message", { sessionId: targetSessionId, msg });
  });

  socket.on("disconnect", () => {
    console.log(`[USER] ${name} ayrıldı`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Natoure Chat Server — port ${PORT}`);
});
