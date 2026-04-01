#!/bin/bash
set -e

echo "=== Node.js qurulur ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== PM2 qurulur ==="
npm install -g pm2

echo "=== Proxy qovluğu yaradılır ==="
mkdir -p /opt/ratehawk-proxy
cd /opt/ratehawk-proxy

echo "=== package.json ==="
cat > package.json << 'EOF'
{
  "name": "ratehawk-proxy",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

echo "=== server.js ==="
cat > server.js << 'EOF'
const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.PROXY_SECRET;
const PORT = process.env.PORT || 3001;

// Auth middleware
app.use((req, res, next) => {
  if (!SECRET) return next();
  const token = req.headers["x-proxy-secret"];
  if (token !== SECRET) return res.status(401).json({ error: "Unauthorized" });
  next();
});

// RateHawk proxy
app.all("/ratehawk/*", async (req, res) => {
  const path = req.path.replace("/ratehawk", "");
  const targetUrl = `https://api.worldota.net${path}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers["authorization"] && {
          Authorization: req.headers["authorization"],
        }),
      },
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl + (req._parsedUrl.search || ""), fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", ip: req.socket.localAddress });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
EOF

echo "=== npm install ==="
npm install

echo "=== .env faylı ==="
PROXY_SECRET=$(openssl rand -hex 32)
echo "PROXY_SECRET=$PROXY_SECRET" > .env
echo ""
echo "=== PROXY_SECRET (Vercel-e əlavə et) ==="
echo "PROXY_SECRET=$PROXY_SECRET"
echo ""

echo "=== PM2 ilə başladılır ==="
pm2 start server.js --name ratehawk-proxy --env production -- --env-file .env
pm2 startup
pm2 save

echo "=== Firewall ==="
ufw allow 22
ufw allow 3001
echo "y" | ufw enable

echo ""
echo "=== HAZIR ==="
echo "Proxy URL: http://37.60.241.131:3001"
echo "Health check: curl http://37.60.241.131:3001/health"
cat .env
