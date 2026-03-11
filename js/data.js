// ═══════════════════════════════════════════════════════
// data.js — State, persistence, calculations, constants
// ═══════════════════════════════════════════════════════

export const CATS = {
  bank:       { label:'Bank Accounts',    icon:'🏦', color:'#5b9cf6' },
  equity:     { label:'Indian Equities',  icon:'📈', color:'#4ecb71' },
  mf:         { label:'Mutual Funds',     icon:'💹', color:'#9b7fea' },
  us:         { label:'US Stocks/ESOPs',  icon:'🌐', color:'#f5a623' },
  retirement: { label:'EPF / PPF / NPS',  icon:'🏛️', color:'#4dd0e1' },
  realestate: { label:'Real Estate',      icon:'🏠', color:'#ef9a9a' },
  gold:       { label:'Gold & Metals',    icon:'🥇', color:'#c8a96e' },
  fd:         { label:'FDs & Bonds',      icon:'🏧', color:'#80cbc4' },
  other:      { label:'Other Assets',     icon:'◈',  color:'#ce93d8' },
  liability:  { label:'Liabilities',      icon:'📋', color:'#e05c5c' },
};

export const FORMS = {
  bank:       [
    {id:'name',    label:'Bank Name',        type:'text',   ph:'HDFC Savings'},
    {id:'account', label:'Type',             type:'sel',    opts:['Savings','Current','FD']},
    {id:'balance', label:'Balance ₹',        type:'number', ph:'0'},
    {id:'notes',   label:'Notes',            type:'text',   ph:'Optional'},
  ],
  equity:     [
    {id:'name',      label:'Stock / Symbol',  type:'text',   ph:'RELIANCE'},
    {id:'qty',       label:'Quantity',         type:'number', ph:'0'},
    {id:'avgPrice',  label:'Avg Buy Price ₹', type:'number', ph:'0'},
    {id:'ltp',       label:'Current Price ₹', type:'number', ph:'0'},
    {id:'exchange',  label:'Exchange',         type:'sel',    opts:['NSE','BSE']},
  ],
  mf:         [
    {id:'name',     label:'Fund Name',        type:'text',   ph:'Mirae Asset Large Cap'},
    {id:'units',    label:'Units',             type:'number', ph:'0'},
    {id:'nav',      label:'Current NAV ₹',    type:'number', ph:'0'},
    {id:'invested', label:'Invested ₹',       type:'number', ph:'0'},
    {id:'mfType',   label:'Type',             type:'sel',    opts:['Equity','Debt','Hybrid','Gold','International']},
  ],
  us:         [
    {id:'name',      label:'Stock / Fund',    type:'text',   ph:'AAPL'},
    {id:'qty',       label:'Quantity',         type:'number', ph:'0'},
    {id:'priceUSD',  label:'Price USD',        type:'number', ph:'0'},
    {id:'costUSD',   label:'Cost USD',         type:'number', ph:'0'},
    {id:'platform',  label:'Platform',         type:'sel',    opts:['Groww','IBKR','Vested','Schwab','Fidelity','Other']},
    {id:'isESOP',    label:'ESOP?',            type:'sel',    opts:['No','Yes-Unvested','Yes-Vested']},
  ],
  retirement: [
    {id:'name',       label:'Account',         type:'sel',    opts:['EPF','PPF','NPS Tier 1','NPS Tier 2','VPF','Gratuity']},
    {id:'balance',    label:'Balance ₹',       type:'number', ph:'0'},
    {id:'ytdContrib', label:'YTD Contribution ₹', type:'number', ph:'0'},
    {id:'notes',      label:'Notes',           type:'text',   ph:'Optional'},
  ],
  realestate: [
    {id:'name',          label:'Property Name',   type:'text',   ph:'Home - Bangalore'},
    {id:'currentValue',  label:'Current Value ₹', type:'number', ph:'0'},
    {id:'purchasePrice', label:'Purchase Price ₹', type:'number', ph:'0'},
    {id:'loanBalance',   label:'Loan Balance ₹',  type:'number', ph:'0'},
    {id:'propertyType',  label:'Type',            type:'sel',    opts:['Residential','Commercial','Plot','Under Construction']},
  ],
  gold:       [
    {id:'name',  label:'Type',            type:'sel',    opts:['Physical Gold','Gold ETF','Sovereign Gold Bond','Digital Gold','Silver']},
    {id:'qty',   label:'Quantity (grams)', type:'number', ph:'0'},
    {id:'rate',  label:'Rate ₹/gram',     type:'number', ph:'7200'},
    {id:'notes', label:'Notes',           type:'text',   ph:'Optional'},
  ],
  fd:         [
    {id:'name',         label:'Bank / Issuer',    type:'text',   ph:'SBI'},
    {id:'principal',    label:'Principal ₹',      type:'number', ph:'0'},
    {id:'maturity',     label:'Maturity Value ₹', type:'number', ph:'0'},
    {id:'rate',         label:'Interest Rate %',  type:'number', ph:'7.5'},
    {id:'maturityDate', label:'Maturity Date',    type:'date'},
    {id:'fdType',       label:'Type',             type:'sel',    opts:['FD','RD','Govt Bond','Corporate Bond','NCD','SGB']},
  ],
  other:      [
    {id:'name',      label:'Asset Name',     type:'text',   ph:'Bitcoin'},
    {id:'value',     label:'Current Value ₹', type:'number', ph:'0'},
    {id:'cost',      label:'Cost ₹',         type:'number', ph:'0'},
    {id:'assetType', label:'Type',           type:'sel',    opts:['Crypto','Art','Angel Investment','Startup Equity','Other']},
    {id:'notes',     label:'Notes',          type:'text',   ph:'Optional'},
  ],
  liability:  [
    {id:'name',        label:'Loan Name',       type:'text',   ph:'Home Loan - HDFC'},
    {id:'outstanding', label:'Outstanding ₹',   type:'number', ph:'0'},
    {id:'emi',         label:'EMI ₹',           type:'number', ph:'0'},
    {id:'rate',        label:'Interest Rate %', type:'number', ph:'0'},
    {id:'loanType',    label:'Type',            type:'sel',    opts:['Home Loan','Car Loan','Personal Loan','Education Loan','Credit Card','Other']},
  ],
};

