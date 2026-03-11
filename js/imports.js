// ═══════════════════════════════════════════════════════
// imports.js — CSV/PDF parsing, import flow
// ═══════════════════════════════════════════════════════
import {
  S, CATS, save, aVal, addTransactions,
  curMonthKey, prevMonths, fmtMon, fmtCF, isSnapLocked, takeSnap,
} from './data.js';



let pendingImport     = null;
let pendingImportType = null;
let importTargetMonth = null;
window._importMsg     = null;

// ─── File trigger helper ───────────────────────────────
export function triggerFile(id) { document.getElementById(id).click(); }
window.triggerFile = triggerFile;

// ─── CSV parser ────────────────────────────────────────
function parseCsv(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    const rows = lines.map(l => {
      const r = [], re = /(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g;
      let m;
      while ((m = re.exec(l)) !== null) r.push(m[1].replace(/^"|"$/g,'').replace(/""/g,'"').trim());
      return r;
    });
    cb(rows);
  };
  reader.readAsText(file);
}

// ─── Zerodha Holdings — overwrite source:"zerodha" only ─
export function parseZH(inp) {
  if (!inp.files[0]) return;
  parseCsv(inp.files[0], rows => {
    const h = rows[0] || [];
    const assets = [];
    rows.slice(1).forEach(r => {
      const g = k => (r[h.indexOf(k)] || '').trim();
      const name = g('Instrument') || g('instrument') || g('Symbol');
      const qty  = parseFloat(g('Qty.') || g('Qty') || g('quantity') || 0);
      const avg  = parseFloat(g('Avg. cost') || g('avg_price') || 0);
      const ltp  = parseFloat(g('LTP') || g('ltp') || 0);
      if (name && qty > 0) {
        assets.push({
          category: 'equity',
          source:   'zerodha',
          name, qty, avgPrice: avg, ltp: ltp || avg, exchange: 'NSE',
        });
      }
    });
    askMonth(assets, 'Zerodha Holdings');
    inp.value = ''; // reset so same file can be re-imported
  });
}
window.parseZH = parseZH;

// ─── Zerodha MF — overwrite source:"zerodha-mf" only ──
export function parseZMF(inp) {
  if (!inp.files[0]) return;
  parseCsv(inp.files[0], rows => {
    const h = rows[0] || [];
    const assets = [];
    rows.slice(1).forEach(r => {
      const g = k => (r[h.indexOf(k)] || '').trim();
      const name  = g('Scheme') || g('scheme') || g('Fund Name');
      const units = parseFloat(g('Quantity') || g('units') || 0);
      const nav   = parseFloat(g('NAV') || g('nav') || 0);
      const inv   = parseFloat(g('Investment Amount') || g('invested') || 0);
      if (name && units > 0) {
        assets.push({
          category: 'mf',
          source:   'zerodha-mf',
          name, units, nav, invested: inv, mfType: 'Equity',
        });
      }
    });
    askMonth(assets, 'Zerodha MF');
    inp.value = '';
  });
}
window.parseZMF = parseZMF;

// ─── Zerodha Tradebook — store transactions, dedup ────
export function parseZTrade(inp) {
  if (!inp.files[0]) return;
  parseCsv(inp.files[0], rows => {
    const h = rows[0] || [];
    const txs = [];
    rows.slice(1).forEach(r => {
      const g = k => (r[h.indexOf(k)] || '').trim();
      const symbol = g('symbol') || g('Symbol') || g('Instrument');
      const date   = g('trade_date') || g('Trade Date') || g('date') || g('Date');
      const type   = (g('trade_type') || g('Trade Type') || g('type') || '').toUpperCase();
      const qty    = parseFloat(g('quantity') || g('Quantity') || g('qty') || 0);
      const price  = parseFloat(g('price') || g('Price') || g('trade_price') || 0);
      const isin   = g('isin') || g('ISIN') || '';
      if (symbol && date && qty > 0 && (type === 'BUY' || type === 'SELL')) {
        txs.push({ symbol, date, type, qty, price, isin });
      }
    });

    if (!txs.length) { window.toast('No transactions found in file', 'err'); return; }

    const added = addTransactions(txs);
    showTxSummary(txs.length, added);
    window.toast(`Tradebook imported: ${added} new transactions (${txs.length - added} duplicates skipped)`, 'ok');
    inp.value = '';
  });
}
window.parseZTrade = parseZTrade;

