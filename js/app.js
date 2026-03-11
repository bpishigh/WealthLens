// ═══════════════════════════════════════════════════════
// app.js — Init, settings, sync, data management
// Entry point — imports all other modules
// ═══════════════════════════════════════════════════════
import {
  S, save, load, autoSnapshot,
  curMonthKey, takeSnap, isSnapLocked, prevMonths, fmtMon, getFY,
} from './data.js';
import { renderDash, navTo, populateCloseSel, toast } from './ui.js';

// Expose shared helpers on window so other modules can call them
// (avoids circular imports for simple helpers)
window._wl = {
  prevMonths, curMonthKey, isSnapLocked, fmtMon, takeSnap,
};

// ─── Setup flow ────────────────────────────────────────
export function goStep2() {
  const k  = document.getElementById('s-gs-key').value.trim();
  const id = document.getElementById('s-gs-id').value.trim();
  const cl = document.getElementById('s-claude-key').value.trim();
  if (k)  localStorage.setItem('wl_gs_key', k);
  if (id) localStorage.setItem('wl_gs_id', id);
  if (cl) localStorage.setItem('wl_claude', cl);
  document.getElementById('step1').style.display = 'none';
  document.getElementById('step2').style.display = 'block';
}
window.goStep2 = goStep2;

export function finishSetup() {
  localStorage.setItem('wl_name',   document.getElementById('s-name').value.trim() || 'User');
  localStorage.setItem('wl_regime', document.getElementById('s-regime').value);
  localStorage.setItem('wl_income', document.getElementById('s-income').value || '0');
  localStorage.setItem('wl_setup',  '1');
  document.getElementById('s-status2').textContent = '✓ Launching...';
  setTimeout(launchApp, 700);
}
window.finishSetup = finishSetup;

export function launchApp() {
  load();
  document.getElementById('setup-overlay').classList.add('hide');
  document.getElementById('app').classList.remove('hide');
  if (!S.snaps.length && S.assets.length) takeSnap();
  autoSnapshot(); // daily snapshot
  renderDash();
  fetchRates();
  document.getElementById('fy-label').textContent = getFY();
  populateCloseSel();
}

// ─── Settings ──────────────────────────────────────────
export function loadSettings() {
  document.getElementById('cfg-gs-key').value = localStorage.getItem('wl_gs_key')  || '';
  document.getElementById('cfg-gs-id').value  = localStorage.getItem('wl_gs_id')   || '';
  document.getElementById('cfg-claude').value = localStorage.getItem('wl_claude')  || '';
  document.getElementById('cfg-name').value   = localStorage.getItem('wl_name')    || '';
  document.getElementById('cfg-income').value = localStorage.getItem('wl_income')  || '';
  document.getElementById('cfg-regime').value = localStorage.getItem('wl_regime')  || 'new';
  document.getElementById('cfg-usd').value    = S.usdInr;
  document.getElementById('cfg-gold').value   = S.goldRate;
}
window.loadSettings = loadSettings;

export function saveSettings() {
  localStorage.setItem('wl_gs_key',  document.getElementById('cfg-gs-key').value);
  localStorage.setItem('wl_gs_id',   document.getElementById('cfg-gs-id').value);
  localStorage.setItem('wl_claude',  document.getElementById('cfg-claude').value);
  localStorage.setItem('wl_name',    document.getElementById('cfg-name').value);
  localStorage.setItem('wl_income',  document.getElementById('cfg-income').value);
  localStorage.setItem('wl_regime',  document.getElementById('cfg-regime').value);
  S.usdInr   = parseFloat(document.getElementById('cfg-usd').value)  || 84;
  S.goldRate  = parseFloat(document.getElementById('cfg-gold').value) || 7200;
  load(); save();
  toast('Settings saved ✓', 'ok');
}
window.saveSettings = saveSettings;

export function fetchRates() {
  fetch('https://api.frankfurter.app/latest?from=USD&to=INR')
    .then(r => r.json())
    .then(d => {
      if (d.rates?.INR) {
        S.usdInr = d.rates.INR;
        save();
        const el = document.getElementById('cfg-usd');
        if (el) el.value = S.usdInr.toFixed(2);
        toast('Rates updated: $1 = ₹' + S.usdInr.toFixed(2), 'ok');
      }
    })
    .catch(() => {});
}
window.fetchRates = fetchRates;

