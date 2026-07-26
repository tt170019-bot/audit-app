// ═══════════════════════════════════════════════
//  DB (IndexedDB via simple wrapper)
// ═══════════════════════════════════════════════
const DB_NAME = 'AuditApp', DB_VER = 2;
const UI_CLASS = Object.freeze({
  HIDDEN: 'hidden',
  OPEN: 'open',
  ACTIVE: 'active',
  ONLINE: 'is-online',
  OFFLINE: 'is-offline'
});
let db;

function byId(id){
  return document.getElementById(id);
}

function setHidden(elOrId, hidden = true){
  const el = typeof elOrId === 'string' ? byId(elOrId) : elOrId;
  if(!el) return;
  el.classList.toggle(UI_CLASS.HIDDEN, Boolean(hidden));
}

function setVisible(elOrId, visible = true){
  setHidden(elOrId, !visible);
}

function openDB(){
  return AuditStore.open(DB_NAME, DB_VER).then(database => { db = database; return database; });
}

function dbAll(store){
  return AuditStore.all(db, store);
}
function dbGet(store,id){
  return AuditStore.get(db, store, id);
}
function dbPut(store,obj){
  return AuditStore.put(db, store, obj);
}
function dbDelete(store,id){
  return AuditStore.delete(db, store, id);
}

function dbClear(store){
  return AuditStore.clear(db, store);
}

// Debug logging is disabled by default in production.
// Add ?debug=1 to the URL when console diagnostics are needed.
const DEBUG_MODE = new URLSearchParams(location.search).get('debug') === '1';
function appLog(...args){ if(DEBUG_MODE) console.log(...args); }
function appWarn(...args){ if(DEBUG_MODE) console.warn(...args); }
function appError(...args){ if(DEBUG_MODE) console.error(...args); }

// ═══════════════════════════════════════════════
//  Modal helpers
// ═══════════════════════════════════════════════
function openModal(id){
  const modal = byId(id);
  if(!modal) return;
  modal.classList.add(UI_CLASS.OPEN);
  document.body.style.overflow='hidden';
}
function closeModal(id){
  const modal = byId(id);
  if(!modal) return;
  modal.classList.remove(UI_CLASS.OPEN);
  document.body.style.overflow='';
}

// ═══════════════════════════════════════════════
//  Toast
// ═══════════════════════════════════════════════
let _toastTimer;
function showToast(msg){
  const t = byId('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ═══════════════════════════════════════════════
//  Utils
// ═══════════════════════════════════════════════
function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