function showTxSummary(total, added) {
  const el = document.getElementById('tx-summary');
  if (!el) return;
  const buys  = S.transactions.filter(t => t.type === 'BUY').length;
  const sells = S.transactions.filter(t => t.type === 'SELL').length;
  const syms  = new Set(S.transactions.map(t => t.symbol)).size;

  el.style.display = 'block';
  el.innerHTML = `<div class="txsec">
    <h2>Transaction History <span class="badge badge-blue">${S.transactions.length} total</span></h2>
    <div class="tx-stats">
      <div class="tx-stat"><div class="tx-stat-val">${S.transactions.length}</div><div class="tx-stat-label">Total Txns</div></div>
      <div class="tx-stat"><div class="tx-stat-val">${buys}</div><div class="tx-stat-label">Buys</div></div>
      <div class="tx-stat"><div class="tx-stat-val">${sells}</div><div class="tx-stat-label">Sells</div></div>
      <div class="tx-stat"><div class="tx-stat-val">${syms}</div><div class="tx-stat-label">Symbols</div></div>
      <div class="tx-stat"><div class="tx-stat-val">${added}</div><div class="tx-stat-label">New This Import</div></div>
    </div>
    <p style="font-size:.82rem;color:var(--muted)">Transactions stored for reference. Holdings are managed separately in Assets — tradebook does not auto-modify them.</p>
  </div>`;
}

// ─── Bank Statement (CSV) ─────────────────────────────
export function parseBank(inp) {
  if (!inp.files[0]) return;
  parseCsv(inp.files[0], rows => {
    let bal = 0;
    // Try to find closing balance from bottom up
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i], str = row.join(',').toLowerCase();
      if (str.includes('closing') || str.includes('balance b/f') || str.includes('available')) {
        for (const cell of row) {
          const n = parseFloat(cell.toString().replace(/[,₹$\s]/g, ''));
          if (!isNaN(n) && n > 0 && n < 1e8) { bal = n; break; }
        }
        if (bal > 0) break;
      }
    }
    // Fallback: find column header "balance" and read last row
    if (!bal) {
      const hrow = rows.slice(0, 5).find(r => r.some(c => c.toLowerCase().includes('balance')));
      if (hrow) {
        const bi = hrow.findIndex(c => c.toLowerCase().includes('balance'));
        for (let i = rows.length - 1; i >= 0; i--) {
          const n = parseFloat((rows[i][bi] || '').replace(/[,₹$\s]/g, ''));
          if (!isNaN(n) && n >= 0) { bal = n; break; }
        }
      }
    }
    const assets = bal > 0 ? [{
      category: 'bank', source: 'import',
      name: inp.files[0].name.replace(/\.csv$/i,'').replace(/_/g,' '),
      account: 'Savings', balance: bal,
    }] : [];
    askMonth(
      assets, 'Bank Statement',
      bal > 0
        ? `Detected balance: ₹${bal.toLocaleString('en-IN')} — rename the asset after import`
        : 'Could not detect balance — add manually'
    );
    inp.value = '';
  });
}
window.parseBank = parseBank;

