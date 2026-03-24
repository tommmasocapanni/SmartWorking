const Imap = require("imap");
const { simpleParser } = require("mailparser");
const webpush = require("web-push");
const http = require("http");
const https = require("https");
const url = require("url");

const PORT   = process.env.PORT || 3741;
const SECRET = process.env.WORKRADAR_SECRET || null;

// ── VAPID ─────────────────────────────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_MAIL    = process.env.VAPID_MAILTO      || "mailto:admin@workradar.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log("Web Push: VAPID configurato ✓");
} else {
  console.warn("Web Push: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY non impostate – push disabilitate.");
}

global._store             = global._store             || {};
global._cachedJobs        = global._cachedJobs        || [];
global._lastSync          = global._lastSync          || null;
global._pushSubscriptions = global._pushSubscriptions || [];
global._imapConfig        = global._imapConfig        || null;  // salvato al primo sync
global._lastUIDs          = global._lastUIDs          || {};    // UIDs per auto-sync

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
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

// ── fetchNewFromBox – Promise.all per attendere tutti i simpleParser ───────────
function fetchNewFromBox(imap, boxName, lastUID) {
  return new Promise(function(resolve) {
    imap.openBox(boxName, true, function(err, box) {
      if (err) return resolve({ emails: [], maxUID: lastUID || 0 });
      var total = box.messages.total;
      if (total === 0) return resolve({ emails: [], maxUID: lastUID || 0 });

      var fetchRange;
      if (lastUID && lastUID > 0) {
        fetchRange = (lastUID + 1) + ":*";
      } else {
        var start = Math.max(1, total - 29);
        fetchRange = start + ":*";
      }

      var fetcher;
      try {
        fetcher = imap.fetch(fetchRange, { bodies: "", uid: true });
      } catch(e) {
        return resolve({ emails: [], maxUID: lastUID || 0 });
      }

      var maxUID   = lastUID || 0;
      var promises = [];

      fetcher.on("message", function(msg) {
        var uid = null;
        msg.on("attributes", function(attrs) {
          uid = attrs.uid;
          if (uid > maxUID) maxUID = uid;
        });

        var p = new Promise(function(res2) {
          msg.on("body", function(stream) {
            simpleParser(stream, function(parseErr, parsed) {
              if (parseErr) return res2(null);
              var mid     = parsed.messageId || String(Date.now() + Math.random());
              var rawText = parsed.text || "";
              res2({
                id:              "reg_" + Buffer.from(mid).toString("base64").slice(0, 16),
                titolo:          parsed.subject || "(nessun oggetto)",
                descrizione:     cleanText(rawText),
                budget:          null,
                scadenza:        null,
                fonte:           parsed.from ? parsed.from.text : "sconosciuto",
                fonte_tipo:      "register",
                data_ricezione:  parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                email_originale: cleanText(rawText).slice(0, 300),
                box:             boxName,
                _uid:            uid,
              });
            });
          });
        });
        promises.push(p);
      });

      fetcher.once("error", function() {
        Promise.all(promises).then(function(results) {
          resolve({ emails: results.filter(Boolean), maxUID: maxUID });
        });
      });

      fetcher.once("end", function() {
        Promise.all(promises).then(function(results) {
          resolve({ emails: results.filter(Boolean), maxUID: maxUID });
        });
      });
    });
  });
}

// ── Invia push per ogni email nuova ──────────────────────────────────────────
async function sendPushNotifications(newEmails) {
  if (!newEmails.length || !VAPID_PUBLIC || !VAPID_PRIVATE || !global._pushSubscriptions.length) return;

  var toRemove = [];

  for (var ei = 0; ei < newEmails.length; ei++) {
    var email   = newEmails[ei];
    var payload = JSON.stringify({
      title: email.titolo || "(nessun oggetto)",
      body:  email.fonte  || "mittente sconosciuto",
      url:   "/",
    });

    for (var pi = 0; pi < global._pushSubscriptions.length; pi++) {
      try {
        await webpush.sendNotification(global._pushSubscriptions[pi], payload);
      } catch(pe) {
        if ((pe.statusCode === 410 || pe.statusCode === 404) && !toRemove.includes(pi)) {
          toRemove.push(pi);
        }
      }
    }
  }

  for (var ri = toRemove.length - 1; ri >= 0; ri--) {
    global._pushSubscriptions.splice(toRemove[ri], 1);
  }

  console.log("  Push inviate (" + newEmails.length + " notifiche) a " + global._pushSubscriptions.length + " dispositivi");
}