// ─── Mutable state ─────────────────────────────────────
export const S = {
  assets: [],
  snaps: [],
  transactions: [],   // tradebook ledger — never used for holdings
  dailyHistory: [],   // { date: "YYYY-MM-DD", networth: number }
  usdInr: 84,
  goldRate: 7200,
  cfg: {},
};

// ─── Persistence ───────────────────────────────────────
export function save() {
  localStorage.setItem('wl_a',  JSON.stringify(S.assets));
  localStorage.setItem('wl_s',  JSON.stringify(S.snaps));
  localStorage.setItem('wl_tx', JSON.stringify(S.transactions));
  localStorage.setItem('wl_dh', JSON.stringify(S.dailyHistory));
  localStorage.setItem('wl_r',  JSON.stringify({ usdInr: S.usdInr, goldRate: S.goldRate }));
}

export function load() {
  try {
    S.assets       = JSON.parse(localStorage.getItem('wl_a')  || '[]');
    S.snaps        = JSON.parse(localStorage.getItem('wl_s')  || '[]');
    S.transactions = JSON.parse(localStorage.getItem('wl_tx') || '[]');
    S.dailyHistory = JSON.parse(localStorage.getItem('wl_dh') || '[]');
    const r        = JSON.parse(localStorage.getItem('wl_r')  || '{}');
    S.usdInr       = r.usdInr   || 84;
    S.goldRate      = r.goldRate  || 7200;
    S.cfg = {
      gsKey:     localStorage.getItem('wl_gs_key')     || '',
      gsId:      localStorage.getItem('wl_gs_id')      || '',
      claude:    localStorage.getItem('wl_claude')     || '',
      name:      localStorage.getItem('wl_name')       || '',
      regime:    localStorage.getItem('wl_regime')     || 'new',
      income:    parseFloat(localStorage.getItem('wl_income') || '0'),
      scriptUrl: localStorage.getItem('wl_script_url') || '',
    };
  } catch (e) { console.error('load error', e); }
}

// ─── Daily snapshot (auto on load) ─────────────────────
export function autoSnapshot() {
  const today = new Date().toISOString().slice(0, 10);
  const exists = S.dailyHistory.some(h => h.date === today);
  if (!exists) {
    const nw = calculateNetWorth();
    S.dailyHistory.push({ date: today, networth: nw });
    // Keep last 730 days (2 years)
    if (S.dailyHistory.length > 730) S.dailyHistory = S.dailyHistory.slice(-730);
    save();
  }
}

