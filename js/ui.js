// ═══════════════════════════════════════════════════════
// ui.js — Navigation, dashboard render, modals, toast
// ═══════════════════════════════════════════════════════
import {
  S, CATS, save, bdown, totalNW, catTotal, momChange, catMoM,
  isSnapLocked, takeSnapFromValues, takeSnap,
  curMonthKey, prevMonths, fmtMon, fmtC, fmtCF, fmtP, getFY, assetSub, aVal,
} from './data.js';
import { renderDonut, renderTrend } from './charts.js';
import { renderAssets, updateAssetValue } from './assets.js';
import { renderTax, updateTax } from './tax.js';

let _tt;

// ─── Toast ─────────────────────────────────────────────
export function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast' + (type ? ' ' + type : '');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.add('hide'), 3200);
}
window.toast = toast;

// ─── Navigation ────────────────────────────────────────
export function navTo(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.add('hide'));
  document.querySelectorAll('.ni').forEach(el => el.classList.remove('on'));
  document.getElementById('p-' + p).classList.remove('hide');
  document.querySelector('[data-p="' + p + '"]').classList.add('on');
  if (p === 'dash')     renderDash();
  if (p === 'assets')   renderAssets();
  if (p === 'close')    renderClose(document.getElementById('close-month-sel')?.value || curMonthKey());
  if (p === 'tax')      renderTax();
  if (p === 'settings') loadSettings();
}
window.navTo = navTo;

// ─── Dashboard ─────────────────────────────────────────
export function renderDash() {
  const total = totalNW(), mom = momChange(), bd = bdown();

  document.getElementById('nw-val').textContent    = fmtCF(total);
  document.getElementById('cur-month').textContent = fmtMon(curMonthKey());
  const chgEl = document.getElementById('nw-chg');
  chgEl.className = 'nwchg ' + (mom.amt >= 0 ? 'pos' : 'neg');
  document.getElementById('chg-arr').textContent = mom.amt >= 0 ? '↑' : '↓';
  document.getElementById('chg-amt').textContent = fmtC(Math.abs(mom.amt));
  document.getElementById('chg-pct').textContent = '(' + fmtP(mom.pct) + ')';

  renderCloseBanner();
  renderCatCards(bd, total);
  renderDonut(bd);
  renderTrend();
  renderSnapTable(bd, total);
  renderMonthSel();
}
window.renderDash = renderDash;

function renderCloseBanner() {
  const k = curMonthKey(), locked = isSnapLocked(k);
  const el = document.getElementById('close-banner');
  if (locked) {
    el.innerHTML = `<div class="close-banner done"><p>✓ <strong>${fmtMon(k)} is closed</strong> — snapshot locked</p><button class="btn2" style="padding:6px 14px;font-size:.8rem" onclick="navTo('close')">View Close</button></div>`;
  } else {
    el.innerHTML = `<div class="close-banner"><p>⚠ <strong>${fmtMon(k)} not yet closed</strong> — complete your monthly close to lock accurate MoM data</p><button class="btn" style="width:auto;margin:0;padding:8px 18px;font-size:.84rem" onclick="navTo('close')">Do Monthly Close →</button></div>`;
  }
}

function renderCatCards(bd, total) {
  document.getElementById('cat-grid').innerHTML = bd.map(b => {
    const m = catMoM(b.cat), pos = m.amt >= 0, pct = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
    return `<div class="catcard" onclick="navTo('assets')">
      <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:${b.color}"></div>
      <div class="cico">${b.icon}</div>
      <div class="cname">${b.label}</div>
      <div class="cval">${fmtC(b.value)}</div>
      <div class="cchg ${pos ? 'pos' : 'neg'}">${pos ? '↑' : '↓'} ${fmtC(Math.abs(m.amt))} ${fmtP(m.pct)}</div>
      <div class="cpct">${pct}% of NW</div>
    </div>`;
  }).join('');
}

