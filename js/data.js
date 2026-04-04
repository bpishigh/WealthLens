// js/data.js — Data layer: CRUD for assets, snapshots, import registry, calculations

const Data = {

  // ============ ASSET ID HELPERS ============

  buildAssetId(source, name) {
    const normalized = (name || '').trim().toUpperCase().replace(/\s+/g, '_');
    return `${source}__${normalized}`;
  },

  // ============ ASSETS ============

  getAssets(category = null) {
    const assets = STATE.assets || [];
    return category ? assets.filter(a => a.category === category) : assets;
  },

  addAsset(asset) {
    asset.id = asset.id || ('a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    asset.createdAt = asset.createdAt || new Date().toISOString();
    asset.source = asset.source || 'manual';
    if (!asset.asset_id && asset.source && asset.name) {
      asset.asset_id = this.buildAssetId(asset.source, asset.name);
    }
    STATE.assets.push(asset);
    this.saveLocal();
    return asset;
  },

  updateAsset(id, updates) {
    const idx = STATE.assets.findIndex(a => a.id === id);
    if (idx >= 0) {
      STATE.assets[idx] = { ...STATE.assets[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveLocal();
    }
  },

  deleteAsset(id) {
    STATE.assets = STATE.assets.filter(a => a.id !== id);
    this.saveLocal();
  },

  mergeAssets(newAssets, source) {
    STATE.assets = STATE.assets.filter(a => a.source !== source);
    newAssets.forEach(a => {
      a.source = source;
      a.id = 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      a.createdAt = new Date().toISOString();
      a.asset_id = this.buildAssetId(source, a.name);
    });
    STATE.assets = STATE.assets.concat(newAssets);
    this.saveLocal();
  },

  // ============ VALUE CALCULATIONS ============

  getAssetValue(asset) {
    const usd = STATE.usdInr || 84;
    switch (asset.category) {
      case 'bank':       return parseFloat(asset.balance) || 0;
      case 'equity':     return (parseFloat(asset.qty) || 0) * (parseFloat(asset.ltp) || 0);
      case 'mf':         return (parseFloat(asset.units) || 0) * (parseFloat(asset.nav) || 0);
      case 'us':         return (parseFloat(asset.qty) || 0) * (parseFloat(asset.priceUSD) || 0) * usd;
      case 'retirement': return parseFloat(asset.balance) || 0;
      case 'realestate': return parseFloat(asset.currentValue) || 0;
      case 'gold':       return (parseFloat(asset.qty) || 0) * (parseFloat(asset.rate) || STATE.goldRate);
      case 'fd':         return parseFloat(asset.maturity) || parseFloat(asset.principal) || 0;
      case 'other':      return parseFloat(asset.value) || 0;
      case 'liability':  return -(parseFloat(asset.outstanding) || 0);
      default:           return 0;
    }
  },

  getAssetCost(asset) {
    const usd = STATE.usdInr || 84;
    switch (asset.category) {
      case 'bank':       return parseFloat(asset.balance) || 0;
      case 'equity':     return (parseFloat(asset.qty) || 0) * (parseFloat(asset.avgPrice) || 0);
      case 'mf':         return parseFloat(asset.invested) || 0;
      case 'us':         return (parseFloat(asset.qty) || 0) * (parseFloat(asset.costUSD) || 0) * usd;
      case 'retirement': return parseFloat(asset.ytdContrib) || 0;
      case 'realestate': return parseFloat(asset.purchasePrice) || 0;
      case 'gold':       return (parseFloat(asset.qty) || 0) * 5000;
      case 'fd':         return parseFloat(asset.principal) || 0;
      case 'other':      return parseFloat(asset.cost) || 0;
      default:           return 0;
    }
  },

  getCategoryTotal(category) {
    return this.getAssets(category).reduce((sum, a) => sum + this.getAssetValue(a), 0);
  },

  getTotalNetWorth() {
    return Object.keys(CONFIG.CATEGORIES).reduce((sum, cat) => sum + this.getCategoryTotal(cat), 0);
  },

  getCategoryBreakdown() {
    return Object.keys(CONFIG.CATEGORIES).map(cat => ({
      category: cat,
      label:    CONFIG.CATEGORIES[cat].label,
      icon:     CONFIG.CATEGORIES[cat].icon,
      color:    CONFIG.CATEGORIES[cat].color,
      value:    this.getCategoryTotal(cat),
      cost:     this.getAssets(cat).reduce((s, a) => s + this.getAssetCost(a), 0),
      count:    this.getAssets(cat).length
    })).filter(c => c.value !== 0);
  },

  // ============ SNAPSHOTS ============

  getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  takeSnapshot(monthKey = null) {
    const key = monthKey || this.getCurrentMonthKey();
    const breakdown = this.getCategoryBreakdown();
    const total = this.getTotalNetWorth();
    const snapshot = {
      month: key,
      total,
      categories: {},
      takenAt: new Date().toISOString()
    };
    breakdown.forEach(b => {
      snapshot.categories[b.category] = { value: b.value, cost: b.cost };
    });
    STATE.snapshots = STATE.snapshots.filter(s => s.month !== key);
    STATE.snapshots.push(snapshot);
    STATE.snapshots.sort((a, b) => a.month.localeCompare(b.month));
    this.saveLocal();
    return snapshot;
  },

  getSnapshots() {
    return [...STATE.snapshots].sort((a, b) => a.month.localeCompare(b.month));
  },

  getSnapshotMonths() {
    return this.getSnapshots().map(s => s.month);
  },

  getLatestSnapshot() {
    const snaps = this.getSnapshots();
    return snaps[snaps.length - 1] || null;
  },

  getPreviousSnapshot() {
    const snaps = this.getSnapshots();
    return snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  },

  getMoMChange() {
    const curr = this.getLatestSnapshot();
    const prev = this.getPreviousSnapshot();
    if (!curr || !prev) return { amount: 0, pct: 0 };
    const amount = curr.total - prev.total;
    const pct = prev.total !== 0 ? (amount / Math.abs(prev.total)) * 100 : 0;
    return { amount, pct };
  },

  getCategoryMoM(category) {
    const curr = this.getLatestSnapshot();
    const prev = this.getPreviousSnapshot();
    if (!curr || !prev) return { amount: 0, pct: 0 };
    const currVal = curr.categories?.[category]?.value || 0;
    const prevVal = prev.categories?.[category]?.value || 0;
    const amount = currVal - prevVal;
    const pct = prevVal !== 0 ? (amount / Math.abs(prevVal)) * 100 : 0;
    return { amount, pct };
  },

  getTrendData(months = 12) {
    const snaps = this.getSnapshots().slice(-months);
    return {
      labels: snaps.map(s => formatMonth(s.month)),
      total:  snaps.map(s => s.total),
      categories: Object.keys(CONFIG.CATEGORIES).reduce((acc, cat) => {
        acc[cat] = snaps.map(s => s.categories?.[cat]?.value || 0);
        return acc;
      }, {})
    };
  },

  getSnapshotForMonth(monthKey) {
    return STATE.snapshots.find(s => s.month === monthKey) || null;
  },

  // ============ XIRR / RETURNS ============

  // XIRR via Newton-Raphson — standard implementation
  // cashFlows: [{ date: Date, amount: number }]
  // Negative amount = cash out (investment), positive = current value
  computeXIRR(cashFlows, guess = 0.1) {
    if (!cashFlows || cashFlows.length < 2) return null;

    const TOLERANCE = 1e-6;
    const MAX_ITER  = 100;
    const days0     = cashFlows[0].date.getTime();

    function npv(rate) {
      return cashFlows.reduce((sum, cf) => {
        const t = (cf.date.getTime() - days0) / (365.25 * 24 * 3600 * 1000);
        return sum + cf.amount / Math.pow(1 + rate, t);
      }, 0);
    }

    function dnpv(rate) {
      return cashFlows.reduce((sum, cf) => {
        const t = (cf.date.getTime() - days0) / (365.25 * 24 * 3600 * 1000);
        return sum - t * cf.amount / Math.pow(1 + rate, t + 1);
      }, 0);
    }

    let rate = guess;
    for (let i = 0; i < MAX_ITER; i++) {
      const f  = npv(rate);
      const df = dnpv(rate);
      if (Math.abs(df) < 1e-12) break;
      const next = rate - f / df;
      if (Math.abs(next - rate) < TOLERANCE) return next;
      rate = next;
    }
    return null;
  },

  // Snapshot-based portfolio XIRR:
  // Treats first snapshot as initial investment, each month's delta as cash flow,
  // and current value as final cash flow.
  getPortfolioXIRR() {
    const snaps = this.getSnapshots();
    if (snaps.length < 2) return null;

    // Build cash flows: treat month-over-month increases as "invested" (negative),
    // decreases as "withdrawn" (positive), final value as positive terminal CF.
    const cashFlows = [];
    for (let i = 0; i < snaps.length; i++) {
      const snap = snaps[i];
      const date = monthKeyToDate(snap.month);
      if (i === 0) {
        // First snapshot = initial invested amount (negative = cash out)
        cashFlows.push({ date, amount: -Math.max(snap.total, 0) });
      } else {
        const delta = snap.total - snaps[i - 1].total;
        // Net new money added each month (positive delta treated as investment)
        // We only count positive deltas as cash flows (negative = gains, not withdrawals)
        if (delta > 0) {
          cashFlows.push({ date, amount: -delta });
        }
      }
    }
    // Terminal cash flow = current value (positive = receiving money back)
    const latest = snaps[snaps.length - 1];
    cashFlows.push({ date: new Date(), amount: latest.total });

    const xirr = this.computeXIRR(cashFlows);
    return xirr !== null ? xirr * 100 : null; // return as percentage
  },

  // Simple absolute return per category (no date needed)
  getCategoryReturns() {
    return this.getCategoryBreakdown().map(b => {
      const gain    = b.value - b.cost;
      const gainPct = b.cost > 0 ? (gain / b.cost) * 100 : null;
      // Snapshot-based CAGR per category using first and latest snapshot
      const snaps   = this.getSnapshots();
      let cagr      = null;
      if (snaps.length >= 2) {
        const first  = snaps[0];
        const last   = snaps[snaps.length - 1];
        const startVal = first.categories?.[b.category]?.value || 0;
        const endVal   = last.categories?.[b.category]?.value  || 0;
        if (startVal > 0 && endVal > 0) {
          const months = monthsBetween(first.month, last.month);
          const years  = months / 12;
          if (years > 0) cagr = (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
        }
      }
      return { ...b, gain, gainPct, cagr };
    });
  },

  // ============ GOALS ============

  getGoals() {
    return STATE.goals || [];
  },

  addGoal(goal) {
    STATE.goals = STATE.goals || [];
    goal.id = 'g_' + Date.now();
    goal.createdAt = new Date().toISOString();
    STATE.goals.push(goal);
    this.saveLocal();
    return goal;
  },

  updateGoal(id, updates) {
    const idx = (STATE.goals || []).findIndex(g => g.id === id);
    if (idx >= 0) {
      STATE.goals[idx] = { ...STATE.goals[idx], ...updates };
      this.saveLocal();
    }
  },

  deleteGoal(id) {
    STATE.goals = (STATE.goals || []).filter(g => g.id !== id);
    this.saveLocal();
  },

  // Compute progress and projection for a goal
  getGoalProgress(goal) {
    const currentNW   = this.getTotalNetWorth();
    const target      = parseFloat(goal.targetAmount) || 0;
    const startAmount = parseFloat(goal.startAmount)  || 0;
    const progress    = target > 0 ? Math.min((currentNW / target) * 100, 100) : 0;
    const remaining   = Math.max(target - currentNW, 0);

    // Project months to target using avg MoM growth from last 3 snapshots
    let monthsToTarget = null;
    const snaps = this.getSnapshots();
    if (snaps.length >= 2 && remaining > 0) {
      const recent   = snaps.slice(-Math.min(snaps.length, 4));
      const avgDelta = recent.length >= 2
        ? (recent[recent.length - 1].total - recent[0].total) / (recent.length - 1)
        : 0;
      if (avgDelta > 0) {
        monthsToTarget = Math.ceil(remaining / avgDelta);
      }
    }

    return { currentNW, target, startAmount, progress, remaining, monthsToTarget };
  },

  // ============ MILESTONES ============

  getMilestoneStatus() {
    const nw = this.getTotalNetWorth();
    const hit  = MILESTONES.filter(m => nw >= m.value);
    const next = MILESTONES.find(m => nw < m.value) || null;
    const latest = hit[hit.length - 1] || null;

    let nextProgress = 0;
    if (next) {
      const prev = hit.length > 0 ? hit[hit.length - 1].value : 0;
      nextProgress = prev < next.value
        ? ((nw - prev) / (next.value - prev)) * 100
        : 100;
    }

    return { hit, next, latest, nextProgress, nw };
  },

  // Check if a new milestone was just crossed (compare latest vs previous snapshot)
  getNewlyHitMilestone() {
    const curr = this.getLatestSnapshot();
    const prev = this.getPreviousSnapshot();
    if (!curr || !prev) return null;
    const newHits = MILESTONES.filter(
      m => curr.total >= m.value && prev.total < m.value
    );
    return newHits.length > 0 ? newHits[newHits.length - 1] : null;
  },

  // ============ ALLOCATION TARGETS ============

  getAllocationTargets() {
    return STATE.allocationTargets || { ...DEFAULT_ALLOCATION_TARGETS };
  },

  setAllocationTargets(targets) {
    STATE.allocationTargets = { ...targets };
    this.saveLocal();
  },

  getAllocationStatus() {
    const total   = this.getTotalNetWorth();
    const targets = this.getAllocationTargets();
    if (total <= 0) return [];

    return Object.keys(CONFIG.CATEGORIES)
      .filter(cat => cat !== 'liability')
      .map(cat => {
        const value   = this.getCategoryTotal(cat);
        const actual  = total > 0 ? (value / total) * 100 : 0;
        const target  = targets[cat] || 0;
        const delta   = actual - target;
        return {
          category: cat,
          label:    CONFIG.CATEGORIES[cat].label,
          icon:     CONFIG.CATEGORIES[cat].icon,
          color:    CONFIG.CATEGORIES[cat].color,
          value,
          actual:   parseFloat(actual.toFixed(1)),
          target,
          delta:    parseFloat(delta.toFixed(1)),
        };
      })
      .filter(a => a.target > 0 || a.value > 0);
  },

  // ============ SAVINGS RATE ============

  getSavingsRateHistory() {
    const snaps = this.getSnapshots();
    if (snaps.length < 2) return [];
    const income = (STATE.config?.annualIncome || 0) / 12; // monthly

    return snaps.slice(1).map((snap, i) => {
      const prev    = snaps[i];
      const delta   = snap.total - prev.total;
      const rate    = income > 0 ? (delta / income) * 100 : null;
      return {
        month: snap.month,
        delta,
        savingsRate: rate,
        label: formatMonth(snap.month),
      };
    }).slice(-12); // last 12 months
  },

  // ============ IMPORT REGISTRY ============

  hashFileContent(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const chr = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  },

  getImports() { return STATE.imports || []; },

  findImportByHash(hash) {
    return (STATE.imports || []).find(imp => imp.fileHash === hash) || null;
  },

  findImportsBySource(source) {
    return (STATE.imports || []).filter(imp => imp.source === source);
  },

  registerImport(importRecord) {
    STATE.imports = STATE.imports || [];
    const existingIdx = STATE.imports.findIndex(i => i.fileHash === importRecord.fileHash);
    if (existingIdx >= 0) {
      STATE.imports[existingIdx] = importRecord;
    } else {
      STATE.imports.push(importRecord);
    }
    this.saveLocal();
  },

  // ============ PNL RECORDS ============

  addPnlRecords(records, source) {
    STATE.pnlRecords = (STATE.pnlRecords || []).filter(r => r.source !== source);
    STATE.pnlRecords = STATE.pnlRecords.concat(
      records.map(r => ({ ...r, source, importedAt: new Date().toISOString() }))
    );
    this.saveLocal();
  },

  getPnlRecords() { return STATE.pnlRecords || []; },

  // ============ TAX CALCULATIONS ============

  getEquityGains() {
    const equityAssets = [...this.getAssets('equity'), ...this.getAssets('mf').filter(a => a.mfType === 'Equity')];
    let ltcg = 0, stcg = 0;
    equityAssets.forEach(a => {
      const gain = this.getAssetValue(a) - this.getAssetCost(a);
      if (gain > 0) ltcg += gain;
    });
    const pnl = this.getPnlRecords();
    pnl.forEach(r => {
      if (r.gainType === 'LTCG' && r.gain > 0) ltcg += r.gain;
      if (r.gainType === 'STCG' && r.gain > 0) stcg += r.gain;
    });
    return { ltcg, stcg };
  },

  get80CUsed() {
    const epfContrib = this.getAssets('retirement')
      .filter(a => ['EPF', 'VPF'].includes(a.name))
      .reduce((s, a) => s + (parseFloat(a.ytdContrib) || 0), 0);
    const ppf = this.getAssets('retirement')
      .filter(a => a.name === 'PPF')
      .reduce((s, a) => s + (parseFloat(a.ytdContrib) || 0), 0);
    const elss = this.getAssets('mf')
      .filter(a => a.notes?.toLowerCase().includes('elss'))
      .reduce((s, a) => s + (parseFloat(a.invested) || 0), 0);
    const total = Math.min(epfContrib + ppf + elss, 150000);
    return { epf: epfContrib, ppf, elss, total };
  },

  // ============ PERSISTENCE ============

  saveLocal() {
    try {
      localStorage.setItem('wl_assets',      JSON.stringify(STATE.assets));
      localStorage.setItem('wl_snapshots',   JSON.stringify(STATE.snapshots));
      localStorage.setItem('wl_imports',     JSON.stringify(STATE.imports   || []));
      localStorage.setItem('wl_pnl',         JSON.stringify(STATE.pnlRecords || []));
      localStorage.setItem('wl_goals',       JSON.stringify(STATE.goals     || []));
      localStorage.setItem('wl_alloc',       JSON.stringify(STATE.allocationTargets || {}));
      localStorage.setItem('wl_usd_inr',     STATE.usdInr);
      localStorage.setItem('wl_gold_rate',   STATE.goldRate);
    } catch (e) {
      console.error('localStorage save error:', e);
      showToast('Storage warning: data may not be saved', 'error');
    }
  },

  loadLocal() {
    try {
      STATE.assets             = JSON.parse(localStorage.getItem('wl_assets')    || '[]');
      STATE.snapshots          = JSON.parse(localStorage.getItem('wl_snapshots') || '[]');
      STATE.imports            = JSON.parse(localStorage.getItem('wl_imports')   || '[]');
      STATE.pnlRecords         = JSON.parse(localStorage.getItem('wl_pnl')       || '[]');
      STATE.goals              = JSON.parse(localStorage.getItem('wl_goals')     || '[]');
      STATE.allocationTargets  = {
        ...DEFAULT_ALLOCATION_TARGETS,
        ...JSON.parse(localStorage.getItem('wl_alloc') || '{}')
      };
      STATE.usdInr    = parseFloat(localStorage.getItem('wl_usd_inr')  || '84');
      STATE.goldRate  = parseFloat(localStorage.getItem('wl_gold_rate') || '7200');
      STATE.config = {
        gsKey:        localStorage.getItem('wl_gs_key')        || '',
        gsId:         localStorage.getItem('wl_gs_id')         || '',
        claudeKey:    localStorage.getItem('wl_claude_key')    || '',
        userName:     localStorage.getItem('wl_user_name')     || '',
        taxRegime:    localStorage.getItem('wl_tax_regime')    || 'new',
        annualIncome: parseFloat(localStorage.getItem('wl_annual_income') || '0'),
        scriptUrl:    localStorage.getItem('wl_script_url')    || ''
      };
    } catch (e) {
      console.error('Error loading local data:', e);
    }
  },

  exportJSON() {
    return JSON.stringify({
      assets:     STATE.assets,
      snapshots:  STATE.snapshots,
      imports:    STATE.imports    || [],
      pnlRecords: STATE.pnlRecords || [],
      goals:      STATE.goals      || [],
      exportedAt: new Date().toISOString(),
      version:    CONFIG.VERSION
    }, null, 2);
  },

  importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.assets)     STATE.assets     = data.assets;
      if (data.snapshots)  STATE.snapshots  = data.snapshots;
      if (data.imports)    STATE.imports    = data.imports;
      if (data.pnlRecords) STATE.pnlRecords = data.pnlRecords;
      if (data.goals)      STATE.goals      = data.goals;
      this.saveLocal();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  buildSheetsData() {
    const assetHeaders = ['id', 'asset_id', 'source', 'category', 'subcategory', 'name',
                          'value', 'cost', 'createdAt', 'updatedAt',
                          'qty', 'price', 'avgPrice', 'units', 'nav', 'invested', 'balance',
                          'outstanding', 'platform', 'notes'];
    const assetRows = STATE.assets.map(a => assetHeaders.map(h => a[h] || ''));
    const snapHeaders = ['month', 'total', 'categories', 'takenAt'];
    const snapRows = STATE.snapshots.map(s => [
      s.month, s.total, JSON.stringify(s.categories), s.takenAt
    ]);
    return {
      assets:    [assetHeaders, ...assetRows],
      snapshots: [snapHeaders,  ...snapRows]
    };
  }
};

// ============ HELPER UTILITIES ============

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  const abs = Math.abs(val);
  let str;
  if (abs >= 10000000)    str = '₹' + (abs / 10000000).toFixed(2) + 'Cr';
  else if (abs >= 100000) str = '₹' + (abs / 100000).toFixed(2) + 'L';
  else if (abs >= 1000)   str = '₹' + (abs / 1000).toFixed(1) + 'K';
  else                    str = '₹' + abs.toFixed(0);
  return val < 0 ? '-' + str : str;
}

function formatCurrencyFull(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);
}

function formatMonth(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function formatPct(val) {
  return (val >= 0 ? '+' : '') + (val || 0).toFixed(1) + '%';
}

function getCurrentFY() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// Convert "YYYY-MM" to a Date object (first day of that month)
function monthKeyToDate(key) {
  const [y, m] = key.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1);
}

// Count months between two "YYYY-MM" keys
function monthsBetween(keyA, keyB) {
  const a = monthKeyToDate(keyA);
  const b = monthKeyToDate(keyB);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
