// js/app.js — App bootstrap, setup flow, global actions

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  Data.loadLocal();

  const isSetup = localStorage.getItem('wl_setup_done');
  if (isSetup) {
    launchApp();
  } else {
    document.getElementById('setup-modal').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
});

// ============ SETUP FLOW ============
async function setupStep1() {
  const apiKey    = document.getElementById('gs-api-key').value.trim();
  const sheetId   = document.getElementById('gs-sheet-id').value.trim();
  const claudeKey = document.getElementById('claude-api-key').value.trim();
  const statusEl  = document.getElementById('setup-status');

  if (!sheetId) {
    statusEl.textContent = '✗ Please enter a Sheet ID';
    statusEl.style.color = 'var(--accent-red)';
    return;
  }

  if (apiKey) localStorage.setItem('wl_gs_key', apiKey);
  if (sheetId) localStorage.setItem('wl_gs_id', sheetId);
  if (claudeKey) localStorage.setItem('wl_claude_key', claudeKey);

  if (apiKey && sheetId) {
    statusEl.innerHTML = '<span class="loading-spinner"></span> Verifying connection...';
    statusEl.style.color = 'var(--text-secondary)';
    const result = await Sheets.verifyConnection(apiKey, sheetId);
    if (!result.ok) {
      statusEl.textContent = '✗ ' + result.error + '. You can still use local storage.';
      statusEl.style.color = 'var(--accent-red)';
    } else {
      statusEl.textContent = '✓ Connected! Sheets: ' + (result.sheets.join(', ') || 'empty');
      statusEl.style.color = 'var(--accent-green)';
    }
  } else {
    statusEl.textContent = '→ No Sheets API key — data will save locally only';
    statusEl.style.color = 'var(--text-secondary)';
  }

  setTimeout(() => {
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    statusEl.textContent = '';
  }, 1200);
}

function setupStep2() {
  const name   = document.getElementById('user-name').value.trim() || 'User';
  const regime = document.getElementById('tax-regime').value;
  const income = parseFloat(document.getElementById('annual-income').value || '0');

  localStorage.setItem('wl_user_name',     name);
  localStorage.setItem('wl_tax_regime',    regime);
  localStorage.setItem('wl_annual_income', income);
  localStorage.setItem('wl_setup_done',    '1');

  const statusEl = document.getElementById('setup-status');
  statusEl.innerHTML = `✓ Profile saved! <strong style="color:var(--accent-gold)">Launching dashboard...</strong>`;
  statusEl.style.color = 'var(--accent-green)';
  setTimeout(() => launchApp(), 1500);
}

function launchApp() {
  Data.loadLocal();
  document.getElementById('setup-modal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      UI.navigate(item.dataset.page);
      closeSidebarOnMobile();
    });
  });

  document.querySelectorAll('.insight-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.insight-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  if (STATE.snapshots.length === 0 && STATE.assets.length > 0) {
    Data.takeSnapshot();
  }

  UI.navigate('dashboard');
  updateCurrentFY();
  fetchLiveRates();
}

