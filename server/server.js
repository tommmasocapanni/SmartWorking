const Imap = require("imap");
const { simpleParser } = require("mailparser");
const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 3741;
const SECRET = process.env.WORKRADAR_SECRET || null;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getBoxes(imap) {
  return new Promise(function(resolve, reject) {
    imap.getBoxes(function(err, boxes) {
      if (err) return reject(err);
      var names = [];
      function walk(obj, prefix) {
        Object.keys(obj).forEach(function(k) {
          var full = prefix ? prefix + obj[k].delimiter + k : k;
          if (full !== "INBOX.Trash" && full !== "INBOX.Spam" && full !== "INBOX.Sent" && full !== "INBOX.Drafts") {
            names.push(full);
          }
          if (obj[k].children) walk(obj[k].children, full);
        });
      }
      walk(boxes, "");
      resolve(names);
    });
  });
}

function fetchFromBox(imap, boxName) {
  return new Promise(function(resolve) {
    imap.openBox(boxName, true, function(err, box) {
      if (err) return resolve([]);
      var total = box.messages.total;
      if (total === 0) return resolve([]);
      var start = Math.max(1, total - 19);
      var emails = [];
      var fetch = imap.fetch(start + ":*", { bodies: "" });
      fetch.on("message", function(msg) {
        msg.on("body", function(stream) {
          simpleParser(stream, function(err, parsed) {
            if (err) return;
            var mid = parsed.messageId || String(Date.now() + Math.random());
            emails.push({
              id: "reg_" + Buffer.from(mid).toString("base64").slice(0, 16),
              subject: parsed.subject || "(nessun oggetto)",
              from: parsed.from ? parsed.from.text : "sconosciuto",
              date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              text: (parsed.text || "").slice(0, 400),
              box: boxName
            });
          });
        });
      });
      fetch.once("error", function() { resolve(emails); });
      fetch.once("end", function() { resolve(emails); });
    });
  });
}

function fetchEmails(config) {
  return new Promise(function(resolve, reject) {
    var imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host || "pop.securemail.pro",
      port: parseInt(config.port) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 20000,
      authTimeout: 15000,
    });

    imap.once("error", reject);

    imap.once("ready", async function() {
      try {
        var boxes = await getBoxes(imap);
        console.log("  Cartelle: " + boxes.join(", "));
        var allEmails = [];
        for (var i = 0; i < boxes.length; i++) {
          var boxEmails = await fetchFromBox(imap, boxes[i]);
          if (boxEmails.length > 0) {
            console.log("  " + boxes[i] + ": " + boxEmails.length + " email");
          }
          allEmails = allEmails.concat(boxEmails);
        }
        imap.end();
        resolve(allEmails);
      } catch(e) {
        imap.end();
        reject(e);
      }
    });

    imap.once("end", function() {});
    imap.connect();
  });
}

function analyzeWithClaude(emails, apiKey) {
  var preview = emails.slice(0, 60).map(function(e) {
    return "ID:" + e.id + "\nCartella:" + e.box + "\nDa:" + e.from + "\nOggetto:" + e.subject + "\nData:" + e.date + "\nTesto:" + e.text.slice(0, 200);
  }).join("\n---\n");

  var systemPrompt = "Analizza queste email e trova quelle relative a lavoro freelance, offerte, brief, notifiche da Addlance/Fiverr/Upwork, richieste collaborazione.\nSii INCLUSIVO.\nRispondi SOLO con JSON array (no markdown, no testo prima o dopo):\n[{\"id\":\"...\",\"titolo\":\"...\",\"descrizione\":\"...\",\"budget\":\"... o null\",\"scadenza\":\"ISO o null\",\"fonte\":\"mittente\",\"fonte_tipo\":\"register\",\"data_ricezione\":\"ISO\",\"email_originale\":\"prime 200 char\"}]\nSe nessuna: [].";

  var body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: preview }]
  });

  return new Promise(function(resolve, reject) {
    var req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    }, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        try {
          var json = JSON.parse(data);
          if (json.error) {
            console.log("  Claude errore API: " + json.error.message);
            return resolve([]);
          }
          var txt = (json.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
          console.log("  Claude risposta (prime 300 char): " + txt.slice(0, 300));
          var match = txt.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
          resolve(match ? JSON.parse(match[0]) : []);
        } catch(e) {
          console.log("  Errore parsing risposta Claude: " + e.message);
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

var server = http.createServer(async function(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  var pathname = url.parse(req.url).pathname;

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, version: "1.3.0" }));
    return;
  }

  if (pathname === "/sync" && req.method === "POST") {
    if (SECRET) {
      var auth = req.headers["authorization"] || "";
      if (auth !== "Bearer " + SECRET) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }
    }
    var body = "";
    req.on("data", function(c) { body += c; });
    req.on("end", async function() {
      try {
        var parsed = JSON.parse(body);
        if (!parsed.email || !parsed.password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "email e password richiesti" }));
        }
        console.log("[" + new Date().toISOString() + "] sync -> " + parsed.email);
        var emails = await fetchEmails({ email: parsed.email, password: parsed.password, host: parsed.host, port: parsed.port });
        console.log("  Totale email: " + emails.length);
        var jobs = [];
        if (emails.length > 0 && parsed.apiKey) {
          jobs = await analyzeWithClaude(emails, parsed.apiKey);
          console.log("  Lavori trovati: " + jobs.length);
        } else if (!parsed.apiKey) {
          console.log("  ATTENZIONE: API key mancante!");
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, total: emails.length, jobs: jobs }));
      } catch(e) {
        console.error("Errore sync: " + e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, function() {
  console.log("WorkRadar Server v1.3 - Porta: " + PORT);
  console.log("Auth: " + (SECRET ? "attiva" : "nessuna"));
});
