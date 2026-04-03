// js/ui.js — UI rendering, forms, navigation

const UI = {

  // ============ NAVIGATION ============
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.remove('hidden');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    if (page === 'dashboard') this.renderDashboard();
    if (page === 'assets')    this.renderAssets();
    if (page === 'tax')       Tax.update();
    if (page === 'settings')  this.renderSettings();
    if (page === 'import')    this.renderImportHistory();
  },

  // ============ DASHBOARD ============
  renderDashboard(snapshotOverride = null) {
    // snapshotOverride: if set, render historical data from that snapshot
    const total    = snapshotOverride ? snapshotOverride.total : Data.getTotalNetWorth();
    const mom      = Data.getMoMChange();
    const breakdown = snapshotOverride
      ? this._breakdownFromSnapshot(snapshotOverride)
      : Data.getCategoryBreakdown();

    document.getElementById('total-networth').textContent = formatCurrencyFull(total);

    const monthKey = snapshotOverride ? snapshotOverride.month : Data.getCurrentMonthKey();
    document.getElementById('current-month').textContent = formatMonth(monthKey);

    const changeEl = document.getElementById('nw-change');
    const isPos = mom.amount >= 0;
    changeEl.className = 'nw-change ' + (isPos ? 'positive' : 'negative');
    document.querySelector('.change-arrow').textContent = isPos ? '↑' : '↓';
    document.getElementById('change-amount').textContent = formatCurrency(Math.abs(mom.amount));
    document.getElementById('change-pct').textContent = `(${formatPct(mom.pct)})`;

    this.renderCategoryCards(breakdown, total);
    Charts.renderDonut('donut-chart', breakdown);

    const trendData = Data.getTrendData();
    Charts.buildChartToggles('chart-toggles');
    Charts.renderTrend('trend-chart', trendData);

    this.renderSnapshotTable(breakdown, total);
    this.populateMonthSelector();
  },

  // Build a breakdown array from a stored snapshot (for historical view)
  _breakdownFromSnapshot(snapshot) {
    return Object.keys(CONFIG.CATEGORIES)
      .filter(cat => snapshot.categories?.[cat])
      .map(cat => ({
        category: cat,
        label:    CONFIG.CATEGORIES[cat].label,
        icon:     CONFIG.CATEGORIES[cat].icon,
        color:    CONFIG.CATEGORIES[cat].color,
        value:    snapshot.categories[cat].value || 0,
        cost:     snapshot.categories[cat].cost  || 0,
        count:    0
      }))
      .filter(b => b.value !== 0);
  },

  renderCategoryCards(breakdown, total) {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    grid.innerHTML = breakdown.map(b => {
      const mom = Data.getCategoryMoM(b.category);
      const pct = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
      const isPos = mom.amount >= 0;
      return `<div class="cat-card" data-cat="${b.category}" onclick="UI.navigate('assets')">
        <div class="cat-icon">${b.icon}</div>
        <div class="cat-name">${b.label}</div>
        <div class="cat-value">${formatCurrency(b.value)}</div>
        <div class="cat-change ${isPos ? 'tag-positive' : 'tag-negative'}">
          ${isPos ? '↑' : '↓'} ${formatCurrency(Math.abs(mom.amount))} ${formatPct(mom.pct)}
        </div>
        <div class="cat-pct">${pct}% of portfolio</div>
      </div>`;
    }).join('');
  },

  renderSnapshotTable(breakdown, total) {
    const tbody = document.getElementById('snapshot-body');
    if (!tbody) return;

    tbody.innerHTML = breakdown.map(b => {
      const gain    = b.value - b.cost;
      const gainPct = b.cost > 0 ? (gain / b.cost) * 100 : 0;
      const mom     = Data.getCategoryMoM(b.category);
      const nwPct   = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
      return `<tr>
        <td>${b.icon} ${b.label}</td>
        <td class="mono">${formatCurrencyFull(b.value)}</td>
        <td class="mono">${b.cost > 0 ? formatCurrencyFull(b.cost) : '—'}</td>
        <td class="mono ${gain >= 0 ? 'tag-positive' : 'tag-negative'}">
          ${gain !== 0 ? formatCurrency(gain) + ' (' + formatPct(gainPct) + ')' : '—'}
        </td>
        <td class="mono">${nwPct}%</td>
        <td class="mono ${mom.amount >= 0 ? 'tag-positive' : 'tag-negative'}">
          ${mom.amount !== 0 ? formatPct(mom.pct) : '—'}
        </td>
      </tr>`;
    }).join('');

    const totalCost = breakdown.reduce((s, b) => s + b.cost, 0);
    const totalGain = total - totalCost;
    tbody.innerHTML += `<tr style="border-top:2px solid var(--border-bright);font-weight:600">
      <td style="color:var(--text-primary)">Total Net Worth</td>
      <td class="mono" style="color:var(--accent-gold)">${formatCurrencyFull(total)}</td>
      <td class="mono">${formatCurrencyFull(totalCost)}</td>
      <td class="mono ${totalGain >= 0 ? 'tag-positive' : 'tag-negative'}">${formatCurrency(totalGain)}</td>
      <td class="mono">100%</td>
      <td class="mono ${Data.getMoMChange().amount >= 0 ? 'tag-positive' : 'tag-negative'}">${formatPct(Data.getMoMChange().pct)}</td>
    </tr>`;
  },

  populateMonthSelector() {
    const sel = document.getElementById('month-selector');
    if (!sel) return;
    const months  = Data.getSnapshotMonths();
    const current = Data.getCurrentMonthKey();
    sel.innerHTML = `<option value="current">Current (${formatMonth(current)})</option>` +
      [...months].reverse().map(m => `<option value="${m}">${formatMonth(m)}</option>`).join('');
  },

  // ============ ASSETS ============
  renderAssets() {
    Object.keys(CONFIG.CATEGORIES).forEach(cat => {
      const assets = Data.getAssets(cat);
      const total  = Data.getCategoryTotal(cat);
      const totalEl = document.getElementById(`${cat}-total`);
      if (totalEl) totalEl.textContent = formatCurrencyFull(total);
      const listEl = document.getElementById(`list-${cat}`);
      if (listEl) listEl.innerHTML = this.renderAssetList(assets, cat);
    });
  },

  renderAssetList(assets, cat) {
    if (assets.length === 0) {
      return `<div style="padding:16px 20px;color:var(--text-muted);font-size:0.83rem">
        No ${CONFIG.CATEGORIES[cat].label} added yet
      </div>`;
    }
    return assets.map(a => {
      const value   = Data.getAssetValue(a);
      const cost    = Data.getAssetCost(a);
      const gain    = value - cost;
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
      const subtitle = getAssetSubtitle(a);
      const sourceTag = a.source && a.source !== 'manual'
        ? `<span style="font-size:0.7rem;background:var(--bg-hover);color:var(--text-muted);padding:1px 6px;border-radius:4px;margin-left:6px">${CONFIG.IMPORT_SOURCES[a.source] || a.source}</span>`
        : '';
      return `<div class="asset-item">
        <div>
          <div class="asset-item-name">${a.name}${sourceTag}</div>
          <div class="asset-item-sub">${subtitle}</div>
        </div>
        <div class="asset-item-value mono">${formatCurrencyFull(value)}</div>
        <div class="mono ${gain >= 0 ? 'tag-positive' : 'tag-negative'}">
          ${cost > 0 ? formatCurrency(gain) + ' (' + formatPct(gainPct) + ')' : '—'}
        </div>
        <div class="mono" style="color:var(--text-muted)">${cost > 0 ? formatCurrencyFull(cost) : '—'}</div>
        <div class="asset-item-actions">
          <button class="btn-icon-sm" onclick="editAsset('${a.id}')">✎</button>
          <button class="btn-icon-sm" onclick="deleteAsset('${a.id}')">✕</button>
        </div>
      </div>`;
    }).join('');
  },

  // ============ ASSET FORMS ============
  showAddAssetModal() {
    // Show category picker first
    const cats = Object.keys(CONFIG.CATEGORIES);
    const pickerHtml = `
      <input type="hidden" id="form-asset-id" value="">
      <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.88rem">Select asset type to add:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${cats.map(cat => {
          const c = CONFIG.CATEGORIES[cat];
          return `<button class="btn-secondary" style="justify-content:flex-start;gap:10px;padding:12px 14px"
            onclick="UI.showAssetForm('${cat}')">
            <span>${c.icon}</span> <span>${c.label}</span>
          </button>`;
        }).join('')}
      </div>`;
    document.getElementById('asset-modal-title').textContent = 'Add Asset';
    document.getElementById('asset-form-container').innerHTML = pickerHtml;
    document.getElementById('asset-modal').classList.remove('hidden');
  },

  showAssetForm(category, existingAsset = null) {
    const fields = CONFIG.ASSET_FORMS[category];
    if (!fields) return;
    const title = existingAsset ? `Edit ${CONFIG.CATEGORIES[category].label}` : `Add ${CONFIG.CATEGORIES[category].label}`;
    document.getElementById('asset-modal-title').textContent = title;

    const formHtml = `
      <input type="hidden" id="form-category" value="${category}">
      <input type="hidden" id="form-asset-id" value="${existingAsset?.id || ''}">
      ${fields.map(f => {
        const val = existingAsset?.[f.id] || '';
        if (f.type === 'select') {
          return `<div class="input-group">
            <label>${f.label}</label>
            <select id="form-${f.id}">
              ${f.options.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>`;
        }
        return `<div class="input-group">
          <label>${f.label}</label>
          <input type="${f.type}" id="form-${f.id}" placeholder="${f.placeholder || ''}" value="${val}">
        </div>`;
      }).join('')}
      <div style="display:flex;gap:12px;margin-top:8px">
        ${!existingAsset ? `<button class="btn-secondary" style="flex:0 0 auto;padding:10px 16px" onclick="UI.showAddAssetModal()">← Back</button>` : ''}
        <button class="btn-secondary" style="flex:1" onclick="closeModal('asset-modal')">Cancel</button>
        <button class="btn-primary" style="flex:1;margin:0" onclick="saveAssetForm()">
          ${existingAsset ? 'Update' : 'Add Asset'}
        </button>
      </div>`;

    document.getElementById('asset-form-container').innerHTML = formHtml;
    document.getElementById('asset-modal').classList.remove('hidden');
  },

  // ============ BULK ENTRY ============
  showBulkEntry() {
    const now = new Date();
    document.getElementById('bulk-month-label').textContent =
      now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const sections = Object.keys(CONFIG.CATEGORIES)
      .map(key => ({ key, items: Data.getAssets(key) }))
      .filter(s => s.items.length > 0 && s.key !== 'liability');

    const formHtml = sections.map(s => {
      const cat = CONFIG.CATEGORIES[s.key];
      return `<div class="bulk-section">
        <div class="bulk-section-title">${cat.icon} ${cat.label}</div>
        ${s.items.map(a => `
          <div class="bulk-item">
            <label>${a.name}</label>
            <input type="number" id="bulk-${a.id}"
              value="${Data.getAssetValue(a).toFixed(0)}"
              placeholder="Current value ₹">
          </div>`).join('')}
      </div>`;
    }).join('');

    document.getElementById('bulk-form').innerHTML = formHtml ||
      '<p style="padding:16px;color:var(--text-muted)">Add assets first before using bulk entry.</p>';
    document.getElementById('bulk-modal').classList.remove('hidden');
  },

  // ============ IMPORT HISTORY ============
  renderImportHistory() {
    const imports = Data.getImports();
    const container = document.getElementById('import-history');
    if (!container) return;

    if (imports.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:12px 0">No imports yet.</p>';
      return;
    }

    container.innerHTML = `
      <table style="width:100%;font-size:0.82rem;border-collapse:collapse">
        <thead>
          <tr style="color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border)">
            <th style="padding:6px 8px">File</th>
            <th style="padding:6px 8px">Source</th>
            <th style="padding:6px 8px">Assets</th>
            <th style="padding:6px 8px">Imported</th>
          </tr>
        </thead>
        <tbody>
          ${[...imports].reverse().map(imp => `
            <tr style="border-bottom:1px solid var(--border);color:var(--text-secondary)">
              <td style="padding:6px 8px;color:var(--text-primary)">${imp.fileName}</td>
              <td style="padding:6px 8px">${CONFIG.IMPORT_SOURCES[imp.source] || imp.source}</td>
              <td style="padding:6px 8px">${imp.assetCount}</td>
              <td style="padding:6px 8px">${new Date(imp.importedAt).toLocaleDateString('en-IN')}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

  // ============ SETTINGS ============
  renderSettings() {
    const el = id => document.getElementById(id);
    if (el('settings-api-key'))    el('settings-api-key').value    = localStorage.getItem('wl_gs_key')     || '';
    if (el('settings-sheet-id'))   el('settings-sheet-id').value   = localStorage.getItem('wl_gs_id')      || '';
    if (el('settings-claude-key')) el('settings-claude-key').value = localStorage.getItem('wl_claude_key') || '';
    if (el('usd-inr-rate'))        el('usd-inr-rate').value        = STATE.usdInr;
    if (el('gold-rate'))           el('gold-rate').value           = STATE.goldRate;
  }
};

// ============ GLOBAL HELPERS ============

function getAssetSubtitle(a) {
  switch (a.category) {
    case 'equity':     return `${a.qty} shares @ ₹${parseFloat(a.avgPrice || 0).toFixed(0)} avg · ${a.exchange || 'NSE'}`;
    case 'mf':         return `${parseFloat(a.units || 0).toFixed(3)} units · NAV ₹${parseFloat(a.nav || 0).toFixed(2)} · ${a.mfType || ''}`;
    case 'us':         return `${a.qty} shares · $${parseFloat(a.priceUSD || 0).toFixed(2)} · ${a.platform || ''} ${a.isESOP !== 'No' ? '· ESOP' : ''}`;
    case 'bank':       return a.account || 'Savings';
    case 'gold':       return `${a.qty}g · ₹${parseFloat(a.rate || STATE.goldRate).toFixed(0)}/g`;
    case 'fd':         return `${a.fdType || 'FD'} · ${a.rate || 0}% · Matures ${a.maturityDate || '—'}`;
    case 'realestate': return `${a.propertyType || ''} · Loan: ${a.loanBalance ? formatCurrency(parseFloat(a.loanBalance)) : 'Nil'}`;
    case 'retirement': return a.notes || '';
    case 'liability':  return `${a.loanType || ''} · EMI ₹${parseFloat(a.emi || 0).toLocaleString()}`;
    default:           return a.notes || '';
  }
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function showAddAssetModal() {
  UI.showAddAssetModal();
}

function saveAssetForm() {
  const cat    = document.getElementById('form-category')?.value;
  const id     = document.getElementById('form-asset-id')?.value;
  const fields = CONFIG.ASSET_FORMS[cat];
  if (!fields) return;

  const asset = { category: cat, source: 'manual' };
  fields.forEach(f => {
    const el = document.getElementById(`form-${f.id}`);
    asset[f.id] = el?.value || '';
  });

  if (id) {
    Data.updateAsset(id, asset);
    showToast('Asset updated', 'success');
  } else {
    Data.addAsset(asset);
    showToast('Asset added ✓', 'success');
  }

  closeModal('asset-modal');
  UI.renderAssets();
  UI.renderDashboard();
}

function editAsset(id) {
  const asset = STATE.assets.find(a => a.id === id);
  if (!asset) return;
  UI.showAssetForm(asset.category, asset);
}

function deleteAsset(id) {
  if (confirm('Delete this asset?')) {
    Data.deleteAsset(id);
    UI.renderAssets();
    UI.renderDashboard();
    showToast('Asset deleted');
  }
}

function saveBulkEntry() {
  STATE.assets.forEach(a => {
    const el = document.getElementById(`bulk-${a.id}`);
    if (!el) return;
    const newVal = parseFloat(el.value);
    if (isNaN(newVal)) return;
    switch (a.category) {
      case 'bank':       Data.updateAsset(a.id, { balance: newVal }); break;
      case 'retirement': Data.updateAsset(a.id, { balance: newVal }); break;
      case 'realestate': Data.updateAsset(a.id, { currentValue: newVal }); break;
      case 'equity': {
        const qty = parseFloat(a.qty) || 1;
        Data.updateAsset(a.id, { ltp: (newVal / qty).toFixed(2) }); break;
      }
      case 'mf': {
        const units = parseFloat(a.units) || 1;
        Data.updateAsset(a.id, { nav: (newVal / units).toFixed(4) }); break;
      }
      case 'us': {
        const qty = parseFloat(a.qty) || 1;
        const inr = STATE.usdInr || 84;
        Data.updateAsset(a.id, { priceUSD: (newVal / qty / inr).toFixed(2) }); break;
      }
      case 'gold': Data.updateAsset(a.id, { rate: (newVal / (parseFloat(a.qty) || 1)).toFixed(0) }); break;
      case 'fd':   Data.updateAsset(a.id, { maturity: newVal }); break;
      case 'other':Data.updateAsset(a.id, { value: newVal }); break;
    }
  });
  Data.takeSnapshot();
  closeModal('bulk-modal');
  UI.renderDashboard();
  showToast('Snapshot saved for ' + formatMonth(Data.getCurrentMonthKey()), 'success');
}

// ============ TOAST (FIXED) ============
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');   // FIX: was missing this line
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ============ GLOBAL PASSTHROUGH FOR INLINE ONCLICK HANDLERS ============
// index.html uses onclick="showAssetForm('bank')" — these bridge to UI object methods
function showAssetForm(category, existingAsset = null) {
  UI.showAssetForm(category, existingAsset);
}

// ============ MONTH SELECTOR HANDLER ============
function loadMonthData(monthKey) {
  if (monthKey === 'current' || !monthKey) {
    UI.renderDashboard();
    return;
  }
  const snap = Data.getSnapshotForMonth(monthKey);
  if (!snap) {
    showToast('No snapshot found for ' + formatMonth(monthKey), 'error');
    return;
  }
  UI.renderDashboard(snap);
}