// ─── Bank Statement (PDF) — pdf.js extraction ─────────
export function parseBankPdf(inp) {
  if (!inp.files[0]) return;
  if (typeof pdfjsLib === 'undefined') {
    window.toast('pdf.js not loaded — check your internet connection', 'err');
    return;
  }

  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page    = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }

      // Try to extract closing balance from text
      const bal = extractBalanceFromText(fullText);
      const hint = bal > 0
        ? `Extracted from PDF text. Verify this is the closing balance.`
        : `Could not auto-detect balance. Please enter it manually.`;

      document.getElementById('pdf-bank-name').value = inp.files[0].name.replace(/\.pdf$/i,'').replace(/[_-]/g,' ');
      document.getElementById('pdf-balance').value   = bal > 0 ? bal.toFixed(2) : '';
      document.getElementById('pdf-extract-hint').textContent = hint;
      document.getElementById('bank-pdf-overlay').classList.remove('hide');
    } catch (err) {
      window.toast('PDF read error: ' + err.message, 'err');
    }
    inp.value = '';
  };
  reader.readAsArrayBuffer(inp.files[0]);
}
window.parseBankPdf = parseBankPdf;

function extractBalanceFromText(text) {
  // Strategy 1: find "Closing Balance" near a number
  const closingMatch = text.match(/closing\s*balance[:\s]+(?:inr|rs\.?|₹)?\s*([\d,]+\.?\d*)/i);
  if (closingMatch) {
    const n = parseFloat(closingMatch[1].replace(/,/g,''));
    if (n > 0 && n < 1e9) return n;
  }
  // Strategy 2: "Available Balance"
  const availMatch = text.match(/available\s*balance[:\s]+(?:inr|rs\.?|₹)?\s*([\d,]+\.?\d*)/i);
  if (availMatch) {
    const n = parseFloat(availMatch[1].replace(/,/g,''));
    if (n > 0 && n < 1e9) return n;
  }
  // Strategy 3: last large number near "balance" keyword
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].toLowerCase().includes('balance')) {
      const nums = lines[i].match(/([\d,]+\.?\d*)/g);
      if (nums) {
        const candidates = nums.map(n => parseFloat(n.replace(/,/g,''))).filter(n => n > 100 && n < 1e8);
        if (candidates.length) return candidates[candidates.length - 1];
      }
    }
  }
  return 0;
}

export function confirmBankPdf() {
  const name = document.getElementById('pdf-bank-name').value.trim() || 'Bank Account';
  const bal  = parseFloat(document.getElementById('pdf-balance').value) || 0;
  if (bal <= 0) { window.toast('Please enter a valid balance', 'err'); return; }
  document.getElementById('bank-pdf-overlay').classList.add('hide');
  const asset = [{ category:'bank', source:'import', name, account:'Savings', balance: bal }];
  askMonth(asset, 'Bank PDF', `Balance: ₹${bal.toLocaleString('en-IN')}`);
}
window.confirmBankPdf = confirmBankPdf;

// ─── US Stocks CSV ─────────────────────────────────────
export function parseUS(inp) {
  if (!inp.files[0]) return;
  parseCsv(inp.files[0], rows => {
    const h = rows[0] || [];
    const assets = [];
    rows.slice(1).forEach(r => {
      const g = k => (r[h.indexOf(k)] || '').trim();
      const name  = g('Symbol') || g('Ticker') || g('Stock');
      const qty   = parseFloat(g('Qty') || g('Quantity') || g('Shares') || 0);
      const price = parseFloat(g('LTP') || g('Price') || g('Last Price') || 0);
      const cost  = parseFloat(g('Avg Price') || g('Cost Basis') || 0);
      if (name && qty > 0) {
        assets.push({ category:'us', source:'import', name, qty, priceUSD:price, costUSD:cost, platform:'Other', isESOP:'No' });
      }
    });
    askMonth(assets, 'US Stocks');
    inp.value = '';
  });
}
window.parseUS = parseUS;

