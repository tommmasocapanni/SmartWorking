import { useState, useEffect, useCallback } from "react";

const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f5f5f3;--surface:#fff;--surface2:#f0efed;
  --border:#e8e6e1;--border2:#d8d6d1;
  --text:#111110;--text2:#6b6a67;--text3:#a8a7a4;
  --nuovo:#111110;--visto:#8a8a87;--applicato:#3d6b4f;--archiviato:#c0bfbc;
  --red:#c0392b;--radius:12px;--radius-sm:8px;
}
html,body{height:100%}
body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);-webkit-font-smoothing:antialiased}
.app{min-height:100vh;background-color:var(--bg);background-image:radial-gradient(circle,var(--border) 1px,transparent 1px);background-size:24px 24px}
.topbar{position:sticky;top:0;z-index:100;background:rgba(245,245,243,0.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between}
.wordmark{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:0.08em;color:var(--text);display:flex;align-items:center;gap:10px}
.dot-logo{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.dot-logo span{width:5px;height:5px;background:var(--text);border-radius:50%;display:block}
.dot-logo span:nth-child(2),.dot-logo span:nth-child(3){background:var(--border2)}
.topbar-right{display:flex;align-items:center;gap:8px}
button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;outline:none;transition:all .15s ease}
.btn{font-size:12px;font-weight:500;padding:8px 14px;border-radius:var(--radius-sm);letter-spacing:.01em}
.btn-solid{background:var(--text);color:white}
.btn-solid:hover{background:#2a2a28}
.btn-solid:disabled{background:var(--border2);color:var(--text3);cursor:not-allowed}
.btn-outline{background:transparent;border:1px solid var(--border2);color:var(--text2)}
.btn-outline:hover{border-color:var(--text);color:var(--text);background:var(--surface2)}
.btn-outline.on{border-color:var(--text);color:var(--text);background:var(--surface)}
.main{max-width:1200px;margin:0 auto;padding:32px 24px}
.page-header{margin-bottom:32px}
.page-title{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;color:var(--text3);text-transform:uppercase;margin-bottom:6px}
.page-count{font-family:'DM Mono',monospace;font-size:40px;font-weight:300;letter-spacing:-.04em;line-height:1}
.stats{display:flex;gap:1px;margin-bottom:32px;background:var(--border);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)}
.stat{flex:1;background:var(--surface);padding:16px 16px 14px}
.stat:first-child{border-radius:var(--radius) 0 0 var(--radius)}
.stat:last-child{border-radius:0 var(--radius) var(--radius) 0}
.stat-n{font-family:'DM Mono',monospace;font-size:22px;letter-spacing:-.03em;margin-bottom:4px}
.stat-l{font-size:10px;color:var(--text3);letter-spacing:.04em;text-transform:uppercase}
.toolbar{display:flex;align-items:center;gap:6px;margin-bottom:20px;flex-wrap:wrap}
.toolbar-sep{width:1px;height:20px;background:var(--border2);margin:0 2px}
.search{font-family:'DM Mono',monospace;font-size:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;color:var(--text);width:180px;margin-left:auto;transition:border-color .15s}
.search:focus{outline:none;border-color:var(--text)}
.search::placeholder{color:var(--text3)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;cursor:pointer;transition:box-shadow .2s,border-color .2s,transform .15s;animation:rise .3s ease both;position:relative}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.card:hover{box-shadow:0 4px 24px rgba(0,0,0,.07);border-color:var(--border2);transform:translateY(-1px)}
.card.stato-archiviato{opacity:.5}
.thread-stack{position:absolute;bottom:-5px;left:8px;right:8px;height:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);z-index:-1}
.thread-stack2{position:absolute;bottom:-10px;left:16px;right:16px;height:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);z-index:-2}
.thread-badge{display:inline-flex;align-items:center;gap:3px;font-family:'DM Mono',monospace;font-size:9px;background:var(--text);color:white;border-radius:20px;padding:2px 7px;letter-spacing:.04em;margin-bottom:10px}
.card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.card-source{font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;color:var(--text3);display:flex;align-items:center;gap:5px}
.card-box{font-family:'DM Mono',monospace;font-size:9px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:var(--text3)}
.card-age{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)}
.card-title{font-size:13px;font-weight:500;line-height:1.45;margin-bottom:5px;letter-spacing:-.01em}
.card-from{font-size:11px;color:var(--text3);margin-bottom:8px;font-family:'DM Mono',monospace}
.card-desc{font-size:11px;color:var(--text2);line-height:1.6;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-bottom{display:flex;align-items:center;justify-content:space-between}
.pill{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:20px;border:1px solid currentColor;cursor:pointer;display:flex;align-items:center;gap:4px}
.pill-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
.pill.nuovo{color:var(--nuovo)}.pill.visto{color:var(--visto)}.pill.applicato{color:var(--applicato)}.pill.archiviato{color:var(--archiviato)}
.empty{grid-column:1/-1;padding:60px 0;text-align:center}
.empty-icon{font-family:'DM Mono',monospace;font-size:28px;color:var(--border2);margin-bottom:12px}
.empty-title{font-size:14px;font-weight:500;color:var(--text2);margin-bottom:4px}
.empty-sub{font-size:12px;color:var(--text3)}
.progress-wrap{margin-bottom:16px}
.progress-label{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);margin-bottom:6px}
.progress-track{height:1px;background:var(--border);overflow:hidden}
.progress-fill{height:100%;background:var(--text);animation:prog 1.8s ease-in-out infinite}
@keyframes prog{0%{width:0%}60%{width:75%}100%{width:100%}}
.err{background:#fdf2f1;border:1px solid #f5c6c2;border-radius:var(--radius-sm);padding:10px 14px;font-family:'DM Mono',monospace;font-size:11px;color:var(--red);margin-bottom:16px}
.server-status{font-family:'DM Mono',monospace;font-size:10px;display:flex;align-items:center;gap:5px;color:var(--text3)}
.server-dot{width:6px;height:6px;border-radius:50%;background:var(--border2)}
.server-dot.online{background:#3d6b4f}
.server-dot.offline{background:var(--red)}
.overlay{position:fixed;inset:0;z-index:200;background:rgba(245,245,243,.8);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .18s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;max-width:580px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.1);animation:slideUp .22s ease}
@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
.modal-eyebrow{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.modal-title{font-size:17px;font-weight:500;letter-spacing:-.02em;line-height:1.35;margin-bottom:20px}
.modal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:20px}
.mg-cell{background:var(--surface);padding:12px 14px}
.mg-key{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:4px}
.mg-val{font-family:'DM Mono',monospace;font-size:11px;word-break:break-word}
.modal-sl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:10px}
.thread-list{display:flex;flex-direction:column;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:20px}
.thread-email{background:var(--surface);padding:0;cursor:pointer;transition:background .15s}
.thread-email:hover{background:var(--surface2)}
.thread-email-header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px}
.thread-email-from{font-family:'DM Mono',monospace;font-size:10px;color:var(--text2);font-weight:500}
.thread-email-date{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)}
.thread-email-body{padding:0 14px 14px;font-size:12px;color:var(--text2);line-height:1.7;white-space:pre-wrap;border-top:1px solid var(--border);padding-top:12px}
.modal-status{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.modal-close-row{display:flex;justify-content:flex-end}
.setup-modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;max-width:480px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.1);animation:slideUp .22s ease}
.setup-title{font-size:16px;font-weight:500;margin-bottom:4px;letter-spacing:-.02em}
.setup-sub{font-size:12px;color:var(--text3);margin-bottom:20px;line-height:1.6}
.tabs{display:flex;gap:1px;background:var(--border);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:18px}
.tab{flex:1;padding:8px;font-size:12px;font-weight:500;background:var(--surface2);color:var(--text3);text-align:center;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
.tab.active{background:var(--surface);color:var(--text)}
.field{margin-bottom:12px}
.field label{display:block;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:5px}
.field input{font-family:'DM Mono',monospace;font-size:12px;width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;color:var(--text);outline:none;transition:border-color .15s}
.field input:focus{border-color:var(--text)}
.field input::placeholder{color:var(--text3)}
.setup-actions{display:flex;gap:8px;margin-top:18px;justify-content:flex-end}
.boxes-list{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.box-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer}
.box-item:hover{border-color:var(--border2)}
.box-item.checked{background:var(--surface);border-color:var(--text)}
.box-check{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.box-check.on{background:var(--text);border-color:var(--text)}
.box-check-inner{width:8px;height:5px;border-left:1.5px solid white;border-bottom:1.5px solid white;transform:rotate(-45deg) translateY(-1px)}
.box-name{font-family:'DM Mono',monospace;font-size:11px;color:var(--text);flex:1}
.box-loading{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);padding:16px;text-align:center}
.setup-note{font-size:11px;color:var(--text3);line-height:1.6;background:var(--bg);border-radius:var(--radius-sm);padding:10px;border:1px solid var(--border)}
`;

const STATUSES = ["nuovo","visto","applicato","archiviato"];
const STATUS_LABEL = { nuovo:"Nuovo", visto:"Visto", applicato:"Applicato", archiviato:"Arch." };
const SKIP_BOXES = ["INBOX.Trash","INBOX.Spam","INBOX.Sent","INBOX.Drafts"];

function age(d) {
  if (!d) return "";
  var diff = Math.floor((Date.now()-new Date(d))/86400000);
  return diff===0?"oggi":diff===1?"ieri":diff+"g";
}
function fmtDate(d) {
  if (!d) return "-";
  var dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
}
function shortBox(b) {
  if (!b) return "";
  return b.replace("INBOX.","").toLowerCase();
}
function threadKey(titolo, box) {
  var clean = (titolo||"").replace(/^(re|fwd|fw|r|i):\s*/gi,"").trim().toLowerCase();
  return clean + "|" + (box||"");
}

function groupThreads(jobs) {
  var groups = {};
  var order = [];
  jobs.forEach(function(job) {
    var key = threadKey(job.titolo, job.box);
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(job);
  });
  return order.map(function(key) {
    var emails = groups[key];
    var latest = emails[0];
    return {
      id: latest.id,
      titolo: latest.titolo,
      descrizione: latest.descrizione,
      fonte: latest.fonte,
      box: latest.box,
      data_ricezione: latest.data_ricezione,
      stato: latest.stato,
      count: emails.length,
      emails: emails
    };
  });
}

export default function WorkRadar() {
  var [jobs, setJobs] = useState([]);
  var [loading, setLoading] = useState(false);
  var [loadMsg, setLoadMsg] = useState("");
  var [error, setError] = useState(null);
  var [filter, setFilter] = useState("tutti");
  var [search, setSearch] = useState("");
  var [selected, setSelected] = useState(null);
  var [expandedEmail, setExpandedEmail] = useState(null);
  var [showSetup, setShowSetup] = useState(false);
  var [setupTab, setSetupTab] = useState("server");
  var [serverOnline, setServerOnline] = useState(null);
  var [availableBoxes, setAvailableBoxes] = useState([]);
  var [boxesLoading, setBoxesLoading] = useState(false);
  var [selectedBoxes, setSelectedBoxes] = useState([]);
  var [cfg, setCfg] = useState({
    serverUrl:"", secret:"",
    host:"pop.securemail.pro", port:"993",
    email:"", password:""
  });
  var [cfgSaved, setCfgSaved] = useState(false);

  useEffect(function() {
    try {
      var j = localStorage.getItem("wr_jobs8"); if(j) setJobs(JSON.parse(j));
      var c = localStorage.getItem("wr_cfg5"); if(c){ setCfg(JSON.parse(c)); setCfgSaved(true); }
      var b = localStorage.getItem("wr_boxes3"); if(b) setSelectedBoxes(JSON.parse(b));
    } catch(e) {}
  }, []);

  useEffect(function() {
    if (!jobs.length) return;
    try { localStorage.setItem("wr_jobs8", JSON.stringify(jobs)); } catch(e) {}
  }, [jobs]);

  var checkServer = useCallback(async function() {
    if (!cfg.serverUrl) { setServerOnline(null); return; }
    try {
      var r = await fetch(cfg.serverUrl+"/health",{signal:AbortSignal.timeout(4000)});
      setServerOnline(r.ok);
    } catch(e) { setServerOnline(false); }
  }, [cfg.serverUrl]);

  useEffect(function() {
    checkServer();
    var t = setInterval(checkServer,10000);
    return function(){ clearInterval(t); };
  }, [checkServer]);

  function setField(key, val) {
    setCfg(function(prev) {
      var next = {};
      next.serverUrl=prev.serverUrl; next.secret=prev.secret;
      next.host=prev.host; next.port=prev.port;
      next.email=prev.email; next.password=prev.password;
      next[key]=val; return next;
    });
  }

  function toggleBox(box) {
    setSelectedBoxes(function(prev) {
      var idx = prev.indexOf(box);
      if (idx !== -1) {
        setJobs(function(jobs) {
          var next = jobs.filter(function(j){ return j.box !== box; });
          try { localStorage.setItem("wr_jobs8", JSON.stringify(next)); } catch(e) {}
          return next;
        });
      }
      return idx===-1 ? prev.concat([box]) : prev.filter(function(b){ return b!==box; });
    });
  }

  function saveCfg() {
    try { localStorage.setItem("wr_cfg5", JSON.stringify(cfg)); } catch(e) {}
    try { localStorage.setItem("wr_boxes3", JSON.stringify(selectedBoxes)); } catch(e) {}
    setCfgSaved(true); setShowSetup(false);
    setTimeout(checkServer,500);
  }

  async function loadBoxes() {
    if (!cfg.email||!cfg.password||!cfg.serverUrl) return;
    setBoxesLoading(true);
    try {
      var headers = {"Content-Type":"application/json"};
      if (cfg.secret) headers["Authorization"]="Bearer "+cfg.secret;
      var res = await fetch(cfg.serverUrl+"/boxes",{
        method:"POST", headers:headers,
        body:JSON.stringify({email:cfg.email,password:cfg.password,host:cfg.host,port:cfg.port})
      });
      var data = await res.json();
      if (data.ok) {
        var filtered = data.boxes.filter(function(b){ return SKIP_BOXES.indexOf(b)===-1; });
        setAvailableBoxes(filtered);
        if (selectedBoxes.length===0) setSelectedBoxes(filtered);
      }
    } catch(e) {}
    setBoxesLoading(false);
  }

  function merge(incoming) {
    setJobs(function(prev) {
      var ids = new Set(prev.map(function(j){ return j.id; }));
      var fresh = incoming.filter(function(j){ return !ids.has(j.id); });
      var next = fresh.concat(prev);
      try { localStorage.setItem("wr_jobs8", JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  var sync = useCallback(async function() {
    if (!cfgSaved||!cfg.email||!cfg.serverUrl) { setError("Configura prima le credenziali."); return; }
    if (selectedBoxes.length===0) { setError("Seleziona almeno una cartella."); return; }
    setLoading(true); setError(null);
    try {
      setLoadMsg("Lettura email...");
      var headers = {"Content-Type":"application/json"};
      if (cfg.secret) headers["Authorization"]="Bearer "+cfg.secret;
      var res = await fetch(cfg.serverUrl+"/sync",{
        method:"POST", headers:headers,
        body:JSON.stringify({email:cfg.email,password:cfg.password,host:cfg.host,port:cfg.port,boxes:selectedBoxes})
      });
      if (!res.ok) throw new Error("Server "+res.status);
      var data = await res.json();
      if (!data.ok) throw new Error(data.error||"Errore");
      merge(data.jobs||[]);
      setLoadMsg("+"+(data.jobs||[]).length+" email");
    } catch(e) { setError("Errore: "+e.message); }
    setLoadMsg(""); setLoading(false);
  }, [cfg,cfgSaved,selectedBoxes]);

  function setStatus(id, stato, e) {
    if (e) e.stopPropagation();
    setJobs(function(p) {
      return p.map(function(j) {
        if (j.id!==id) return j;
        return {id:j.id,titolo:j.titolo,descrizione:j.descrizione,fonte:j.fonte,fonte_tipo:j.fonte_tipo,data_ricezione:j.data_ricezione,email_originale:j.email_originale,box:j.box,stato:stato};
      });
    });
    if (selected&&selected.id===id) setSelected(function(s){ return Object.assign({},s,{stato:stato}); });
  }

  var threads = groupThreads(jobs);
  var filteredThreads = threads.filter(function(t) {
    if (filter!=="tutti"&&t.stato!==filter) return false;
    var q = search.toLowerCase();
    return !q||[t.titolo,t.descrizione,t.fonte,t.box].some(function(s){ return (s||"").toLowerCase().indexOf(q)!==-1; });
  });

  var stats = {
    totale: threads.length,
    nuovo: threads.filter(function(t){ return t.stato==="nuovo"; }).length,
    applicato: threads.filter(function(t){ return t.stato==="applicato"; }).length,
    email: jobs.length
  };

  var serverClass = "server-dot"+(serverOnline===true?" online":serverOnline===false?" offline":"");

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
            {cfg.serverUrl&&<div className="server-status"><span className={serverClass}/>{serverOnline===true?"online":serverOnline===false?"offline":"..."}</div>}
            <button className={"btn btn-outline"+(cfgSaved?" on":"")} onClick={function(){ setShowSetup(true); }}>
              {cfgSaved?"configurato":"+ configura"}
            </button>
            <button className="btn btn-solid" onClick={sync} disabled={loading}>{loading?"...":"Sincronizza"}</button>
          </div>
        </div>

        <div className="main">
          <div className="page-header">
            <div className="page-title">conversazioni</div>
            <div className="page-count">{String(stats.totale).padStart(2,"0")}</div>
          </div>

          <div className="stats">
            {[{l:"Thread",n:stats.totale},{l:"Nuovi",n:stats.nuovo},{l:"Applicato",n:stats.applicato},{l:"Email tot.",n:stats.email}].map(function(s){
              return <div className="stat" key={s.l}><div className="stat-n">{s.n}</div><div className="stat-l">{s.l}</div></div>;
            })}
          </div>

          {loading&&<div className="progress-wrap"><div className="progress-label">{loadMsg}</div><div className="progress-track"><div className="progress-fill"/></div></div>}
          {error&&<div className="err">! {error}</div>}

          <div className="toolbar">
            <button className={"btn btn-outline"+(filter==="tutti"?" on":"")} onClick={function(){ setFilter("tutti"); }}>Tutti</button>
            <div className="toolbar-sep"/>
            {STATUSES.map(function(s){
              var count = threads.filter(function(t){ return t.stato===s; }).length;
              return (
                <button key={s} className={"btn btn-outline"+(filter===s?" on":"")} onClick={function(){ setFilter(s); }}>
                  {STATUS_LABEL[s]}<span style={{marginLeft:4,opacity:.4,fontFamily:"DM Mono,monospace",fontSize:10}}>{count}</span>
                </button>
              );
            })}
            <input className="search" placeholder="cerca..." value={search} onChange={function(e){ setSearch(e.target.value); }}/>
          </div>

          <div className="grid">
            {threads.length===0&&!loading&&(
              <div className="empty"><div className="empty-icon">. . .</div><div className="empty-title">Nessuna email</div><div className="empty-sub">Configura e scegli le cartelle da sincronizzare</div></div>
            )}
            {threads.length>0&&filteredThreads.length===0&&(
              <div className="empty"><div className="empty-icon">0</div><div className="empty-title">Nessun risultato</div><div className="empty-sub">Cambia filtro o ricerca</div></div>
            )}
            {filteredThreads.map(function(thread,i){
              var isThread = thread.count > 1;
              var nextStato = STATUSES[(STATUSES.indexOf(thread.stato)+1)%STATUSES.length];
              return (
                <div key={thread.id} className={"card stato-"+thread.stato} style={{animationDelay:i*20+"ms",marginBottom:isThread?10:0}} onClick={function(){ setSelected(thread); setExpandedEmail(null); }}>
                  {isThread&&<div className="thread-stack"/>}
                  {isThread&&thread.count>2&&<div className="thread-stack2"/>}
                  {isThread&&<div className="thread-badge">{thread.count} email</div>}
                  <div className="card-top">
                    <div className="card-source">{thread.box&&<span className="card-box">{shortBox(thread.box)}</span>}</div>
                    <div className="card-age">{age(thread.data_ricezione)}</div>
                  </div>
                  <div className="card-title">{thread.titolo||"Email"}</div>
                  <div className="card-from">{thread.fonte||""}</div>
                  <div className="card-desc">{thread.descrizione||""}</div>
                  <div className="card-bottom">
                    <span className={"pill "+thread.stato} onClick={function(e){ setStatus(thread.id,nextStato,e); }}>
                      <span className="pill-dot"/><span>{STATUS_LABEL[thread.stato]}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected&&(
        <div className="overlay" onClick={function(){ setSelected(null); setExpandedEmail(null); }}>
          <div className="modal" onClick={function(e){ e.stopPropagation(); }}>
            <div className="modal-eyebrow">
              {selected.box?shortBox(selected.box)+" · ":""}{fmtDate(selected.data_ricezione)}
              {selected.count>1?" · "+selected.count+" email":""}
            </div>
            <div className="modal-title">{selected.titolo}</div>
            <div className="modal-grid">
              <div className="mg-cell"><div className="mg-key">Da</div><div className="mg-val">{selected.fonte||"-"}</div></div>
              <div className="mg-cell"><div className="mg-key">Cartella</div><div className="mg-val">{selected.box?shortBox(selected.box):"-"}</div></div>
              <div className="mg-cell"><div className="mg-key">Stato</div><div className="mg-val">{STATUS_LABEL[selected.stato]}</div></div>
            </div>

            {selected.emails&&selected.emails.length>1?(
              <>
                <div className="modal-sl">{selected.emails.length} email nel thread — clicca per espandere</div>
                <div className="thread-list">
                  {selected.emails.map(function(em,i){
                    var isExpanded = expandedEmail===em.id;
                    return (
                      <div key={em.id} className="thread-email">
                        <div className="thread-email-header" onClick={function(){ setExpandedEmail(isExpanded?null:em.id); }}>
                          <div className="thread-email-from">{em.fonte||"sconosciuto"}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div className="thread-email-date">{fmtDate(em.data_ricezione)}</div>
                            <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--text3)"}}>{isExpanded?"▲":"▼"}</div>
                          </div>
                        </div>
                        {isExpanded&&(
                          <div className="thread-email-body">{em.descrizione||"-"}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ):(
              <>
                <div className="modal-sl">Testo</div>
                <div className="modal-desc">{selected.descrizione||"-"}</div>
              </>
            )}

            <div className="modal-sl">Cambia stato</div>
            <div className="modal-status">
              {STATUSES.map(function(s){
                return (
                  <span key={s} className={"pill "+s} style={selected.stato===s?{background:"var(--border2)"}:{}} onClick={function(e){ setStatus(selected.id,s,e); }}>
                    <span className="pill-dot"/><span>{STATUS_LABEL[s]}</span>
                  </span>
                );
              })}
            </div>
            <div className="modal-close-row"><button className="btn btn-outline" onClick={function(){ setSelected(null); setExpandedEmail(null); }}>Chiudi</button></div>
          </div>
        </div>
      )}

      {showSetup&&(
        <div className="overlay" onClick={function(){ setShowSetup(false); }}>
          <div className="setup-modal" onClick={function(e){ e.stopPropagation(); }}>
            <div className="setup-title">Configurazione</div>
            <div className="setup-sub">Connetti il server e scegli le cartelle.</div>
            <div className="tabs">
              <button className={"tab"+(setupTab==="server"?" active":"")} onClick={function(){ setSetupTab("server"); }}>Server</button>
              <button className={"tab"+(setupTab==="imap"?" active":"")} onClick={function(){ setSetupTab("imap"); }}>Email</button>
              <button className={"tab"+(setupTab==="boxes"?" active":"")} onClick={function(){ setSetupTab("boxes"); if(availableBoxes.length===0) loadBoxes(); }}>Cartelle</button>
            </div>

            {setupTab==="server"&&(
              <>
                <div className="field"><label>URL Server Railway</label><input value={cfg.serverUrl} onChange={function(e){ setField("serverUrl",e.target.value); }} placeholder="https://smartworking-production.up.railway.app"/></div>
                <div className="field"><label>Secret Token</label><input type="password" value={cfg.secret} onChange={function(e){ setField("secret",e.target.value); }} placeholder="WORKRADAR_SECRET"/></div>
              </>
            )}
            {setupTab==="imap"&&(
              <>
                <div className="field"><label>Server IMAP</label><input value={cfg.host} onChange={function(e){ setField("host",e.target.value); }} placeholder="pop.securemail.pro"/></div>
                <div className="field"><label>Porta</label><input value={cfg.port} onChange={function(e){ setField("port",e.target.value); }} placeholder="993"/></div>
                <div className="field"><label>Email</label><input type="email" value={cfg.email} onChange={function(e){ setField("email",e.target.value); }} placeholder="tua@email.it"/></div>
                <div className="field"><label>Password</label><input type="password" value={cfg.password} onChange={function(e){ setField("password",e.target.value); }} placeholder="password email"/></div>
              </>
            )}
            {setupTab==="boxes"&&(
              <>
                {boxesLoading&&<div className="box-loading">Caricamento cartelle...</div>}
                {!boxesLoading&&availableBoxes.length===0&&(
                  <div className="box-loading">
                    <div style={{marginBottom:10}}>Inserisci prima le credenziali email.</div>
                    <button className="btn btn-outline" onClick={loadBoxes}>Carica cartelle</button>
                  </div>
                )}
                {!boxesLoading&&availableBoxes.length>0&&(
                  <>
                    <div className="boxes-list">
                      {availableBoxes.map(function(box){
                        var isOn = selectedBoxes.indexOf(box)!==-1;
                        return (
                          <div key={box} className={"box-item"+(isOn?" checked":"")} onClick={function(){ toggleBox(box); }}>
                            <div className={"box-check"+(isOn?" on":"")}>{isOn&&<div className="box-check-inner"/>}</div>
                            <span className="box-name">{box}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="setup-note">{selectedBoxes.length} di {availableBoxes.length} cartelle selezionate. Deselezionare rimuove subito le email.</div>
                  </>
                )}
              </>
            )}

            <div className="setup-actions">
              <button className="btn btn-outline" onClick={function(){ setShowSetup(false); }}>Annulla</button>
              <button className="btn btn-solid" onClick={saveCfg}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
