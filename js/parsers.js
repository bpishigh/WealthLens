// js/parsers.js — CSV/PDF/Excel import parsers
// All parsers return: { assets[], pnlRecords[], source, type, fileHash, error? }
// assets follow the canonical schema; pnlRecords are for tax reference only.

const Parsers = {

  // ============ SHARED FILE → ROWS HELPER ============
  // Handles CSV, Excel (.xlsx/.xls) transparently.
  // Returns: { rows: Array<Object>, fileHash: string, error?: string }
  async fileToRows(file) {
    const isExcel = /\.xlsx?$/i.test(file.name);
    if (isExcel) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook    = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        const sheet       = workbook.Sheets[workbook.SheetNames[0]];
        const rows        = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const fileHash    = Data.hashFileContent(file.name + file.size + file.lastModified);
        return { rows, fileHash };
      } catch (e) {
        return { rows: [], fileHash: '', error: `Excel parsing error: ${e.message}` };
      }
    }
    // CSV
    const text = await file.text();
    const fileHash = Data.hashFileContent(text);
    return await new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve({ rows: results.data, fileHash }),
        error:    (err)     => resolve({ rows: [], fileHash: '', error: err.message })
      });
    });
  },

  // ============ ZERODHA EQUITY HOLDINGS ============
  async parseZerodha(file) {
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };

    const assets = [];
    rows.forEach(row => {
      const name     = row['Instrument'] || row['instrument'] || row['Symbol'] || row['symbol'];
      const qty      = parseFloat(row['Qty.'] || row['Qty'] || row['quantity'] || 0);
      const avgPrice = parseFloat(row['Avg. cost'] || row['avg_price'] || row['Average Price'] || 0);
      const ltp      = parseFloat(row['LTP'] || row['ltp'] || row['Last Price'] || 0);

      if (name && qty > 0) {
        assets.push({
          category: 'equity', subcategory: 'stocks',
          name: name.toString().trim(), qty, avgPrice,
          ltp: ltp || avgPrice, exchange: 'NSE',
        });
      }
    });
    return { assets, pnlRecords: [], source: 'zerodha_equity', fileHash, type: 'zerodha_equity' };
  },

  // ============ ZERODHA MF ============
  async parseZerodhaMF(file) {
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };

    const assets = [];
    rows.forEach(row => {
      const name     = row['Scheme'] || row['scheme'] || row['Fund Name'] || row['fund_name'];
      const units    = parseFloat(row['Quantity'] || row['units'] || row['Units'] || 0);
      const nav      = parseFloat(row['NAV'] || row['nav'] || row['Current NAV'] || 0);
      const invested = parseFloat(row['Investment Amount'] || row['invested'] || row['Invested Amount'] || 0);

      if (name && units > 0) {
        assets.push({
          category: 'mf',
          subcategory: 'mf_' + guessMFType(name).toLowerCase(),
          name: name.toString().trim(), units,
          nav: nav || 0, invested: invested || 0,
          mfType: guessMFType(name),
        });
      }
    });
    return { assets, pnlRecords: [], source: 'zerodha_mf', fileHash, type: 'zerodha_mf' };
  },

  // ============ GROWW EQUITY HOLDINGS ============
  async parseGrowwEquity(file) {
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };

    const assets = [];
    rows.forEach(row => {
      const name     = row['Stock Name'] || row['stock_name'] || row['Name'] || row['Instrument'] || row['Symbol'];
      const qty      = parseFloat(row['Quantity'] || row['qty'] || row['Shares'] || 0);
      const avgPrice = parseFloat(row['Avg Buy Price'] || row['Average Price'] || row['avg_price'] || row['Buy Price'] || 0);
      const ltp      = parseFloat(row['Current Price'] || row['LTP'] || row['Market Price'] || row['ltp'] || 0);

      if (name && qty > 0) {
        assets.push({
          category: 'equity', subcategory: 'stocks',
          name: name.toString().trim(), qty, avgPrice,
          ltp: ltp || avgPrice, exchange: 'NSE', platform: 'Groww',
        });
      }
    });
    return { assets, pnlRecords: [], source: 'groww_equity', fileHash, type: 'groww_equity' };
  },

  // ============ GROWW MF HOLDINGS ============
  async parseGrowwMF(file) {
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };

    const assets = [];
    rows.forEach(row => {
      const name     = row['Fund Name'] || row['fund_name'] || row['Scheme'] || row['Scheme Name'];
      const units    = parseFloat(row['Units'] || row['units'] || row['Quantity'] || 0);
      const nav      = parseFloat(row['Current NAV'] || row['NAV'] || row['nav'] || 0);
      const invested = parseFloat(row['Invested Amount'] || row['invested_amount'] || row['Investment'] || 0);

      if (name && units > 0) {
        assets.push({
          category: 'mf',
          subcategory: 'mf_' + guessMFType(name).toLowerCase(),
          name: name.toString().trim(), units,
          nav: nav || 0, invested: invested || 0,
          mfType: guessMFType(name), platform: 'Groww',
        });
      }
    });
    return { assets, pnlRecords: [], source: 'groww_mf', fileHash, type: 'groww_mf' };
  },

  // ============ GROWW P&L STATEMENT ============
  // Handles CSV and Excel. P&L → pnlRecords only, not net worth.
  async parseGrowwPnL(file) {
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };

    const pnlRecords = [];
    rows.forEach(row => {
      const name = (
        row['Stock Name'] || row['stock_name'] ||
        row['Fund Name']  || row['Instrument'] ||
        row['Script Name']|| row['Symbol']     || row['Name'] || ''
      ).toString().trim();

      const sellDate = (
        row['Sell Date'] || row['sell_date'] ||
        row['Date']      || row['Transaction Date'] || ''
      ).toString().trim();

      const buyPrice  = parseFloat(row['Buy Price'] || row['buy_price'] || row['Avg Buy Price'] || row['Average Buy Price'] || 0);
      const sellPrice = parseFloat(row['Sell Price'] || row['sell_price'] || row['Selling Price'] || 0);
      const qty       = parseFloat(row['Quantity'] || row['Qty'] || row['qty'] || row['Shares'] || 0);
      const gain      = parseFloat(
        row['Realised P&L'] || row['Realized P&L'] ||
        row['P&L'] || row['pnl'] || row['Gain/Loss'] || row['Net P&L'] || 0
      );
      const typeRaw  = (row['Type'] || row['Gain Type'] || row['Term'] || '').toString();
      const gainType = detectGainType(typeRaw, sellDate);

      if (name && qty > 0) {
        pnlRecords.push({ name, sellDate, buyPrice, sellPrice, qty, gain, gainType });
      }
    });

    return {
      assets: [],
      pnlRecords,
      source:  'groww_pnl',
      fileHash,
      type:    'groww_pnl',
      message: pnlRecords.length > 0
        ? `Found ${pnlRecords.length} P&L records. Stored for tax reference — does not affect net worth.`
        : 'No P&L records detected. Check that the file is a Groww P&L export.'
    };
  },

  // ============ BANK STATEMENT ============
  async parseBank(file) {
    if (/\.pdf$/i.test(file.name)) return this.parseBankPDF(file);
    // CSV or Excel
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };
    return this._parseBankRows(rows, fileHash);
  },

  _parseBankRows(rows, fileHash) {
    // Strategy: find a column named 'balance' and take the last non-empty value
    if (rows.length === 0) {
      return { assets: [], pnlRecords: [], source: 'bank_csv', fileHash, needsConfirm: true,
               message: 'Could not auto-detect balance. Please enter manually.' };
    }

    // Find balance column key
    const headers = Object.keys(rows[0]);
    const balKey  = headers.find(h => /balance/i.test(h));
    let balance   = 0;

    if (balKey) {
      // Walk rows from bottom, take first valid number
      for (let i = rows.length - 1; i >= 0; i--) {
        const num = parseFloat(rows[i][balKey]?.toString().replace(/[,₹$\s]/g, '') || '');
        if (!isNaN(num) && num > 0) { balance = num; break; }
      }
    }

    // Fallback: scan all cells in last few rows for closing balance keywords
    if (balance === 0) {
      for (let i = rows.length - 1; i >= Math.max(0, rows.length - 5); i--) {
        const rowStr = Object.values(rows[i]).join(',').toLowerCase();
        if (rowStr.includes('closing') || rowStr.includes('available balance')) {
          Object.values(rows[i]).forEach(cell => {
            const num = parseFloat(cell.toString().replace(/[,₹$\s]/g, ''));
            if (!isNaN(num) && num > 100 && num < 100000000) balance = Math.max(balance, num);
          });
          if (balance > 0) break;
        }
      }
    }

    const assets = balance > 0 ? [{
      category: 'bank', subcategory: 'savings',
      name: 'Bank Account', account: 'Savings', balance,
    }] : [];

    return {
      assets, pnlRecords: [],
      source: 'bank_csv', fileHash, type: 'bank_csv', needsConfirm: true,
      message: balance > 0
        ? `Detected closing balance: ₹${balance.toLocaleString('en-IN')}. Please rename the bank before confirming.`
        : 'Could not auto-detect balance. Please enter manually.'
    };
  },

  async parseBankPDF(file) {
    const fileHash = Data.hashFileContent(file.name + file.size);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map(item => item.str).join(' ') + '\n';
      }

      let balance = 0;
      const patterns = [
        /closing\s+balance[\s:]+(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
        /available\s+balance[\s:]+(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
        /balance\s+(?:as\s+on|as\s+at)[\s:]+[^\d]*([\d,]+\.?\d*)/i,
        /net\s+balance[\s:]+(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      ];
      for (const pattern of patterns) {
        const match = allText.match(pattern);
        if (match) { balance = parseFloat(match[1].replace(/,/g, '')); if (balance > 0) break; }
      }

      return {
        assets: balance > 0 ? [{
          category: 'bank', subcategory: 'savings', name: 'Bank Account', account: 'Savings', balance
        }] : [],
        pnlRecords: [],
        source: 'bank_pdf', fileHash, type: 'bank_pdf', needsConfirm: true,
        message: balance > 0
          ? `Detected balance: ₹${balance.toLocaleString('en-IN')}. Please rename the bank below.`
          : 'Could not auto-detect balance from PDF. Please enter manually.'
      };
    } catch (e) {
      return { assets: [], pnlRecords: [], error: `PDF parsing error: ${e.message}` };
    }
  },

  // ============ US STOCKS ============
  async parseUSStocks(file) {
    const { rows, fileHash, error } = await this.fileToRows(file);
    if (error) return { assets: [], pnlRecords: [], error };

    const platform = detectUSPlatform(Object.keys(rows[0] || {}));
    const assets   = [];
    rows.forEach(row => {
      const name     = row['Symbol'] || row['symbol'] || row['Stock'] || row['Ticker'] || row['Description'];
      const qty      = parseFloat(row['Qty'] || row['Quantity'] || row['Shares'] || row['quantity'] || 0);
      const priceUSD = parseFloat(row['LTP'] || row['Price'] || row['Close Price'] || row['Last Price'] || 0);
      const costUSD  = parseFloat(row['Avg Price'] || row['Average Price'] || row['Cost'] || row['Cost Basis'] || 0);

      if (name && qty > 0) {
        assets.push({
          category: 'us', subcategory: 'us_stocks',
          name: name.toString().trim(), qty,
          priceUSD: priceUSD || 0, costUSD: costUSD || 0,
          platform, isESOP: 'No',
        });
      }
    });
    return { assets, pnlRecords: [], source: 'us_stocks', fileHash, type: 'us_stocks' };
  },

  // ============ EPF PDF ============
  async parseEPF(file) {
    const fileHash = Data.hashFileContent(file.name + file.size);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map(item => item.str).join(' ') + '\n';
      }

      let balance = 0;
      const patterns = [
        /net\s+balance[\s:]+([\d,]+\.?\d*)/i,
        /total\s+balance[\s:]+([\d,]+\.?\d*)/i,
        /closing\s+balance[\s:]+([\d,]+\.?\d*)/i,
        /balance\s+(?:amount)?[\s:]+([\d,]+\.?\d*)/i,
      ];
      for (const pattern of patterns) {
        const match = allText.match(pattern);
        if (match) { balance = parseFloat(match[1].replace(/,/g, '')); if (balance > 0) break; }
      }

      return {
        assets: balance > 0 ? [{
          category: 'retirement', subcategory: 'epf', name: 'EPF', balance, ytdContrib: 0
        }] : [],
        pnlRecords: [],
        source: 'epf_pdf', fileHash, type: 'epf_pdf', needsConfirm: true,
        message: balance > 0
          ? `Detected EPF balance: ₹${balance.toLocaleString('en-IN')}`
          : 'Could not auto-detect EPF balance. Please enter manually.'
      };
    } catch (e) {
      return { assets: [], pnlRecords: [], error: `PDF parsing error: ${e.message}` };
    }
  },
};

// ============ PARSER HELPERS ============

function guessMFType(name) {
  const n = name.toString().toLowerCase();
  if (n.includes('liquid') || n.includes('overnight') || n.includes('money market')) return 'Debt';
  if (n.includes('debt') || n.includes('bond') || n.includes('gilt') || n.includes('credit')) return 'Debt';
  if (n.includes('gold')) return 'Gold';
  if (n.includes('international') || n.includes('global') || n.includes('us ') || n.includes('nasdaq')) return 'International';
  if (n.includes('hybrid') || n.includes('balanced') || n.includes('equity sav')) return 'Hybrid';
  return 'Equity';
}

function detectUSPlatform(fields) {
  const str = fields.join(',').toLowerCase();
  if (str.includes('groww'))  return 'Groww';
  if (str.includes('ibkr') || str.includes('interactive')) return 'IBKR';
  if (str.includes('vested')) return 'Vested';
  if (str.includes('schwab')) return 'Schwab';
  return 'Other';
}

function detectGainType(typeStr, sellDateStr) {
  const t = typeStr.toString().toLowerCase();
  if (t.includes('long')  || t.includes('ltcg')) return 'LTCG';
  if (t.includes('short') || t.includes('stcg')) return 'STCG';
  return 'unknown';
}