// ─── Asset value (current) ─────────────────────────────
export function aVal(a) {
  const u = S.usdInr;
  switch (a.category) {
    case 'bank':       return +a.balance || 0;
    case 'equity':     return (+a.qty || 0) * (+a.ltp || 0);
    case 'mf':         return (+a.units || 0) * (+a.nav || 0);
    case 'us':         return (+a.qty || 0) * (+a.priceUSD || 0) * u;
    case 'retirement': return +a.balance || 0;
    // Real estate: equity model — value minus loan
    case 'realestate': return Math.max(0, (+a.currentValue || 0) - (+a.loanBalance || 0));
    // Gold: grams × rate (rate auto-filled from S.goldRate)
    case 'gold':       return (+a.qty || 0) * (+a.rate || S.goldRate);
    case 'fd':         return +a.maturity || +a.principal || 0;
    case 'other':      return +a.value || 0;
    case 'liability':  return -(+a.outstanding || 0);
    default:           return 0;
  }
}

// ─── Asset cost basis ──────────────────────────────────
export function aCost(a) {
  const u = S.usdInr;
  switch (a.category) {
    case 'bank':       return +a.balance || 0;
    case 'equity':     return (+a.qty || 0) * (+a.avgPrice || 0);
    case 'mf':         return +a.invested || 0;
    case 'us':         return (+a.qty || 0) * (+a.costUSD || 0) * u;
    case 'retirement': return +a.ytdContrib || 0;
    case 'realestate': return +a.purchasePrice || 0;
    case 'gold':       return (+a.qty || 0) * 5000;
    case 'fd':         return +a.principal || 0;
    case 'other':      return +a.cost || 0;
    default:           return 0;
  }
}

// ─── Net Worth = Total Assets − Total Liabilities ──────
export function calculateNetWorth() {
  let assets = 0;
  let liabilities = 0;
  S.assets.forEach(a => {
    if (a.category === 'liability') {
      liabilities += (+a.outstanding || 0);
    } else {
      assets += aVal(a);
    }
  });
  return assets - liabilities;
}

export function totalNW() { return calculateNetWorth(); }

export function catTotal(cat) {
  return S.assets
    .filter(a => a.category === cat)
    .reduce((s, a) => s + aVal(a), 0);
}

export function catCostFromAssets(cat) {
  return S.assets
    .filter(a => a.category === cat)
    .reduce((s, a) => s + aCost(a), 0);
}

export function bdown() {
  return Object.keys(CATS).map(cat => ({
    cat,
    label: CATS[cat].label,
    icon: CATS[cat].icon,
    color: CATS[cat].color,
    value: catTotal(cat),
    cost: S.assets.filter(a => a.category === cat).reduce((s, a) => s + aCost(a), 0),
    count: S.assets.filter(a => a.category === cat).length,
  })).filter(b => b.value !== 0);
}

// ─── Snapshots ─────────────────────────────────────────
export function takeSnap(monthKey, lock = false) {
  const k = monthKey || curMonthKey();
  const bd = bdown(), total = totalNW();
  const snap = { month: k, total, cats: {}, at: new Date().toISOString(), locked: lock };
  bd.forEach(b => { snap.cats[b.cat] = { value: b.value, cost: b.cost }; });
  S.snaps = S.snaps.filter(s => s.month !== k);
  S.snaps.push(snap);
  S.snaps.sort((a, b) => a.month.localeCompare(b.month));
  save();
  return snap;
}

export function takeSnapFromValues(monthKey, values, lock = false) {
  const k = monthKey || curMonthKey();
  const total = Object.values(values).reduce((s, v) => s + v, 0);
  const snap = { month: k, total, cats: {}, at: new Date().toISOString(), locked: lock };
  Object.keys(values).forEach(cat => {
    snap.cats[cat] = { value: values[cat], cost: catCostFromAssets(cat) };
  });
  S.snaps = S.snaps.filter(s => s.month !== k);
  S.snaps.push(snap);
  S.snaps.sort((a, b) => a.month.localeCompare(b.month));
  save();
  return snap;
}

