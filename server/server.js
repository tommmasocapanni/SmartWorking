const Imap = require("imap");
const { simpleParser } = require("mailparser");
const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 3741;
const SECRET = process.env.WORKRADAR_SECRET || null;

// In-memory store: { "box": { lastUID: 123, jobs: [...] } }
global._store = global._store || {};
global._cachedJobs = global._cachedJobs || [];
global._lastSync = global._lastSync || null;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function auth(req) {
  if (!SECRET) return true;
  return (req.headers["authorization"] || "") === "Bearer " + SECRET;
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

function getBoxInfo(imap, boxName) {
  return new Promise(function(resolve) {
    imap.openBox(boxName, true, function(err, box) {
      if (err) return resolve(null);
      resolve({ total: box.messages.total, uidnext: box.uidnext });
    });
  });
}

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/\[image:[^\]]*\]/gi, "")
    .replace(/\[cid:[^\]]*\]/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/={2,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 600);
}

// Fetch only emails newer than lastUID
function fetchNewFromBox(imap, boxName, lastUID) {
  return new Promise(function(resolve) {
    imap.openBox(boxName, true, function(err, box) {
      if (err) return resolve([]);
      var total = box.messages.total;
      if (total === 0) return resolve([]);

      var emails = [];
      var fetchRange;

      if (lastUID && lastUID > 0) {
        // Only fetch emails with UID > lastUID
        fetchRange = (lastUID + 1) + ":*";
      } else {
        // First time: fetch last 30
        var start = Math.max(1, total - 29);
        fetchRange = start + ":*";
      }

      var fetcher;
      try {
        fetcher = imap.fetch(fetchRange, { bodies: "", uid: true });
      } catch(e) {
        return resolve([]);
      }

      var maxUID = lastUID || 0;

      fetcher.on("message", function(msg) {
        var uid = null;
        msg.on("attributes", function(attrs) { uid = attrs.uid; if (uid > maxUID) maxUID = uid; });
        msg.on("body", function(stream) {
          simpleParser(stream, function(err, parsed) {
            if (err) return;
            var mid = parsed.messageId || String(Date.now() + Math.random());
            var rawText = parsed.text || "";
            emails.push({
              id: "reg_" + Buffer.from(mid).toString("base64").slice(0, 16),
              titolo: parsed.subject || "(nessun oggetto)",
              descrizione: cleanText(rawText),
              budget: null, scadenza: null,
              fonte: parsed.from ? parsed.from.text : "sconosciuto",
              fonte_tipo: "register",
              data_ricezione: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              email_originale: cleanText(rawText).slice(0, 300),
              box: boxName,
              _uid: uid
            });
          });
        });
      });

      fetcher.once("error", function() { resolve({ emails: emails, maxUID: maxUID }); });
      fetcher.once("end", function() {
        // Small delay to let simpleParser finish
        setTimeout(function() {
          resolve({ emails: emails, maxUID: maxUID });
        }, 500);
      });
    });
  });
}

var server = http.createServer(async function(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  var pathname = url.parse(req.url).pathname;

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, version: "3.0.0" }));
  }

  if (!auth(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Unauthorized" }));
  }

  function readBody(req) {
    return new Promise(function(resolve) {
      var body = "";
      req.on("data", function(c) { body += c; });
      req.on("end", function() { resolve(body); });
    });
  }

  // GET BOXES LIST
  if (pathname === "/boxes" && req.method === "POST") {
    var b = await readBody(req);
    try {
      var p = JSON.parse(b);
      var imap = await connectImap(p);
      var boxes = await getBoxes(imap);
      imap.end();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true, boxes: boxes }));
    } catch(e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // SYNC - incremental
  if (pathname === "/sync" && req.method === "POST") {
    var b2 = await readBody(req);
    try {
      var p2 = JSON.parse(b2);
      if (!p2.email || !p2.password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "email e password richiesti" }));
      }

      var selectedBoxes = p2.boxes || ["INBOX"];
      // lastUIDs: { "INBOX": 123, "INBOX.addlance": 456 }
      var lastUIDs = p2.lastUIDs || {};

      console.log("[" + new Date().toISOString() + "] sync -> " + p2.email);

      var imap2 = await connectImap(p2);
      var allEmails = [];
      var newLastUIDs = {};

      for (var i = 0; i < selectedBoxes.length; i++) {
        var box = selectedBoxes[i];
        var lastUID = lastUIDs[box] || 0;
        var result = await fetchNewFromBox(imap2, box, lastUID);
        var emails = result.emails || [];
        var maxUID = result.maxUID || lastUID;
        newLastUIDs[box] = maxUID;
        if (emails.length > 0) {
          console.log("  " + box + ": " + emails.length + " nuove (lastUID:" + lastUID + " -> " + maxUID + ")");
        }
        allEmails = allEmails.concat(emails);
      }

      imap2.end();

      // Update global cache
      global._cachedJobs = (global._cachedJobs || []).concat(allEmails);
      global._lastSync = new Date().toISOString();

      console.log("  Totale nuove: " + allEmails.length);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        ok: true,
        total: allEmails.length,
        jobs: allEmails,
        lastUIDs: newLastUIDs // send back to client to store
      }));
    } catch(e) {
      console.error("Errore sync:", e.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // WIDGET endpoint
  if (pathname === "/widget" && req.method === "GET") {
    var jobs = global._cachedJobs || [];
    var nuovi = jobs.filter(function(j){ return j.stato === "nuovo"; });
    var summary = nuovi.slice(0, 5).map(function(j){
      return { id:j.id, titolo:(j.titolo||"").slice(0,60), fonte:(j.fonte||"").slice(0,30), box:(j.box||"").replace("INBOX.",""), data:j.data_ricezione };
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok:true, nuovi:nuovi.length, totale:jobs.length, items:summary, lastUpdate:global._lastSync }));
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, function() {
  console.log("WorkRadar Server v3.0 - Porta: " + PORT);
  console.log("Auth: " + (SECRET ? "attiva" : "nessuna"));
  console.log("Sync: incrementale (solo email nuove)");
});
