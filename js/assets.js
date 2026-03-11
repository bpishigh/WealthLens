// ═══════════════════════════════════════════════════════
// assets.js — Asset CRUD and rendering
// ═══════════════════════════════════════════════════════
import {
  S, CATS, FORMS, save, aVal, aCost, catTotal, assetSub,
  fmtC, fmtCF, fmtP, curMonthKey,
} from './data.js';



// ─── Render assets page ────────────────────────────────
export function renderAssets() {
  document.getElementById('asset-sections').innerHTML = Object.keys(CATS).map(cat => {
    const assets = S.assets.filter(a => a.category === cat);
    const total  = catTotal(cat);
    return `<div class="asec">
      <div class="ashdr">
        <span style="font-size:1.05rem">${CATS[cat].icon}</span>
        <h2>${CATS[cat].label}</h2>
        <span class="asttl ${cat === 'liability' ? 'neg2' : ''}">${fmtCF(total)}</span>
        <button class="badd" onclick="openModal('${cat}')">+ Add</button>
      </div>
      ${assets.length === 0
        ? `<div style="padding:13px 17px;color:var(--muted);font-size:.8rem">No ${CATS[cat].label} yet — click + Add</div>`
        : assets.map(a => renderAItem(a)).join('')}
    </div>`;
  }).join('');
}

function renderAItem(a) {
  const v = aVal(a), c = aCost(a), gain = v - c, gp = c > 0 ? gain / c * 100 : 0;
  const srcTag = a.source && a.source !== 'manual'
    ? `<span class="src-tag">${a.source}</span>`
    : '';
  return `<div class="aitem">
    <div>
      <div class="aname">${a.name}${srcTag}</div>
      <div class="asub">${assetSub(a)}</div>
    </div>
    <div class="mn">${fmtCF(v)}</div>
    <div class="mn ${gain >= 0 ? 'pos' : 'neg'}">${c > 0 ? fmtC(gain) + ' (' + fmtP(gp) + ')' : '—'}</div>
    <div class="mn" style="color:var(--muted)">${c > 0 ? fmtCF(c) : '—'}</div>
    <div style="display:flex;gap:5px;justify-content:flex-end">
      <button class="bsm" onclick="openModal('${a.category}','${a.id}')">✎</button>
      <button class="bsm" onclick="delAsset('${a.id}')">✕</button>
    </div>
  </div>`;
}

// ─── Asset modal ───────────────────────────────────────
export function openModal(cat, id) {
  const fields = FORMS[cat];
  if (!fields) { window.toast('Unknown category: ' + cat, 'err'); return; }
  const exist = id ? S.assets.find(a => a.id === id) : null;
  document.getElementById('modal-title').textContent = (exist ? 'Edit ' : 'Add ') + CATS[cat].label;

  let html = `<input type="hidden" id="f-cat" value="${cat}"><input type="hidden" id="f-id" value="${id || ''}">`;
  fields.forEach(f => {
    const v = exist ? (exist[f.id] || '') : '';
    html += `<div class="ig"><label>${f.label}</label>`;
    if (f.type === 'sel') {
      html += `<select id="f-${f.id}">`;
      f.opts.forEach(o => { html += `<option${o === v ? ' selected' : ''}>${o}</option>`; });
      html += '</select>';
    } else {
      html += `<input type="${f.type}" id="f-${f.id}" placeholder="${f.ph || ''}" value="${v}">`;
    }
    html += '</div>';
  });

  // Show real estate equity preview hint
  if (cat === 'realestate') {
    html += `<div class="hint" style="margin-bottom:12px;color:var(--gold)">⬡ Net Worth uses <strong>equity = value − loan</strong>, not gross value</div>`;
  }

  html += `<div style="display:flex;gap:10px;margin-top:12px">
    <button class="btn2" style="flex:1" onclick="closeAssetModal()">Cancel</button>
    <button class="btn" style="flex:1;margin:0" onclick="saveModal()">${exist ? 'Update' : 'Add Asset'}</button>
  </div>`;

  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('asset-overlay').classList.remove('hide');
}

export function closeAssetModal() {
  document.getElementById('asset-overlay').classList.add('hide');
}

