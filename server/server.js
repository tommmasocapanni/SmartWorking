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

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\[image:[^\]]*\]/gi, "")
    .replace(/\[cid:[^\]]*\]/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/={2,}/g, "")
    .replace(/\*{2,}/g, "")
    .replace(/_{2,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 600);
}

function getBoxes(imap) {
  return new Promise(function(resolve, reject) {
    imap.getBoxes(function(err, boxes) {
      if (err) return reject(err);
      var names = [];
      function walk(obj, prefix) {
        Object.keys(obj).forEach(function(k) {
          var full = prefix ? prefix + obj[k].delimiter + k : k;
          names.push(full);
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
      var start = Math.max(1, total - 49);
      var emails = [];
      var fetch = imap.fetch(start + ":*", { bodies: "" });
      fetch.on("message", function(msg) {
        msg.on("body", function(stream) {
          simpleParser(stream, function(err, parsed) {
            if (err) return;
            var mid = parsed.messageId || String(Date.now() + Math.random());
            var rawText = parsed.text || "";
            var cleanedText = cleanText(rawText);
            emails.push({
              id: "reg_" + Buffer.from(mid).toString("base64").slice(0, 16),
              titolo: parsed.subject || "(nessun oggetto)",
              descrizione: cleanedText,
              budget: null,
              scadenza: null,
              fonte: parsed.from ? parsed.from.text : "sconosciuto",
              fonte_tipo: "register",
              data_ricezione: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              email_originale: cleanedText.slice(0, 300),
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

function connectImap(config) {
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
    imap.once("ready", function() { resolve(imap); });
    imap.connect();
  });
}

var server = http.createServer(async function(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  var pathname = url.parse(req.url).pathname;

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, version: "2.1.0" }));
    return;
  }

  if (pathname === "/boxes" && req.method === "POST") {
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
        var imap = await connectImap(parsed);
        var boxes = await getBoxes(imap);
        imap.end();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, boxes: boxes }));
      } catch(e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === "/sync" && req.method === "POST") {
    if (SECRET) {
      var auth2 = req.headers["authorization"] || "";
      if (auth2 !== "Bearer " + SECRET) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }
    }
    var body2 = "";
    req.on("data", function(c) { body2 += c; });
    req.on("end", async function() {
      try {
        var parsed2 = JSON.parse(body2);
        if (!parsed2.email || !parsed2.password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "email e password richiesti" }));
        }
        var selectedBoxes = parsed2.boxes || ["INBOX"];
        console.log("[" + new Date().toISOString() + "] sync -> " + parsed2.email);
        var imap2 = await connectImap(parsed2);
        var allEmails = [];
        for (var i = 0; i < selectedBoxes.length; i++) {
          var boxEmails = await fetchFromBox(imap2, selectedBoxes[i]);
          console.log("  " + selectedBoxes[i] + ": " + boxEmails.length + " email");
          allEmails = allEmails.concat(boxEmails);
        }
        imap2.end();
        console.log("  Totale: " + allEmails.length);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, total: allEmails.length, jobs: allEmails }));
      } catch(e) {
        console.error("Errore: " + e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, function() {
  console.log("WorkRadar Server v2.1 - Porta: " + PORT);
  console.log("Auth: " + (SECRET ? "attiva" : "nessuna"));
});