function renderSnapTable(bd, total) {
  const mom = momChange(), totCost = bd.reduce((s, b) => s + b.cost, 0), totGain = total - totCost;
  document.getElementById('snap-tbody').innerHTML =
    bd.map(b => {
      const gain = b.value - b.cost, gp = b.cost > 0 ? gain / b.cost * 100 : 0;
      const m = catMoM(b.cat), np = total > 0 ? (b.value / total * 100).toFixed(1) : 0;
      return `<tr>
        <td>${b.icon} ${b.label}</td>
        <td class="mn">${fmtCF(b.value)}</td>
        <td class="mn">${b.cost > 0 ? fmtCF(b.cost) : '—'}</td>
        <td class="mn ${gain >= 0 ? 'pos' : 'neg'}">${gain ? fmtC(gain) + ' (' + fmtP(gp) + ')' : '—'}</td>
        <td class="mn">${np}%</td>
        <td class="mn ${m.amt >= 0 ? 'pos' : 'neg'}">${m.amt ? fmtP(m.pct) : '—'}</td>
      </tr>`;
    }).join('') +
    `<tr style="border-top:2px solid #303848;font-weight:600">
      <td style="color:#e8eaf0">Total Net Worth</td>
      <td class="mn" style="color:#c8a96e">${fmtCF(total)}</td>
      <td class="mn">${fmtCF(totCost)}</td>
      <td class="mn ${totGain >= 0 ? 'pos' : 'neg'}">${fmtC(totGain)}</td>
      <td class="mn">100%</td>
      <td class="mn ${mom.amt >= 0 ? 'pos' : 'neg'}">${fmtP(mom.pct)}</td>
    </tr>`;
}

function renderMonthSel() {
  const sel = document.getElementById('month-sel'), cur = curMonthKey();
  sel.innerHTML = `<option value="${cur}">Current (${fmtMon(cur)})</option>` +
    S.snaps.slice().reverse().map(s =>
      `<option value="${s.month}">${fmtMon(s.month)}${s.locked ? ' ✓' : ''}</option>`
    ).join('');
}

export function showSnap(k) {
  const s = S.snaps.find(x => x.month === k);
  if (!s) return;
  document.getElementById('nw-val').textContent    = fmtCF(s.total);
  document.getElementById('cur-month').textContent = fmtMon(k) + (s.locked ? ' (Locked)' : '');
}
window.showSnap = showSnap;

// ─── Monthly Close ─────────────────────────────────────
export function populateCloseSel() {
  const sel = document.getElementById('close-month-sel');
  if (!sel) return;
  const months = prevMonths(6);
  sel.innerHTML = months.map(m =>
    `<option value="${m}">${fmtMon(m)}${isSnapLocked(m) ? ' ✓ Locked' : ''}</option>`
  ).join('');
  sel.value = curMonthKey();
}

export function loadCloseMonth(k) { renderClose(k); }
window.loadCloseMonth = loadCloseMonth;

