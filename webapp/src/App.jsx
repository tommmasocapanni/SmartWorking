import { useState, useEffect, useCallback, useRef } from "react";

const LIGHT = `
  --bg:#f5f5f3;--surface:#fff;--surface2:#f0efed;
  --border:#e8e6e1;--border2:#d8d6d1;
  --text:#111110;--text2:#6b6a67;--text3:#a8a7a4;
  --card-shadow:0 4px 24px rgba(0,0,0,.07);
`;
const DARK = `
  --bg:#0a0a09;--surface:#141412;--surface2:#1c1c1a;
  --border:#252522;--border2:#2e2e2b;
  --text:#f0ede8;--text2:#a8a5a0;--text3:#606060;
  --card-shadow:0 4px 24px rgba(0,0,0,.5);
`;

const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{ ${LIGHT} --nuovo:#111110;--visto:#8a8a87;--applicato:#3d6b4f;--archiviato:#6b6a67;--red:#c0392b;--radius:12px;--radius-sm:8px; }
[data-dark="true"]{ ${DARK} --nuovo:#f0ede8;--visto:#6b6a67;--applicato:#4ade80;--archiviato:#555450; }
html,body{height:100%}
body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
.app{min-height:100vh;background-color:var(--bg);background-image:radial-gradient(circle,var(--border) 1px,transparent 1px);background-size:24px 24px;transition:background .3s}
.topbar{position:sticky;top:0;z-index:100;background:rgba(245,245,243,0.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 20px;height:56px;display:flex;align-items:center;justify-content:space-between;transition:background .3s,border-color .3s}
[data-dark="true"] .topbar{background:rgba(10,10,9,0.92)}
.wordmark{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:0.08em;color:var(--text);display:flex;align-items:center;gap:10px}
.dot-logo{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.dot-logo span{width:5px;height:5px;background:var(--text);border-radius:50%;display:block;transition:background .3s}
.dot-logo span:nth-child(2),.dot-logo span:nth-child(3){background:var(--border2)}
.topbar-right{display:flex;align-items:center;gap:6px}
button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;outline:none;transition:all .15s ease}
.btn{font-size:12px;font-weight:500;padding:8px 14px;border-radius:var(--radius-sm);letter-spacing:.01em}
.btn-solid{background:var(--text);color:var(--bg)}
.btn-solid:hover{opacity:.85}
.btn-solid:disabled{opacity:.4;cursor:not-allowed}
.btn-outline{background:transparent;border:1px solid var(--border2);color:var(--text2);transition:all .15s}
.btn-outline:hover{border-color:var(--text);color:var(--text)}
.btn-outline.on{border-color:var(--text);color:var(--text);background:var(--surface)}
.btn-icon{background:transparent;border:1px solid var(--border2);color:var(--text2);width:34px;height:34px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:14px}
.btn-icon:hover{border-color:var(--text);color:var(--text)}
.btn-icon.on{border-color:var(--text);color:var(--text);background:var(--surface)}
.main{max-width:1200px;margin:0 auto;padding:28px 20px}
.page-header{margin-bottom:28px;display:flex;align-items:flex-end;justify-content:space-between}
.page-title{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;color:var(--text3);text-transform:uppercase;margin-bottom:4px}
.page-count{font-family:'DM Mono',monospace;font-size:38px;font-weight:300;letter-spacing:-.04em;line-height:1}
.autosync-info{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);text-align:right;line-height:1.6}
.autosync-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--text3);margin-right:4px;vertical-align:middle}
.autosync-dot.active{background:#4ade80;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.stats{display:flex;gap:1px;margin-bottom:28px;background:var(--border2);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border2)}
.stat{flex:1;background:var(--surface);padding:14px 14px 12px;transition:background .3s,color .3s}
.stat:first-child{border-radius:var(--radius) 0 0 var(--radius)}
.stat:last-child{border-radius:0 var(--radius) var(--radius) 0}
.stat-n{font-family:'DM Mono',monospace;font-size:20px;letter-spacing:-.03em;margin-bottom:3px;color:var(--text)}
.stat-l{font-size:10px;color:var(--text3);letter-spacing:.04em;text-transform:uppercase;margin-top:2px}
.toolbar{display:flex;align-items:center;gap:5px;margin-bottom:16px;flex-wrap:wrap}
.toolbar-sep{width:1px;height:18px;background:var(--border2);margin:0 2px;flex-shrink:0}
.filter-tags{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px}
.filter-tag-chip{font-family:'DM Mono',monospace;font-size:10px;padding:3px 9px;border-radius:20px;border:1px solid;cursor:pointer;transition:all .15s}
.search{font-family:'DM Mono',monospace;font-size:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:7px 12px;color:var(--text);width:150px;transition:border-color .15s}
.search:focus{outline:none;border-color:var(--text)}
.search::placeholder{color:var(--text3)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}

/* CARD */
.card-wrap{position:relative;overflow:hidden;border-radius:var(--radius)}
.swipe-hint{position:absolute;inset:0;border-radius:var(--radius);display:flex;align-items:center;padding:0 20px;font-size:18px;pointer-events:none;transition:opacity .2s;opacity:0}
.swipe-hint.left{background:linear-gradient(90deg,rgba(74,222,128,.15),transparent);justify-content:flex-start}
.swipe-hint.right{background:linear-gradient(270deg,rgba(239,68,68,.15),transparent);justify-content:flex-end}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;cursor:pointer;transition:box-shadow .2s,border-color .2s,transform .2s,background .3s;position:relative;touch-action:pan-y;user-select:none}
.card:hover{box-shadow:var(--card-shadow);border-color:var(--border2)}
.card.stato-archiviato{opacity:.45}
.card.pinned{border-color:rgba(251,191,36,.5);box-shadow:0 0 0 1px rgba(251,191,36,.2)}
.thread-stack{position:absolute;bottom:-5px;left:8px;right:8px;height:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);z-index:-1}
.thread-stack2{position:absolute;bottom:-10px;left:16px;right:16px;height:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);z-index:-2}
.thread-badge{display:inline-flex;align-items:center;gap:3px;font-family:'DM Mono',monospace;font-size:9px;background:var(--text);color:var(--bg);border-radius:20px;padding:2px 7px;letter-spacing:.04em;margin-bottom:8px}
.card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.card-meta{display:flex;align-items:center;gap:4px}
.card-box{font-family:'DM Mono',monospace;font-size:9px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:var(--text3)}
.card-right{display:flex;align-items:center;gap:6px}
.card-age{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)}
.pin-btn{background:none;border:none;font-size:13px;cursor:pointer;opacity:.4;padding:0;line-height:1;transition:opacity .15s}
.pin-btn:hover{opacity:1}
.pin-btn.on{opacity:1}
.card-title{font-size:13px;font-weight:500;line-height:1.4;margin-bottom:3px;letter-spacing:-.01em}
.card-from{font-size:10px;color:var(--text3);margin-bottom:7px;font-family:'DM Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-tags{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px}
.tag{font-family:'DM Mono',monospace;font-size:9px;padding:2px 6px;border-radius:20px;border:1px solid;letter-spacing:.03em}
.card-note-preview{font-size:10px;color:var(--text3);font-style:italic;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-desc{font-size:11px;color:var(--text2);line-height:1.55;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}
.card-bottom-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.card-budget-badge{font-family:'DM Mono',monospace;font-size:11px;color:var(--applicato);font-weight:500}
.deadline-badge{font-family:'DM Mono',monospace;font-size:10px;padding:2px 7px;border-radius:20px;border:1px solid}
.deadline-badge.urgent{color:#ef4444;border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.08)}
.deadline-badge.soon{color:#f59e0b;border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.08)}
.deadline-badge.ok{color:var(--text3);border-color:var(--border);background:var(--surface2)}
.pill{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.05em;text-transform:uppercase;padding:4px 8px;border-radius:20px;border:1px solid currentColor;cursor:pointer;display:flex;align-items:center;gap:4px;flex-shrink:0}
.pill-dot{width:4px;height:4px;border-radius:50%;background:currentColor}
.pill.nuovo{color:var(--nuovo)}.pill.visto{color:var(--visto)}.pill.applicato{color:var(--applicato)}.pill.archiviato{color:var(--archiviato)}
.empty{grid-column:1/-1;padding:60px 0;text-align:center}
.empty-icon{font-family:'DM Mono',monospace;font-size:28px;color:var(--border2);margin-bottom:12px}
.empty-title{font-size:14px;font-weight:500;color:var(--text2);margin-bottom:4px}
.empty-sub{font-size:12px;color:var(--text3)}
.progress-wrap{margin-bottom:14px}
.progress-label{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);margin-bottom:5px}
.progress-track{height:1px;background:var(--border);overflow:hidden}
.progress-fill{height:100%;background:var(--text);animation:prog 1.8s ease-in-out infinite}
@keyframes prog{0%{width:0%}60%{width:75%}100%{width:100%}}
.err{background:rgba(192,57,43,.08);border:1px solid rgba(192,57,43,.2);border-radius:var(--radius-sm);padding:10px 14px;font-family:'DM Mono',monospace;font-size:11px;color:#e74c3c;margin-bottom:14px}
.server-status{font-family:'DM Mono',monospace;font-size:10px;display:flex;align-items:center;gap:4px;color:var(--text3)}
.server-dot{width:6px;height:6px;border-radius:50%;background:var(--border2)}
.server-dot.online{background:#4ade80}
.server-dot.offline{background:#ef4444}
.overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.4);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .18s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;max-width:580px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);animation:slideUp .22s ease;transition:background .3s,border-color .3s}
@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
.modal-eyebrow{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:5px}
.modal-title{font-size:16px;font-weight:500;letter-spacing:-.02em;line-height:1.35;margin-bottom:14px}
.modal-meta-row{display:flex;gap:20px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.modal-meta-item{display:flex;flex-direction:column;gap:2px}
.modal-meta-key{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)}
.modal-meta-val{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2)}
.modal-sl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:7px;margin-top:14px}
.modal-desc{font-size:12px;color:var(--text2);line-height:1.75;white-space:pre-wrap}
.modal-links{display:flex;flex-direction:column;gap:4px;margin-top:4px}
.modal-link{font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);text-decoration:none;padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.modal-link:hover{border-color:var(--text2)}
.modal-attach{display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px}
.card-attachments{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;margin-bottom:2px}
.card-attach-pill{font-family:'DM Mono',monospace;font-size:9px;padding:2px 6px;border-radius:4px;background:var(--surface2);border:1px solid var(--border);color:var(--text3);display:flex;align-items:center;gap:3px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card-links-row{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.card-link-pill{font-family:'DM Mono',monospace;font-size:9px;padding:2px 6px;border-radius:4px;background:var(--surface2);border:1px solid var(--border);color:var(--text3);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.thread-list{display:flex;flex-direction:column;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden}
.thread-email{background:var(--surface);cursor:pointer;transition:background .15s}
.thread-email:hover{background:var(--surface2)}
.thread-email-header{display:flex;justify-content:space-between;align-items:center;padding:10px 13px}
.thread-email-from{font-family:'DM Mono',monospace;font-size:10px;color:var(--text2)}
.thread-email-date{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)}
.thread-email-body{padding:10px 13px;font-size:11px;color:var(--text2);line-height:1.7;white-space:pre-wrap;border-top:1px solid var(--border)}
.modal-input{font-family:'DM Mono',monospace;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;color:var(--text);outline:none;transition:border-color .15s;width:100%}
.modal-input:focus{border-color:var(--text)}
.modal-input::placeholder{color:var(--text3)}
.modal-note-area{width:100%;font-family:'DM Sans',sans-serif;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 10px;color:var(--text);outline:none;resize:vertical;min-height:65px;transition:border-color .15s;line-height:1.6}
.modal-note-area:focus{border-color:var(--text)}
.modal-note-area::placeholder{color:var(--text3)}
.modal-row{display:flex;gap:8px;align-items:center}
.tags-area{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;min-height:10px}
.tag-pill{font-family:'DM Mono',monospace;font-size:10px;padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:5px}
.tag-pill-x{cursor:pointer;opacity:.6;font-size:10px;line-height:1}
.tag-pill-x:hover{opacity:1}
.tag-input-row{display:flex;gap:6px}
.tag-input{font-family:'DM Mono',monospace;font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;color:var(--text);outline:none;flex:1;transition:border-color .15s}
.tag-input:focus{border-color:var(--text)}
.tag-input::placeholder{color:var(--text3)}
.modal-status{display:flex;gap:5px;flex-wrap:wrap}
.modal-actions{display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)}
.setup-modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;max-width:460px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);animation:slideUp .22s ease;transition:background .3s}
.setup-title{font-size:16px;font-weight:500;margin-bottom:3px;letter-spacing:-.02em}
.setup-sub{font-size:12px;color:var(--text3);margin-bottom:18px;line-height:1.6}
.tabs{display:flex;gap:1px;background:var(--border);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:16px}
.tab{flex:1;padding:7px;font-size:11px;font-weight:500;background:var(--surface2);color:var(--text3);text-align:center;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .15s}
.tab.active{background:var(--surface);color:var(--text)}
.field{margin-bottom:11px}
.field label{display:block;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:4px}
.field input,.field select{font-family:'DM Mono',monospace;font-size:12px;width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:7px 10px;color:var(--text);outline:none;transition:border-color .15s}
.field input:focus,.field select:focus{border-color:var(--text)}
.field input::placeholder{color:var(--text3)}
.setup-actions{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
.boxes-list{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
.box-item{display:flex;align-items:center;gap:10px;padding:9px 11px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:border-color .15s}
.box-item:hover{border-color:var(--border2)}
.box-item.checked{background:var(--surface);border-color:var(--text)}
.box-check{width:15px;height:15px;border-radius:4px;border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.box-check.on{background:var(--text);border-color:var(--text)}
.box-check-inner{width:7px;height:4px;border-left:1.5px solid var(--bg);border-bottom:1.5px solid var(--bg);transform:rotate(-45deg) translateY(-1px)}
.box-name{font-family:'DM Mono',monospace;font-size:11px;color:var(--text);flex:1}
.box-loading{font-family:'DM Mono',monospace;font-size:11px;color:var(--text3);padding:14px;text-align:center}
.setup-note{font-size:11px;color:var(--text3);line-height:1.6;background:var(--bg);border-radius:var(--radius-sm);padding:9px;border:1px solid var(--border)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--bg);border-radius:var(--radius);padding:11px 16px;display:flex;align-items:center;gap:10px;font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,.25);z-index:500;animation:toastIn .25s ease;white-space:nowrap}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.toast-undo{font-family:'DM Mono',monospace;font-size:11px;background:rgba(128,128,128,.2);border:1px solid rgba(128,128,128,.3);border-radius:6px;padding:3px 9px;cursor:pointer;color:inherit;transition:background .15s}
.toast-undo:hover{background:rgba(128,128,128,.35)}
.toast-bar{position:absolute;bottom:0;left:0;height:2px;background:rgba(128,128,128,.4);border-radius:0 0 var(--radius) var(--radius);animation:toastBar 5s linear forwards}
@keyframes toastBar{from{width:100%}to{width:0%}}
.ptr-indicator{position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:300;display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:0 0 20px 20px;padding:8px 18px;font-family:'DM Mono',monospace;font-size:11px;color:var(--text2);box-shadow:0 4px 16px rgba(0,0,0,.1);transition:transform .25s ease,opacity .25s ease}
.ptr-indicator.hidden{transform:translateX(-50%) translateY(-100%);opacity:0}
.ptr-indicator.visible{transform:translateX(-50%) translateY(0);opacity:1}
.ptr-spinner{width:12px;height:12px;border:1.5px solid var(--border2);border-top-color:var(--text);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.ptr-arrow{font-size:14px;transition:transform .3s}
.ptr-arrow.ready{transform:rotate(180deg)}

/* ── BOX COLOR STRIPE ───────────────────────────────────────────────── */
.card-color-stripe{position:absolute;top:0;left:0;width:3px;bottom:0;border-radius:var(--radius) 0 0 var(--radius)}
.card-box-colored{font-family:'DM Mono',monospace;font-size:9px;border-radius:4px;padding:2px 6px;border:1px solid;font-weight:500}

/* ── BOX COLOR PICKER (in setup) ────────────────────────────────────── */
.box-color-row{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px}
.box-color-name{font-family:'DM Mono',monospace;font-size:11px;color:var(--text);flex:1}
.box-palette{display:flex;gap:5px;align-items:center}
.box-palette-dot{width:16px;height:16px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .15s,border-color .15s;flex-shrink:0}
.box-palette-dot:hover{transform:scale(1.2)}
.box-palette-dot.selected{border-color:var(--text);transform:scale(1.15)}
.box-palette-dot.none{background:var(--border2);position:relative}

/* ── VAULT ──────────────────────────────────────────────────────────── */
.vault-modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;max-width:520px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);animation:slideUp .22s ease;transition:background .3s,border-color .3s}
.vault-grid{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.vault-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);transition:border-color .15s}
.vault-item:hover{border-color:var(--border2)}
.vault-item-icon{font-size:18px;flex-shrink:0}
.vault-item-info{flex:1;min-width:0}
.vault-item-name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vault-item-meta{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);margin-top:2px}
.vault-item-actions{display:flex;gap:6px;flex-shrink:0}
.vault-drop{border:1.5px dashed var(--border2);border-radius:var(--radius-sm);padding:22px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;font-family:'DM Mono',monospace;font-size:11px;color:var(--text3)}
.vault-drop:hover,.vault-drop.drag-over{border-color:var(--text);background:var(--surface2);color:var(--text2)}
.vault-attach-list{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.vault-attach-row{display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;cursor:pointer;transition:border-color .15s}
.vault-attach-row:hover{border-color:var(--text2)}
.vault-attach-row-name{font-family:'DM Mono',monospace;font-size:11px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vault-attach-row-size{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)}

/* ── ATTACHMENT PREVIEW ─────────────────────────────────────────────── */
.attach-preview-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.75);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .18s ease}
.attach-preview-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;max-width:720px;width:100%;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.4);animation:slideUp .22s ease}
.attach-preview-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);flex-shrink:0}
.attach-preview-title{font-family:'DM Mono',monospace;font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;margin-right:12px}
.attach-preview-body{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:16px;min-height:200px}
.attach-preview-body img{max-width:100%;max-height:65vh;border-radius:8px;object-fit:contain}
.attach-preview-body iframe{width:100%;height:65vh;border:none;border-radius:8px}
.attach-preview-unsupported{text-align:center;padding:40px;font-family:'DM Mono',monospace;font-size:12px;color:var(--text3)}
.modal-attach-clickable{cursor:pointer;transition:border-color .15s}
.modal-attach-clickable:hover{border-color:var(--text2)}