// ─── Month picker flow ─────────────────────────────────
function askMonth(assets, title, msg) {
  if (!assets.length) { showImportPrev(assets, title, msg, curMonthKey()); return; }
  pendingImport     = assets;
  pendingImportType = title;
  window._importMsg = msg;

  document.getElementById('mp-title').textContent = 'Which month is this ' + title + ' data for?';
  const months = prevMonths(6);
  document.getElementById('mp-buttons').innerHTML = months.map(m =>
    `<button class="mpick-btn${m === curMonthKey() ? ' on' : ''}${isSnapLocked(m) ? ' locked' : ''}" onclick="selectMonth('${m}',this)">${fmtMon(m)}${isSnapLocked(m) ? ' ✓' : ''}</button>`
  ).join('');
  document.getElementById('mp-custom').value = '';
  document.getElementById('monthpick-overlay').classList.remove('hide');
}

export function selectMonth(k, btn) {
  document.querySelectorAll('.mpick-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('mp-custom').value = k;
}
window.selectMonth = selectMonth;

export function confirmMonthPick() {
  const k = document.getElementById('mp-custom').value.trim() || curMonthKey();
  if (!/^\d{4}-\d{2}$/.test(k)) { window.toast('Format must be YYYY-MM', 'err'); return; }
  document.getElementById('monthpick-overlay').classList.add('hide');
  showImportPrev(pendingImport, pendingImportType, window._importMsg, k);
}
window.confirmMonthPick = confirmMonthPick;

function showImportPrev(assets, title, msg, monthKey) {
  importTargetMonth = monthKey || curMonthKey();
  const el = document.getElementById('import-prev');
  el.style.display = 'block';
  pendingImport = assets;

  let html = `<div class="iprev">
    <h2>Import Preview <span class="badge badge-gold">${fmtMon(importTargetMonth)}</span></h2>`;
  if (msg) html += `<div style="background:var(--raised);padding:10px 14px;border-radius:7px;margin-bottom:12px;color:var(--gold);font-size:.84rem">${msg}</div>`;
  if (!assets.length) { html += '<p style="color:var(--muted)">No assets detected.</p></div>'; el.innerHTML = html; return; }

  html += `<p style="color:var(--text2);margin-bottom:10px;font-size:.84rem">Found <strong style="color:var(--text)">${assets.length}</strong> ${title} entries for <strong style="color:var(--gold)">${fmtMon(importTargetMonth)}</strong>:</p>
    <table><thead><tr><th>Name</th><th>Category</th><th>Value</th></tr></thead><tbody>
    ${assets.map(a => `<tr><td>${a.name}</td><td>${CATS[a.category]?.label || a.category}</td><td class="mn">${fmtCF(aVal(a))}</td></tr>`).join('')}
    </tbody></table>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
      <button class="btn2" onclick="clearPrev()">Cancel</button>
      <button class="btn" style="width:auto;margin:0" onclick="confirmImport()">Import & Snapshot ${fmtMon(importTargetMonth)} →</button>
    </div></div>`;

  el.innerHTML = html;
  el.scrollIntoView({ behavior: 'smooth' });
}

export function clearPrev() {
  document.getElementById('import-prev').style.display = 'none';
  pendingImport = null;
}
window.clearPrev = clearPrev;

export function confirmImport() {
  if (!pendingImport?.length) return;

  // Determine source tag from type
  const isZerodha   = pendingImportType === 'Zerodha Holdings';
  const isZerodhaМF = pendingImportType === 'Zerodha MF';

  if (isZerodha) {
    // Remove all previous Zerodha holdings
    S.assets = S.assets.filter(a => !(a.category === 'equity' && a.source === 'zerodha'));
  }
  if (isZerodhaМF) {
    // Remove all previous Zerodha MF holdings
    S.assets = S.assets.filter(a => !(a.category === 'mf' && a.source === 'zerodha-mf'));
  }

  pendingImport.forEach(a => {
    a.id        = 'a' + Date.now() + Math.random().toString(36).slice(2, 6);
    a.createdAt = new Date().toISOString();
    S.assets.push(a);
  });

  takeSnap(importTargetMonth, false);
  save();
  window.toast('Imported ' + pendingImport.length + ' assets for ' + fmtMon(importTargetMonth) + ' ✓', 'ok');
  clearPrev();
  window.renderDash();
}
window.confirmImport = confirmImport;