// ============ MOBILE SIDEBAR TOGGLE ============
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('active', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ============ MANUAL SNAPSHOT (dashboard button) ============
function takeSnapshotNow() {
  Data.takeSnapshot();
  UI.renderDashboard();
  showToast('Snapshot saved for ' + formatMonth(Data.getCurrentMonthKey()), 'success');
}

// ============ SYNC ============
async function syncToSheets() {
  const syncEl = document.getElementById('sync-status');
  syncEl.innerHTML = '<span class="loading-spinner"></span> Syncing...';

  const sheetsData = Data.buildSheetsData();
  const [r1, r2] = await Promise.all([
    Sheets.writeData(CONFIG.SHEET_TABS.ASSETS,    sheetsData.assets),
    Sheets.writeData(CONFIG.SHEET_TABS.SNAPSHOTS, sheetsData.snapshots)
  ]);

  if (r1.ok && r2.ok) {
    syncEl.innerHTML = '<span class="sync-dot"></span> Synced ' + new Date().toLocaleTimeString('en-IN');
    showToast('Synced to Google Sheets ✓', 'success');
  } else {
    syncEl.innerHTML = '<span style="color:var(--accent-red)">⚠ Sync failed</span>';
    showToast(r1.error || r2.error || 'Sync failed', 'error');
  }
}

// ============ AI INSIGHTS ============

function switchInsightMode(mode, btn) {
  document.querySelectorAll('.insights-mode-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('insights-preset-mode').classList.toggle('hidden', mode !== 'preset');
  document.getElementById('insights-ask-mode').classList.toggle('hidden', mode !== 'ask');
}

async function generateInsights() {
  const activeBtn = document.querySelector('.insight-btn.active');
  const type      = activeBtn?.dataset?.type || 'monthly';
  const outputEl  = document.getElementById('insights-output');

  outputEl.innerHTML = `<div class="ai-loading">
    <span class="loading-spinner"></span>
    Generating ${type} insights with full portfolio context…
  </div>`;

  if (document.getElementById('page-insights').classList.contains('hidden')) {
    UI.navigate('insights');
  }

  const result = await Insights.generate(type);
  outputEl.innerHTML = Insights.formatInsightHTML(result);
}

async function sendChatMessage() {
  const input  = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const msg    = input.value.trim();
  if (!msg) return;

  const chatEl = document.getElementById('chat-output');

  // Append user bubble
  chatEl.innerHTML += Insights.formatChatHTML(msg, true);
  input.value   = '';
  input.disabled = true;
  sendBtn.disabled = true;

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  chatEl.innerHTML += `<div id="${typingId}" class="chat-bubble chat-ai chat-typing">
    <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
  </div>`;
  chatEl.scrollTop = chatEl.scrollHeight;

  const result = await Insights.chat(msg);

  // Remove typing indicator, add reply
  document.getElementById(typingId)?.remove();
  chatEl.innerHTML += Insights.formatChatHTML(result);
  chatEl.scrollTop = chatEl.scrollHeight;

  input.disabled   = false;
  sendBtn.disabled = false;
  input.focus();
}

function clearChat() {
  Insights.clearHistory();
  const chatEl = document.getElementById('chat-output');
  if (chatEl) chatEl.innerHTML = '';
  showToast('Conversation cleared', '');
}

// ============ IMPORT HANDLERS ============

// Check if file was already imported (exact duplicate)
function checkDuplicate(fileHash, fileName) {
  const existing = Data.findImportByHash(fileHash);
  if (existing) {
    const date = new Date(existing.importedAt).toLocaleDateString('en-IN');
    return `"${fileName}" was already imported on ${date}. Re-importing will replace the data from that source.`;
  }
  return null;
}

async function parseZerodha(input) {
  if (!input.files[0]) return;
  showToast('Parsing Zerodha holdings...', '');
  const result = await Parsers.parseZerodha(input.files[0]);
  showImportPreview(result, 'Zerodha Holdings');
}

async function parseZerodhaMF(input) {
  if (!input.files[0]) return;
  showToast('Parsing Zerodha MF...', '');
  const result = await Parsers.parseZerodhaMF(input.files[0]);
  showImportPreview(result, 'Zerodha Mutual Funds');
}

async function parseGrowwEquity(input) {
  if (!input.files[0]) return;
  showToast('Parsing Groww holdings...', '');
  const result = await Parsers.parseGrowwEquity(input.files[0]);
  showImportPreview(result, 'Groww Holdings');
}

async function parseGrowwMF(input) {
  if (!input.files[0]) return;
  showToast('Parsing Groww MF...', '');
  const result = await Parsers.parseGrowwMF(input.files[0]);
  showImportPreview(result, 'Groww Mutual Funds');
}

async function parseGrowwPnL(input) {
  if (!input.files[0]) return;
  showToast('Parsing Groww P&L...', '');
  const result = await Parsers.parseGrowwPnL(input.files[0]);
  showImportPreview(result, 'Groww P&L');
}

async function parseBank(input) {
  if (!input.files[0]) return;
  showToast('Parsing bank statement...', '');
  const result = await Parsers.parseBank(input.files[0]);
  showImportPreview(result, 'Bank Statement', result.message);
}

async function parseUSStocks(input) {
  if (!input.files[0]) return;
  showToast('Parsing US holdings...', '');
  const result = await Parsers.parseUSStocks(input.files[0]);
  showImportPreview(result, 'US Stocks');
}

async function parseEPF(input) {
  if (!input.files[0]) return;
  showToast('Parsing EPF passbook...', '');
  const result = await Parsers.parseEPF(input.files[0]);
  showImportPreview(result, 'EPF Passbook', result.message);
}

let currentImportResult = null;

function showImportPreview(result, title, extraMessage = null) {
  currentImportResult = result;
  const previewEl = document.getElementById('import-preview');
  const contentEl = document.getElementById('import-preview-content');
  previewEl.classList.remove('hidden');

  if (result.error) {
    contentEl.innerHTML = `<div style="color:var(--accent-red);padding:16px">Error: ${result.error}</div>`;
    return;
  }

  // Duplicate file warning
  const dupWarning = result.fileHash ? checkDuplicate(result.fileHash, result.source || title) : null;

  let html = '';
  if (dupWarning) {
    html += `<div style="background:var(--accent-red-dim);border:1px solid var(--accent-red);padding:12px 16px;border-radius:8px;margin-bottom:16px;color:var(--accent-red);font-size:0.85rem">
      ⚠ ${dupWarning}
    </div>`;
  }
  if (extraMessage) {
    html += `<div style="background:var(--bg-raised);padding:12px 16px;border-radius:8px;margin-bottom:16px;color:var(--accent-gold)">${extraMessage}</div>`;
  }

  // PnL-only imports
  if (result.pnlRecords?.length > 0 && result.assets.length === 0) {
    html += `<div style="background:var(--bg-raised);padding:16px;border-radius:8px;margin-bottom:16px">
      <p style="color:var(--text-secondary);margin-bottom:8px">
        Found <strong style="color:var(--text-primary)">${result.pnlRecords.length}</strong> P&L records.
        These are stored for <strong>tax reference only</strong> and do not affect your net worth.
      </p>
      <table style="width:100%;font-size:0.8rem;border-collapse:collapse;margin-top:8px">
        <thead><tr style="color:var(--text-muted)">
          <th style="text-align:left;padding:4px 8px">Stock</th>
          <th style="text-align:right;padding:4px 8px">Qty</th>
          <th style="text-align:right;padding:4px 8px">Gain/Loss</th>
          <th style="text-align:right;padding:4px 8px">Type</th>
        </tr></thead>
        <tbody>
          ${result.pnlRecords.slice(0, 10).map(r => `
            <tr style="border-bottom:1px solid var(--border);color:var(--text-secondary)">
              <td style="padding:4px 8px;color:var(--text-primary)">${r.name}</td>
              <td style="padding:4px 8px;text-align:right">${r.qty}</td>
              <td style="padding:4px 8px;text-align:right;color:${r.gain >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
                ${formatCurrency(r.gain)}
              </td>
              <td style="padding:4px 8px;text-align:right">${r.gainType}</td>
            </tr>`).join('')}
          ${result.pnlRecords.length > 10 ? `<tr><td colspan="4" style="padding:8px;color:var(--text-muted);text-align:center">...and ${result.pnlRecords.length - 10} more</td></tr>` : ''}
        </tbody>
      </table>
    </div>`;
    contentEl.innerHTML = html;
    previewEl.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (result.assets.length === 0) {
    contentEl.innerHTML = html + `<p style="color:var(--text-muted);padding:16px">No assets detected. Check file format.</p>`;
    return;
  }

  html += `<p style="color:var(--text-secondary);margin-bottom:12px">Found <strong style="color:var(--text-primary)">${result.assets.length}</strong> ${title} entries:</p>`;

  // Bank rename field — always show for bank imports so user can name the account
  const isBank = result.source === 'bank_csv' || result.source === 'bank_pdf';
  if (isBank && result.assets.length > 0) {
    const detectedBalance = result.assets[0].balance || 0;
    html += `<div style="background:var(--bg-raised);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
      <div class="input-group" style="margin-bottom:0">
        <label>Bank Name</label>
        <input type="text" id="bank-import-name" placeholder="e.g. HDFC Savings, SBI Current"
          value="${result.assets[0].name || 'Bank Account'}"
          style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);font-size:0.9rem;width:100%">
        <span class="input-hint">Detected balance: <strong style="color:var(--accent-gold)">${formatCurrencyFull(detectedBalance)}</strong> — rename this account before confirming</span>
      </div>
    </div>`;
  }

  html += `<table class="preview-table">
      <thead><tr><th>Name</th><th>Category</th><th>Value</th><th>Cost Basis</th></tr></thead>
      <tbody>
        ${result.assets.map(a => `
          <tr>
            <td>${a.name}</td>
            <td>${CONFIG.CATEGORIES[a.category]?.label || a.category}</td>
            <td>${formatCurrencyFull(Data.getAssetValue(a))}</td>
            <td>${formatCurrencyFull(Data.getAssetCost(a))}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;

  contentEl.innerHTML = html;
  previewEl.scrollIntoView({ behavior: 'smooth' });
}

function closeImportPreview() {
  document.getElementById('import-preview').classList.add('hidden');
  currentImportResult = null;
}

function confirmImport() {
  if (!currentImportResult) return;

  const result = currentImportResult;
  const source = result.source;

  // PnL records
  if (result.pnlRecords?.length > 0) {
    Data.addPnlRecords(result.pnlRecords, source);
    Data.registerImport({
      fileHash:   result.fileHash || ('manual_' + Date.now()),
      fileName:   source,
      source,
      assetCount: result.pnlRecords.length,
      importedAt: new Date().toISOString(),
      type:       'pnl'
    });
    showToast(`Saved ${result.pnlRecords.length} P&L records ✓`, 'success');
    closeImportPreview();
    return;
  }

  if (!result.assets?.length) return;

  // Apply bank rename if user set a custom name
  const bankNameEl = document.getElementById('bank-import-name');
  if (bankNameEl && (result.source === 'bank_csv' || result.source === 'bank_pdf')) {
    const customName = bankNameEl.value.trim();
    if (customName) result.assets[0].name = customName;
  }

  // Merge assets by source (replace source's existing data)
  Data.mergeAssets(result.assets, source);
  Data.takeSnapshot();

  // Register this import
  Data.registerImport({
    fileHash:   result.fileHash || ('manual_' + Date.now()),
    fileName:   result.type || source,
    source,
    assetCount: result.assets.length,
    importedAt: new Date().toISOString(),
    type:       'assets'
  });

  showToast(`Imported ${result.assets.length} assets from ${CONFIG.IMPORT_SOURCES[source] || source} ✓`, 'success');
  closeImportPreview();
  UI.renderDashboard();
  UI.renderImportHistory();
}

function showBulkEntry() { UI.showBulkEntry(); }

// ============ SETTINGS ============
function loadSettings() { UI.renderSettings(); }

function saveSettings() {
  localStorage.setItem('wl_gs_key',     document.getElementById('settings-api-key')?.value    || '');
  localStorage.setItem('wl_gs_id',      document.getElementById('settings-sheet-id')?.value   || '');
  localStorage.setItem('wl_claude_key', document.getElementById('settings-claude-key')?.value || '');
  const scriptUrl = document.getElementById('settings-script-url')?.value.trim();
  if (scriptUrl) localStorage.setItem('wl_script_url', scriptUrl);
  STATE.usdInr   = parseFloat(document.getElementById('usd-inr-rate')?.value)  || 84;
  STATE.goldRate = parseFloat(document.getElementById('gold-rate')?.value)     || 7200;
  Data.saveLocal();
  showToast('Settings saved ✓', 'success');
}

async function fetchLiveRates() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
    if (res.ok) {
      const data = await res.json();
      STATE.usdInr = data.rates?.INR || STATE.usdInr;
      Data.saveLocal();
      const el = document.getElementById('usd-inr-rate');
      if (el) el.value = STATE.usdInr.toFixed(2);
    }
  } catch { /* silent fail */ }
}

function exportData() {
  const json = Data.exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `wealthlens-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast('Exported backup ✓', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text   = await file.text();
    const result = Data.importJSON(text);
    if (result.ok) {
      showToast('Data imported ✓', 'success');
      UI.renderDashboard();
    } else {
      showToast('Import failed: ' + result.error, 'error');
    }
  };
  input.click();
}

function clearData() {
  if (confirm('Clear ALL data? This cannot be undone.')) {
    if (confirm('Are you sure? All assets, history, and imports will be deleted.')) {
      localStorage.clear();
      location.reload();
    }
  }
}

function updateCurrentFY() {
  const el = document.getElementById('current-fy');
  if (el) el.textContent = getCurrentFY();
}

// ============ APPS SCRIPT GUIDE ============
function showAppsScriptGuide() {
  const sheetId = localStorage.getItem('wl_gs_id') || '';
  const code = Sheets.getAppsScriptCode(sheetId);
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card" style="width:680px">
      <div class="modal-header">
        <h2>Google Sheets Write Access Setup</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div style="padding:24px">
        <p style="color:var(--text-secondary);margin-bottom:16px">
          Deploy this Apps Script as a Web App to enable write access:
        </p>
        <ol style="color:var(--text-secondary);font-size:0.88rem;line-height:2;margin:0 0 16px 20px">
          <li>Open your Google Sheet → Extensions → Apps Script</li>
          <li>Replace all code with the script below</li>
          <li>Click Deploy → New deployment → Web App</li>
          <li>Set "Execute as: Me" and "Access: Anyone"</li>
          <li>Copy the Web App URL and paste below</li>
        </ol>
        <textarea style="width:100%;height:200px;background:var(--bg-raised);border:1px solid var(--border);border-radius:6px;padding:12px;color:var(--text-primary);font-family:var(--font-mono);font-size:0.78rem" readonly>${code}</textarea>
        <div class="input-group" style="margin-top:16px">
          <label>Web App URL</label>
          <input type="text" id="script-url-input" placeholder="https://script.google.com/macros/s/.../exec"
            value="${localStorage.getItem('wl_script_url') || ''}">
        </div>
        <button class="btn-primary" onclick="saveScriptUrl()">Save Script URL</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveScriptUrl() {
  const url = document.getElementById('script-url-input')?.value.trim();
  if (url) {
    localStorage.setItem('wl_script_url', url);
    showToast('Script URL saved ✓', 'success');
    document.querySelector('.modal-overlay:last-child')?.remove();
  }
}