export function isSnapLocked(k) { return S.snaps.some(s => s.month === k && s.locked); }
export function latestSnap()    { return S.snaps[S.snaps.length - 1] || null; }
export function prevSnap()      { return S.snaps.length >= 2 ? S.snaps[S.snaps.length - 2] : null; }

export function momChange() {
  const c = latestSnap(), p = prevSnap();
  if (!c || !p) return { amt: 0, pct: 0 };
  const amt = c.total - p.total;
  return { amt, pct: p.total ? amt / Math.abs(p.total) * 100 : 0 };
}

export function catMoM(cat) {
  const c = latestSnap(), p = prevSnap();
  if (!c || !p) return { amt: 0, pct: 0 };
  const cv = c.cats?.[cat]?.value || 0, pv = p.cats?.[cat]?.value || 0, amt = cv - pv;
  return { amt, pct: pv ? amt / Math.abs(pv) * 100 : 0 };
}

export function trendData(n = 12) {
  const sl = S.snaps.slice(-n);
  return {
    labels: sl.map(s => fmtMon(s.month)),
    total: sl.map(s => s.total),
    cats: Object.fromEntries(Object.keys(CATS).map(c => [c, sl.map(s => s.cats?.[c]?.value || 0)])),
  };
}

// ─── Transactions ──────────────────────────────────────
export function addTransactions(newTxs) {
  // Dedup by composite key: date+symbol+qty+type
  const existingKeys = new Set(S.transactions.map(tx => txKey(tx)));
  let added = 0;
  newTxs.forEach(tx => {
    const k = txKey(tx);
    if (!existingKeys.has(k)) {
      S.transactions.push(tx);
      existingKeys.add(k);
      added++;
    }
  });
  S.transactions.sort((a, b) => a.date.localeCompare(b.date));
  save();
  return added;
}

function txKey(tx) {
  return `${tx.date}|${tx.symbol}|${tx.qty}|${tx.type}`;
}

// ─── Helpers ───────────────────────────────────────────
export function curMonthKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function prevMonths(n = 13) {
  const out = [], d = new Date();
  for (let i = 0; i < n; i++) {
    out.unshift(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export function fmtMon(k) {
  if (!k) return '';
  const [y, m] = k.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1] + ' ' + y;
}

export function fmtC(v) {
  const a = Math.abs(v);
  let s;
  if (a >= 1e7)      s = '₹' + (a / 1e7).toFixed(2) + 'Cr';
  else if (a >= 1e5) s = '₹' + (a / 1e5).toFixed(2) + 'L';
  else if (a >= 1e3) s = '₹' + (a / 1e3).toFixed(1) + 'K';
  else               s = '₹' + a.toFixed(0);
  return v < 0 ? '-' + s : s;
}

export function fmtCF(v) {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(v);
}

export function fmtP(v) { return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'; }

export function getFY() {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth() + 1;
  return m >= 4 ? y + '-' + (y + 1) : (y - 1) + '-' + y;
}

export function assetSub(a) {
  switch (a.category) {
    case 'equity':     return `${a.qty || 0} shares @ ₹${(+a.avgPrice || 0).toFixed(0)} avg · ${a.exchange || 'NSE'}`;
    case 'mf':         return `${(+a.units || 0).toFixed(3)} units · NAV ₹${(+a.nav || 0).toFixed(2)} · ${a.mfType || ''}`;
    case 'us':         return `${a.qty || 0} shares · $${(+a.priceUSD || 0).toFixed(2)} · ${a.platform || ''}${a.isESOP !== 'No' ? ' · ESOP' : ''}`;
    case 'bank':       return a.account || 'Savings';
    case 'gold':       return `${a.qty || 0}g · ₹${(+a.rate || S.goldRate).toFixed(0)}/g`;
    case 'fd':         return `${a.fdType || 'FD'} · ${a.rate || 0}% · Matures ${a.maturityDate || '—'}`;
    case 'realestate': return `${a.propertyType || ''} · Equity: ${fmtC(Math.max(0, (+a.currentValue || 0) - (+a.loanBalance || 0)))}`;
    case 'retirement': return a.notes || a.name || '';
    case 'liability':  return `${a.loanType || ''} · EMI ₹${(+a.emi || 0).toLocaleString()}`;
    default:           return a.notes || '';
  }
}
