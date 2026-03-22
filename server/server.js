const Imap = require("imap");
const { simpleParser } = require("mailparser");
const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 3741;
const SECRET = process.env.WORKRADAR_SECRET || null;

function cors(res) {
  const allowed = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowed);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function fetchEmails(config) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host || "webmail.register.it",
      port: parseInt(config.port) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 20000,
      authTimeout: 15000,
    });
    const emails = [];
    imap.once("error", reject);
    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err, box) => {
        if (err) return reject(err);
        const total = box.messages.total;
        if (total === 0) { imap.end(); return resolve([]); }
        const start = Math.max(1, total - 49);
        imap.fetch(`${start}:*`, { bodies: "" }).on("message", (msg) => {
          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (err) return;
              emails.push({
                id: `reg_${Buffer.from(parsed.messageId || String(Date.now()+Math.random())).toString("base64").slice(0,16)}`,
                subject: parsed.subject || "(nessun oggetto)",
                from: parsed.from?.text || "sconosciuto",
                date: parsed.date?.toISOString() || new Date().toISOString(),
                text: (parsed.text || "").slice(0, 800),
              });
            });
          });
        }).once("end", () => imap.end());
      });
    });
    imap.once("end", () => resolve(emails));
    imap.connect();
  });
}

function analyzeWithClaude(emails, apiKey) {
  const preview = emails.slice(0, 30).map(e =>
    `ID:${e.id}\nDa:${e.from}\nOggetto:${e.subject}\nData:${e.date}\nTesto:${e.text.slice(0,300)}`
  ).join("\n---\n");

  const body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: `Analizza queste email. Trova solo quelle con opportunità di lavoro freelance, offerte, brief clienti, notifiche piattaforme lavoro.
Rispondi SOLO con JSON array (no markdown):
[{"id":"...","titolo":"...","descrizione":"...","budget":"... o null","scadenza":"ISO o null","fonte":"mittente","fonte_tipo":"register","data_ricezione":"ISO","email_originale":"prime 200 char"}]
Se nessuna: [].`,
    messages: [{ role: "user", content: preview }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const txt = (json.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
          const match = txt.replace(/```json|```/g,"").trim().match(/\[[\s\S]*\]/);
          resolve(match ? JSON.parse(match[0]) : []);
        } catch(e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  const { pathname } = url.parse(req.url);

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, version: "1.1.0" }));
    return;
  }

  if (pathname === "/sync" && req.method === "POST") {
    if (SECRET) {
      const auth = req.headers["authorization"] || "";
      if (auth !== `Bearer ${SECRET}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }
    }
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { email, password, host, port, apiKey } = JSON.parse(body);
        if (!email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "email e password richiesti" }));
        }
        console.log(`[${new Date().toISOString()}] sync → ${email}`);
        const emails = await fetchEmails({ email, password, host, port });
        console.log(`  ${emails.length} email recuperate`);
        let jobs = [];
        if (emails.length > 0 && apiKey) {
          jobs = await analyzeWithClaude(emails, apiKey);
          console.log(`  ${jobs.length} lavori trovati`);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, total: emails.length, jobs }));
      } catch(e) {
        console.error("Errore:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, function() {
  console.log("WorkRadar Server v1.1 - Porta: " + PORT);
  console.log("Auth: " + (SECRET ? "attiva" : "nessuna"));
  console.log("CORS: " + (process.env.ALLOWED_ORIGIN || "*"));
});
