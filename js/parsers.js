// js/parsers.js — CSV/PDF import parsers

const Parsers = {

  // ============ ZERODHA HOLDINGS ============
  async parseZerodha(file) {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const assets = [];
          results.data.forEach(row => {
            // Zerodha holdings CSV format: Instrument, Qty, Avg cost, LTP, Cur val, P&L, Net chg, Day chg
            const name = row['Instrument'] || row['instrument'] || row['Symbol'] || row['symbol'];
            const qty = parseFloat(row['Qty.'] || row['Qty'] || row['quantity'] || 0);
            const avgPrice = parseFloat(row['Avg. cost'] || row['avg_price'] || row['Average Price'] || 0);
            const ltp = parseFloat(row['LTP'] || row['ltp'] || row['Last Price'] || 0);

            if (name && qty > 0) {
              assets.push({
                category: 'equity',
                name: name.trim(),
                qty,
                avgPrice,
                ltp: ltp || avgPrice,
                exchange: 'NSE',
                source: 'zerodha_import'
              });
            }
          });
          resolve({ assets, type: 'zerodha_equity', raw: results.data });
        },
        error: (err) => resolve({ assets: [], error: err.message })
      });
    });
  },

  // ============ ZERODHA MF ============
  async parseZerodhaMF(file) {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const assets = [];
          results.data.forEach(row => {
            const name = row['Scheme'] || row['scheme'] || row['Fund Name'] || row['fund_name'];
            const units = parseFloat(row['Quantity'] || row['units'] || row['Units'] || 0);
            const nav = parseFloat(row['NAV'] || row['nav'] || row['Current NAV'] || 0);
            const invested = parseFloat(row['Investment Amount'] || row['invested'] || row['Invested Amount'] || 0);

            if (name && units > 0) {
              assets.push({
                category: 'mf',
                name: name.trim(),
                units,
                nav: nav || 0,
                invested: invested || 0,
                mfType: guessMFType(name),
                source: 'zerodha_mf_import'
              });
            }
          });
          resolve({ assets, type: 'zerodha_mf', raw: results.data });
        },
        error: (err) => resolve({ assets: [], error: err.message })
      });
    });
  },

  // ============ BANK STATEMENT ============
  async parseBank(file) {
    if (file.name.endsWith('.csv')) {
      return this.parseBankCSV(file);
    } else if (file.name.endsWith('.pdf')) {
      return this.parseBankPDF(file);
    }
    return { assets: [], error: 'Unsupported format' };
  },

  async parseBankCSV(file) {
    return new Promise((resolve) => {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          // Try to find closing balance from bank CSV
          // Different banks have different formats; try common patterns
          const rows = results.data;
          let balance = 0;
          let bankName = 'Bank Account';

          // Look for balance column or closing balance row
          for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            const rowStr = row.join(',').toLowerCase();

            if (rowStr.includes('closing') || rowStr.includes('balance b/f') || rowStr.includes('available')) {
              // Find numeric value in this row
              for (const cell of row) {
                const num = parseFloat(cell.toString().replace(/[,₹$\s]/g, ''));
                if (!isNaN(num) && num > 0 && num < 100000000) {
                  balance = num;
                  break;
                }
              }
              if (balance > 0) break;
            }
          }

          // If not found by closing balance, try last balance column
          if (balance === 0) {
            // Find header row
            let balanceColIdx = -1;
            for (let i = 0; i < Math.min(5, rows.length); i++) {
              const row = rows[i];
              const lower = row.map(c => c.toString().toLowerCase());
              const idx = lower.findIndex(c => c.includes('balance'));
              if (idx >= 0) { balanceColIdx = idx; break; }
            }

            if (balanceColIdx >= 0) {
              // Get last valid balance
              for (let i = rows.length - 1; i >= 0; i--) {
                const val = rows[i][balanceColIdx];
                if (val) {
                  const num = parseFloat(val.toString().replace(/[,₹$\s]/g, ''));
                  if (!isNaN(num) && num >= 0) { balance = num; break; }
                }
              }
            }
          }

          const assets = balance > 0 ? [{
            category: 'bank',
            name: bankName,
            account: 'Savings',
            balance,
            source: 'bank_csv_import'
          }] : [];

          resolve({
            assets,
            type: 'bank',
            detectedBalance: balance,
            raw: rows,
            needsConfirm: true,
            message: balance > 0
              ? `Detected closing balance: ₹${balance.toLocaleString('en-IN')}. Please verify and set the bank name.`
              : 'Could not auto-detect balance. Please enter manually.'
          });
        },
        error: (err) => resolve({ assets: [], error: err.message })
      });
    });
  },

  async parseBankPDF(file) {
    // Use PDF.js to extract text and find balance
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allText = '';

      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map(item => item.str).join(' ') + '\n';
      }

      // Search for balance patterns
      let balance = 0;
      const patterns = [
        /closing\s+balance[:\s]+(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
        /available\s+balance[:\s]+(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
        /balance\s+(?:as\s+on|as\s+at)[:\s]+[^\d]*([\d,]+\.?\d*)/i,
        /net\s+balance[:\s]+(?:INR|Rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
      ];

      for (const pattern of patterns) {
        const match = allText.match(pattern);
        if (match) {
          balance = parseFloat(match[1].replace(/,/g, ''));
          if (balance > 0) break;
        }
      }

      return {
        assets: balance > 0 ? [{
          category: 'bank',
          name: 'Bank Account',
          account: 'Savings',
          balance,
          source: 'bank_pdf_import'
        }] : [],
        type: 'bank',
        detectedBalance: balance,
        needsConfirm: true,
        extractedText: allText.substring(0, 500),
        message: balance > 0
          ? `Detected balance: ₹${balance.toLocaleString('en-IN')}. Please verify and set the bank name.`
          : 'Could not auto-detect balance from PDF. Please enter manually.'
      };
    } catch (e) {
      return { assets: [], error: `PDF parsing error: ${e.message}`, needsConfirm: true };
    }
  },

  // ============ US STOCKS ============
  async parseUSStocks(file) {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const assets = [];
          results.data.forEach(row => {
            // Support Groww US, IBKR, Vested CSV formats
            const name = row['Symbol'] || row['symbol'] || row['Stock'] || row['Ticker'] || row['Description'];
            const qty = parseFloat(row['Qty'] || row['Quantity'] || row['Shares'] || row['quantity'] || 0);
            const priceUSD = parseFloat(row['LTP'] || row['Price'] || row['Close Price'] || row['Last Price'] || 0);
            const costUSD = parseFloat(row['Avg Price'] || row['Average Price'] || row['Cost'] || row['Cost Basis'] || 0);
            const platform = detectUSPlatform(results.meta?.fields || []);

            if (name && qty > 0) {
              assets.push({
                category: 'us',
                name: name.trim(),
                qty,
                priceUSD: priceUSD || 0,
                costUSD: costUSD || 0,
                platform,
                isESOP: 'No',
                source: 'us_import'
              });
            }
          });
          resolve({ assets, type: 'us_stocks', raw: results.data });
        },
        error: (err) => resolve({ assets: [], error: err.message })
      });
    });
  },

  // ============ EPF PDF ============
  async parseEPF(file) {
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
        /net\s+balance[:\s]+([\d,]+\.?\d*)/i,
        /total\s+balance[:\s]+([\d,]+\.?\d*)/i,
        /closing\s+balance[:\s]+([\d,]+\.?\d*)/i,
        /balance\s+(?:amount)?[:\s]+([\d,]+\.?\d*)/i,
      ];

      for (const pattern of patterns) {
        const match = allText.match(pattern);
        if (match) {
          balance = parseFloat(match[1].replace(/,/g, ''));
          if (balance > 0) break;
        }
      }

      return {
        assets: balance > 0 ? [{
          category: 'retirement',
          name: 'EPF',
          balance,
          ytdContrib: 0,
          source: 'epf_pdf_import'
        }] : [],
        type: 'epf',
        detectedBalance: balance,
        needsConfirm: true,
        message: balance > 0
          ? `Detected EPF balance: ₹${balance.toLocaleString('en-IN')}`
          : 'Could not auto-detect EPF balance. Please enter manually.'
      };
    } catch (e) {
      return { assets: [], error: `PDF parsing error: ${e.message}` };
    }
  },
};

// ============ HELPERS ============
function guessMFType(name) {
  const n = name.toLowerCase();
  if (n.includes('liquid') || n.includes('overnight') || n.includes('money market')) return 'Debt';
  if (n.includes('debt') || n.includes('bond') || n.includes('gilt') || n.includes('credit')) return 'Debt';
  if (n.includes('gold')) return 'Gold';
  if (n.includes('international') || n.includes('global') || n.includes('us ') || n.includes('nasdaq')) return 'International';
  if (n.includes('hybrid') || n.includes('balanced') || n.includes('equity sav')) return 'Hybrid';
  return 'Equity';
}

function detectUSPlatform(fields) {
  const str = fields.join(',').toLowerCase();
  if (str.includes('groww')) return 'Groww';
  if (str.includes('ibkr') || str.includes('interactive')) return 'IBKR';
  if (str.includes('vested')) return 'Vested';
  if (str.includes('schwab')) return 'Schwab';
  return 'Other';
}