export function renderClose(monthKey) {
  const k      = monthKey || curMonthKey();
  const locked = isSnapLocked(k);
  const existing = S.snaps.find(s => s.month === k);
  const el       = document.getElementById('close-body');

  const previewTotal = locked ? existing.total : totalNW();
  const prevS        = S.snaps.filter(s => s.month < k).slice(-1)[0];
  const change       = prevS ? previewTotal - prevS.total : 0;
  const changePct    = prevS && prevS.total ? change / Math.abs(prevS.total) * 100 : 0;

  let html = `<div class="close-preview">
    <div class="cp-item"><div class="cp-label">Month</div><div class="cp-val gold">${fmtMon(k)}</div></div>
    <div class="cp-item"><div class="cp-label">Net Worth</div><div class="cp-val gold">${fmtCF(previewTotal)}</div></div>
    <div class="cp-item"><div class="cp-label">vs Prior Month</div><div class="cp-val ${change >= 0 ? 'pos' : 'neg'}">${fmtC(change)} (${fmtP(changePct)})</div></div>
    <div class="cp-item"><div class="cp-label">Status</div><div class="cp-val ${locked ? 'pos' : ''}">${locked ? '✓ Locked' : 'Pending'}</div></div>
  </div>`;

  if (locked) {
    html += `<div style="background:rgba(78,203,113,.06);border:1px solid var(--green);border-radius:10px;padding:16px 18px;margin-bottom:16px;font-size:.86rem;color:var(--text2)">
      ✓ <strong style="color:var(--green)">${fmtMon(k)} is locked.</strong> Snapshot saved on ${new Date(existing.at).toLocaleDateString('en-IN')}.
      <button class="btn2" style="margin-left:12px;padding:4px 12px;font-size:.78rem" onclick="unlockSnap('${k}')">Unlock to Edit</button>
    </div>`;
    html += '<div class="close-sections">';
    Object.keys(CATS).forEach(cat => {
      const v = existing.cats?.[cat]?.value || 0;
      if (v === 0 && cat !== 'bank') return;
      html += `<div class="close-sec"><div class="close-sec-hdr"><span>${CATS[cat].icon}</span><h3>${CATS[cat].label}</h3><span class="close-status cs-done">Locked: ${fmtC(v)}</span></div></div>`;
    });
    html += '</div>';
  } else {
    html += `<p style="color:var(--text2);font-size:.84rem;margin-bottom:16px">Enter the closing value for each asset category as of the last day of <strong style="color:var(--text)">${fmtMon(k)}</strong>.</p>
    <div class="close-sections">`;
    Object.keys(CATS).forEach(cat => {
      const currentVal = Math.abs(catTotal(cat));
      const assets     = S.assets.filter(a => a.category === cat);
      if (assets.length === 0 && cat !== 'bank' && cat !== 'equity' && cat !== 'mf') return;
      const status     = assets.length > 0 ? 'cs-done' : 'cs-pend';
      const statusText = assets.length > 0 ? 'Data available' : 'No assets yet';

      html += `<div class="close-sec">
        <div class="close-sec-hdr">
          <span>${CATS[cat].icon}</span><h3>${CATS[cat].label}</h3>
          <span class="close-status ${status}">${statusText}</span>
        </div>`;

      if (assets.length > 0) {
        assets.forEach(a => {
          const v = Math.abs(aVal(a));
          html += `<div class="close-item">
            <label>${a.name} <span style="color:var(--muted);font-size:.75rem">${assetSub(a)}</span></label>
            <input type="number" id="cl-${a.id}" value="${v.toFixed(0)}" placeholder="₹">
          </div>`;
        });
      } else {
        html += `<div class="close-item"><label>Total ${CATS[cat].label} ₹</label><input type="number" id="cl-cat-${cat}" placeholder="0"></div>`;
      }
      html += '</div>';
    });

    html += `</div>
    <div style="margin-top:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <button class="btn2" onclick="saveCloseDraft('${k}')">Save Draft (unlocked)</button>
      <button class="btn-green" onclick="lockClose('${k}')">✓ Lock & Close ${fmtMon(k)}</button>
      <span style="font-size:.78rem;color:var(--muted)">Locked snapshots cannot be edited accidentally</span>
    </div>`;
  }

  el.innerHTML = html;
}

function collectCloseValues() {
  const values = {};
  Object.keys(CATS).forEach(cat => {
    const assets = S.assets.filter(a => a.category === cat);
    if (assets.length > 0) {
      let total = 0;
      assets.forEach(a => {
        const el = document.getElementById('cl-' + a.id);
        const v  = el ? parseFloat(el.value) || 0 : Math.abs(aVal(a));
        total   += (cat === 'liability' ? -v : v);
        if (el) updateAssetValue(a.id, cat, parseFloat(el.value) || 0);
      });
      values[cat] = total;
    } else {
      const el = document.getElementById('cl-cat-' + cat);
      if (el && el.value) values[cat] = (cat === 'liability' ? -(parseFloat(el.value) || 0) : parseFloat(el.value) || 0);
    }
  });
  return values;
}

export function saveCloseDraft(k) {
  const values = collectCloseValues();
  takeSnapFromValues(k, values, false);
  renderClose(k);
  renderDash();
  toast('Draft saved for ' + fmtMon(k), 'ok');
}
window.saveCloseDraft = saveCloseDraft;

export function lockClose(k) {
  if (!confirm('Lock ' + fmtMon(k) + '? This snapshot will be marked as final. You can unlock it later if needed.')) return;
  const values = collectCloseValues();
  takeSnapFromValues(k, values, true);
  populateCloseSel();
  renderClose(k);
  renderDash();
  toast(fmtMon(k) + ' locked ✓', 'ok');
}
window.lockClose = lockClose;

export function unlockSnap(k) {
  const s = S.snaps.find(x => x.month === k);
  if (s) { s.locked = false; save(); renderClose(k); toast('Unlocked — you can now edit', 'ok'); }
}
window.unlockSnap = unlockSnap;
