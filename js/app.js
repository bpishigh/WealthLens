// js/app.js — App bootstrap, setup flow, global actions

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  // Set PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
  const apiKey = document.getElementById('gs-api-key').value.trim();
  const sheetId = document.getElementById('gs-sheet-id').value.trim();
  const claudeKey = document.getElementById('claude-api-key').value.trim();

  const statusEl = document.getElementById('setup-status');

  if (!sheetId) {
    statusEl.textContent = '✗ Please enter a Sheet ID';
    statusEl.style.color = 'var(--accent-red)';
    return;
  }

  // Save keys
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
      statusEl.textContent = '✓ Connected! Found sheets: ' + (result.sheets.join(', ') || 'empty');
      statusEl.style.color = 'var(--accent-green)';
    }
  } else {
    statusEl.textContent = '→ No Sheets API key — data will save locally only';
    statusEl.style.color = 'var(--text-secondary)';
  }

  // Move to step 2
  setTimeout(() => {
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    statusEl.textContent = '';
  }, 1200);
}

function setupStep2() {
  const name = document.getElementById('user-name').value.trim() || 'User';
  const regime = document.getElementById('tax-regime').value;
  const income = parseFloat(document.getElementById('annual-income').value || '0');

  localStorage.setItem('wl_user_name', name);
  localStorage.setItem('wl_tax_regime', regime);
  localStorage.setItem('wl_annual_income', income);
  localStorage.setItem('wl_setup_done', '1');

  // Show Apps Script setup tip
  const statusEl = document.getElementById('setup-status');
  statusEl.innerHTML = `✓ Profile saved! For Google Sheets sync, go to Settings → Deploy Apps Script.<br>
    <strong style="color:var(--accent-gold)">Launching dashboard...</strong>`;
  statusEl.style.color = 'var(--accent-green)';

  setTimeout(() => launchApp(), 1500);
}

function launchApp() {
  Data.loadLocal();
  document.getElementById('setup-modal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Set up nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      UI.navigate(item.dataset.page);
    });
  });

  document.querySelectorAll('.insight-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.insight-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // If no data, take initial snapshot
  if (STATE.snapshots.length === 0 && STATE.assets.length > 0) {
    Data.takeSnapshot();
  }

  UI.navigate('dashboard');
  updateCurrentFY();
  fetchLiveRates(); // Try to get live USD/INR and gold rates
}

