// js/data.js — Data layer: CRUD for assets, snapshots, calculations

const Data = {

  // ============ ASSETS ============

  getAssets(category = null) {
    const assets = STATE.assets || [];
    return category ? assets.filter(a => a.category === category) : assets;
  },

  addAsset(asset) {
    asset.id = 'a_' + Date.now();
    asset.createdAt = new Date().toISOString();
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

  // ============ VALUE CALCULATIONS ============

  getAssetValue(asset) {
    const usd = STATE.usdInr || 84;
    switch (asset.category) {
      case 'bank':
        return parseFloat(asset.balance) || 0;
      case 'equity':
        return (parseFloat(asset.qty) || 0) * (parseFloat(asset.ltp) || 0);
      case 'mf':
        return (parseFloat(asset.units) || 0) * (parseFloat(asset.nav) || 0);
      case 'us':
        return (parseFloat(asset.qty) || 0) * (parseFloat(asset.priceUSD) || 0) * usd;
      case 'retirement':
        return parseFloat(asset.balance) || 0;
      case 'realestate':
        return parseFloat(asset.currentValue) || 0;
      case 'gold':
        return (parseFloat(asset.qty) || 0) * (parseFloat(asset.rate) || STATE.goldRate);
      case 'fd':
        return parseFloat(asset.maturity) || parseFloat(asset.principal) || 0;
      case 'other':
        return parseFloat(asset.value) || 0;
      case 'liability':
        return -(parseFloat(asset.outstanding) || 0);
      default:
        return 0;
    }
  },

  getAssetCost(asset) {
    const usd = STATE.usdInr || 84;
    switch (asset.category) {
      case 'bank': return parseFloat(asset.balance) || 0;
      case 'equity': return (parseFloat(asset.qty) || 0) * (parseFloat(asset.avgPrice) || 0);
      case 'mf': return parseFloat(asset.invested) || 0;
      case 'us': return (parseFloat(asset.qty) || 0) * (parseFloat(asset.costUSD) || 0) * usd;
      case 'retirement': return parseFloat(asset.ytdContrib) || 0;
      case 'realestate': return parseFloat(asset.purchasePrice) || 0;
      case 'gold': return (parseFloat(asset.qty) || 0) * 5000; // rough historical avg
      case 'fd': return parseFloat(asset.principal) || 0;
      case 'other': return parseFloat(asset.cost) || 0;
      default: return 0;
    }
  },

  getCategoryTotal(category) {
    return this.getAssets(category).reduce((sum, a) => sum + this.getAssetValue(a), 0);
  },

  getTotalNetWorth() {
    const categories = Object.keys(CONFIG.CATEGORIES);
    return categories.reduce((sum, cat) => sum + this.getCategoryTotal(cat), 0);
  },

  getCategoryBreakdown() {
    return Object.keys(CONFIG.CATEGORIES).map(cat => ({
      category: cat,
      label: CONFIG.CATEGORIES[cat].label,
      icon: CONFIG.CATEGORIES[cat].icon,
      color: CONFIG.CATEGORIES[cat].color,
      value: this.getCategoryTotal(cat),
      cost: this.getAssets(cat).reduce((s, a) => s + this.getAssetCost(a), 0),
      count: this.getAssets(cat).length
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

    // Remove existing snapshot for same month
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
      total: snaps.map(s => s.total),
      categories: Object.keys(CONFIG.CATEGORIES).reduce((acc, cat) => {
        acc[cat] = snaps.map(s => s.categories?.[cat]?.value || 0);
        return acc;
      }, {})
    };
  },

  // ============ TAX CALCULATIONS ============

  getEquityGains() {
    const equityAssets = [...this.getAssets('equity'), ...this.getAssets('mf').filter(a => a.mfType === 'Equity')];
    let ltcg = 0, stcg = 0;
    equityAssets.forEach(a => {
      const gain = this.getAssetValue(a) - this.getAssetCost(a);
      // Simplified: assume all as LTCG (would need purchase date for accuracy)
      if (gain > 0) ltcg += gain;
    });
    return { ltcg, stcg };
  },

  get80CUsed() {
    const epf = this.getCategoryTotal('retirement');
    const ppf = this.getAssets('retirement').filter(a => a.name === 'PPF')
                  .reduce((s, a) => s + (parseFloat(a.ytdContrib) || 0), 0);
    const elss = this.getAssets('mf').filter(a => a.notes?.toLowerCase().includes('elss'))
                  .reduce((s, a) => s + (parseFloat(a.invested) || 0), 0);
    const ulip = 0; // Could track separately
    return { epf: Math.min(epf * 0.12, 150000), ppf, elss, total: Math.min(ppf + elss, 150000) };
  },

  // ============ PERSISTENCE ============

  saveLocal() {
    localStorage.setItem('wl_assets', JSON.stringify(STATE.assets));
    localStorage.setItem('wl_snapshots', JSON.stringify(STATE.snapshots));
    localStorage.setItem('wl_usd_inr', STATE.usdInr);
    localStorage.setItem('wl_gold_rate', STATE.goldRate);
  },

  loadLocal() {
    try {
      STATE.assets = JSON.parse(localStorage.getItem('wl_assets') || '[]');
      STATE.snapshots = JSON.parse(localStorage.getItem('wl_snapshots') || '[]');
      STATE.usdInr = parseFloat(localStorage.getItem('wl_usd_inr') || '84');
      STATE.goldRate = parseFloat(localStorage.getItem('wl_gold_rate') || '7200');
      STATE.config = {
        gsKey: localStorage.getItem('wl_gs_key') || '',
        gsId: localStorage.getItem('wl_gs_id') || '',
        claudeKey: localStorage.getItem('wl_claude_key') || '',
        userName: localStorage.getItem('wl_user_name') || '',
        taxRegime: localStorage.getItem('wl_tax_regime') || 'new',
        annualIncome: parseFloat(localStorage.getItem('wl_annual_income') || '0'),
        scriptUrl: localStorage.getItem('wl_script_url') || ''
      };
    } catch (e) {
      console.error('Error loading local data:', e);
    }
  },

  exportJSON() {
    return JSON.stringify({
      assets: STATE.assets,
      snapshots: STATE.snapshots,
      exportedAt: new Date().toISOString(),
      version: CONFIG.VERSION
    }, null, 2);
  },

  importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.assets) STATE.assets = data.assets;
      if (data.snapshots) STATE.snapshots = data.snapshots;
      this.saveLocal();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // Build sheets-compatible rows for syncing
  buildSheetsData() {
    const assetHeaders = ['id', 'category', 'name', 'value', 'cost', 'createdAt', 'updatedAt', 
                          'qty', 'price', 'avgPrice', 'units', 'nav', 'invested', 'balance', 
                          'outstanding', 'platform', 'notes'];
    const assetRows = STATE.assets.map(a => assetHeaders.map(h => a[h] || ''));

    const snapHeaders = ['month', 'total', 'categories', 'takenAt'];
    const snapRows = STATE.snapshots.map(s => [
      s.month, s.total, JSON.stringify(s.categories), s.takenAt
    ]);

    return {
      assets: [assetHeaders, ...assetRows],
      snapshots: [snapHeaders, ...snapRows]
    };
  }
};

// Helper utilities
function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  const abs = Math.abs(val);
  let str;
  if (abs >= 10000000) str = '₹' + (abs / 10000000).toFixed(2) + 'Cr';
  else if (abs >= 100000) str = '₹' + (abs / 100000).toFixed(2) + 'L';
  else if (abs >= 1000) str = '₹' + (abs / 1000).toFixed(1) + 'K';
  else str = '₹' + abs.toFixed(0);
  return val < 0 ? '-' + str : str;
}

function formatCurrencyFull(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

function formatMonth(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${y}`;
}

function formatPct(val) {
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
}

function getCurrentFY() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4 ? `${year}-${year+1}` : `${year-1}-${year}`;
}
