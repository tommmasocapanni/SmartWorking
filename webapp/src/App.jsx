import { useState, useEffect, useCallback } from “react”;

const G = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0} :root{ --bg:#f5f5f3;--surface:#fff;--surface2:#f0efed; --border:#e8e6e1;--border2:#d8d6d1; --text:#111110;--text2:#6b6a67;--text3:#a8a7a4; --nuovo:#111110;--visto:#8a8a87;--applicato:#3d6b4f;--archiviato:#c0bfbc; --red:#c0392b;--radius:12px;--radius-sm:8px; } html,body{height:100%} body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);-webkit-font-smoothing:antialiased} .app{min-height:100vh;background-color:var(--bg);background-image:radial-gradient(circle,var(--border) 1px,transparent 1px);background-size:24px 24px} .topbar{position:sticky;top:0;z-index:100;background:rgba(245,245,243,0.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 32px;height:56px;display:flex;align-items:center;justify-content:space-between} .wordmark{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:0.08em;color:var(--text);display:flex;align-items:center;gap:10px} .dot-logo{display:grid;grid-template-columns:1fr 1fr;gap:3px} .dot-logo span{width:5px;height:5px;background:var(--text);border-radius:50%;display:block} .dot-logo span:nth-child(2),.dot-logo span:nth-child(3){background:var(--border2)} .topbar-right{display:flex;align-items:center;gap:10px} button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;outline:none;transition:all .15s ease} .btn{font-size:12px;font-weight:500;padding:8px 16px;border-radius:var(--radius-sm);letter-spacing:.01em} .btn-solid{background:var(--text);color:white} .btn-solid:hover{background:#2a2a28} .btn-solid:disabled{background:var(--border2);color:var(--text3);cursor:not-allowed} .btn-outline{background:transparent;border:1px solid var(--border2);color:var(--text2)} .btn-outline:hover{border-color:var(--text);color:var(--text);background:var(--surface2)} .btn-outline.on{border-color:var(--text);color:var(--text);background:var(--surface)} .main{max-width:1200px;margin:0 auto;padding:40px 32px} .page-header{margin-bottom:40px} .page-title{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;color:var(--text3);text-transform:uppercase;margin-bottom:6px} .page-count{font-family:'DM Mono',monospace;font-size:40px;font-weight:300;letter-spacing:-.04em;line-height:1} .stats{display:flex;gap:1px;margin-bottom:40px;background:var(--border);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)} .stat{flex:1;background:var(--surface);padding:20px 20px 18px} .stat:first-child{border-radius:var(--radius) 0 0 var(--radius)} .stat:last-child{border-radius:0 var(--radius) var(--radius) 0} .stat-n{font-family:'DM Mono',monospace;font-size:24px;letter-spacing:-.03em;margin-bottom:4px} .stat-l{font-size:11px;color:var(--text3);letter-spacing:.04em;text-transform:uppercase} .toolbar{display:flex;align-items:center;gap:6px;margin-bottom:24px;flex-wrap:wrap} .toolbar-sep{width:1px;height:20px;background:var(--border2);margin:0 4px} .search{font-family:'DM Mono',monospace;font-size:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 14px;color:var(--text);width:200px;margin-left:auto;transition:border-color .15s} .search:focus{outline:none;border-color:var(--text)} .search::placeholder{color:var(--text3)} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px} .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;cursor:pointer;transition:box-shadow .2s,border-color .2s,transform .15s;animation:rise .3s ease both} @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .card:hover{box-shadow:0 4px 24px rgba(0,0,0,.07);border-color:var(--border2);transform:translateY(-1px)} .card.stato-archiviato{opacity:.5} .card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px} .card-source{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);display:flex;align-items:center;gap:6px} .sdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:var(--text3)} .card-age{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)} .card-title{font-size:14px;font-weight:500;line-height:1.45;margin-bottom:8px;letter-spacing:-.01em} .card-desc{font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden} .card-bottom{display:flex;align-items:center;justify-content:space-between} .card-budget{font-family:'DM Mono',monospace;font-size:13px;font-weight:500} .card-budget.empty{color:var(--text3);font-size:11px;font-weight:400} .pill{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:20px;border:1px solid currentColor;cursor:pointer;transition:all .12s;display:flex;align-items:center;gap:5px} .pill-dot{width:5px;height:5px;border-radius:50%;background:currentColor} .pill.nuovo{color:var(--nuovo)}.pill.visto{color:var(--visto)}.pill.applicato{color:var(--applicato)}.pill.archiviato{color:var(--archiviato)} .empty{grid-column:1/-1;padding:80px 0;text-align:center} .empty-icon{font-family:'DM Mono',monospace;font-size:32px;color:var(--border2);margin-bottom:16px} .empty-title{font-size:14px;font-weight:500;color:var(--text2);margin-bottom:6px} .empty-sub{font-size:12px;color:var(--text3)} .progress-wrap{margin-bottom:20px} .progress-label{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);margin-bottom:8px;letter-spacing:.06em} .progress-track{height:1px;background:var(--border);border-radius:1px;overflow:hidden} .progress-fill{height:100%;background:var(--text);animation:prog 1.8s ease-in-out infinite} @keyframes prog{0%{width:0%}60%{width:75%}100%{width:100%}} .err{background:#fdf2f1;border:1px solid #f5c6c2;border-radius:var(--radius-sm);padding:12px 16px;font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:20px} .server-status{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;display:flex;align-items:center;gap:5px;color:var(--text3)} .server-dot{width:6px;height:6px;border-radius:50%;background:var(--border2)} .server-dot.online{background:#3d6b4f} .server-dot.offline{background:var(--red)} .overlay{position:fixed;inset:0;z-index:200;background:rgba(245,245,243,.75);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .18s ease} @keyframes fadeIn{from{opacity:0}to{opacity:1}} .modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px;max-width:580px;width:100%;max-height:82vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.1);animation:slideUp .22s ease} @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}} .modal-eyebrow{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:10px;display:flex;align-items:center;gap:8px} .modal-title{font-size:18px;font-weight:500;letter-spacing:-.02em;line-height:1.35;margin-bottom:24px} .modal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:24px} .mg-cell{background:var(--surface);padding:14px 16px} .mg-key{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px} .mg-val{font-family:'DM Mono',monospace;font-size:13px} .modal-sl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:10px} .modal-desc{font-size:13px;color:var(--text2);line-height:1.75;margin-bottom:24px;white-space:pre-wrap} .modal-raw{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:24px;line-height:1.6;white-space:pre-wrap;word-break:break-word} .modal-status{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px} .modal-close-row{display:flex;justify-content:flex-end} .setup-modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px;max-width:460px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.1);animation:slideUp .22s ease} .setup-title{font-size:16px;font-weight:500;margin-bottom:4px;letter-spacing:-.02em} .setup-sub{font-size:12px;color:var(--text3);margin-bottom:24px;line-height:1.6} .tabs{display:flex;gap:1px;background:var(--border);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:20px} .tab{flex:1;padding:8px;font-size:12px;font-weight:500;background:var(--surface2);color:var(--text3);text-align:center;cursor:pointer;border:none;transition:all .15s;font-family:'DM Sans',sans-serif} .tab.active{background:var(--surface);color:var(--text)} .field{margin-bottom:14px} .field label{display:block;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:6px} .field input{font-family:'DM Mono',monospace;font-size:12px;width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 12px;color:var(--text);outline:none;transition:border-color .15s} .field input:focus{border-color:var(--text)} .field input::placeholder{color:var(--text3)} .setup-note{font-size:11px;color:var(--text3);margin-top:16px;line-height:1.6;background:var(--bg);border-radius:var(--radius-sm);padding:12px;border:1px solid var(--border)} .setup-actions{display:flex;gap:8px;margin-top:20px;justify-content:flex-end}`;

const STATUSES = [“nuovo”,“visto”,“applicato”,“archiviato”];
const STATUS_LABEL = { nuovo:“Nuovo”, visto:“Visto”, applicato:“Applicato”, archiviato:“Arch.” };

function age(d) {
if (!d) return “”;
const diff = Math.floor((Date.now()-new Date(d))/86400000);
return diff===0?“oggi”:diff===1?“ieri”:diff+“g”;
}
function fmtDate(d) {
if (!d) return “-”;
const dt = new Date(d); if (isNaN(dt)) return d;
return dt.toLocaleDateString(“it-IT”,{day:“2-digit”,month:“short”,year:“numeric”});
}

async function fetchRegisterJobs(cfg) {
const headers = {“Content-Type”:“application/json”};
if (cfg.secret) headers[“Authorization”] = “Bearer “ + cfg.secret;
const res = await fetch(cfg.serverUrl + “/sync”, {
method:“POST”, headers: headers,
body: JSON.stringify({
email: cfg.email,
password: cfg.password,
host: cfg.host,
port: cfg.port,
apiKey: cfg.apiKey
})
});
if (!res.ok) {
const err = await res.json().catch(function(){ return {}; });
throw new Error(err.error || “Server “ + res.status);
}
const data = await res.json();
if (!data.ok) throw new Error(data.error || “Errore server”);
return data.jobs || [];
}

export default function WorkRadar() {
const [jobs, setJobs] = useState([]);
const [loading, setLoading] = useState(false);
const [loadMsg, setLoadMsg] = useState(””);
const [error, setError] = useState(null);
const [filter, setFilter] = useState(“tutti”);
const [search, setSearch] = useState(””);
const [selected, setSelected] = useState(null);
const [showSetup, setShowSetup] = useState(false);
const [setupTab, setSetupTab] = useState(“server”);
const [serverOnline, setServerOnline] = useState(null);
const [cfg, setCfg] = useState({
serverUrl: “”, secret: “”,
host: “webmail.register.it”, port: “993”,
email: “”, password: “”, apiKey: “”
});
const [cfgSaved, setCfgSaved] = useState(false);

useEffect(function() {
(async function() {
try {
const j = await window.storage.get(“wr_jobs5”);
if (j) setJobs(JSON.parse(j.value));
const c = await window.storage.get(“wr_cfg2”);
if (c) { setCfg(JSON.parse(c.value)); setCfgSaved(true); }
} catch(e) {}
})();
}, []);

useEffect(function() {
if (!jobs.length) return;
window.storage.set(“wr_jobs5”, JSON.stringify(jobs)).catch(function(){});
}, [jobs]);

const checkServer = useCallback(async function() {
if (!cfg.serverUrl) { setServerOnline(null); return; }
try {
const r = await fetch(cfg.serverUrl + “/health”, { signal: AbortSignal.timeout(4000) });
setServerOnline(r.ok);
} catch(e) { setServerOnline(false); }
}, [cfg.serverUrl]);

useEffect(function() {
checkServer();
const t = setInterval(checkServer, 10000);
return function() { clearInterval(t); };
}, [checkServer]);

function saveCfg() {
window.storage.set(“wr_cfg2”, JSON.stringify(cfg)).catch(function(){});
setCfgSaved(true);
setShowSetup(false);
setTimeout(checkServer, 500);
}

function merge(incoming) {
setJobs(function(prev) {
const ids = new Set(prev.map(function(j) { return j.id; }));
const fresh = incoming
.filter(function(j) { return !ids.has(j.id); })
.map(function(j) { return Object.assign({}, j, { stato: “nuovo” }); });
return fresh.concat(prev);
});
}

const sync = useCallback(async function() {
if (!cfgSaved || !cfg.email || !cfg.serverUrl) {
setError(“Configura prima il server e le credenziali IMAP.”);
return;
}
setLoading(true); setError(null);
try {
setLoadMsg(“register.it: lettura email…”);
const rj = await fetchRegisterJobs(cfg);
merge(rj);
setLoadMsg(“Trovati “ + rj.length + “ lavori”);
} catch(e) {
setError(“Errore: “ + e.message);
}
setLoadMsg(””); setLoading(false);
}, [cfg, cfgSaved]);

function setStatus(id, stato, e) {
if (e) e.stopPropagation();
setJobs(function(p) { return p.map(function(j) { return j.id === id ? Object.assign({}, j, { stato: stato }) : j; }); });
if (selected && selected.id === id) setSelected(function(s) { return Object.assign({}, s, { stato: stato }); });
}

const filtered = jobs.filter(function(j) {
if (filter !== “tutti” && j.stato !== filter) return false;
const q = search.toLowerCase();
return !q || [j.titolo, j.descrizione, j.fonte].some(function(s) { return (s || “”).toLowerCase().includes(q); });
});

const stats = {
totale: jobs.length,
nuovo: jobs.filter(function(j) { return j.stato === “nuovo”; }).length,
applicato: jobs.filter(function(j) { return j.stato === “applicato”; }).length,
budget: jobs.filter(function(j) { return j.budget && j.budget !== “null”; }).length
};

return (
<>
<style>{G}</style>
<div className="app">
<div className="topbar">
<div className="wordmark">
<div className="dot-logo"><span/><span/><span/><span/></div>
workradar
</div>
<div className="topbar-right">
{cfg.serverUrl && (
<div className="server-status">
<span className={“server-dot” + (serverOnline === true ? “ online” : serverOnline === false ? “ offline” : “”)}/>
{serverOnline === true ? “server online” : serverOnline === false ? “server offline” : “…”}
</div>
)}
<button className={“btn btn-outline” + (cfgSaved ? “ on” : “”)} onClick={function(){ setShowSetup(true); }}>
{cfgSaved ? “configurato” : “+ configura”}
</button>
<button className="btn btn-solid" onClick={sync} disabled={loading}>
{loading ? “…” : “Sincronizza”}
</button>
</div>
</div>

```
    <div className="main">
      <div className="page-header">
        <div className="page-title">lavori in arrivo</div>
        <div className="page-count">{String(stats.totale).padStart(2,"0")}</div>
      </div>

      <div className="stats">
        {[{l:"Totali",n:stats.totale},{l:"Nuovi",n:stats.nuovo},{l:"Applicato",n:stats.applicato},{l:"Con budget",n:stats.budget}].map(function(s) {
          return <div className="stat" key={s.l}><div className="stat-n">{s.n}</div><div className="stat-l">{s.l}</div></div>;
        })}
      </div>

      {loading && <div className="progress-wrap"><div className="progress-label">{loadMsg}</div><div className="progress-track"><div className="progress-fill"/></div></div>}
      {error && <div className="err">! {error}</div>}

      <div className="toolbar">
        <button className={"btn btn-outline" + (filter === "tutti" ? " on" : "")} onClick={function(){ setFilter("tutti"); }}>Tutti</button>
        <div className="toolbar-sep"/>
        {STATUSES.map(function(s) {
          return (
            <button key={s} className={"btn btn-outline" + (filter === s ? " on" : "")} onClick={function(){ setFilter(s); }}>
              {STATUS_LABEL[s]}
              <span style={{marginLeft:5,opacity:.4,fontFamily:"'DM Mono',monospace",fontSize:10}}>{jobs.filter(function(j){ return j.stato===s; }).length}</span>
            </button>
          );
        })}
        <input className="search" placeholder="cerca..." value={search} onChange={function(e){ setSearch(e.target.value); }}/>
      </div>

      <div className="grid">
        {jobs.length === 0 && !loading ? (
          <div className="empty">
            <div className="empty-icon">. . .</div>
            <div className="empty-title">Nessun lavoro</div>
            <div className="empty-sub">Configura le credenziali e clicca Sincronizza</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">0</div>
            <div className="empty-title">Nessun risultato</div>
            <div className="empty-sub">Cambia filtro o ricerca</div>
          </div>
        ) : filtered.map(function(job, i) {
          return (
            <div key={job.id} className={"card stato-" + job.stato} style={{animationDelay: i*30+"ms"}} onClick={function(){ setSelected(job); }}>
              <div className="card-top">
                <div className="card-source"><span className="sdot"/>{job.fonte || "email"}</div>
                <div className="card-age">{age(job.data_ricezione)}</div>
              </div>
              <div className="card-title">{job.titolo || "Offerta"}</div>
              <div className="card-desc">{job.descrizione || "-"}</div>
              <div className="card-bottom">
                {job.budget && job.budget !== "null"
                  ? <div className="card-budget">{job.budget}</div>
                  : <div className="card-budget empty">budget n.d.</div>}
                <span className={"pill " + job.stato} onClick={function(e){
                  e.stopPropagation();
                  setStatus(job.id, STATUSES[(STATUSES.indexOf(job.stato)+1) % STATUSES.length], e);
                }}>
                  <span className="pill-dot"/><span>{STATUS_LABEL[job.stato]}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {selected && (
    <div className="overlay" onClick={function(){ setSelected(null); }}>
      <div className="modal" onClick={function(e){ e.stopPropagation(); }}>
        <div className="modal-eyebrow">{selected.fonte} - {fmtDate(selected.data_ricezione)}</div>
        <div className="modal-title">{selected.titolo}</div>
        <div className="modal-grid">
          <div className="mg-cell"><div className="mg-key">Budget</div><div className="mg-val">{(selected.budget && selected.budget !== "null") ? selected.budget : "-"}</div></div>
          <div className="mg-cell"><div className="mg-key">Scadenza</div><div className="mg-val">{fmtDate(selected.scadenza)}</div></div>
          <div className="mg-cell"><div className="mg-key">Stato</div><div className="mg-val">{STATUS_LABEL[selected.stato]}</div></div>
        </div>
        <div className="modal-sl">Descrizione</div>
        <div className="modal-desc">{selected.descrizione || "-"}</div>
        {selected.email_originale && <><div className="modal-sl">Email originale</div><div className="modal-raw">{selected.email_originale}</div></>}
        <div className="modal-sl">Cambia stato</div>
        <div className="modal-status">
          {STATUSES.map(function(s) {
            return (
              <span key={s} className={"pill " + s} style={selected.stato === s ? {background:"var(--border2)"} : {}} onClick={function(e){ setStatus(selected.id, s, e); }}>
                <span className="pill-dot"/><span>{STATUS_LABEL[s]}</span>
              </span>
            );
          })}
        </div>
        <div className="modal-close-row"><button className="btn btn-outline" onClick={function(){ setSelected(null); }}>Chiudi</button></div>
      </div>
    </div>
  )}

  {showSetup && (
    <div className="overlay" onClick={function(){ setShowSetup(false); }}>
      <div className="setup-modal" onClick={function(e){ e.stopPropagation(); }}>
        <div className="setup-title">Configurazione</div>
        <div className="setup-sub">Connetti il server Railway e le credenziali email.</div>
        <div className="tabs">
          <button className={"tab" + (setupTab === "server" ? " active" : "")} onClick={function(){ setSetupTab("server"); }}>Server</button>
          <button className={"tab" + (setupTab === "imap" ? " active" : "")} onClick={function(){ setSetupTab("imap"); }}>Email IMAP</button>
        </div>

        {setupTab === "server" && <>
          <div className="field">
            <label>URL Server Railway</label>
            <input value={cfg.serverUrl} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{serverUrl:e.target.value.replace(/\/$/,"")}); })} placeholder="https://smartworking-production.up.railway.app"/>
          </div>
          <div className="field">
            <label>Secret Token</label>
            <input type="password" value={cfg.secret} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{secret:e.target.value}); })} placeholder="il tuo WORKRADAR_SECRET"/>
          </div>
        </>}

        {setupTab === "imap" && <>
          <div className="field">
            <label>Server IMAP</label>
            <input value={cfg.host} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{host:e.target.value}); })} placeholder="webmail.register.it"/>
          </div>
          <div className="field">
            <label>Porta</label>
            <input value={cfg.port} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{port:e.target.value}); })} placeholder="993"/>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={cfg.email} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{email:e.target.value}); })} placeholder="tua@email.it"/>
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={cfg.password} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{password:e.target.value}); })} placeholder="password email"/>
          </div>
          <div className="field">
            <label>API Key Anthropic</label>
            <input type="password" value={cfg.apiKey} onChange={function(e){ setCfg(function(p){ return Object.assign({},p,{apiKey:e.target.value}); })} placeholder="sk-ant-..."/>
          </div>
          <div className="setup-note">API key su console.anthropic.com/settings/keys</div>
        </>}

        <div className="setup-actions">
          <button className="btn btn-outline" onClick={function(){ setShowSetup(false); }}>Annulla</button>
          <button className="btn btn-solid" onClick={saveCfg}>Salva</button>
        </div>
      </div>
    </div>
  )}
</>
```

);
}
