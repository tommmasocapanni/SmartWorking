import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const STORE = {
  jobs:     "wr_jobs",
  cfg:      "wr_cfg",
  boxes:    "wr_boxes",
  uids:     "wr_uids",
  autosync: "wr_autosync",
  lastsync: "wr_lastsync",
};

const STATUSES   = ["nuovo","visto","applicato","archiviato"];
const STATUS_LBL = { nuovo:"Nuovo", visto:"Visto", applicato:"Applicato", archiviato:"Arch." };
const SKIP_BOXES = ["INBOX.Trash","INBOX.Spam","INBOX.Sent","INBOX.Drafts"];
const TAG_PALETTE = [
  { bg:"rgba(59,130,246,.12)",  border:"rgba(59,130,246,.3)",  fg:"#3b82f6" },
  { bg:"rgba(16,185,129,.12)",  border:"rgba(16,185,129,.3)",  fg:"#10b981" },
  { bg:"rgba(245,158,11,.12)",  border:"rgba(245,158,11,.3)",  fg:"#f59e0b" },
  { bg:"rgba(239,68,68,.12)",   border:"rgba(239,68,68,.3)",   fg:"#ef4444" },
  { bg:"rgba(139,92,246,.12)",  border:"rgba(139,92,246,.3)",  fg:"#8b5cf6" },
  { bg:"rgba(236,72,153,.12)",  border:"rgba(236,72,153,.3)",  fg:"#ec4899" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const ls = {
  get:    (k)    => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch{ return null; } },
  set:    (k,v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{} },
  remove: (k)    => { try { localStorage.removeItem(k); } catch{} },
};

function tagColor(tag) {
  let i=0; for(const c of tag) i+=c.charCodeAt(0);
  return TAG_PALETTE[i % TAG_PALETTE.length];
}

function ageStr(d) {
  if(!d) return "";
  const diff = Math.floor((Date.now()-new Date(d))/86400000);
  return diff===0?"oggi" : diff===1?"ieri" : diff+"g";
}

function fmtDate(d) {
  if(!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
}

function shortBox(b) {
  return (b||"").replace("INBOX.","").toLowerCase();
}

function threadKey(title, box) {
  const clean = (title||"").replace(/^(re|fwd?|i|r):\s*/gi,"").trim().toLowerCase();
  return `${clean}|${box||""}`;
}

function deadlineInfo(dl) {
  if(!dl) return null;
  const days = Math.ceil((new Date(dl)-Date.now())/86400000);
  if(days<0)  return { label:"scaduta", cls:"urgent" };
  if(days===0) return { label:"oggi!",  cls:"urgent" };
  if(days===1) return { label:"domani", cls:"urgent" };
  if(days<=5)  return { label:`tra ${days}g`, cls:"soon" };
  return { label:`tra ${days}g`, cls:"ok" };
}

function groupIntoThreads(jobs) {
  const STATUS_RANK = { archiviato:0, nuovo:1, visto:2, applicato:3 };
  const map = new Map();
  const order = [];
  for(const job of jobs) {
    const key = threadKey(job.title, job.box);
    if(!map.has(key)) { map.set(key,[]); order.push(key); }
    map.get(key).push(job);
  }
  return order.map(key => {
    const emails = map.get(key);
    // Email rappresentativa: quella con lo status più avanzato,
    // a parità di status quella più recente
    const top = emails.reduce((best, cur) => {
      const rb = STATUS_RANK[best.status] ?? 1;
      const rc = STATUS_RANK[cur.status]  ?? 1;
      if(rc > rb) return cur;
      if(rc === rb) {
        return new Date(cur.date) > new Date(best.date) ? cur : best;
      }
      return best;
    });
    // Aggrega note/budget/tags/deadline dall'email che li ha
    const withNote     = emails.find(e=>e.note)     || top;
    const withBudget   = emails.find(e=>e.budget)   || top;
    const withDeadline = emails.find(e=>e.deadline) || top;
    const allTags      = [...new Set(emails.flatMap(e=>e.tags||[]))];
    const newest       = emails.reduce((a,b)=>new Date(a.date)>new Date(b.date)?a:b);
    return {
      id: top.id, title: top.title, desc: newest.desc,
      from: newest.from, box: top.box, date: newest.date,
      status: top.status, note: withNote.note||"",
      budget: withBudget.budget||"", tags: allTags,
      deadline: withDeadline.deadline||"", pinned: emails.some(e=>e.pinned),
      count: emails.length, emails,
    };
  });
}

function exportCSV(jobs) {
  const rows = [["ID","Titolo","Da","Cartella","Stato","Budget","Scadenza","Data","Note","Tag"]];
  for(const j of jobs) {
    rows.push([
      j.id, j.title||"", j.from||"", j.box||"", j.status||"",
      j.budget||"", j.deadline||"", j.date||"", j.note||"",
      (j.tags||[]).join(";")
    ]);
  }
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = `workradar_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#f5f5f3; --surface:#fff; --surface2:#f0efed;
  --border:#e8e6e1; --border2:#d8d6d1;
  --text:#111110; --text2:#6b6a67; --text3:#a8a7a4;
  --green:#3d6b4f; --red:#c0392b; --amber:#b45309;
  --r:12px; --rs:8px;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#0a0a09; --surface:#141412; --surface2:#1c1c1a;
  --border:#252522; --border2:#2e2e2b;
  --text:#f0ede8; --text2:#a8a5a0; --text3:#606060;
  --green:#4ade80; --red:#f87171; --amber:#fbbf24;
}}
html,body { height:100%; }
body { background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); -webkit-font-smoothing:antialiased; }

/* APP */
.app { min-height:100vh; background:var(--bg) radial-gradient(circle,var(--border) 1px,transparent 1px) 0 0/24px 24px; }

/* TOPBAR */
.topbar { position:sticky; top:0; z-index:100; height:56px; padding:0 20px;
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:blur(16px); border-bottom:1px solid var(--border); }
.logo { font-family:'DM Mono',monospace; font-size:13px; letter-spacing:.08em;
  display:flex; align-items:center; gap:10px; }
.logo-dots { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.logo-dots span { width:5px; height:5px; border-radius:50%; background:var(--text); }
.logo-dots span:nth-child(2),.logo-dots span:nth-child(3) { background:var(--border2); }
.topbar-right { display:flex; align-items:center; gap:6px; }

/* BUTTONS */
button { font-family:'DM Sans',sans-serif; cursor:pointer; border:none; outline:none; transition:all .15s; }
.btn { font-size:12px; font-weight:500; padding:8px 14px; border-radius:var(--rs); letter-spacing:.01em; }
.btn-solid { background:var(--text); color:var(--bg); }
.btn-solid:hover { opacity:.85; }
.btn-solid:disabled { opacity:.4; cursor:not-allowed; }
.btn-ghost { background:transparent; border:1px solid var(--border2); color:var(--text2); }
.btn-ghost:hover { border-color:var(--text); color:var(--text); }
.btn-ghost.active { border-color:var(--text); color:var(--text); background:var(--surface); }
.btn-danger { background:transparent; border:1px solid rgba(192,57,43,.3); color:var(--red); }
.btn-danger:hover { background:rgba(192,57,43,.08); }

/* STATUS DOT */
.status-dot { width:6px; height:6px; border-radius:50%; background:var(--border2); }
.status-dot.on  { background:var(--green); }
.status-dot.off { background:var(--red); }
.server-label { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3);
  display:flex; align-items:center; gap:5px; }

/* MAIN */
.main { max-width:1200px; margin:0 auto; padding:28px 20px; }

/* PAGE HEADER */
.page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; }
.page-label { font-family:'DM Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--text3); margin-bottom:4px; }
.page-count { font-family:'DM Mono',monospace; font-size:38px; font-weight:300; letter-spacing:-.04em; line-height:1; }
.sync-info { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3); text-align:right; line-height:1.7; }
.sync-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--text3); margin-right:4px; vertical-align:middle; }
.sync-dot.active { background:var(--green); animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

/* STATS */
.stats { display:flex; gap:1px; background:var(--border2); border:1px solid var(--border2);
  border-radius:var(--r); overflow:hidden; margin-bottom:28px; }
.stat { flex:1; background:var(--surface); padding:14px; }
.stat:first-child { border-radius:var(--r) 0 0 var(--r); }
.stat:last-child  { border-radius:0 var(--r) var(--r) 0; }
.stat-n { font-family:'DM Mono',monospace; font-size:20px; color:var(--text); letter-spacing:-.03em; margin-bottom:3px; }
.stat-l { font-size:10px; color:var(--text3); letter-spacing:.04em; text-transform:uppercase; }

/* TOOLBAR */
.toolbar { display:flex; align-items:center; gap:5px; margin-bottom:12px; flex-wrap:wrap; }
.sep { width:1px; height:18px; background:var(--border2); margin:0 2px; flex-shrink:0; }
.search { font-family:'DM Mono',monospace; font-size:12px; background:var(--surface);
  border:1px solid var(--border); border-radius:var(--rs); padding:7px 12px;
  color:var(--text); width:150px; transition:border-color .15s; }
.search:focus { outline:none; border-color:var(--text); }
.search::placeholder { color:var(--text3); }

/* ACTIVE FILTERS */
.active-filters { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:14px; min-height:4px; }
.filter-chip { font-family:'DM Mono',monospace; font-size:10px; padding:3px 9px;
  border-radius:20px; border:1px solid; cursor:pointer; transition:opacity .15s; }
.filter-chip:hover { opacity:.7; }

/* PROGRESS */
.progress-bar { height:1px; background:var(--border); border-radius:1px; overflow:hidden; margin-bottom:14px; }
.progress-fill { height:100%; background:var(--text); animation:prog 1.8s ease-in-out infinite; }
@keyframes prog { 0%{width:0%} 60%{width:75%} 100%{width:100%} }
.progress-label { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3); margin-bottom:6px; }

/* ERROR */
.error-bar { background:rgba(192,57,43,.08); border:1px solid rgba(192,57,43,.2);
  border-radius:var(--rs); padding:10px 14px; font-family:'DM Mono',monospace;
  font-size:11px; color:var(--red); margin-bottom:14px; }

/* GRID */
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:14px; }

/* CARD */
.card-wrap { position:relative; overflow:hidden; border-radius:var(--r); }
.swipe-bg { position:absolute; inset:0; border-radius:var(--r); display:flex;
  align-items:center; padding:0 18px; pointer-events:none; }
.swipe-bg.l { background:linear-gradient(90deg,rgba(74,222,128,.15),transparent); justify-content:flex-start; }
.swipe-bg.r { background:linear-gradient(270deg,rgba(239,68,68,.15),transparent); justify-content:flex-end; }
.card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r);
  padding:16px; cursor:pointer; position:relative; touch-action:pan-y; user-select:none;
  transition:box-shadow .2s,border-color .2s,transform .15s; }
.card:hover { box-shadow:0 4px 24px rgba(0,0,0,.08); border-color:var(--border2); transform:translateY(-1px); }
.card.archiviato { opacity:.45; }
.card.pinned { border-color:rgba(251,191,36,.5); }
.thread-s1 { position:absolute; bottom:-5px; left:8px; right:8px; height:100%;
  background:var(--surface); border:1px solid var(--border); border-radius:var(--r); z-index:-1; }
.thread-s2 { position:absolute; bottom:-10px; left:16px; right:16px; height:100%;
  background:var(--surface2); border:1px solid var(--border); border-radius:var(--r); z-index:-2; }
.thread-badge { display:inline-flex; align-items:center; gap:3px; font-family:'DM Mono',monospace;
  font-size:9px; background:var(--text); color:var(--bg); border-radius:20px;
  padding:2px 7px; letter-spacing:.04em; margin-bottom:8px; }
.card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.card-box { font-family:'DM Mono',monospace; font-size:9px; background:var(--surface2);
  border:1px solid var(--border); border-radius:4px; padding:2px 6px; color:var(--text3); }
.card-right { display:flex; align-items:center; gap:6px; }
.card-age { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3); }
.pin-btn { background:none; border:none; font-size:13px; cursor:pointer; opacity:.4; padding:0; line-height:1; }
.pin-btn:hover,.pin-btn.on { opacity:1; }
.card-title { font-size:13px; font-weight:500; line-height:1.4; margin-bottom:3px; letter-spacing:-.01em; }
.card-from { font-size:10px; color:var(--text3); font-family:'DM Mono',monospace;
  margin-bottom:7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.card-tags { display:flex; flex-wrap:wrap; gap:3px; margin-bottom:7px; }
.tag { font-family:'DM Mono',monospace; font-size:9px; padding:2px 6px; border-radius:20px; border:1px solid; letter-spacing:.03em; }
.card-note { font-size:10px; color:var(--text3); font-style:italic; margin-bottom:7px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.card-desc { font-size:11px; color:var(--text2); line-height:1.55; margin-bottom:12px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.card-bottom { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.card-badges { display:flex; align-items:center; gap:6px; flex:1; min-width:0; }
.budget-badge { font-family:'DM Mono',monospace; font-size:11px; color:var(--green); font-weight:500; }
.dl-badge { font-family:'DM Mono',monospace; font-size:10px; padding:2px 7px;
  border-radius:20px; border:1px solid; }
.dl-badge.urgent { color:var(--red);   border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.08); }
.dl-badge.soon   { color:var(--amber); border-color:rgba(245,158,11,.3); background:rgba(245,158,11,.08); }
.dl-badge.ok     { color:var(--text3); border-color:var(--border); background:var(--surface2); }

/* STATUS PILL */
.pill { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.05em; text-transform:uppercase;
  padding:4px 8px; border-radius:20px; border:1px solid currentColor; cursor:pointer;
  display:flex; align-items:center; gap:4px; flex-shrink:0; }
.pill-dot { width:4px; height:4px; border-radius:50%; background:currentColor; }
.pill.nuovo     { color:var(--text); }
.pill.visto     { color:var(--text3); }
.pill.applicato { color:var(--green); }
.pill.archiviato{ color:var(--border2); }

/* EMPTY */
.empty { grid-column:1/-1; padding:60px 0; text-align:center; }
.empty-icon  { font-family:'DM Mono',monospace; font-size:28px; color:var(--border2); margin-bottom:12px; }
.empty-title { font-size:14px; font-weight:500; color:var(--text2); margin-bottom:4px; }
.empty-sub   { font-size:12px; color:var(--text3); }

/* OVERLAY + MODALS */
.overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.35);
  backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center;
  padding:20px; animation:fadeIn .18s ease; }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }

.modal { background:var(--surface); border:1px solid var(--border); border-radius:16px;
  padding:26px; max-width:580px; width:100%; max-height:88vh; overflow-y:auto;
  box-shadow:0 24px 64px rgba(0,0,0,.25); animation:slideUp .22s ease; }
.setup-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px;
  padding:26px; max-width:460px; width:100%; max-height:88vh; overflow-y:auto;
  box-shadow:0 24px 64px rgba(0,0,0,.25); animation:slideUp .22s ease; }

.modal-eyebrow { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.08em;
  text-transform:uppercase; color:var(--text3); margin-bottom:5px; }
.modal-title { font-size:16px; font-weight:500; letter-spacing:-.02em; line-height:1.35; margin-bottom:14px; }
.modal-meta { display:flex; gap:20px; flex-wrap:wrap; padding-bottom:14px;
  border-bottom:1px solid var(--border); margin-bottom:14px; }
.meta-item { display:flex; flex-direction:column; gap:2px; }
.meta-key { font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--text3); }
.meta-val { font-family:'DM Mono',monospace; font-size:11px; color:var(--text2); }

.section-label { font-size:9px; text-transform:uppercase; letter-spacing:.1em;
  color:var(--text3); margin-bottom:7px; margin-top:14px; }
.modal-text { font-size:12px; color:var(--text2); line-height:1.75; white-space:pre-wrap; }
.modal-input { font-family:'DM Mono',monospace; font-size:12px; width:100%; background:var(--bg);
  border:1px solid var(--border); border-radius:var(--rs); padding:8px 10px; color:var(--text);
  outline:none; transition:border-color .15s; }
.modal-input:focus { border-color:var(--text); }
.modal-input::placeholder { color:var(--text3); }
.modal-textarea { width:100%; font-family:'DM Sans',sans-serif; font-size:12px; background:var(--bg);
  border:1px solid var(--border); border-radius:var(--rs); padding:9px 10px; color:var(--text);
  outline:none; resize:vertical; min-height:65px; line-height:1.6; transition:border-color .15s; }
.modal-textarea:focus { border-color:var(--text); }
.modal-textarea::placeholder { color:var(--text3); }

/* THREAD LIST */
.thread-list { border:1px solid var(--border); border-radius:var(--rs); overflow:hidden; }
.t-email { background:var(--surface); cursor:pointer; border-top:1px solid var(--border); }
.t-email:first-child { border-top:none; }
.t-email:hover { background:var(--surface2); }
.t-email-hdr { display:flex; justify-content:space-between; align-items:center; padding:10px 13px; }
.t-email-from { font-family:'DM Mono',monospace; font-size:10px; color:var(--text2); }
.t-email-date { font-family:'DM Mono',monospace; font-size:10px; color:var(--text3); }
.t-email-body { padding:10px 13px; font-size:11px; color:var(--text2); line-height:1.7;
  white-space:pre-wrap; border-top:1px solid var(--border); }

/* TAGS */
.tags-row { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; min-height:8px; }
.tag-pill { font-family:'DM Mono',monospace; font-size:10px; padding:3px 8px;
  border-radius:20px; display:flex; align-items:center; gap:5px; }
.tag-x { cursor:pointer; opacity:.6; font-size:10px; }
.tag-x:hover { opacity:1; }
.tag-input-row { display:flex; gap:6px; }
.tag-input { font-family:'DM Mono',monospace; font-size:11px; background:var(--bg);
  border:1px solid var(--border); border-radius:var(--rs); padding:6px 10px;
  color:var(--text); outline:none; flex:1; }
.tag-input:focus { border-color:var(--text); }
.tag-input::placeholder { color:var(--text3); }

/* STATUS PILLS ROW */
.status-row { display:flex; gap:5px; flex-wrap:wrap; }

/* MODAL ACTIONS */
.modal-actions { display:flex; justify-content:space-between; align-items:center;
  margin-top:18px; padding-top:14px; border-top:1px solid var(--border); }
.modal-actions-right { display:flex; gap:8px; }

/* SETUP */
.setup-title { font-size:16px; font-weight:500; margin-bottom:3px; letter-spacing:-.02em; }
.setup-sub   { font-size:12px; color:var(--text3); margin-bottom:18px; line-height:1.6; }
.tabs { display:flex; gap:1px; background:var(--border); border-radius:var(--rs); overflow:hidden; margin-bottom:16px; }
.tab-btn { flex:1; padding:7px; font-size:11px; font-weight:500; background:var(--surface2);
  color:var(--text3); border:none; font-family:'DM Sans',sans-serif; cursor:pointer; }
.tab-btn.active { background:var(--surface); color:var(--text); }
.field { margin-bottom:11px; }
.field label { display:block; font-size:10px; font-weight:500; text-transform:uppercase;
  letter-spacing:.08em; color:var(--text2); margin-bottom:4px; }
.field input,.field select { font-family:'DM Mono',monospace; font-size:12px; width:100%;
  background:var(--bg); border:1px solid var(--border); border-radius:var(--rs);
  padding:7px 10px; color:var(--text); outline:none; transition:border-color .15s; }
.field input:focus,.field select:focus { border-color:var(--text); }
.field input::placeholder { color:var(--text3); }
.setup-note { font-size:11px; color:var(--text3); line-height:1.6; background:var(--bg);
  border-radius:var(--rs); padding:9px; border:1px solid var(--border); }
.setup-actions { display:flex; gap:6px; margin-top:16px; align-items:center; }

/* BOX LIST */
.box-list { display:flex; flex-direction:column; gap:5px; margin-bottom:12px; }
.box-row { display:flex; align-items:center; gap:10px; padding:9px 11px; background:var(--bg);
  border:1px solid var(--border); border-radius:var(--rs); cursor:pointer; }
.box-row:hover { border-color:var(--border2); }
.box-row.on { background:var(--surface); border-color:var(--text); }
.box-check { width:15px; height:15px; border-radius:4px; border:1.5px solid var(--border2);
  display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.box-check.on { background:var(--text); border-color:var(--text); }
.box-check-tick { width:7px; height:4px; border-left:1.5px solid var(--bg); border-bottom:1.5px solid var(--bg); transform:rotate(-45deg) translateY(-1px); }
.box-name { font-family:'DM Mono',monospace; font-size:11px; flex:1; }

/* TOAST */
.toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  background:var(--text); color:var(--bg); border-radius:var(--r); padding:11px 16px;
  display:flex; align-items:center; gap:10px; font-size:13px;
  box-shadow:0 8px 32px rgba(0,0,0,.25); z-index:500; white-space:nowrap;
  animation:slideUp .25s ease; }
.toast-undo { font-family:'DM Mono',monospace; font-size:11px; background:rgba(128,128,128,.2);
  border:1px solid rgba(128,128,128,.3); border-radius:6px; padding:3px 9px; cursor:pointer; color:inherit; }
.toast-undo:hover { background:rgba(128,128,128,.35); }
.toast-bar { position:absolute; bottom:0; left:0; height:2px; background:rgba(128,128,128,.4);
  border-radius:0 0 var(--r) var(--r); animation:toastBar 5s linear forwards; }
@keyframes toastBar { from{width:100%} to{width:0%} }

/* PTR */
.ptr { position:fixed; top:0; left:50%; transform:translateX(-50%); z-index:300;
  display:flex; align-items:center; gap:8px; background:var(--surface);
  border:1px solid var(--border); border-radius:0 0 20px 20px;
  padding:8px 18px; font-family:'DM Mono',monospace; font-size:11px; color:var(--text2);
  box-shadow:0 4px 16px rgba(0,0,0,.1); transition:transform .25s,opacity .25s; }
.ptr.hidden { transform:translateX(-50%) translateY(-100%); opacity:0; }
.ptr-spinner { width:12px; height:12px; border:1.5px solid var(--border2);
  border-top-color:var(--text); border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
.ptr-arrow { font-size:14px; transition:transform .3s; }
.ptr-arrow.ready { transform:rotate(180deg); }
`;

// ─── CARD COMPONENT (outside main to avoid re-render bugs) ───────────────────
function Card({ thread, idx, onOpen, onUpdate, onDelete, filterTag, onFilterBox, onFilterTag }) {
  const isThread = thread.count > 1;
  const nextStatus = STATUSES[(STATUSES.indexOf(thread.status)+1) % STATUSES.length];
  const dl = deadlineInfo(thread.deadline);
  const touchX = useRef(null);

  function onTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if(touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if(dx > 70)  onUpdate(thread.id, { status:"visto" });
    if(dx < -70) onUpdate(thread.id, { status:"archiviato" });
  }

  return (
    <div className="card-wrap" style={{ marginBottom: isThread ? 10 : 0 }}>
      <div className="swipe-bg l">✓</div>
      <div className="swipe-bg r">👁</div>
      <div
        className={`card ${thread.status}${thread.pinned?" pinned":""}`}
        style={{ animationDelay: `${idx*18}ms` }}
        onClick={() => onOpen(thread)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {isThread && <><div className="thread-s1"/>{thread.count>2&&<div className="thread-s2"/>}</>}
        {isThread && <div className="thread-badge">{thread.count} email</div>}

        <div className="card-top">
          <div>
            {thread.box && (
              <span className="card-box" onClick={e=>{ e.stopPropagation(); onFilterBox(thread.box); }}>
                {shortBox(thread.box)}
              </span>
            )}
          </div>
          <div className="card-right">
            <span className="card-age">{ageStr(thread.date)}</span>
            <button
              className={`pin-btn${thread.pinned?" on":""}`}
              onClick={e=>{ e.stopPropagation(); onUpdate(thread.id,{pinned:!thread.pinned}); }}
            >{thread.pinned?"⭐":"☆"}</button>
          </div>
        </div>

        <div className="card-title">{thread.title||"Email"}</div>
        <div className="card-from">{thread.from||""}</div>

        {thread.tags?.length > 0 && (
          <div className="card-tags">
            {thread.tags.slice(0,3).map(tag => {
              const c = tagColor(tag);
              return (
                <span key={tag} className="tag"
                  style={{ background:c.bg, borderColor:c.border, color:c.fg }}
                  onClick={e=>{ e.stopPropagation(); onFilterTag(filterTag===tag?"":tag); }}
                >{tag}</span>
              );
            })}
          </div>
        )}

        {thread.note && <div className="card-note">📝 {thread.note}</div>}
        <div className="card-desc">{thread.desc||""}</div>

        <div className="card-bottom">
          <div className="card-badges">
            {thread.budget && <span className="budget-badge">{thread.budget}</span>}
            {dl && <span className={`dl-badge ${dl.cls}`}>⏰ {dl.label}</span>}
          </div>
          <span
            className={`pill ${thread.status}`}
            onClick={e=>{ e.stopPropagation(); onUpdate(thread.id,{status:nextStatus}); }}
          >
            <span className="pill-dot"/>
            <span>{STATUS_LBL[thread.status]}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [jobs,       setJobs]       = useState([]);
  const [cfg,        setCfg]        = useState({ serverUrl:"", secret:"", host:"pop.securemail.pro", port:"993", email:"", password:"" });
  const [cfgSaved,   setCfgSaved]   = useState(false);
  const [selBoxes,   setSelBoxes]   = useState([]);
  const [uids,       setUids]       = useState({});
  const [autoSync,   setAutoSync]   = useState(0);
  const [lastSync,   setLastSync]   = useState(null);
  const [serverUp,   setServerUp]   = useState(null);

  const [loading,    setLoading]    = useState(false);
  const [loadMsg,    setLoadMsg]    = useState("");
  const [error,      setError]      = useState(null);

  const [filter,     setFilter]     = useState("tutti");
  const [filterBox,  setFilterBox]  = useState("tutti");
  const [filterTag,  setFilterTag]  = useState("");
  const [search,     setSearch]     = useState("");
  const [sortDesc,   setSortDesc]   = useState(true);

  const [selected,   setSelected]   = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editNote,   setEditNote]   = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editTags,   setEditTags]   = useState([]);
  const [editDl,     setEditDl]     = useState("");
  const [tagInput,   setTagInput]   = useState("");

  const [showSetup,  setShowSetup]  = useState(false);
  const [setupTab,   setSetupTab]   = useState("server");
  const [avBoxes,    setAvBoxes]    = useState([]);
  const [boxLoading, setBoxLoading] = useState(false);

  const [toast,      setToast]      = useState(null);
  const [ptrState,   setPtrState]   = useState("idle");

  const toastTimer   = useRef(null);
  const autoSyncRef  = useRef(null);
  const syncFnRef    = useRef(null);
  const ptrStartY    = useRef(null);
  const PTR_THRESH   = 80;
  const [pushStatus, setPushStatus] = useState("idle"); // idle | loading | granted | denied | unsupported

  // ── Push helpers ───────────────────────────────────────────────────────────
  function urlBase64ToUint8Array(b64) {
    const pad = "=".repeat((4 - b64.length % 4) % 4);
    const b   = (b64 + pad).replace(/-/g,"+").replace(/_/g,"/");
    const raw = atob(b);
    return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
  }

  async function enablePush() {
    if(!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported"); return;
    }
    if(!cfg.serverUrl) { setError("Configura prima l'URL del server."); return; }
    setPushStatus("loading");
    try {
      // 1. Registra il service worker
      const reg = await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;

      // 2. Chiedi permesso (deve essere da gesto utente ✓)
      const perm = await Notification.requestPermission();
      if(perm !== "granted") { setPushStatus("denied"); return; }

      // 3. Recupera la chiave pubblica VAPID dal server
      const kr = await fetch(`${cfg.serverUrl}/push/vapidPublicKey`);
      const kd = await kr.json();
      if(!kd.key) throw new Error("VAPID key non disponibile sul server.");

      // 4. Crea la subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(kd.key),
      });

      // 5. Invia la subscription al server
      const h = {"Content-Type":"application/json"};
      if(cfg.secret) h["Authorization"] = `Bearer ${cfg.secret}`;
      await fetch(`${cfg.serverUrl}/push/subscribe`, { method:"POST", headers:h, body:JSON.stringify(sub) });

      setPushStatus("granted");
      ls.set("wr_push","granted");
    } catch(e) {
      setPushStatus("idle");
      setError("Errore push: " + e.message);
    }
  }

  async function disablePush() {
    if(!("serviceWorker" in navigator)) return;
    setPushStatus("loading");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if(reg) {
        const sub = await reg.pushManager.getSubscription();
        if(sub) {
          const h = {"Content-Type":"application/json"};
          if(cfg.secret) h["Authorization"] = `Bearer ${cfg.secret}`;
          await fetch(`${cfg.serverUrl}/push/unsubscribe`, { method:"POST", headers:h, body:JSON.stringify(sub) });
          await sub.unsubscribe();
        }
        await reg.unregister();
      }
      setPushStatus("idle");
      ls.remove("wr_push");
    } catch(e) {
      setPushStatus("idle");
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const j  = ls.get(STORE.jobs);     if(j)  setJobs(j);
    const c  = ls.get(STORE.cfg);      if(c)  { setCfg(c); setCfgSaved(true); }
    const b  = ls.get(STORE.boxes);    if(b)  setSelBoxes(b);
    const u  = ls.get(STORE.uids);     if(u)  setUids(u);
    const as = ls.get(STORE.autosync); if(as) setAutoSync(as);
    const ls2= ls.get(STORE.lastsync); if(ls2)setLastSync(ls2);
    const ps = ls.get("wr_push"); if(ps) setPushStatus(ps);
  }, []);

  useEffect(() => { if(jobs.length) ls.set(STORE.jobs, jobs); }, [jobs]);

  // ── Server health ──────────────────────────────────────────────────────────
  const checkServer = useCallback(async () => {
    if(!cfg.serverUrl) { setServerUp(null); return; }
    try {
      const r = await fetch(cfg.serverUrl+"/health", { signal:AbortSignal.timeout(4000) });
      setServerUp(r.ok);
    } catch { setServerUp(false); }
  }, [cfg.serverUrl]);

  useEffect(() => {
    checkServer();
    const t = setInterval(checkServer, 10000);
    return () => clearInterval(t);
  }, [checkServer]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setCfgField(k, v) {
    setCfg(p => ({ ...p, [k]: v }));
  }

  function updateJob(id, patch) {
    setJobs(p => {
      const next = p.map(j => j.id===id ? {...j,...patch} : j);
      ls.set(STORE.jobs, next);
      return next;
    });
    if(selected?.id === id) setSelected(s => ({...s,...patch}));
  }

  function removeJob(id) {
    let snap = null;
    setJobs(p => {
      snap = p.filter(j => j.id===id);
      const next = p.filter(j => j.id!==id);
      ls.set(STORE.jobs, next);
      return next;
    });
    if(selected?.id === id) setSelected(null);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ snap });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  function undoDelete() {
    if(!toast?.snap) return;
    clearTimeout(toastTimer.current);
    setJobs(p => {
      const ids = new Set(p.map(j=>j.id));
      const restored = toast.snap.filter(j => !ids.has(j.id));
      const next = [...restored, ...p];
      ls.set(STORE.jobs, next);
      return next;
    });
    setToast(null);
  }

  function merge(incoming) {
    setJobs(p => {
      const ids  = new Set(p.map(j=>j.id));
      const keys = new Set(p.map(j=>`${j.title||""}|${j.box||""}|${j.date||""}`));
      const fresh = incoming
        .filter(j => !ids.has(j.id) && !keys.has(`${j.title||""}|${j.box||""}|${j.date||""}`))
        .map(j => ({...j, status:"nuovo"}));
      const next = [...fresh, ...p];
      ls.set(STORE.jobs, next);
      return next;
    });
  }

  // ── Sync ───────────────────────────────────────────────────────────────────
  const doSync = useCallback(async (silent=false) => {
    if(!cfgSaved || !cfg.email || !cfg.serverUrl) {
      if(!silent) setError("Configura prima le credenziali.");
      return;
    }
    if(selBoxes.length === 0) {
      if(!silent) setError("Seleziona almeno una cartella.");
      return;
    }
    if(!silent) { setLoading(true); setError(null); setLoadMsg("Lettura email..."); }
    try {
      const h = {"Content-Type":"application/json"};
      if(cfg.secret) h["Authorization"] = `Bearer ${cfg.secret}`;
      const res = await fetch(`${cfg.serverUrl}/sync`, {
        method:"POST", headers:h,
        body: JSON.stringify({ email:cfg.email, password:cfg.password, host:cfg.host, port:cfg.port, boxes:selBoxes, lastUIDs:uids })
      });
      if(!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if(!data.ok) throw new Error(data.error||"Errore");
      merge(data.jobs||[]);
      if(data.lastUIDs) {
        const newUids = {...uids, ...data.lastUIDs};
        setUids(newUids);
        ls.set(STORE.uids, newUids);
      }
      const now = new Date().toISOString();
      setLastSync(now); ls.set(STORE.lastsync, now);
      if(!silent) setLoadMsg(data.jobs?.length > 0 ? `+${data.jobs.length} nuove` : "Nessuna novità");
    } catch(e) {
      if(!silent) setError(`Errore: ${e.message}`);
    }
    if(!silent) { setLoadMsg(""); setLoading(false); }
  }, [cfg, cfgSaved, selBoxes, uids]);

  syncFnRef.current = doSync;

  // ── Auto-sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if(autoSyncRef.current) clearInterval(autoSyncRef.current);
    if(autoSync > 0) autoSyncRef.current = setInterval(() => syncFnRef.current(true), autoSync*60000);
    return () => { if(autoSyncRef.current) clearInterval(autoSyncRef.current); };
  }, [autoSync]);

  // ── Box toggle ─────────────────────────────────────────────────────────────
  function toggleBox(box) {
    setSelBoxes(prev => {
      const has = prev.includes(box);
      if(has) {
        setJobs(p => { const next=p.filter(j=>j.box!==box); ls.set(STORE.jobs,next); return next; });
        setUids(u => { const next={...u}; delete next[box]; ls.set(STORE.uids,next); return next; });
      }
      const next = has ? prev.filter(b=>b!==box) : [...prev,box];
      ls.set(STORE.boxes, next);
      return next;
    });
  }

  // ── Load boxes ─────────────────────────────────────────────────────────────
  async function loadBoxes() {
    if(!cfg.email||!cfg.password||!cfg.serverUrl) return;
    setBoxLoading(true);
    try {
      const h = {"Content-Type":"application/json"};
      if(cfg.secret) h["Authorization"]=`Bearer ${cfg.secret}`;
      const r = await fetch(`${cfg.serverUrl}/boxes`, { method:"POST", headers:h, body:JSON.stringify({email:cfg.email,password:cfg.password,host:cfg.host,port:cfg.port}) });
      const d = await r.json();
      if(d.ok) {
        const filtered = d.boxes.filter(b=>!SKIP_BOXES.includes(b));
        setAvBoxes(filtered);
        if(selBoxes.length===0) setSelBoxes(filtered);
      }
    } catch{}
    setBoxLoading(false);
  }

  // ── Save config ────────────────────────────────────────────────────────────
  function saveConfig() {
    ls.set(STORE.cfg,      cfg);
    ls.set(STORE.boxes,    selBoxes);
    ls.set(STORE.autosync, autoSync);
    setCfgSaved(true);
    setShowSetup(false);
    setTimeout(checkServer, 500);
  }

  // ── Hard reset ─────────────────────────────────────────────────────────────
  function hardReset() {
    if(!window.confirm("Cancella tutti i dati salvati?")) return;
    Object.values(STORE).forEach(k => ls.remove(k));
    // Also clean up old keys from previous versions
    ["wr_j10","wr_c10","wr_b10","wr_as","wr_ls","wr_jobs9","wr_cfg6","wr_boxes4",
     "wr_jobs8","wr_cfg5","wr_boxes3","wr_jobs7","wr_cfg4","wr_boxes2",
     "wr_jobs6","wr_cfg3","wr_jobs5","wr_cfg2","wr_dark"].forEach(k => ls.remove(k));
    window.location.reload();
  }

  // ── Modal open/save ────────────────────────────────────────────────────────
  function openModal(thread) {
    setSelected(thread);
    setExpandedId(null);
    setEditNote(thread.note||"");
    setEditBudget(thread.budget||"");
    setEditTags(thread.tags||[]);
    setEditDl(thread.deadline||"");
    setTagInput("");
  }

  function saveModal() {
    updateJob(selected.id, { note:editNote, budget:editBudget, tags:editTags, deadline:editDl });
    setSelected(null);
  }

  function addTag(t) {
    const tag = t.trim();
    if(!tag || editTags.includes(tag)) return;
    setEditTags(p => [...p, tag]);
    setTagInput("");
  }

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  function onPTRStart(e) { if(window.scrollY===0) ptrStartY.current=e.touches[0].clientY; }
  function onPTRMove(e) {
    if(ptrStartY.current===null||window.scrollY>0) return;
    const dy = e.touches[0].clientY - ptrStartY.current;
    if(dy < 0) { ptrStartY.current=null; return; }
    setPtrState(dy >= PTR_THRESH ? "ready" : "pulling");
  }
  function onPTREnd() {
    if(ptrStartY.current===null) return;
    ptrStartY.current = null;
    if(ptrState==="ready") {
      setPtrState("refreshing");
      doSync(false).then(() => setPtrState("idle"));
    } else {
      setPtrState("idle");
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const threads = groupIntoThreads(jobs).sort((a,b) => {
    if(a.pinned && !b.pinned) return -1;
    if(!a.pinned && b.pinned) return 1;
    const da=new Date(a.date), db=new Date(b.date);
    return sortDesc ? db-da : da-db;
  });

  const visible = threads.filter(t => {
    if(filter!=="tutti" && t.status!==filter) return false;
    if(filterBox!=="tutti" && t.box!==filterBox) return false;
    if(filterTag && !t.tags?.includes(filterTag)) return false;
    const q = search.toLowerCase();
    return !q || [t.title,t.desc,t.from,t.box,t.note].some(s=>(s||"").toLowerCase().includes(q));
  });

  const stats = {
    nuovi:     threads.filter(t=>t.status==="nuovo").length,
    totale:    threads.length,
    applicato: threads.filter(t=>t.status==="applicato").length,
    email:     jobs.length,
  };

  const allTags  = [...new Set(jobs.flatMap(j=>j.tags||[]))];
  const allBoxes = [...new Set(jobs.map(j=>j.box).filter(Boolean))];

  function fmtLastSync(s) {
    if(!s) return "mai";
    const m = Math.floor((Date.now()-new Date(s))/60000);
    return m<1?"adesso" : m<60?`${m}min fa` : `${Math.floor(m/60)}h fa`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* PTR indicator */}
        {ptrState!=="idle" && (
          <div className={`ptr${ptrState==="idle"?" hidden":""}`}>
            {ptrState==="refreshing"
              ? <><div className="ptr-spinner"/><span>sincronizzazione...</span></>
              : <><span className={`ptr-arrow${ptrState==="ready"?" ready":""}`}>↓</span><span>{ptrState==="ready"?"rilascia":"tira per sync"}</span></>
            }
          </div>
        )}

        {/* TOPBAR */}
        <div className="topbar">
          <div className="logo">
            <div className="logo-dots"><span/><span/><span/><span/></div>
            workradar
          </div>
          <div className="topbar-right">
            {cfg.serverUrl && (
              <div className="server-label">
                <span className={`status-dot${serverUp===true?" on":serverUp===false?" off":""}`}/>
                {serverUp===true?"online":serverUp===false?"offline":"..."}
              </div>
            )}
            <button className={`btn btn-ghost${cfgSaved?" active":""}`} onClick={()=>setShowSetup(true)}>
              {cfgSaved?"configurato":"+ configura"}
            </button>
            <button className="btn btn-solid" onClick={()=>doSync(false)} disabled={loading}>
              {loading?"...":"Sincronizza"}
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div
          className="main"
          onTouchStart={onPTRStart}
          onTouchMove={onPTRMove}
          onTouchEnd={onPTREnd}
        >
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="page-label">nuovi lavori</div>
              <div className="page-count" style={{color:stats.nuovi>0?"var(--text)":"var(--text3)"}}>
                {String(stats.nuovi).padStart(2,"0")}
              </div>
            </div>
            <div className="sync-info">
              <span className={`sync-dot${autoSync>0?" active":""}`}/>
              {autoSync>0?`auto ogni ${autoSync}min`:"auto-sync off"}<br/>
              ultimo: {fmtLastSync(lastSync)}
            </div>
          </div>

          {/* Stats */}
          <div className="stats">
            {[{l:"Thread",n:stats.totale},{l:"Nuovi",n:stats.nuovi},{l:"Applicato",n:stats.applicato},{l:"Email",n:stats.email}].map(s=>(
              <div className="stat" key={s.l}>
                <div className="stat-n">{s.n}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div>
              <div className="progress-label">{loadMsg}</div>
              <div className="progress-bar"><div className="progress-fill"/></div>
            </div>
          )}
          {error && <div className="error-bar">! {error}</div>}

          {/* Toolbar */}
          <div className="toolbar">
            <button className={`btn btn-ghost${filter==="tutti"?" active":""}`} onClick={()=>setFilter("tutti")}>Tutti</button>
            <div className="sep"/>
            {STATUSES.map(s => (
              <button key={s}
                className={`btn btn-ghost${filter===s?" active":""}`}
                onClick={()=>setFilter(p=>p===s?"tutti":s)}
              >
                {STATUS_LBL[s]}
                <span style={{marginLeft:4,opacity:.4,fontFamily:"DM Mono,monospace",fontSize:10}}>
                  {threads.filter(t=>t.status===s).length}
                </span>
              </button>
            ))}
            <div className="sep"/>
            <button className={`btn btn-ghost${sortDesc?" active":""}`} onClick={()=>setSortDesc(p=>!p)}>
              {sortDesc?"↓ rec":"↑ vec"}
            </button>
            <button className="btn btn-ghost" onClick={()=>exportCSV(jobs)} title="Esporta CSV">↓ CSV</button>
            <input className="search" placeholder="cerca..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Active filters */}
          {(filterBox!=="tutti" || filterTag || allBoxes.length>1 || allTags.length>0) && (
            <div className="active-filters">
              {filterBox!=="tutti" && (
                <span className="filter-chip"
                  style={{background:"rgba(59,130,246,.1)",borderColor:"rgba(59,130,246,.3)",color:"#3b82f6"}}
                  onClick={()=>setFilterBox("tutti")}
                >📁 {shortBox(filterBox)} ✕</span>
              )}
              {filterTag && (
                <span className="filter-chip"
                  style={{background:tagColor(filterTag).bg,borderColor:tagColor(filterTag).border,color:tagColor(filterTag).fg}}
                  onClick={()=>setFilterTag("")}
                ># {filterTag} ✕</span>
              )}
              {filterBox==="tutti" && allBoxes.map(box=>(
                <span key={box} className="filter-chip"
                  style={{background:"var(--surface2)",borderColor:"var(--border)",color:"var(--text3)"}}
                  onClick={()=>setFilterBox(box)}
                >📁 {shortBox(box)}</span>
              ))}
              {!filterTag && allTags.map(tag=>{
                const c=tagColor(tag);
                return (
                  <span key={tag} className="filter-chip"
                    style={{background:c.bg,borderColor:c.border,color:c.fg}}
                    onClick={()=>setFilterTag(tag)}
                  ># {tag}</span>
                );
              })}
            </div>
          )}

          {/* Grid */}
          <div className="grid">
            {jobs.length===0 && !loading && (
              <div className="empty">
                <div className="empty-icon">· · ·</div>
                <div className="empty-title">Nessuna email</div>
                <div className="empty-sub">Configura e scegli le cartelle da sincronizzare</div>
              </div>
            )}
            {jobs.length>0 && visible.length===0 && (
              <div className="empty">
                <div className="empty-icon">∅</div>
                <div className="empty-title">Nessun risultato</div>
                <div className="empty-sub">Cambia filtro o ricerca</div>
              </div>
            )}
            {visible.map((t,i) => (
              <Card key={t.id} thread={t} idx={i}
                onOpen={openModal} onUpdate={updateJob} onDelete={removeJob}
                filterTag={filterTag} onFilterBox={setFilterBox} onFilterTag={setFilterTag}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div className="overlay" onClick={saveModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-eyebrow">
              {selected.box?shortBox(selected.box)+" · ":""}{fmtDate(selected.date)}
              {selected.count>1?` · ${selected.count} email`:""}
            </div>
            <div className="modal-title">{selected.title}</div>
            <div className="modal-meta">
              <div className="meta-item"><div className="meta-key">Da</div><div className="meta-val">{selected.from||"—"}</div></div>
              <div className="meta-item"><div className="meta-key">Cartella</div><div className="meta-val">{selected.box?shortBox(selected.box):"—"}</div></div>
              <div className="meta-item"><div className="meta-key">Stato</div><div className="meta-val">{STATUS_LBL[selected.status]}</div></div>
            </div>

            {selected.emails?.length > 1 ? (
              <>
                <div className="section-label">{selected.emails.length} email nel thread</div>
                <div className="thread-list">
                  {selected.emails.map(em => {
                    const open = expandedId===em.id;
                    return (
                      <div key={em.id} className="t-email">
                        <div className="t-email-hdr" onClick={()=>setExpandedId(open?null:em.id)}>
                          <span className="t-email-from">{em.from||"sconosciuto"}</span>
                          <div style={{display:"flex",gap:8,alignItems:"center"}}>
                            <span className="t-email-date">{fmtDate(em.date)}</span>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--text3)"}}>{open?"▲":"▼"}</span>
                          </div>
                        </div>
                        {open && <div className="t-email-body">{em.desc||"—"}</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="section-label">Testo</div>
                <div className="modal-text">{selected.desc||"—"}</div>
              </>
            )}

            <div className="section-label">Budget</div>
            <input className="modal-input" placeholder="es. €500, €50/h..." value={editBudget} onChange={e=>setEditBudget(e.target.value)}/>

            <div className="section-label">Scadenza</div>
            <input className="modal-input" type="date" value={editDl} onChange={e=>setEditDl(e.target.value)}/>

            <div className="section-label">Tag</div>
            <div className="tags-row">
              {editTags.map(tag => {
                const c=tagColor(tag);
                return (
                  <span key={tag} className="tag-pill" style={{background:c.bg,border:`1px solid ${c.border}`,color:c.fg}}>
                    {tag}
                    <span className="tag-x" onClick={()=>setEditTags(p=>p.filter(t=>t!==tag))}>✕</span>
                  </span>
                );
              })}
            </div>
            <div className="tag-input-row">
              <input className="tag-input" placeholder="Aggiungi tag..." value={tagInput}
                onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){ e.preventDefault(); addTag(tagInput); } }}
              />
              <button className="btn btn-ghost" style={{padding:"6px 12px",fontSize:11}} onClick={()=>addTag(tagInput)}>+</button>
            </div>

            <div className="section-label">Note</div>
            <textarea className="modal-textarea" placeholder="Aggiungi una nota..." value={editNote} onChange={e=>setEditNote(e.target.value)}/>

            <div className="section-label">Stato</div>
            <div className="status-row">
              {STATUSES.map(s => (
                <span key={s} className={`pill ${s}`}
                  style={selected.status===s?{background:"var(--border2)"}:{}}
                  onClick={()=>{ updateJob(selected.id,{status:s}); setSelected(p=>({...p,status:s})); }}
                >
                  <span className="pill-dot"/><span>{STATUS_LBL[s]}</span>
                </span>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-danger" onClick={()=>removeJob(selected.id)}>Elimina</button>
              <div className="modal-actions-right">
                <button className={`btn btn-ghost${selected.pinned?" active":""}`}
                  onClick={()=>updateJob(selected.id,{pinned:!selected.pinned})}
                >{selected.pinned?"⭐":"☆"} Pin</button>
                <button className="btn btn-solid" onClick={saveModal}>Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETUP MODAL */}
      {showSetup && (
        <div className="overlay" onClick={()=>setShowSetup(false)}>
          <div className="setup-modal" onClick={e=>e.stopPropagation()}>
            <div className="setup-title">Configurazione</div>
            <div className="setup-sub">Connetti il server e scegli le cartelle.</div>
            <div className="tabs">
              {["server","email","cartelle","sync"].map(t=>(
                <button key={t} className={`tab-btn${setupTab===t?" active":""}`} onClick={()=>{ setSetupTab(t); if(t==="cartelle"&&avBoxes.length===0) loadBoxes(); }}>{t}</button>
              ))}
            </div>

            {setupTab==="server" && <>
              <div className="field"><label>URL Server Railway</label><input value={cfg.serverUrl} onChange={e=>setCfgField("serverUrl",e.target.value)} placeholder="https://smartworking-production.up.railway.app"/></div>
              <div className="field"><label>Secret Token</label><input type="password" value={cfg.secret} onChange={e=>setCfgField("secret",e.target.value)} placeholder="WORKRADAR_SECRET"/></div>
            </>}

            {setupTab==="email" && <>
              <div className="field"><label>Server IMAP</label><input value={cfg.host} onChange={e=>setCfgField("host",e.target.value)} placeholder="pop.securemail.pro"/></div>
              <div className="field"><label>Porta</label><input value={cfg.port} onChange={e=>setCfgField("port",e.target.value)} placeholder="993"/></div>
              <div className="field"><label>Email</label><input type="email" value={cfg.email} onChange={e=>setCfgField("email",e.target.value)} placeholder="tua@email.it"/></div>
              <div className="field"><label>Password</label><input type="password" value={cfg.password} onChange={e=>setCfgField("password",e.target.value)} placeholder="••••••••"/></div>
            </>}

            {setupTab==="cartelle" && <>
              {boxLoading && <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"var(--text3)",padding:14,textAlign:"center"}}>Caricamento...</div>}
              {!boxLoading && avBoxes.length===0 && (
                <div style={{textAlign:"center",padding:14}}>
                  <div style={{fontSize:12,color:"var(--text3)",marginBottom:10}}>Inserisci prima le credenziali email.</div>
                  <button className="btn btn-ghost" onClick={loadBoxes}>Carica cartelle</button>
                </div>
              )}
              {!boxLoading && avBoxes.length>0 && <>
                <div className="box-list">
                  {avBoxes.map(box => {
                    const on = selBoxes.includes(box);
                    return (
                      <div key={box} className={`box-row${on?" on":""}`} onClick={()=>toggleBox(box)}>
                        <div className={`box-check${on?" on":""}`}>{on&&<div className="box-check-tick"/>}</div>
                        <span className="box-name">{box}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="setup-note">{selBoxes.length} di {avBoxes.length} cartelle selezionate.</div>
              </>}
            </>}

            {setupTab==="sync" && <>
              <div className="field">
                <label>Frequenza auto-sync</label>
                <select value={autoSync} onChange={e=>setAutoSync(parseInt(e.target.value))}>
                  <option value={0}>Disattivato</option>
                  <option value={5}>Ogni 5 minuti</option>
                  <option value={15}>Ogni 15 minuti</option>
                  <option value={30}>Ogni 30 minuti</option>
                  <option value={60}>Ogni ora</option>
                </select>
              </div>
              <div className="setup-note">Tieni la pagina aperta per l'auto-sync.</div>

              {/* ── Notifiche Push ── */}
              <div className="field" style={{marginTop:12}}>
                <label>Notifiche Push (iPhone)</label>
                {pushStatus==="unsupported" && (
                  <div className="setup-note" style={{color:"var(--red,#ef4444)"}}>
                    Non supportato su questo browser/dispositivo.
                  </div>
                )}
                {pushStatus==="denied" && (
                  <div className="setup-note" style={{color:"var(--red,#ef4444)"}}>
                    Permesso negato. Vai in Impostazioni Safari → WorkRadar → Notifiche per riabilitarle.
                  </div>
                )}
                {pushStatus==="granted" ? (
                  <button className="btn btn-ghost" style={{fontSize:13,marginTop:4}} onClick={disablePush}>
                    🔕 Disattiva notifiche
                  </button>
                ) : (
                  <button
                    className="btn btn-solid"
                    style={{fontSize:13,marginTop:4}}
                    disabled={pushStatus==="loading"}
                    onClick={enablePush}
                  >
                    {pushStatus==="loading" ? "…" : "🔔 Attiva notifiche push"}
                  </button>
                )}
                <div className="setup-note" style={{marginTop:4}}>
                  Richiede iOS 16.4+ e app salvata sulla Home Screen.<br/>
                  Il server deve avere le variabili VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY impostate.
                </div>
              </div>
            </>}

            <div className="setup-actions">
              <button className="btn btn-danger" style={{fontSize:11}} onClick={hardReset}>Reset</button>
              <div style={{flex:1}}/>
              <button className="btn btn-ghost" onClick={()=>setShowSetup(false)}>Annulla</button>
              <button className="btn btn-solid" onClick={saveConfig}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast">
          <span style={{fontSize:12}}>Email eliminata</span>
          <button className="toast-undo" onClick={undoDelete}>Annulla</button>
          <div className="toast-bar"/>
        </div>
      )}
    </>
  );
}