`;

const STATUSES = ["nuovo","visto","applicato","archiviato"];
const STATUS_LABEL = {nuovo:"Nuovo",visto:"Visto",applicato:"Applicato",archiviato:"Arch."};
const SKIP_BOXES = ["INBOX.Trash","INBOX.Spam","INBOX.Sent","INBOX.Drafts"];
const TAG_COLORS = [
  {bg:"rgba(59,130,246,.12)",border:"rgba(59,130,246,.3)",text:"#3b82f6"},
  {bg:"rgba(16,185,129,.12)",border:"rgba(16,185,129,.3)",text:"#10b981"},
  {bg:"rgba(245,158,11,.12)",border:"rgba(245,158,11,.3)",text:"#f59e0b"},
  {bg:"rgba(239,68,68,.12)",border:"rgba(239,68,68,.3)",text:"#ef4444"},
  {bg:"rgba(139,92,246,.12)",border:"rgba(139,92,246,.3)",text:"#8b5cf6"},
  {bg:"rgba(236,72,153,.12)",border:"rgba(236,72,153,.3)",text:"#ec4899"},
];

// ── Palette colori box ────────────────────────────────────────────────────────
const BOX_PALETTE = [
  {id:"blue",   label:"Blu",      accent:"#3b82f6", bg:"rgba(59,130,246,.10)",  border:"rgba(59,130,246,.30)"},
  {id:"green",  label:"Verde",    accent:"#10b981", bg:"rgba(16,185,129,.10)",  border:"rgba(16,185,129,.30)"},
  {id:"amber",  label:"Ambra",    accent:"#f59e0b", bg:"rgba(245,158,11,.10)",  border:"rgba(245,158,11,.30)"},
  {id:"red",    label:"Rosso",    accent:"#ef4444", bg:"rgba(239,68,68,.10)",   border:"rgba(239,68,68,.30)"},
  {id:"violet", label:"Viola",    accent:"#8b5cf6", bg:"rgba(139,92,246,.10)",  border:"rgba(139,92,246,.30)"},
  {id:"pink",   label:"Rosa",     accent:"#ec4899", bg:"rgba(236,72,153,.10)",  border:"rgba(236,72,153,.30)"},
  {id:"cyan",   label:"Ciano",    accent:"#06b6d4", bg:"rgba(6,182,212,.10)",   border:"rgba(6,182,212,.30)"},
  {id:"orange", label:"Arancio",  accent:"#f97316", bg:"rgba(249,115,22,.10)",  border:"rgba(249,115,22,.30)"},
  {id:"none",   label:"Nessuno",  accent:null,      bg:null,                    border:null},
];

function tagColor(tag) {
  var i=0; for(var c=0;c<tag.length;c++) i+=tag.charCodeAt(c);
  return TAG_COLORS[i%TAG_COLORS.length];
}
function age(d) {
  if(!d) return "";
  var diff=Math.floor((Date.now()-new Date(d))/86400000);
  return diff===0?"oggi":diff===1?"ieri":diff+"g";
}
function fmtDate(d) {
  if(!d) return "-";
  var dt=new Date(d); if(isNaN(dt)) return d;
  return dt.toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"});
}
function shortBox(b) { return b?(b.replace("INBOX.","").toLowerCase()):""; }
function threadKey(titolo,box) {
  var clean=(titolo||"").replace(/^(re|fwd|fw|r|i):\s*/gi,"").trim().toLowerCase();
  return clean+"|"+(box||"");
}
function groupThreads(jobs) {
  var groups={},order=[];
  jobs.forEach(function(job) {
    var key=threadKey(job.titolo,job.box);
    if(!groups[key]){groups[key]=[];order.push(key);}
    groups[key].push(job);
  });
  // Priorità stato: applicato > nuovo > visto > archiviato
  var STATO_PRIORITY={applicato:3,nuovo:2,visto:1,archiviato:0};
  return order.map(function(key) {
    var emails=groups[key];
    // Prendi sempre la email più recente per i metadati, indipendentemente dall'ordine dell'array
    var latest=emails.reduce(function(best,e){
      return new Date(e.data_ricezione)>new Date(best.data_ricezione)?e:best;
    },emails[0]);
    // Prendi lo stato più importante tra tutte le email del thread
    var bestStato=emails.reduce(function(best,e){
      var p=STATO_PRIORITY[e.stato]!=null?STATO_PRIORITY[e.stato]:-1;
      var bp=STATO_PRIORITY[best]!=null?STATO_PRIORITY[best]:-1;
      return p>bp?e.stato:best;
    },emails[0].stato||"nuovo");
    return {id:latest.id,titolo:latest.titolo,descrizione:latest.descrizione,fonte:latest.fonte,fonte_email:latest.fonte_email||"",fonte_dominio:latest.fonte_dominio||"",fonte_nome:latest.fonte_nome||"",box:latest.box,data_ricezione:latest.data_ricezione,stato:bestStato,note:latest.note||"",budget:latest.budget||"",tags:latest.tags||[],deadline:latest.deadline||"",pinned:latest.pinned||false,count:emails.length,emails:emails,links:latest.links||[],allegati:latest.allegati||[]};
  });
}
function deadlineInfo(deadline) {
  if(!deadline) return null;
  var d=new Date(deadline), now=new Date();
  var days=Math.ceil((d-now)/86400000);
  if(days<0) return {label:"scaduta",cls:"urgent"};
  if(days===0) return {label:"oggi!",cls:"urgent"};
  if(days===1) return {label:"domani",cls:"urgent"};
  if(days<=5) return {label:"tra "+days+"g",cls:"soon"};
  return {label:"tra "+days+"g",cls:"ok"};
}
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
function load(key){try{var v=localStorage.getItem(key);return v?JSON.parse(v):null;}catch(e){return null;}}

function CardItem(props) {
  var thread=props.thread, i=props.i, onOpen=props.onOpen, onUpdate=props.onUpdate, filterTag=props.filterTag, onFilterBox=props.onFilterBox, onFilterTag=props.onFilterTag, boxColors=props.boxColors||{};
  var isThread=thread.count>1;
  var nextStato=STATUSES[(STATUSES.indexOf(thread.stato)+1)%STATUSES.length];
  var dl=deadlineInfo(thread.deadline);
  var touchX=useRef(null);
  var boxColor=thread.box?BOX_PALETTE.find(function(p){return p.id===(boxColors[thread.box]||"none");})||BOX_PALETTE[BOX_PALETTE.length-1]:null;
  var hasColor=boxColor&&boxColor.accent;
  function onTouchStart(e){ touchX.current=e.touches[0].clientX; }
  function onTouchEnd(e){
    if(touchX.current===null) return;
    var dx=e.changedTouches[0].clientX-touchX.current;
    touchX.current=null;
    if(dx>70) onUpdate(thread.id,{stato:"visto"});
    else if(dx<-70) onUpdate(thread.id,{stato:"archiviato"});
  }
  return (
    <div className="card-wrap" style={{marginBottom:isThread?10:0}}>
      <div className="swipe-hint left">✓</div>
      <div className="swipe-hint right">👁</div>
      <div
        className={"card stato-"+thread.stato+(thread.pinned?" pinned":"")}
        style={{animationDelay:i*18+"ms", paddingLeft: hasColor?"20px":"16px"}}
        onClick={function(){onOpen(thread);}}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {hasColor&&<div className="card-color-stripe" style={{background:boxColor.accent}}/>}
        {isThread&&<div className="thread-stack"/>}
        {isThread&&thread.count>2&&<div className="thread-stack2"/>}
        {isThread&&<div className="thread-badge">{thread.count} email</div>}
        <div className="card-top">
          <div className="card-meta">
            {thread.box&&(
              hasColor
                ? <span className="card-box-colored" style={{background:boxColor.bg,borderColor:boxColor.border,color:boxColor.accent}} onClick={function(e){e.stopPropagation();onFilterBox(thread.box);}}>{shortBox(thread.box)}</span>
                : <span className="card-box" onClick={function(e){e.stopPropagation();onFilterBox(thread.box);}}>{shortBox(thread.box)}</span>
            )}
          </div>
          <div className="card-right">
            <div className="card-age">{age(thread.data_ricezione)}</div>
            <button className={"pin-btn"+(thread.pinned?" on":"")} onClick={function(e){e.stopPropagation();onUpdate(thread.id,{pinned:!thread.pinned});}} title={thread.pinned?"Rimuovi pin":"Fissa in cima"}>
              {thread.pinned?"⭐":"☆"}
            </button>
          </div>
        </div>
        <div className="card-title">{thread.titolo||"Email"}</div>
        <div className="card-from">{thread.fonte||""}</div>
        {thread.tags&&thread.tags.length>0&&(
          <div className="card-tags">
            {thread.tags.slice(0,3).map(function(tag){
              var c=tagColor(tag);
              return <span key={tag} className="tag" style={{background:c.bg,borderColor:c.border,color:c.text}} onClick={function(e){e.stopPropagation();onFilterTag(filterTag===tag?"":tag);}}>{tag}</span>;
            })}
          </div>
        )}
        {thread.note&&<div className="card-note-preview">📝 {thread.note}</div>}
        {((thread.allegati&&thread.allegati.length>0)||(thread.links&&thread.links.length>0))&&(
          <div className="card-attachments">
            {(thread.allegati||[]).slice(0,3).map(function(a,i){
              var icon=/image/.test(a.contentType)?"🖼️":/pdf/.test(a.contentType)?"📄":/zip|rar/.test(a.contentType)?"🗜️":"📎";
              return <span key={i} className="card-attach-pill">{icon} {a.filename}</span>;
            })}
            {(thread.links||[]).slice(0,2).map(function(l,i){
              var label=l.replace(/^https?:\/\//,"").replace(/\/.*$/,"");
              return <span key={i} className="card-link-pill">🔗 {label}</span>;
            })}
            {((thread.allegati||[]).length+(thread.links||[]).length)>5&&(
              <span className="card-attach-pill" style={{color:"var(--text3)"}}>+{((thread.allegati||[]).length+(thread.links||[]).length)-5}</span>
            )}
          </div>
        )}
        <div className="card-desc">{thread.descrizione||""}</div>
        <div className="card-bottom">
          <div className="card-bottom-left">
            {thread.budget&&<span className="card-budget-badge">{thread.budget}</span>}
            {dl&&<span className={"deadline-badge "+dl.cls}>⏰ {dl.label}</span>}
          </div>
          <span className={"pill "+thread.stato} onClick={function(e){e.stopPropagation();onUpdate(thread.id,{stato:nextStato});}}>
            <span className="pill-dot"/><span>{STATUS_LABEL[thread.stato]}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WorkRadar() {
  var [jobs,setJobs]=useState([]);
  var [dark,setDark]=useState(function(){
    return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  var [undoToast,setUndoToast]=useState(null);
  var [loading,setLoading]=useState(false);
  var [ptrState,setPtrState]=useState('idle'); // idle | pulling | ready | refreshing
  var [ptrY,setPtrY]=useState(0);
  var ptrStartY=useRef(null);
  var PTR_THRESHOLD=80;
  var [loadMsg,setLoadMsg]=useState("");
  var [error,setError]=useState(null);
  var [filter,setFilter]=useState("tutti");
  var [filterBox,setFilterBox]=useState("tutti");
  var [filterTag,setFilterTag]=useState("");
  var [filterCliente,setFilterCliente]=useState("");
  var [search,setSearch]=useState("");
  var [selected,setSelected]=useState(null);
  var [expandedEmail,setExpandedEmail]=useState(null);
  var [editNote,setEditNote]=useState("");
  var [editBudget,setEditBudget]=useState("");
  var [editTags,setEditTags]=useState([]);
  var [editDeadline,setEditDeadline]=useState("");
  var [tagInput,setTagInput]=useState("");
  var [showSetup,setShowSetup]=useState(false);
  var [setupTab,setSetupTab]=useState("server");
  var [serverOnline,setServerOnline]=useState(null);
  var [availableBoxes,setAvailableBoxes]=useState([]);
  var [boxesLoading,setBoxesLoading]=useState(false);
  var [selectedBoxes,setSelectedBoxes]=useState([]);
  var [sortDesc,setSortDesc]=useState(true);
  var [autoSync,setAutoSync]=useState(0);
  var [lastSync,setLastSync]=useState(null);
  var [lastUIDs,setLastUIDs]=useState({});
  var [cfg,setCfg]=useState({serverUrl:"",secret:"",host:"pop.securemail.pro",port:"993",email:"",password:""});
  var [cfgSaved,setCfgSaved]=useState(false);
  var autoSyncRef=useRef(null);
  var syncRef=useRef(null);
  var undoTimerRef=useRef(null);
  var [pushStatus,setPushStatus]=useState("idle"); // idle | loading | granted | denied | unsupported
  // ── Box colors ───────────────────────────────────────────────────────────
  var [boxColors,setBoxColors]=useState(function(){ return load("wr_v1_boxcolors")||{}; });
  // ── Vault ────────────────────────────────────────────────────────────────
  var [showVault,setShowVault]=useState(false);
  var [vaultDocs,setVaultDocs]=useState(function(){ return load("wr_v1_vault")||[]; });
  var [vaultDragOver,setVaultDragOver]=useState(false);
  var vaultInputRef=useRef(null);
  // ── Attachment preview ───────────────────────────────────────────────────
  var [previewAttach,setPreviewAttach]=useState(null);

  // ── Push helpers ────────────────────────────────────────────────────────────
  function urlBase64ToUint8Array(b64){
    var pad="=".repeat((4-b64.length%4)%4);
    var b=(b64+pad).replace(/-/g,"+").replace(/_/g,"/");
    var raw=atob(b);
    return Uint8Array.from([...raw].map(function(c){return c.charCodeAt(0);}));
  }

  async function enablePush(){
    if(!("serviceWorker" in navigator)||!("PushManager" in window)){setPushStatus("unsupported");return;}
    if(!cfg.serverUrl){alert("Configura prima l'URL del server.");return;}
    setPushStatus("loading");
    try{
      var reg=await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;
      var perm=await Notification.requestPermission();
      if(perm!=="granted"){setPushStatus("denied");return;}
      var kr=await fetch(cfg.serverUrl+"/push/vapidPublicKey");
      var kd=await kr.json();
      if(!kd.key) throw new Error("VAPID key non disponibile sul server.");
      var sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(kd.key)});
      var h={"Content-Type":"application/json"};
      if(cfg.secret) h["Authorization"]="Bearer "+cfg.secret;
      await fetch(cfg.serverUrl+"/push/subscribe",{method:"POST",headers:h,body:JSON.stringify(sub)});
      setPushStatus("granted");
      save("wr_v1_push","granted");
    }catch(e){
      setPushStatus("idle");
      alert("Errore push: "+e.message);
    }
  }

  async function disablePush(){
    if(!("serviceWorker" in navigator)) return;
    setPushStatus("loading");
    try{
      var reg=await navigator.serviceWorker.getRegistration("./sw.js");
      if(reg){
        var sub=await reg.pushManager.getSubscription();
        if(sub){
          var h={"Content-Type":"application/json"};
          if(cfg.secret) h["Authorization"]="Bearer "+cfg.secret;
          await fetch(cfg.serverUrl+"/push/unsubscribe",{method:"POST",headers:h,body:JSON.stringify(sub)});
          await sub.unsubscribe();
        }
        await reg.unregister();
      }
      setPushStatus("idle");
      save("wr_v1_push",null);
    }catch(e){setPushStatus("idle");}
  }

  useEffect(function(){
    var j=load("wr_v1_jobs");if(j)setJobs(j);
    var c=load("wr_v1_cfg");if(c){setCfg(c);setCfgSaved(true);}
    var b=load("wr_v1_boxes");if(b)setSelectedBoxes(b);
    var as=load("wr_v1_autosync");if(as)setAutoSync(as);
    var ls=load("wr_v1_lastsync");if(ls)setLastSync(ls);
    var lu=load("wr_v1_uids");if(lu)setLastUIDs(lu);
    var ps=load("wr_v1_push");if(ps)setPushStatus(ps);
    // Ripristina subscription push se si era persa (es. iOS scade il token)
    if(ps==="granted"){
      (async function(){
        try{
          if(!("serviceWorker" in navigator)||!("PushManager" in window)) return;
          var savedCfg=load("wr_v1_cfg");
          if(!savedCfg||!savedCfg.serverUrl) return;
          var reg=await navigator.serviceWorker.register("./sw.js");
          await navigator.serviceWorker.ready;
          var sub=await reg.pushManager.getSubscription();
          if(!sub){
            var kr=await fetch(savedCfg.serverUrl+"/push/vapidPublicKey");
            var kd=await kr.json();
            if(!kd.key) return;
            sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(kd.key)});
          }
          var h={"Content-Type":"application/json"};
          if(savedCfg.secret) h["Authorization"]="Bearer "+savedCfg.secret;
          await fetch(savedCfg.serverUrl+"/push/subscribe",{method:"POST",headers:h,body:JSON.stringify(sub)});
        }catch(err){
          console.warn("[push] restore fallito:",err.message);
        }
      })();
    }
  },[]);

  useEffect(function(){if(jobs.length)save("wr_v1_jobs",jobs);},[jobs]);

  useEffect(function(){
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    function onChange(e){ setDark(e.matches); }
    mq.addEventListener('change',onChange);
    return function(){ mq.removeEventListener('change',onChange); };
  },[]);
  var checkServer=useCallback(async function(){
    if(!cfg.serverUrl){setServerOnline(null);return;}
    try{var r=await fetch(cfg.serverUrl+"/health",{signal:AbortSignal.timeout(4000)});setServerOnline(r.ok);}
    catch(e){setServerOnline(false);}
  },[cfg.serverUrl]);

  useEffect(function(){
    checkServer();
    var t=setInterval(checkServer,10000);
    return function(){clearInterval(t);};
  },[checkServer]);

  function setField(key,val){
    setCfg(function(p){var n={serverUrl:p.serverUrl,secret:p.secret,host:p.host,port:p.port,email:p.email,password:p.password};n[key]=val;return n;});
  }

  function toggleBox(box){
    setSelectedBoxes(function(prev){
      var idx=prev.indexOf(box);
      if(idx!==-1){
        // Removing box: delete its emails and reset its UID
        setJobs(function(js){
          var next=js.filter(function(j){return j.box!==box;});
          save("wr_v1_jobs",next);return next;
        });
        setLastUIDs(function(prev){
          var next=Object.assign({},prev);
          delete next[box];
          save("wr_v1_uids",next);
          return next;
        });
      }
      var next=idx===-1?prev.concat([box]):prev.filter(function(b){return b!==box;});
      save("wr_v1_boxes",next);
      return next;
    });
  }

  function saveCfg(){
    save("wr_v1_cfg",cfg);
    save("wr_v1_boxes",selectedBoxes);
    save("wr_v1_autosync",autoSync);
    setCfgSaved(true);
    setShowSetup(false);
    setTimeout(checkServer,500);
  }

  async function loadBoxes(){
    if(!cfg.email||!cfg.password||!cfg.serverUrl)return;
    setBoxesLoading(true);
    try{
      var h={"Content-Type":"application/json"};if(cfg.secret)h["Authorization"]="Bearer "+cfg.secret;
      var res=await fetch(cfg.serverUrl+"/boxes",{method:"POST",headers:h,body:JSON.stringify({email:cfg.email,password:cfg.password,host:cfg.host,port:cfg.port})});
      var data=await res.json();
      if(data.ok){var f=data.boxes.filter(function(b){return SKIP_BOXES.indexOf(b)===-1;});setAvailableBoxes(f);if(selectedBoxes.length===0)setSelectedBoxes(f);}
    }catch(e){}
    setBoxesLoading(false);
  }

  function merge(incoming){
    setJobs(function(prev){
      // Dedup by id AND by titolo+box combo to avoid duplicates across syncs
      var ids=new Set(prev.map(function(j){return j.id;}));
      var keys=new Set(prev.map(function(j){return (j.titolo||"")+"||"+(j.box||"")+"||"+(j.data_ricezione||"");}));
      var fresh=incoming.filter(function(j){
        if(ids.has(j.id)) return false;
        var k=(j.titolo||"")+"||"+(j.box||"")+"||"+(j.data_ricezione||"");
        if(keys.has(k)) return false;
        return true;
      });
      // Preserve user edits (note, tags, stato, budget, deadline, pinned) on existing jobs
      var next=fresh.map(function(j){return Object.assign({},j,{stato:"nuovo"});}).concat(prev);
      save("wr_v1_jobs",next);
      return next;
    });
  }

  var doSync=useCallback(async function(silent){
    if(!cfgSaved||!cfg.email||!cfg.serverUrl){if(!silent)setError("Configura prima le credenziali.");return;}
    if(selectedBoxes.length===0){if(!silent)setError("Seleziona almeno una cartella.");return;}
    if(!silent){setLoading(true);setError(null);setLoadMsg("Lettura email...");}
    try{
      var h={"Content-Type":"application/json"};if(cfg.secret)h["Authorization"]="Bearer "+cfg.secret;
      var res=await fetch(cfg.serverUrl+"/sync",{method:"POST",headers:h,body:JSON.stringify({email:cfg.email,password:cfg.password,host:cfg.host,port:cfg.port,boxes:selectedBoxes,lastUIDs:lastUIDs})});
      if(!res.ok)throw new Error("Server "+res.status);
      var data=await res.json();if(!data.ok)throw new Error(data.error||"Errore");
      merge(data.jobs||[]);
      // Save updated UIDs for next incremental sync
      if(data.lastUIDs){
        setLastUIDs(function(prev){
          var next=Object.assign({},prev,data.lastUIDs);
          save("wr_v1_uids",next);
          return next;
        });
      }
      var now=new Date().toISOString();setLastSync(now);save("wr_v1_lastsync",now);
      var count=data.jobs||[];
      if(!silent)setLoadMsg(count.length>0?"+"+count.length+" nuove email":"Nessuna novità");
    }catch(e){if(!silent)setError("Errore: "+e.message);}
    if(!silent){setLoadMsg("");setLoading(false);}
  },[cfg,cfgSaved,selectedBoxes]);

  syncRef.current=doSync;

  useEffect(function(){
    if(autoSyncRef.current)clearInterval(autoSyncRef.current);
    if(autoSync>0)autoSyncRef.current=setInterval(function(){syncRef.current(true);},autoSync*60000);
    return function(){if(autoSyncRef.current)clearInterval(autoSyncRef.current);};
  },[autoSync]);

  function updateJob(id,patch){
    setJobs(function(prev){
      // Se si aggiorna lo stato, propagalo a tutte le email dello stesso thread (stesso titolo+box)
      var baseJob=prev.find(function(j){return j.id===id;});
      var next=prev.map(function(j){
        if(j.id===id) return Object.assign({},j,patch);
        // Propaga stato e pinned a tutte le email del thread
        if(patch.stato!==undefined&&baseJob&&threadKey(j.titolo,j.box)===threadKey(baseJob.titolo,baseJob.box)){
          return Object.assign({},j,{stato:patch.stato});
        }
        if(patch.pinned!==undefined&&baseJob&&threadKey(j.titolo,j.box)===threadKey(baseJob.titolo,baseJob.box)){
          return Object.assign({},j,{pinned:patch.pinned});
        }
        return j;
      });
      save("wr_v1_jobs",next);return next;
    });
    if(selected&&selected.id===id)setSelected(function(s){return Object.assign({},s,patch);});
  }

  function deleteThread(threadId,e){
    if(e)e.stopPropagation();
    var snapshot=null;
    setJobs(function(prev){
      snapshot=prev.filter(function(j){return j.id===threadId;});
      var next=prev.filter(function(j){return j.id!==threadId;});
      save("wr_v1_jobs",next);return next;
    });
    if(selected&&selected.id===threadId)setSelected(null);
    if(undoTimerRef.current)clearTimeout(undoTimerRef.current);
    setUndoToast({id:threadId,snapshot:snapshot||[]});
    undoTimerRef.current=setTimeout(function(){setUndoToast(null);},5000);
  }

  function undoDelete(){
    if(!undoToast)return;
    clearTimeout(undoTimerRef.current);
    setJobs(function(prev){
      var ids=new Set(prev.map(function(j){return j.id;}));
      var restored=undoToast.snapshot.filter(function(j){return !ids.has(j.id);});
      var next=restored.concat(prev);save("wr_v1_jobs",next);return next;
    });
    setUndoToast(null);
  }

  function openModal(thread){
    setSelected(thread);setExpandedEmail(null);
    setEditNote(thread.note||"");setEditBudget(thread.budget||"");
    setEditTags(thread.tags||[]);setEditDeadline(thread.deadline||"");setTagInput("");
  }

  function saveModal(){
    updateJob(selected.id,{note:editNote,budget:editBudget,tags:editTags,deadline:editDeadline});
    setSelected(null);
  }

  function addTag(tag){
    var t=tag.trim();if(!t||editTags.indexOf(t)!==-1)return;
    setEditTags(function(p){return p.concat([t]);});setTagInput("");
  }


  // ── Box colors helpers ────────────────────────────────────────────────────
  function setBoxColor(box, colorId){
    setBoxColors(function(prev){
      var next=Object.assign({},prev);
      next[box]=colorId;
      save("wr_v1_boxcolors",next);
      return next;
    });
  }

  // ── Vault helpers ─────────────────────────────────────────────────────────
  function vaultAddFiles(files){
    Array.from(files).forEach(function(file){
      var reader=new FileReader();
      reader.onload=function(e){
        var doc={id:Date.now()+Math.random(),name:file.name,size:file.size,type:file.type,dataUrl:e.target.result,addedAt:new Date().toISOString()};
        setVaultDocs(function(prev){
          var next=prev.concat([doc]);
          // localStorage has ~5MB limit; skip if too big
          try{save("wr_v1_vault",next);}catch(err){next=prev;}
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  }
  function vaultDelete(id){
    setVaultDocs(function(prev){
      var next=prev.filter(function(d){return d.id!==id;});
      save("wr_v1_vault",next);
      return next;
    });
  }
  function vaultAttachToSelected(doc){
    if(!selected) return;
    var existing=selected.vaultAttachments||[];
    if(existing.some(function(d){return d.id===doc.id;})) return;
    updateJob(selected.id,{vaultAttachments:existing.concat([doc])});
    setSelected(function(s){return Object.assign({},s,{vaultAttachments:(s.vaultAttachments||[]).concat([doc])});});
  }
  function vaultDetachFromSelected(docId){
    if(!selected) return;
    var next=(selected.vaultAttachments||[]).filter(function(d){return d.id!==docId;});
    updateJob(selected.id,{vaultAttachments:next});
    setSelected(function(s){return Object.assign({},s,{vaultAttachments:next});});
  }
  function fmtFileSize(bytes){
    if(bytes>1048576) return (bytes/1048576).toFixed(1)+"MB";
    if(bytes>1024) return (bytes/1024).toFixed(0)+"KB";
    return bytes+"B";
  }
  function fileIcon(type){
    if(!type) return "📎";
    if(/image/.test(type)) return "🖼️";
    if(/pdf/.test(type)) return "📄";
    if(/zip|rar|7z/.test(type)) return "🗜️";
    if(/word|doc/.test(type)) return "📝";
    if(/sheet|excel|xls/.test(type)) return "📊";
    return "📎";
  }
  function openAttachPreview(name, dataUrl, contentType){
    setPreviewAttach({name:name, dataUrl:dataUrl, contentType:contentType||""});
  }

  var allTags=[...new Set(jobs.flatMap(function(j){return j.tags||[];}))];
  var allBoxes=[...new Set(jobs.map(function(j){return j.box;}).filter(Boolean))];

  var threads=groupThreads(jobs).sort(function(a,b){
    if(a.pinned&&!b.pinned)return -1;if(!a.pinned&&b.pinned)return 1;
    var da=new Date(a.data_ricezione).getTime(),db=new Date(b.data_ricezione).getTime();
    return sortDesc?db-da:da-db;
  });

  // Clienti ricorrenti — chiave universale che funziona anche senza fonte_dominio
  function getClienteKey(fonte, fonte_dominio, fonte_email){
    if(fonte_dominio) return fonte_dominio;
    if(fonte_email && fonte_email.includes("@")) return fonte_email.split("@")[1].toLowerCase();
    var m=(fonte||"").match(/<[^>]+@([^>]+)>/);
    if(m) return m[1].toLowerCase();
    return (fonte||"").trim();
  }
  var clientiMap={};
  threads.forEach(function(t){
    var key=getClienteKey(t.fonte, t.fonte_dominio, t.fonte_email);
    if(!key) return;
    if(!clientiMap[key]) clientiMap[key]={chiave:key,nome:t.fonte_nome||(t.fonte||"").replace(/<[^>]+>/g,"").trim()||key,count:0};
    clientiMap[key].count++;
  });
  var clientiRicorrenti=Object.values(clientiMap).filter(function(c){return c.count>1;}).sort(function(a,b){return b.count-a.count;});

  var filteredThreads=threads.filter(function(t){
    if(filter!=="tutti"&&t.stato!==filter)return false;
    if(filterBox!=="tutti"&&t.box!==filterBox)return false;
    if(filterTag&&(t.tags||[]).indexOf(filterTag)===-1)return false;
    if(filterCliente&&getClienteKey(t.fonte,t.fonte_dominio,t.fonte_email)!==filterCliente) return false;
    var q=search.toLowerCase();
    return !q||[t.titolo,t.descrizione,t.fonte,t.box,t.note].some(function(s){return (s||"").toLowerCase().indexOf(q)!==-1;});
  });

  var stats={totale:threads.length,nuovo:threads.filter(function(t){return t.stato==="nuovo";}).length,applicato:threads.filter(function(t){return t.stato==="applicato";}).length,email:jobs.length};
  var serverClass="server-dot"+(serverOnline===true?" online":serverOnline===false?" offline":"");
  function fmtLastSync(ls){if(!ls)return "mai";var diff=Math.floor((Date.now()-new Date(ls))/60000);if(diff<1)return "adesso";if(diff<60)return diff+"min fa";return Math.floor(diff/60)+"h fa";}


  function onTouchStartPtr(e){
    if(window.scrollY===0) ptrStartY.current=e.touches[0].clientY;
  }
  function onTouchMovePtr(e){
    if(ptrStartY.current===null||window.scrollY>0)return;
    var dy=e.touches[0].clientY-ptrStartY.current;
    if(dy<0){ptrStartY.current=null;return;}
    var capped=Math.min(dy,PTR_THRESHOLD*1.4);
    setPtrY(capped);
    setPtrState(dy>=PTR_THRESHOLD?"ready":"pulling");
  }
  function onTouchEndPtr(){
    if(ptrStartY.current===null)return;
    ptrStartY.current=null;
    if(ptrState==="ready"){
      setPtrState("refreshing");
      setPtrY(0);
      doSync(false).then(function(){ setPtrState("idle"); });
    } else {
      setPtrY(0);
      setPtrState("idle");
    }
  }

  return (
    <>
      <style>{G}</style>
      <div className="app" data-dark={dark?"true":"false"}>
        <div className="topbar">
          <div className="wordmark">
            <div className="dot-logo"><span/><span/><span/><span/></div>
            workradar
          </div>
          <div className="topbar-right">
            {cfg.serverUrl&&<div className="server-status"><span className={serverClass}/>{serverOnline===true?"online":serverOnline===false?"offline":"..."}</div>}
            <button className={"btn btn-outline"+(showVault?" on":"")} onClick={function(){setShowVault(true);}}>🗄️{vaultDocs.length>0?" ("+vaultDocs.length+")":""}</button>
            <button className={"btn btn-outline"+(cfgSaved?" on":"")} onClick={function(){setShowSetup(true);}}>{cfgSaved?"configurato":"+ configura"}</button>
            <button className="btn btn-solid" onClick={function(){doSync(false);}} disabled={loading}>{loading?"...":"Sincronizza"}</button>
          </div>
        </div>

        {ptrState!=="idle"&&(
          <div className={"ptr-indicator"+(ptrState==="idle"?" hidden":" visible")}>
            {ptrState==="refreshing"
              ? <><div className="ptr-spinner"/><span>sincronizzazione...</span></>
              : <><span className={"ptr-arrow"+(ptrState==="ready"?" ready":"")}>↓</span><span>{ptrState==="ready"?"rilascia per sync":"tira per aggiornare"}</span></>
            }
          </div>
        )}
        <div className="main" onTouchStart={onTouchStartPtr} onTouchMove={onTouchMovePtr} onTouchEnd={onTouchEndPtr} style={{paddingTop: ptrY>0 ? 28+ptrY*0.4+"px" : undefined, transition: ptrY===0?"padding .25s ease":undefined}}>
          <div className="page-header">
            <div>
              <div className="page-title">nuovi lavori</div>
              <div className="page-count" style={{color:stats.nuovo>0?"var(--text)":"var(--text3)"}}>{String(stats.nuovo).padStart(2,"0")}</div>
            </div>
            <div className="autosync-info">
              <span className={"autosync-dot"+(autoSync>0?" active":"")}/>
              {autoSync>0?"auto ogni "+autoSync+"min":"auto-sync off"}<br/>
              ultimo: {fmtLastSync(lastSync)}
            </div>
          </div>

          <div className="stats">
            {[{l:"Thread",n:stats.totale},{l:"Nuovi",n:stats.nuovo},{l:"Applicato",n:stats.applicato},{l:"Email",n:stats.email}].map(function(s){
              return <div className="stat" key={s.l}><div className="stat-n">{s.n}</div><div className="stat-l">{s.l}</div></div>;
            })}
          </div>

          {loading&&<div className="progress-wrap"><div className="progress-label">{loadMsg}</div><div className="progress-track"><div className="progress-fill"/></div></div>}
          {error&&<div className="err">! {error}</div>}

          <div className="toolbar">
            <button className={"btn btn-outline"+(filter==="tutti"?" on":"")} onClick={function(){setFilter("tutti");}}>Tutti</button>
            <div className="toolbar-sep"/>
            {STATUSES.map(function(s){
              var count=threads.filter(function(t){return t.stato===s;}).length;
              return <button key={s} className={"btn btn-outline"+(filter===s?" on":"")} onClick={function(){ setFilter(function(prev){ return prev===s?"tutti":s; }); }}>{STATUS_LABEL[s]}<span style={{marginLeft:4,opacity:.4,fontFamily:"DM Mono,monospace",fontSize:10}}>{count}</span></button>;
            })}
            <div className="toolbar-sep"/>
            <button className={"btn btn-outline"+(sortDesc?" on":"")} onClick={function(){setSortDesc(function(v){return !v;});}}>{sortDesc?"↓ rec":"↑ vec"}</button>
            <input className="search" placeholder="cerca..." value={search} onChange={function(e){setSearch(e.target.value);}}/>
          </div>

          {(filterBox!=="tutti"||filterTag||filterCliente||allBoxes.length>1||allTags.length>0||clientiRicorrenti.length>0)&&(
            <div className="filter-tags">
              {filterBox!=="tutti"&&(
                <span className="filter-tag-chip" style={{background:"rgba(59,130,246,.1)",borderColor:"rgba(59,130,246,.3)",color:"#3b82f6"}} onClick={function(){setFilterBox("tutti");}}>
                  📁 {shortBox(filterBox)} ✕
                </span>
              )}
              {filterTag&&(
                <span className="filter-tag-chip" style={Object.assign({},tagColor(filterTag),{border:"1px solid"})} onClick={function(){setFilterTag("");}}>
                  # {filterTag} ✕
                </span>
              )}
              {filterCliente&&(
                <span className="filter-tag-chip" style={{background:"rgba(139,92,246,.1)",borderColor:"rgba(139,92,246,.3)",color:"#8b5cf6"}} onClick={function(){setFilterCliente("");}}>
                  👤 {filterCliente} ✕
                </span>
              )}
              {filterBox==="tutti"&&allBoxes.map(function(box){
                return <span key={box} className="filter-tag-chip" style={{background:"var(--surface2)",borderColor:"var(--border)",color:"var(--text3)"}} onClick={function(){setFilterBox(box);}}>📁 {shortBox(box)}</span>;
              })}
              {!filterTag&&allTags.map(function(tag){
                var c=tagColor(tag);
                return <span key={tag} className="filter-tag-chip" style={{background:c.bg,borderColor:c.border,color:c.text}} onClick={function(){setFilterTag(tag);}}>#{tag}</span>;
              })}
              {!filterCliente&&clientiRicorrenti.slice(0,5).map(function(c){
                return <span key={c.chiave} className="filter-tag-chip" style={{background:"rgba(139,92,246,.08)",borderColor:"rgba(139,92,246,.2)",color:"#8b5cf6"}} onClick={function(){setFilterCliente(c.chiave);}}>👤 {c.nome.split(" ")[0]||c.chiave} ({c.count})</span>;
              })}
            </div>
          )}

          <div className="grid" style={{animation:"rise .3s ease"}}>
            {threads.length===0&&!loading&&(
              <div className="empty"><div className="empty-icon">. . .</div><div className="empty-title">Nessuna email</div><div className="empty-sub">Configura e scegli le cartelle da sincronizzare</div></div>
            )}
            {threads.length>0&&filteredThreads.length===0&&(
              <div className="empty"><div className="empty-icon">0</div><div className="empty-title">Nessun risultato</div></div>
            )}
            {filteredThreads.map(function(thread,i){
              return <CardItem key={thread.id} thread={thread} i={i} onOpen={openModal} onUpdate={updateJob} filterTag={filterTag} onFilterBox={setFilterBox} onFilterTag={setFilterTag} boxColors={boxColors}/>;
            })}
          </div>
        </div>
      </div>

      {selected&&(
        <div className="overlay" onClick={saveModal}>
          <div className="modal" onClick={function(e){e.stopPropagation();}}>
            <div className="modal-eyebrow">{selected.box?shortBox(selected.box)+" · ":""}{fmtDate(selected.data_ricezione)}{selected.count>1?" · "+selected.count+" email":""}</div>
            <div className="modal-title">{selected.titolo}</div>
            <div className="modal-meta-row">
              <div className="modal-meta-item"><div className="modal-meta-key">Da</div><div className="modal-meta-val">{selected.fonte||"-"}</div></div>
              <div className="modal-meta-item"><div className="modal-meta-key">Cartella</div><div className="modal-meta-val">{selected.box?shortBox(selected.box):"-"}</div></div>
              <div className="modal-meta-item"><div className="modal-meta-key">Stato</div><div className="modal-meta-val">{STATUS_LABEL[selected.stato]}</div></div>
            </div>

            {selected.emails&&selected.emails.length>1?(
              <>
                <div className="modal-sl">{selected.emails.length} email — tocca per espandere</div>
                <div className="thread-list">
                  {selected.emails.map(function(em){
                    var isExp=expandedEmail===em.id;
                    return (
                      <div key={em.id} className="thread-email">
                        <div className="thread-email-header" onClick={function(){setExpandedEmail(isExp?null:em.id);}}>
                          <div className="thread-email-from">{em.fonte||"sconosciuto"}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div className="thread-email-date">{fmtDate(em.data_ricezione)}</div>
                            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--text3)"}}>{isExp?"▲":"▼"}</span>
                          </div>
                        </div>
                        {isExp&&<div className="thread-email-body">{em.descrizione||"-"}</div>}
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

            {((selected.links&&selected.links.length>0)||(selected.allegati&&selected.allegati.length>0))&&(
              <>
                <div className="modal-sl">📎 Allegati e link</div>
                <div className="modal-links">
                  {(selected.allegati||[]).map(function(a,i){
                    var icon=/image/.test(a.contentType)?"🖼️":/pdf/.test(a.contentType)?"📄":/zip|rar/.test(a.contentType)?"🗜️":"📎";
                    var size=a.size>1048576?(a.size/1048576).toFixed(1)+"MB":a.size>1024?(a.size/1024).toFixed(0)+"KB":a.size+"B";
                    var canPreview=a.dataUrl&&(/image/.test(a.contentType)||/pdf/.test(a.contentType));
                    return <div key={i} className={"modal-attach"+(canPreview?" modal-attach-clickable":"")} onClick={function(){if(canPreview)openAttachPreview(a.filename,a.dataUrl,a.contentType);}}>
                      <span>{icon}</span><span style={{flex:1}}>{a.filename}</span>
                      <span style={{opacity:.5,fontSize:10}}>{size}</span>
                      {canPreview&&<span style={{fontSize:10,color:"var(--text3)"}}>👁</span>}
                    </div>;
                  })}
                  {(selected.links||[]).map(function(l,i){
                    var label=l.replace(/^https?:\/\//,"").replace(/\/.*$/,"");
                    return <a key={i} className="modal-link" href={l} target="_blank" rel="noopener noreferrer">🔗 {label}</a>;
                  })}
                </div>
              </>
            )}

            <div className="modal-sl">🗄️ Dal Vault</div>
            {vaultDocs.length===0?(
              <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"var(--text3)",padding:"6px 0"}}>Nessun documento nel vault. <span style={{cursor:"pointer",textDecoration:"underline"}} onClick={function(){setShowVault(true);}}>Aggiungi →</span></div>
            ):(
              <div className="vault-attach-list">
                {vaultDocs.map(function(doc){
                  var attached=(selected.vaultAttachments||[]).some(function(d){return d.id===doc.id;});
                  var canPreview=/image/.test(doc.type)||/pdf/.test(doc.type);
                  return (
                    <div key={doc.id} className="vault-attach-row" onClick={function(){if(canPreview)openAttachPreview(doc.name,doc.dataUrl,doc.type);}} style={{opacity:attached?1:0.7}}>
                      <span>{fileIcon(doc.type)}</span>
                      <span className="vault-attach-row-name">{doc.name}</span>
                      <span className="vault-attach-row-size">{fmtFileSize(doc.size)}</span>
                      {canPreview&&<span style={{fontSize:10,color:"var(--text3)"}}>👁</span>}
                      <button className={"btn btn-outline"} style={{padding:"2px 8px",fontSize:10,flexShrink:0,color:attached?"var(--red)":"var(--text2)"}} onClick={function(e){e.stopPropagation();attached?vaultDetachFromSelected(doc.id):vaultAttachToSelected(doc);}}>
                        {attached?"✕ Rimuovi":"+ Allega"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-sl">Budget</div>
            <input className="modal-input" placeholder="es. €500, €50/h..." value={editBudget} onChange={function(e){setEditBudget(e.target.value);}}/>

            <div className="modal-sl">Scadenza</div>
            <input className="modal-input" type="date" value={editDeadline} onChange={function(e){setEditDeadline(e.target.value);}}/>

            <div className="modal-sl">Tag</div>
            <div className="tags-area">
              {editTags.map(function(tag){
                var c=tagColor(tag);
                return <span key={tag} className="tag-pill" style={{background:c.bg,border:"1px solid "+c.border,color:c.text}}>{tag}<span className="tag-pill-x" onClick={function(){setEditTags(function(p){return p.filter(function(t){return t!==tag;});});}}>✕</span></span>;
              })}
            </div>
            <div className="tag-input-row">
              <input className="tag-input" placeholder="Aggiungi tag..." value={tagInput} onChange={function(e){setTagInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"||e.key===","){e.preventDefault();addTag(tagInput);}}}/>
              <button className="btn btn-outline" style={{padding:"6px 12px",fontSize:11}} onClick={function(){addTag(tagInput);}}>+</button>
            </div>

            <div className="modal-sl">Note private</div>
            <textarea className="modal-note-area" placeholder="Aggiungi una nota..." value={editNote} onChange={function(e){setEditNote(e.target.value);}}/>

            <div className="modal-sl">Stato</div>
            <div className="modal-status">
              {STATUSES.map(function(s){
                return <span key={s} className={"pill "+s} style={selected.stato===s?{background:"var(--border2)"}:{}} onClick={function(){updateJob(selected.id,{stato:s});setSelected(function(sel){return Object.assign({},sel,{stato:s});});}}><span className="pill-dot"/><span>{STATUS_LABEL[s]}</span></span>;
              })}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" style={{color:"var(--red)",borderColor:"rgba(192,57,43,.3)"}} onClick={function(){deleteThread(selected.id,null);}}>Elimina</button>
              <div style={{display:"flex",gap:8}}>
                <button className={"btn btn-outline"+(selected.pinned?" on":"")} onClick={function(){updateJob(selected.id,{pinned:!selected.pinned});}}>{selected.pinned?"⭐ Pinnato":"☆ Fissa"}</button>
                <button className="btn btn-solid" onClick={saveModal}>Salva</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSetup&&(
        <div className="overlay" onClick={function(){setShowSetup(false);}}>
          <div className="setup-modal" onClick={function(e){e.stopPropagation();}}>
            <div className="setup-title">Configurazione</div>
            <div className="setup-sub">Connetti il server e scegli le cartelle.</div>
            <div className="tabs">
              <button className={"tab"+(setupTab==="server"?" active":"")} onClick={function(){setSetupTab("server");}}>Server</button>
              <button className={"tab"+(setupTab==="imap"?" active":"")} onClick={function(){setSetupTab("imap");}}>Email</button>
              <button className={"tab"+(setupTab==="boxes"?" active":"")} onClick={function(){setSetupTab("boxes");if(availableBoxes.length===0)loadBoxes();}}>Cartelle</button>
              <button className={"tab"+(setupTab==="colori"?" active":"")} onClick={function(){setSetupTab("colori");}}>Colori</button>
              <button className={"tab"+(setupTab==="sync"?" active":"")} onClick={function(){setSetupTab("sync");}}>Sync</button>
            </div>

            {setupTab==="server"&&(<>
              <div className="field"><label>URL Server Railway</label><input value={cfg.serverUrl} onChange={function(e){setField("serverUrl",e.target.value);}} placeholder="https://smartworking-production.up.railway.app"/></div>
              <div className="field"><label>Secret Token</label><input type="password" value={cfg.secret} onChange={function(e){setField("secret",e.target.value);}} placeholder="WORKRADAR_SECRET"/></div>
            </>)}
            {setupTab==="imap"&&(<>
              <div className="field"><label>Server IMAP</label><input value={cfg.host} onChange={function(e){setField("host",e.target.value);}} placeholder="pop.securemail.pro"/></div>
              <div className="field"><label>Porta</label><input value={cfg.port} onChange={function(e){setField("port",e.target.value);}} placeholder="993"/></div>
              <div className="field"><label>Email</label><input type="email" value={cfg.email} onChange={function(e){setField("email",e.target.value);}} placeholder="tua@email.it"/></div>
              <div className="field"><label>Password</label><input type="password" value={cfg.password} onChange={function(e){setField("password",e.target.value);}} placeholder="password email"/></div>
            </>)}
            {setupTab==="boxes"&&(<>
              {boxesLoading&&<div className="box-loading">Caricamento...</div>}
              {!boxesLoading&&availableBoxes.length===0&&<div className="box-loading"><div style={{marginBottom:10}}>Inserisci prima le credenziali.</div><button className="btn btn-outline" onClick={loadBoxes}>Carica cartelle</button></div>}
              {!boxesLoading&&availableBoxes.length>0&&(<>
                <div className="boxes-list">
                  {availableBoxes.map(function(box){
                    var isOn=selectedBoxes.indexOf(box)!==-1;
                    return <div key={box} className={"box-item"+(isOn?" checked":"")} onClick={function(){toggleBox(box);}}><div className={"box-check"+(isOn?" on":"")}>{isOn&&<div className="box-check-inner"/>}</div><span className="box-name">{box}</span></div>;
                  })}
                </div>
                <div className="setup-note">{selectedBoxes.length} di {availableBoxes.length} selezionate.</div>
              </>)}
            </>)}
            {setupTab==="colori"&&(<>
              {allBoxes.length===0?(
                <div className="box-loading">Sincronizza prima per vedere le cartelle.</div>
              ):(
                allBoxes.map(function(box){
                  var currentColorId=boxColors[box]||"none";
                  return (
                    <div key={box} className="box-color-row">
                      <span className="box-color-name">{box.replace("INBOX.","")}</span>
                      <div className="box-palette">
                        {BOX_PALETTE.map(function(p){
                          var isSelected=currentColorId===p.id;
                          return (
                            <div
                              key={p.id}
                              className={"box-palette-dot"+(isSelected?" selected":"")+(p.id==="none"?" none":"")}
                              style={{background:p.accent||"transparent",border:p.id==="none"?"1.5px dashed var(--border2)":isSelected?"2px solid var(--text)":"2px solid transparent"}}
                              title={p.label}
                              onClick={function(){setBoxColor(box, p.id);}}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
              <div className="setup-note" style={{marginTop:8}}>Il colore appare come striscia laterale e badge sulle card.</div>
            </>)}

            {setupTab==="sync"&&(<>
              <div className="field"><label>Frequenza auto-sync</label>
                <select value={autoSync} onChange={function(e){setAutoSync(parseInt(e.target.value));}}>
                  <option value={0}>Disattivato</option>
                  <option value={5}>Ogni 5 minuti</option>
                  <option value={15}>Ogni 15 minuti</option>
                  <option value={30}>Ogni 30 minuti</option>
                  <option value={60}>Ogni ora</option>
                </select>
              </div>
              <div className="setup-note">Tieni la pagina aperta per l'auto-sync.</div>
              <div className="field" style={{marginTop:12}}>
                <label>Notifiche Push (iPhone)</label>
                {pushStatus==="unsupported"&&<div className="setup-note" style={{color:"var(--red)"}}>Non supportato su questo browser.</div>}
                {pushStatus==="denied"&&<div className="setup-note" style={{color:"var(--red)"}}>Permesso negato. Vai in Impostazioni Safari → WorkRadar → Notifiche.</div>}
                {pushStatus==="granted"
                  ?<button className="btn btn-outline" style={{fontSize:13,marginTop:4}} onClick={disablePush}>🔕 Disattiva notifiche</button>
                  :<button className="btn btn-solid" style={{fontSize:13,marginTop:4}} disabled={pushStatus==="loading"} onClick={enablePush}>{pushStatus==="loading"?"…":"🔔 Attiva notifiche push"}</button>
                }
                <div className="setup-note" style={{marginTop:4}}>Richiede iOS 16.4+ e app sulla Home Screen.</div>
              </div>
            </>)}

            <div className="setup-actions">
              <button className="btn btn-outline" style={{color:"var(--red)",borderColor:"rgba(192,57,43,.3)",fontSize:11}} onClick={async function(){
                if(!window.confirm("Azzera tutte le email e riscarica le ultime 30? Le credenziali vengono mantenute.")) return;
                // 1. Cancella solo email e UIDs dal localStorage (tieni credenziali e config)
                ["wr_v1_jobs","wr_v1_lastsync","wr_v1_uids",
                 "wr_j10","wr_ls","wr_jobs9","wr_jobs8","wr_jobs7","wr_jobs6","wr_jobs5"].forEach(function(k){localStorage.removeItem(k);});
                // 2. Azzera cache e UIDs anche sul server
                try{
                  var h={"Content-Type":"application/json"};
                  if(cfg.secret) h["Authorization"]="Bearer "+cfg.secret;
                  await fetch(cfg.serverUrl+"/reset",{method:"POST",headers:h});
                }catch(e){}
                // 3. Ricarica la pagina — al boot farà subito sync con UIDs azzerati
                window.location.reload();
              }}>🔄 Reset email</button>
              <div style={{flex:1}}/>
              <button className="btn btn-outline" onClick={function(){setShowSetup(false);}}>Annulla</button>
              <button className="btn btn-solid" onClick={saveCfg}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ATTACHMENT PREVIEW OVERLAY ───────────────────────────────────── */}
      {previewAttach&&(
        <div className="attach-preview-overlay" onClick={function(){setPreviewAttach(null);}}>
          <div className="attach-preview-box" onClick={function(e){e.stopPropagation();}}>
            <div className="attach-preview-header">
              <span className="attach-preview-title">{previewAttach.name}</span>
              <button className="btn btn-outline" style={{padding:"4px 10px",fontSize:11}} onClick={function(){setPreviewAttach(null);}}>✕ Chiudi</button>
            </div>
            <div className="attach-preview-body">
              {/image/.test(previewAttach.contentType)?(
                <img src={previewAttach.dataUrl} alt={previewAttach.name}/>
              ):/pdf/.test(previewAttach.contentType)?(
                <iframe src={previewAttach.dataUrl} title={previewAttach.name}/>
              ):(
                <div className="attach-preview-unsupported">
                  <div style={{fontSize:32,marginBottom:12}}>📎</div>
                  <div>Anteprima non disponibile per questo tipo di file.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VAULT MODAL ─────────────────────────────────────────────────────── */}
      {showVault&&(
        <div className="overlay" onClick={function(){setShowVault(false);}}>
          <div className="vault-modal" onClick={function(e){e.stopPropagation();}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div className="setup-title">🗄️ Vault documenti</div>
              <button className="btn btn-outline" style={{padding:"4px 10px",fontSize:11}} onClick={function(){setShowVault(false);}}>✕</button>
            </div>
            <div className="setup-sub">I tuoi documenti riutilizzabili: CV, portfolio, preventivi. Salvati nel browser.</div>

            {/* Drop zone */}
            <div
              className={"vault-drop"+(vaultDragOver?" drag-over":"")}
              onClick={function(){vaultInputRef.current&&vaultInputRef.current.click();}}
              onDragOver={function(e){e.preventDefault();setVaultDragOver(true);}}
              onDragLeave={function(){setVaultDragOver(false);}}
              onDrop={function(e){e.preventDefault();setVaultDragOver(false);vaultAddFiles(e.dataTransfer.files);}}
            >
              ↑ Trascina file qui o clicca per scegliere
              <input ref={vaultInputRef} type="file" multiple style={{display:"none"}} onChange={function(e){vaultAddFiles(e.target.files);e.target.value="";}}/>
            </div>

            {/* File list */}
            {vaultDocs.length>0?(
              <div className="vault-grid" style={{marginTop:12}}>
                {vaultDocs.map(function(doc){
                  var canPreview=/image/.test(doc.type)||/pdf/.test(doc.type);
                  return (
                    <div key={doc.id} className="vault-item">
                      <div className="vault-item-icon">{fileIcon(doc.type)}</div>
                      <div className="vault-item-info">
                        <div className="vault-item-name">{doc.name}</div>
                        <div className="vault-item-meta">{fmtFileSize(doc.size)} · aggiunto {fmtDate(doc.addedAt)}</div>
                      </div>
                      <div className="vault-item-actions">
                        {canPreview&&(
                          <button className="btn btn-outline" style={{padding:"4px 8px",fontSize:11}} onClick={function(){openAttachPreview(doc.name,doc.dataUrl,doc.type);}}>👁</button>
                        )}
                        <button className="btn btn-outline" style={{padding:"4px 8px",fontSize:11,color:"var(--red)",borderColor:"rgba(192,57,43,.3)"}} onClick={function(){vaultDelete(doc.id);}}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"var(--text3)",textAlign:"center",padding:"20px 0"}}>Nessun documento ancora.</div>
            )}

            <div className="setup-note" style={{marginTop:12}}>I file sono salvati nel localStorage del browser (~5MB totali). Per allegare un documento a un lavoro, aprilo dalla card → sezione "Dal Vault".</div>
          </div>
        </div>
      )}

      {undoToast&&(
        <div className="toast">
          <span style={{fontSize:12}}>Email eliminata</span>
          <button className="toast-undo" onClick={undoDelete}>Annulla</button>
          <div className="toast-bar"/>
        </div>
      )}
    </>
  );
}