var server = http.createServer(async function(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  var pathname = url.parse(req.url).pathname;

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, version: "3.2.0" }));
  }

  // Pubblico – non richiede auth
  if (pathname === "/push/vapidPublicKey" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ key: VAPID_PUBLIC || "" }));
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

  // POST /push/subscribe
  if (pathname === "/push/subscribe" && req.method === "POST") {
    var b0 = await readBody(req);
    try {
      var sub = JSON.parse(b0);
      var exists = global._pushSubscriptions.some(function(s){ return s.endpoint === sub.endpoint; });
      if (!exists) {
        global._pushSubscriptions.push(sub);
        console.log("[push] Nuova subscription, totale:", global._pushSubscriptions.length);
      }
      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    } catch(e) {
      res.writeHead(400); return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // POST /push/unsubscribe
  if (pathname === "/push/unsubscribe" && req.method === "POST") {
    var b01 = await readBody(req);
    try {
      var unsub = JSON.parse(b01);
      global._pushSubscriptions = global._pushSubscriptions.filter(function(s){ return s.endpoint !== unsub.endpoint; });
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    } catch(e) {
      res.writeHead(400); return res.end(JSON.stringify({ error: e.message }));
    }
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

  // SYNC - incrementale
  if (pathname === "/sync" && req.method === "POST") {
    var b2 = await readBody(req);
    try {
      var p2 = JSON.parse(b2);
      if (!p2.email || !p2.password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "email e password richiesti" }));
      }

      var selectedBoxes = p2.boxes    || ["INBOX"];
      var lastUIDs      = p2.lastUIDs || {};

      console.log("[" + new Date().toISOString() + "] sync -> " + p2.email);

      // Salva config per auto-sync
      global._imapConfig = { email: p2.email, password: p2.password, host: p2.host, port: p2.port, boxes: selectedBoxes };

      var imap2       = await connectImap(p2);
      var allEmails   = [];
      var newLastUIDs = {};

      for (var i = 0; i < selectedBoxes.length; i++) {
        var box     = selectedBoxes[i];
        var lastUID = lastUIDs[box] || 0;
        var result  = await fetchNewFromBox(imap2, box, lastUID);
        var emails  = result.emails || [];
        var maxUID  = result.maxUID || lastUID;
        newLastUIDs[box] = maxUID;
        if (emails.length > 0) {
          console.log("  " + box + ": " + emails.length + " nuove (lastUID:" + lastUID + " -> " + maxUID + ")");
        }
        allEmails = allEmails.concat(emails);
      }

      imap2.end();

      global._cachedJobs = (global._cachedJobs || []).concat(allEmails);
      global._lastSync   = new Date().toISOString();
      global._lastUIDs   = Object.assign({}, global._lastUIDs, newLastUIDs);

      console.log("  Totale nuove: " + allEmails.length);

      await sendPushNotifications(allEmails);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        ok:       true,
        total:    allEmails.length,
        jobs:     allEmails,
        lastUIDs: newLastUIDs,
      }));
    } catch(e) {
      console.error("Errore sync:", e.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // WIDGET endpoint
  if (pathname === "/widget" && req.method === "GET") {
    var jobs  = global._cachedJobs || [];
    var nuovi = jobs.filter(function(j){ return j.stato === "nuovo"; });
    var summary = nuovi.slice(0, 5).map(function(j){
      return { id:j.id, titolo:(j.titolo||"").slice(0,60), fonte:(j.fonte||"").slice(0,30), box:(j.box||"").replace("INBOX.",""), data:j.data_ricezione };
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok:true, nuovi:nuovi.length, totale:jobs.length, items:summary, lastUpdate:global._lastSync }));
  }

  res.writeHead(404); res.end("Not found");
});

// ── Auto-sync lato server ogni 15 minuti ──────────────────────────────────────
var AUTO_SYNC_INTERVAL = parseInt(process.env.AUTO_SYNC_MINUTES || "15") * 60 * 1000;

async function serverAutoSync() {
  if (!global._imapConfig) {
    console.log("[auto-sync] nessuna config salvata, skip.");
    return;
  }
  console.log("[auto-sync] avvio -> " + global._imapConfig.email);
  try {
    var cfg      = global._imapConfig;
    var boxes    = cfg.boxes || ["INBOX"];
    var imap     = await connectImap(cfg);
    var allNew   = [];
    var newUIDs  = {};

    for (var i = 0; i < boxes.length; i++) {
      var box    = boxes[i];
      var last   = global._lastUIDs[box] || 0;
      var result = await fetchNewFromBox(imap, box, last);
      var emails = result.emails || [];
      newUIDs[box] = result.maxUID || last;
      if (emails.length > 0) {
        console.log("  [auto-sync] " + box + ": " + emails.length + " nuove");
      }
      allNew = allNew.concat(emails);
    }

    imap.end();
    global._cachedJobs = (global._cachedJobs || []).concat(allNew);
    global._lastSync   = new Date().toISOString();
    global._lastUIDs   = Object.assign({}, global._lastUIDs, newUIDs);

    console.log("[auto-sync] totale nuove: " + allNew.length);

    await sendPushNotifications(allNew);

  } catch(e) {
    console.error("[auto-sync] errore:", e.message);
  }
}

server.listen(PORT, function() {
  console.log("WorkRadar Server v3.2 - Porta: " + PORT);
  console.log("Auth: " + (SECRET ? "attiva" : "nessuna"));
  console.log("Sync: incrementale (solo email nuove)");
  console.log("Auto-sync server: ogni " + (AUTO_SYNC_INTERVAL/60000) + " minuti");
  setInterval(serverAutoSync, AUTO_SYNC_INTERVAL);
});