// ============ SYNC ============
async function syncToSheets() {
  const syncEl = document.getElementById('sync-status');
  syncEl.innerHTML = '<span class="loading-spinner"></span> Syncing...';

  const sheetsData = Data.buildSheetsData();

  const [r1, r2] = await Promise.all([
    Sheets.writeData(CONFIG.SHEET_TABS.ASSETS, sheetsData.assets),
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
async function generateInsights() {
  const activeBtn = document.querySelector('.insight-btn.active');
  const type = activeBtn?.dataset?.type || 'monthly';

  const outputEl = document.getElementById('insights-output');
  outputEl.innerHTML = `<div class="ai-loading"><span class="loading-spinner"></span> Generating ${type} insights with Claude Haiku (~500 tokens)...</div>`;

  // Navigate to insights page if not there
  if (document.getElementById('page-insights').classList.contains('hidden')) {
    UI.navigate('insights');
  }

  const result = await Insights.generate(type);
  outputEl.innerHTML = Insights.formatInsightHTML(result);
}

// ============ IMPORT HANDLERS ============
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

  if (extraMessage) {
    contentEl.innerHTML = `<div style="background:var(--bg-raised);padding:12px 16px;border-radius:8px;margin-bottom:16px;color:var(--accent-gold)">${extraMessage}</div>`;
  } else {
    contentEl.innerHTML = '';
  }

  if (result.assets.length === 0) {
    contentEl.innerHTML += `<p style="color:var(--text-muted);padding:16px">No assets detected. Check file format.</p>`;
    return;
  }

  contentEl.innerHTML += `
    <p style="color:var(--text-secondary);margin-bottom:12px">Found <strong style="color:var(--text-primary)">${result.assets.length}</strong> ${title} entries:</p>
    <table class="preview-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Value</th>
          <th>Cost Basis</th>
        </tr>
      </thead>
      <tbody>
        ${result.assets.map(a => `
          <tr>
            <td>${a.name}</td>
            <td>${CONFIG.CATEGORIES[a.category]?.label || a.category}</td>
            <td>${formatCurrencyFull(Data.getAssetValue(a))}</td>
            <td>${formatCurrencyFull(Data.getAssetCost(a))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  previewEl.scrollIntoView({ behavior: 'smooth' });
}

function closeImportPreview() {
  document.getElementById('import-preview').classList.add('hidden');
  currentImportResult = null;
}

function confirmImport() {
  if (!currentImportResult?.assets?.length) return;

  currentImportResult.assets.forEach(a => Data.addAsset(a));
  Data.takeSnapshot();
  Data.saveLocal();

  showToast(`Imported ${currentImportResult.assets.length} assets ✓`, 'success');
  closeImportPreview();
  UI.renderDashboard();
}

function showBulkEntry() { UI.showBulkEntry(); }

// ============ SETTINGS ============
function loadSettings() {
  document.getElementById('settings-api-key').value = localStorage.getItem('wl_gs_key') || '';
  document.getElementById('settings-sheet-id').value = localStorage.getItem('wl_gs_id') || '';
  document.getElementById('settings-claude-key').value = localStorage.getItem('wl_claude_key') || '';
  document.getElementById('usd-inr-rate').value = STATE.usdInr;
  document.getElementById('gold-rate').value = STATE.goldRate;
}

function saveSettings() {
  localStorage.setItem('wl_gs_key', document.getElementById('settings-api-key').value);
  localStorage.setItem('wl_gs_id', document.getElementById('settings-sheet-id').value);
  localStorage.setItem('wl_claude_key', document.getElementById('settings-claude-key').value);
  STATE.usdInr = parseFloat(document.getElementById('usd-inr-rate').value) || 84;
  STATE.goldRate = parseFloat(document.getElementById('gold-rate').value) || 7200;
  Data.saveLocal();
  showToast('Settings saved ✓', 'success');
}

async function fetchLiveRates() {
  try {
    // Free forex API
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
    if (res.ok) {
      const data = await res.json();
      STATE.usdInr = data.rates?.INR || STATE.usdInr;
      Data.saveLocal();
      const el = document.getElementById('usd-inr-rate');
      if (el) el.value = STATE.usdInr.toFixed(2);
    }
  } catch { /* silent fail — user can set manually */ }
}

function exportData() {
  const json = Data.exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wealthlens-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast('Exported backup ✓', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
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
    if (confirm('Are you sure? All assets and history will be deleted.')) {
      localStorage.clear();
      location.reload();
    }
  }
}

function updateCurrentFY() {
  document.getElementById('current-fy').textContent = getCurrentFY();
}

// ============ SETTINGS APPS SCRIPT SETUP ============
// Add to settings page: guide for deploying Apps Script
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
          To write data to your Google Sheet, deploy this Apps Script as a Web App:
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

// Expose Apps Script guide button to settings page
document.addEventListener('DOMContentLoaded', () => {
  // Add button dynamically when settings loads
  document.querySelector('[data-page="settings"]')?.addEventListener('click', () => {
    setTimeout(() => {
      const card = document.querySelector('.settings-card:first-child');
      if (card && !card.querySelector('.script-btn')) {
        const btn = document.createElement('button');
        btn.className = 'btn-secondary script-btn';
        btn.textContent = '⚙ Setup Write Access (Apps Script)';
        btn.onclick = showAppsScriptGuide;
        card.appendChild(btn);
      }
    }, 100);
  });
});
