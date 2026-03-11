# WealthLens — Personal Net Worth MIS Tracker

A **100% free, privacy-first** personal net worth tracker with AI-powered insights.

## Tech Stack (All Free)
- **Frontend**: Pure HTML/CSS/JS — no build step, no framework
- **Backend**: Google Sheets (your own account) via Apps Script
- **AI**: Claude Haiku API (~$0.001 per insight generation)
- **Hosting**: GitHub Pages (free) or any static host

---

## Quick Setup (10 minutes)

### Step 1: Host the App (GitHub Pages — Free)
1. Create a new GitHub repo (e.g., `wealth-tracker`)
2. Upload all files maintaining folder structure
3. Go to repo Settings → Pages → Source: Deploy from main branch
4. Your app will be live at `https://yourusername.github.io/wealth-tracker`

### Step 2: Google Sheets Setup
1. Create a new Google Sheet at sheets.google.com
2. Create 4 tabs named: `Assets`, `Snapshots`, `Settings`, `History`
3. Copy the **Sheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/`**[COPY THIS PART]**`/edit`

### Step 3: Google Sheets API Key (for reading)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → Enable "Google Sheets API"
3. Go to Credentials → Create API Key
4. Restrict it to Google Sheets API only

### Step 4: Write Access via Apps Script
1. In your Google Sheet: Extensions → Apps Script
2. Replace all code with the script from Settings → Setup Write Access
3. Deploy → New Deployment → Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web App URL
5. Paste it in WealthLens Settings → Web App URL

### Step 5: Claude API Key (for AI insights)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. The app uses **Claude Haiku** — the cheapest model
   - Cost: ~$0.001 per insight (essentially free for personal use)
   - Each insight uses ~500-700 tokens total

---

## Asset Types Supported

| Category | Data Entry Method |
|----------|------------------|
| 🏦 Bank Accounts | Manual entry or CSV upload |
| 📈 Indian Equities | Zerodha Holdings CSV |
| 💹 Mutual Funds | Zerodha MF CSV |
| 🌐 US Stocks & ESOPs | Manual or CSV (Groww/IBKR/Vested) |
| 🏛️ EPF/PPF/NPS | Manual entry or EPF PDF |
| 🏠 Real Estate | Manual entry |
| 🥇 Gold & Metals | Manual (auto gold price coming) |
| 🏧 FDs & Bonds | Manual entry |
| ◈ Crypto & Other | Manual entry |
| 📋 Liabilities | Manual entry |

---

## Zerodha CSV Export Guide

**Holdings:**
Console.zerodha.com → Portfolio → Holdings → Download (CSV)

**Mutual Funds:**
Console.zerodha.com → MF → Holdings → Export

---

## Privacy
- All data stored in **your** browser (localStorage) and **your** Google Sheet
- API keys stored only in your browser's localStorage
- Claude API calls go directly from your browser to Anthropic
- No third-party servers involved

---

## Token Optimization
The app minimizes Claude API token usage:
- Uses **Claude Haiku** (1/30th cost of Opus)
- Compressed portfolio context (~300 token input)
- Max 700 token output
- ~600-800 total tokens per insight = < $0.001 per call

---

## File Structure
```
index.html          — Main app shell
css/style.css       — All styles
js/config.js        — Constants and categories
js/sheets.js        — Google Sheets integration
js/data.js          — Data layer + calculations
js/parsers.js       — CSV/PDF import parsers
js/charts.js        — Chart.js wrappers
js/insights.js      — Claude AI integration
js/tax.js           — Tax calculations
js/ui.js            — UI rendering
js/app.js           — App bootstrap
```