// ─── Google Sheets sync ────────────────────────────────
export async function syncNow() {
  const url = S.cfg.scriptUrl || localStorage.getItem('wl_script_url');
  if (!url) { toast('No Apps Script URL — go to Settings', 'err'); return; }

  document.getElementById('sync-label').textContent = 'Syncing...';
  const { aVal: av, aCost: ac } = await import('./data.js');
  const aRows = [
    ['id','category','name','value','cost','source','createdAt'],
    ...S.assets.map(a => [a.id, a.category, a.name, av(a), ac(a), a.source||'manual', a.createdAt||'']),
  ];
  const sRows = [
    ['month','total','locked','categories','at'],
    ...S.snaps.map(s => [s.month, s.total, s.locked ? 'yes' : 'no', JSON.stringify(s.cats), s.at||'']),
  ];

  try {
    await Promise.all([
      fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'write',tab:'Assets',data:aRows}) }),
      fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'write',tab:'Snapshots',data:sRows}) }),
    ]);
    document.getElementById('sync-label').textContent = 'Synced ' + new Date().toLocaleTimeString('en-IN');
    toast('Synced to Sheets ✓', 'ok');
  } catch (e) {
    document.getElementById('sync-label').textContent = 'Sync failed';
    toast('Sync failed', 'err');
  }
}
window.syncNow = syncNow;

export function showScriptGuide() {
  const id   = localStorage.getItem('wl_gs_id') || 'YOUR_SHEET_ID';
  const code = `const SHEET_ID='${id}';\nfunction doPost(e){\n  try{\n    const p=JSON.parse(e.postData.contents),ss=SpreadsheetApp.openById(SHEET_ID);\n    if(p.action==='write'){\n      const sh=ss.getSheetByName(p.tab)||ss.insertSheet(p.tab);\n      sh.clearContents();\n      if(p.data&&p.data.length>0)sh.getRange(1,1,p.data.length,p.data[0].length).setValues(p.data);\n    }\n    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);\n  }catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:err.message})).setMimeType(ContentService.MimeType.JSON);}\n}`;
  const div  = document.createElement('div');
  div.className = 'overlay';
  div.innerHTML = `<div class="mcard wide">
    <div class="mhdr"><h2>Apps Script Setup</h2><button class="mcls" onclick="this.closest('.overlay').remove()">✕</button></div>
    <ol style="color:var(--text2);font-size:.84rem;line-height:2.2;margin:0 0 14px 18px">
      <li>Open your Google Sheet → <strong>Extensions → Apps Script</strong></li>
      <li>Replace all code with the script below → Save (Ctrl+S)</li>
      <li>Click <strong>Deploy → New Deployment → Web App</strong></li>
      <li>Execute as: <strong>Me</strong> · Who has access: <strong>Anyone</strong></li>
      <li>Authorize → Copy the <strong>Web App URL</strong> → paste below</li>
    </ol>
    <textarea style="width:100%;height:150px;background:var(--raised);border:1px solid var(--border);border-radius:6px;padding:10px;color:var(--text);font-family:var(--mono);font-size:.74rem" readonly>${code}</textarea>
    <div class="ig" style="margin-top:14px"><label>Web App URL</label><input type="text" id="script-url-inp" placeholder="https://script.google.com/macros/s/.../exec" value="${localStorage.getItem('wl_script_url')||''}"></div>
    <button class="btn" onclick="const u=document.getElementById('script-url-inp').value.trim();if(u){localStorage.setItem('wl_script_url',u);S.cfg.scriptUrl=u;this.closest('.overlay').remove();window.toast('Saved ✓','ok');}else{window.toast('Paste the URL first','err');}">Save URL</button>
  </div>`;
  document.body.appendChild(div);
}
window.showScriptGuide = showScriptGuide;

// ─── Data management ───────────────────────────────────
export function doExport() {
  const data = {
    assets:       S.assets,
    snaps:        S.snaps,
    transactions: S.transactions,
    dailyHistory: S.dailyHistory,
    exportedAt:   new Date().toISOString(),
    version:      2,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'wealthlens-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  toast('Exported ✓', 'ok');
}
window.doExport = doExport;

export function doImport() {
  const inp    = document.createElement('input');
  inp.type     = 'file';
  inp.accept   = '.json';
  inp.onchange = async e => {
    try {
      const d = JSON.parse(await e.target.files[0].text());
      if (d.assets)       S.assets       = d.assets;
      if (d.snaps)        S.snaps        = d.snaps;
      if (d.transactions) S.transactions = d.transactions;
      if (d.dailyHistory) S.dailyHistory = d.dailyHistory;
      save();
      renderDash();
      toast('Imported ✓', 'ok');
    } catch (err) { toast('Import failed: ' + err.message, 'err'); }
  };
  inp.click();
}
window.doImport = doImport;

export function doClear() {
  if (confirm('Delete ALL data? This cannot be undone.') && confirm('Final confirmation — clear everything?')) {
    localStorage.clear();
    location.reload();
  }
}
window.doClear = doClear;

// ─── Nav click wiring + DOMContentLoaded ──────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.ni').forEach(el => {
    el.addEventListener('click', () => navTo(el.dataset.p));
  });
  document.querySelectorAll('.ibtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ibtn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
    });
  });
  load();
  if (localStorage.getItem('wl_setup')) launchApp();
});
