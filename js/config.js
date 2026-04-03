// js/config.js — App configuration & constants

const CONFIG = {
  APP_NAME: 'WealthLens',
  VERSION: '1.1.0',
  SHEET_TABS: {
    SNAPSHOTS: 'Snapshots',
    ASSETS: 'Assets',
    SETTINGS: 'Settings',
    HISTORY: 'History'
  },
  CATEGORIES: {
    bank:        { label: 'Bank Accounts',       icon: '🏦', color: '#5b9cf6' },
    equity:      { label: 'Indian Equities',     icon: '📈', color: '#4ecb71' },
    mf:          { label: 'Mutual Funds',         icon: '💹', color: '#9b7fea' },
    us:          { label: 'US Stocks & ESOPs',   icon: '🌐', color: '#f5a623' },
    retirement:  { label: 'EPF/PPF/NPS',         icon: '🏛️', color: '#4dd0e1' },
    realestate:  { label: 'Real Estate',          icon: '🏠', color: '#ef9a9a' },
    gold:        { label: 'Gold & Metals',        icon: '🥇', color: '#c8a96e' },
    fd:          { label: 'FDs & Bonds',          icon: '🏧', color: '#80cbc4' },
    other:       { label: 'Other Assets',         icon: '◈',  color: '#ce93d8' },
    liability:   { label: 'Liabilities',          icon: '📋', color: '#e05c5c' }
  },

  // Subcategories for richer classification
  SUBCATEGORIES: {
    equity:     ['stocks', 'etf', 'sgb'],
    mf:         ['mf_equity', 'mf_debt', 'mf_hybrid', 'mf_gold', 'mf_international'],
    us:         ['us_stocks', 'us_etf', 'esop_vested', 'esop_unvested'],
    retirement: ['epf', 'ppf', 'nps_tier1', 'nps_tier2', 'vpf', 'gratuity'],
    gold:       ['physical_gold', 'gold_etf', 'sgb', 'digital_gold', 'silver'],
    fd:         ['fd', 'rd', 'govt_bond', 'corp_bond', 'ncd'],
    other:      ['crypto', 'art', 'collectibles', 'angel', 'startup_equity']
  },

  // Known import sources
  IMPORT_SOURCES: {
    zerodha_equity:  'Zerodha Holdings',
    zerodha_mf:      'Zerodha MF',
    groww_equity:    'Groww Holdings',
    groww_mf:        'Groww MF',
    groww_pnl:       'Groww P&L',
    bank_csv:        'Bank Statement (CSV)',
    bank_pdf:        'Bank Statement (PDF)',
    us_stocks:       'US Stocks (CSV)',
    epf_pdf:         'EPF Passbook',
    manual:          'Manual Entry'
  },

  ASSET_FORMS: {
    bank: [
      { id: 'name',    label: 'Bank Name',         type: 'text',   placeholder: 'HDFC Savings' },
      { id: 'account', label: 'Account Type',      type: 'select', options: ['Savings', 'Current', 'FD', 'RD'] },
      { id: 'balance', label: 'Current Balance ₹', type: 'number', placeholder: '0' },
      { id: 'notes',   label: 'Notes',             type: 'text',   placeholder: 'Optional' }
    ],
    equity: [
      { id: 'name',     label: 'Stock / Symbol',      type: 'text',   placeholder: 'RELIANCE / NSE:RELIANCE' },
      { id: 'qty',      label: 'Quantity',            type: 'number', placeholder: '0' },
      { id: 'avgPrice', label: 'Avg Buy Price ₹',     type: 'number', placeholder: '0' },
      { id: 'ltp',      label: 'Current Price ₹',     type: 'number', placeholder: '0' },
      { id: 'exchange', label: 'Exchange',            type: 'select', options: ['NSE', 'BSE'] }
    ],
    mf: [
      { id: 'name',     label: 'Fund Name',           type: 'text',   placeholder: 'Mirae Asset Large Cap' },
      { id: 'folio',    label: 'Folio Number',        type: 'text',   placeholder: 'Optional' },
      { id: 'units',    label: 'Units',               type: 'number', placeholder: '0' },
      { id: 'nav',      label: 'Current NAV ₹',       type: 'number', placeholder: '0' },
      { id: 'invested', label: 'Amount Invested ₹',   type: 'number', placeholder: '0' },
      { id: 'mfType',   label: 'Fund Type',           type: 'select', options: ['Equity', 'Debt', 'Hybrid', 'Gold', 'International'] }
    ],
    us: [
      { id: 'name',      label: 'Stock / Fund Name',  type: 'text',   placeholder: 'AAPL / MSFT / VOO' },
      { id: 'qty',       label: 'Quantity / Units',   type: 'number', placeholder: '0' },
      { id: 'priceUSD',  label: 'Current Price (USD)',type: 'number', placeholder: '0' },
      { id: 'costUSD',   label: 'Cost Basis (USD)',   type: 'number', placeholder: '0' },
      { id: 'platform',  label: 'Platform',           type: 'select', options: ['Groww', 'IBKR', 'Vested', 'Schwab', 'Fidelity', 'Other'] },
      { id: 'isESOP',    label: 'Is ESOP?',           type: 'select', options: ['No', 'Yes - Unvested', 'Yes - Vested'] }
    ],
    retirement: [
      { id: 'name',    label: 'Account Name',     type: 'select', options: ['EPF', 'PPF', 'NPS Tier 1', 'NPS Tier 2', 'VPF', 'Gratuity'] },
      { id: 'balance', label: 'Current Balance ₹',type: 'number', placeholder: '0' },
      { id: 'ytdContrib', label: 'YTD Contribution ₹', type: 'number', placeholder: '0' },
      { id: 'notes',   label: 'Notes',            type: 'text',   placeholder: 'Optional' }
    ],
    realestate: [
      { id: 'name',         label: 'Property Name',      type: 'text',   placeholder: 'Home - Bangalore' },
      { id: 'currentValue', label: 'Current Value ₹',   type: 'number', placeholder: '0' },
      { id: 'purchasePrice',label: 'Purchase Price ₹',  type: 'number', placeholder: '0' },
      { id: 'loanBalance',  label: 'Loan Balance ₹',    type: 'number', placeholder: '0' },
      { id: 'propertyType', label: 'Type',              type: 'select', options: ['Residential', 'Commercial', 'Plot', 'Under Construction'] }
    ],
    gold: [
      { id: 'name',   label: 'Type',             type: 'select', options: ['Physical Gold', 'Gold ETF', 'Sovereign Gold Bond', 'Digital Gold', 'Silver'] },
      { id: 'qty',    label: 'Quantity (grams)',  type: 'number', placeholder: '0' },
      { id: 'rate',   label: 'Current Rate ₹/g', type: 'number', placeholder: '7200' },
      { id: 'notes',  label: 'Notes',            type: 'text',   placeholder: 'Optional' }
    ],
    fd: [
      { id: 'name',       label: 'Bank / Issuer',      type: 'text',   placeholder: 'SBI' },
      { id: 'principal',  label: 'Principal ₹',        type: 'number', placeholder: '0' },
      { id: 'maturity',   label: 'Maturity Value ₹',   type: 'number', placeholder: '0' },
      { id: 'rate',       label: 'Interest Rate %',    type: 'number', placeholder: '7.5' },
      { id: 'maturityDate',label: 'Maturity Date',     type: 'date' },
      { id: 'fdType',     label: 'Type',               type: 'select', options: ['FD', 'RD', 'Government Bond', 'Corporate Bond', 'NCD', 'SGBs'] }
    ],
    other: [
      { id: 'name',    label: 'Asset Name',       type: 'text',   placeholder: 'Bitcoin / Art / Other' },
      { id: 'value',   label: 'Current Value ₹',  type: 'number', placeholder: '0' },
      { id: 'cost',    label: 'Cost Basis ₹',     type: 'number', placeholder: '0' },
      { id: 'assetType', label: 'Type',           type: 'select', options: ['Crypto', 'Art', 'Collectibles', 'Angel Investment', 'Startup Equity', 'Other'] },
      { id: 'notes',   label: 'Notes',            type: 'text',   placeholder: 'Optional' }
    ],
    liability: [
      { id: 'name',       label: 'Liability Name',     type: 'text',   placeholder: 'Home Loan - HDFC' },
      { id: 'outstanding',label: 'Outstanding Balance ₹', type: 'number', placeholder: '0' },
      { id: 'emi',        label: 'EMI ₹',              type: 'number', placeholder: '0' },
      { id: 'rate',       label: 'Interest Rate %',    type: 'number', placeholder: '0' },
      { id: 'loanType',   label: 'Type',               type: 'select', options: ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Credit Card', 'Other'] }
    ]
  }
};

// App state — single source of truth
const STATE = {
  config: null,       // loaded from localStorage on init
  assets: [],         // all asset records
  snapshots: [],      // monthly snapshots [{month, categories, total}]
  imports: [],        // import registry [{id, fileName, source, importedAt, assetCount}]
  pnlRecords: [],     // realized P&L records (for tax; not counted in net worth)
  currentMonth: null,
  pendingImport: null,
  charts: {},
  usdInr: 84,
  goldRate: 7200,
};