export function saveModal() {
  const cat    = document.getElementById('f-cat').value;
  const id     = document.getElementById('f-id').value;
  const fields = FORMS[cat]; if (!fields) return;
  const asset  = { category: cat, source: 'manual' };
  fields.forEach(f => {
    const el = document.getElementById('f-' + f.id);
    asset[f.id] = el ? el.value : '';
  });

  if (id) {
    const idx = S.assets.findIndex(a => a.id === id);
    if (idx >= 0) {
      // Preserve source tag if it was imported
      asset.id = id;
      asset.source = S.assets[idx].source || 'manual';
      asset.updatedAt = new Date().toISOString();
      S.assets[idx] = { ...S.assets[idx], ...asset };
    }
    window.toast('Updated ✓', 'ok');
  } else {
    asset.id        = 'a' + Date.now();
    asset.createdAt = new Date().toISOString();
    S.assets.push(asset);
    window.toast('Added ✓', 'ok');
  }

  save();
  closeAssetModal();
  renderAssets();
  window.renderDash();
}

export function delAsset(id) {
  if (!confirm('Delete this asset?')) return;
  S.assets = S.assets.filter(a => a.id !== id);
  save();
  renderAssets();
  window.renderDash();
  window.toast('Deleted');
}

// ─── Bulk update modal ─────────────────────────────────
export function openBulk() {
  const { prevMonths, curMonthKey: cmk, isSnapLocked, fmtMon: fm } = window._wl;
  const sel = document.getElementById('bulk-month-sel');
  sel.innerHTML = prevMonths(6).map(m =>
    `<option value="${m}"${m === cmk() ? ' selected' : ''}>${fm(m)}${isSnapLocked(m) ? ' ✓' : ''}</option>`
  ).join('');

  const catKeys = ['bank','equity','mf','us','retirement','realestate','gold','fd','other'];
  const sections = catKeys.filter(c => S.assets.some(a => a.category === c));
  const body = document.getElementById('bulk-body');
  body.innerHTML = sections.length === 0
    ? '<p style="color:var(--muted);padding:14px">Add assets first.</p>'
    : sections.map(cat =>
        `<div class="bsec2">
          <div class="bsectitle">${CATS[cat].icon} ${CATS[cat].label}</div>
          ${S.assets.filter(a => a.category === cat).map(a =>
            `<div class="bitem">
              <label>${a.name}</label>
              <input type="number" id="b-${a.id}" value="${Math.abs(aVal(a)).toFixed(0)}" placeholder="Current value ₹">
            </div>`
          ).join('')}
        </div>`
      ).join('');
  document.getElementById('bulk-overlay').classList.remove('hide');
}

export function saveBulk() {
  const { isSnapLocked, fmtMon: fm } = window._wl;
  const monthKey = document.getElementById('bulk-month-sel').value;
  if (isSnapLocked(monthKey) && !confirm(fm(monthKey) + ' is locked. Overwrite?')) return;

  S.assets.forEach(a => {
    const el = document.getElementById('b-' + a.id);
    if (!el) return;
    const v = parseFloat(el.value);
    if (isNaN(v)) return;
    updateAssetValue(a.id, a.category, v);
  });

  window._wl.takeSnap(monthKey, false);
  save();
  document.getElementById('bulk-overlay').classList.add('hide');
  window.renderDash();
  renderAssets();
  window.toast('Snapshot saved for ' + fm(monthKey), 'ok');
}

// ─── Update asset field from a raw value ───────────────
export function updateAssetValue(id, cat, v) {
  const a = S.assets.find(x => x.id === id);
  if (!a) return;
  switch (cat) {
    case 'bank':
    case 'retirement': a.balance = v; break;
    case 'realestate': a.currentValue = v; break;
    case 'other':      a.value = v; break;
    case 'fd':         a.maturity = v; break;
    case 'liability':  a.outstanding = v; break;
    case 'equity':     a.ltp = (v / (+a.qty || 1)).toFixed(2); break;
    case 'mf':         a.nav = (v / (+a.units || 1)).toFixed(4); break;
    case 'us':         a.priceUSD = (v / (+a.qty || 1) / S.usdInr).toFixed(2); break;
    case 'gold':       a.rate = (v / (+a.qty || 1)).toFixed(0); break;
  }
}

// Expose for inline onclick
window.openModal      = openModal;
window.closeAssetModal = closeAssetModal;
window.saveModal      = saveModal;
window.delAsset       = delAsset;
window.openBulk       = openBulk;
window.saveBulk       = saveBulk;
