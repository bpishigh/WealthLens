// js/sheets.js — Google Sheets read/write integration

const Sheets = {

  getConfig() {
    return {
      apiKey: localStorage.getItem('wl_gs_key') || '',
      sheetId: localStorage.getItem('wl_gs_id') || ''
    };
  },

  async verifyConnection(apiKey, sheetId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=sheets.properties.title`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Invalid API key or Sheet ID');
      const data = await res.json();
      return { ok: true, sheets: data.sheets?.map(s => s.properties.title) || [] };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async initializeSheets(apiKey, sheetId) {
    // Check if our tabs exist, if not create them
    const needed = Object.values(CONFIG.SHEET_TABS);
    // Note: Creating sheets requires OAuth. For API key only (read/append),
    // user must manually create the sheets. We'll guide them.
    return { ok: true };
  },

  async readRange(range) {
    const { apiKey, sheetId } = this.getConfig();
    if (!apiKey || !sheetId) return null;
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data.values || [];
    } catch { return null; }
  },

  async appendRow(tab, values) {
    // For write operations, we need OAuth token
    // Strategy: use a Google Apps Script Web App as proxy (free, no OAuth needed from browser)
    const scriptUrl = localStorage.getItem('wl_script_url');
    if (!scriptUrl) return { ok: false, error: 'No Apps Script URL configured' };

    try {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', tab, values })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async writeData(tab, data) {
    const scriptUrl = localStorage.getItem('wl_script_url');
    if (!scriptUrl) {
      // Fallback: save to localStorage only
      return { ok: false, error: 'No Apps Script URL. Data saved locally only.' };
    }
    try {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', tab, data })
      });
      const result = await res.json();
      return result;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async loadAllData() {
    // Try to load assets and snapshots from Google Sheets
    const assetsRaw = await this.readRange(`${CONFIG.SHEET_TABS.ASSETS}!A:Z`);
    const snapshotsRaw = await this.readRange(`${CONFIG.SHEET_TABS.SNAPSHOTS}!A:Z`);

    let assets = [], snapshots = [];

    if (assetsRaw && assetsRaw.length > 1) {
      const headers = assetsRaw[0];
      assets = assetsRaw.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || '');
        return obj;
      });
    }

    if (snapshotsRaw && snapshotsRaw.length > 1) {
      const headers = snapshotsRaw[0];
      snapshots = snapshotsRaw.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          try { obj[h] = JSON.parse(row[i]); } 
          catch { obj[h] = row[i] || ''; }
        });
        return obj;
      });
    }

    return { assets, snapshots };
  },

  // Generate Apps Script code for the user to deploy
  getAppsScriptCode(sheetId) {
    return `// WealthLens Apps Script — Deploy as Web App
// Deploy: Extensions > Apps Script > Deploy > New Deployment > Web App
// Execute as: Me, Access: Anyone

const SHEET_ID = '${sheetId || 'YOUR_SHEET_ID'}';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    if (payload.action === 'append') {
      const sheet = ss.getSheetByName(payload.tab) || ss.insertSheet(payload.tab);
      sheet.appendRow(payload.values);
      
    } else if (payload.action === 'write') {
      const sheet = ss.getSheetByName(payload.tab) || ss.insertSheet(payload.tab);
      sheet.clearContents();
      if (payload.data && payload.data.length > 0) {
        sheet.getRange(1, 1, payload.data.length, payload.data[0].length).setValues(payload.data);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, status: 'WealthLens Script Active' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
  }
};
