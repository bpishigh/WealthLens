/* ============================================
   WealthLens — CSS Design System
   Aesthetic: Dark luxury financial terminal
   Fonts: DM Serif Display + DM Mono + Instrument Sans
============================================ */

:root {
  --bg-base: #0a0c0f;
  --bg-surface: #111318;
  --bg-raised: #171b22;
  --bg-card: #1c2029;
  --bg-hover: #232836;

  --border: #252b38;
  --border-bright: #303848;

  --text-primary: #e8eaf0;
  --text-secondary: #8b93a8;
  --text-muted: #505a72;
  --text-accent: #c8a96e;

  --accent-gold: #c8a96e;
  --accent-gold-dim: #8a6e3e;
  --accent-green: #4ecb71;
  --accent-green-dim: #1e4a2e;
  --accent-red: #e05c5c;
  --accent-red-dim: #3a1a1a;
  --accent-blue: #5b9cf6;
  --accent-blue-dim: #1a2d52;
  --accent-purple: #9b7fea;

  --cat-bank: #5b9cf6;
  --cat-equity: #4ecb71;
  --cat-mf: #9b7fea;
  --cat-us: #f5a623;
  --cat-retirement: #4dd0e1;
  --cat-realestate: #ef9a9a;
  --cat-gold: #c8a96e;
  --cat-fd: #80cbc4;
  --cat-other: #ce93d8;
  --cat-liability: #e05c5c;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;

  --shadow-card: 0 2px 16px rgba(0,0,0,0.4);
  --shadow-hover: 0 8px 32px rgba(0,0,0,0.6);

  --font-display: 'DM Serif Display', serif;
  --font-mono: 'DM Mono', monospace;
  --font-body: 'Instrument Sans', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 15px; }

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ============ SETUP MODAL ============ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-overlay.hidden { display: none; }

.setup-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-lg);
  padding: 48px;
  width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.8);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.setup-logo {
  font-size: 32px;
  color: var(--accent-gold);
  margin-bottom: 12px;
  display: block;
}

.setup-title {
  font-family: var(--font-display);
  font-size: 2.2rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.setup-subtitle {
  color: var(--text-secondary);
  margin: 8px 0 32px;
  font-size: 0.95rem;
}

.setup-step { display: none; }
.setup-step.active { display: flex; gap: 20px; }

.step-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-gold);
  opacity: 0.6;
  padding-top: 4px;
  flex-shrink: 0;
}

.step-content { flex: 1; }
.step-content h3 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  margin-bottom: 8px;
}
.step-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 24px;
}

/* ============ FORMS ============ */
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.input-group input, .input-group select {
  width: 100%;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}
.input-group input:focus, .input-group select:focus {
  outline: none;
  border-color: var(--accent-gold);
}
.input-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}
.input-hint a { color: var(--accent-gold); }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ============ BUTTONS ============ */
.btn-primary {
  background: var(--accent-gold);
  color: #0a0c0f;
  border: none;
  border-radius: var(--radius-sm);
  padding: 12px 24px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 8px;
}
.btn-primary:hover { background: #e0bf7e; transform: translateY(-1px); }

.btn-secondary {
  background: var(--bg-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-sm);
  padding: 10px 20px;
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background: var(--bg-hover); border-color: var(--accent-gold); }

.btn-add {
  background: transparent;
  border: 1px dashed var(--border-bright);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-size: 0.82rem;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s;
}
.btn-add:hover { border-color: var(--accent-gold); color: var(--accent-gold); }

.btn-danger {
  background: var(--accent-red-dim);
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
  border-radius: var(--radius-sm);
  padding: 10px 20px;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 8px;
}

.btn-sync {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-size: 0.8rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}
.btn-sync:hover { border-color: var(--accent-gold); color: var(--accent-gold); }

/* ============ LAYOUT ============ */
.app {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.app.hidden { display: none; }

/* ============ SIDEBAR ============ */
.sidebar {
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 28px;
  border-bottom: 1px solid var(--border);
}

.logo-mark {
  font-size: 20px;
  color: var(--accent-gold);
}
.logo-text {
  font-family: var(--font-display);
  font-size: 1.15rem;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.sidebar-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}
.nav-item:hover { background: var(--bg-raised); color: var(--text-primary); }
.nav-item.active { background: var(--bg-hover); color: var(--accent-gold); }

.nav-icon { font-size: 0.9rem; opacity: 0.8; }

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.sync-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

/* ============ MAIN CONTENT ============ */
.main-content {
  background: var(--bg-base);
  min-height: 100vh;
  overflow-y: auto;
}

.page { padding: 32px 36px; }
.page.hidden { display: none; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 0.88rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions select {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

/* ============ NET WORTH HERO ============ */
.networth-hero {
  background: var(--bg-surface);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-lg);
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.networth-hero::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 240px; height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.nw-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.nw-value {
  font-family: var(--font-display);
  font-size: 3.4rem;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 12px;
}

.nw-change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.nw-change.positive { color: var(--accent-green); }
.nw-change.negative { color: var(--accent-red); }

.change-period {
  color: var(--text-muted);
  font-size: 0.82rem;
}

/* ============ CATEGORY GRID ============ */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.cat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px 16px;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.cat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 3px; height: 100%;
  border-radius: 2px 0 0 2px;
}
.cat-card:hover { border-color: var(--border-bright); transform: translateY(-2px); box-shadow: var(--shadow-hover); }

.cat-icon { font-size: 1.1rem; margin-bottom: 8px; }
.cat-name { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.cat-value { font-family: var(--font-mono); font-size: 1.1rem; color: var(--text-primary); font-weight: 500; }
.cat-change { font-size: 0.75rem; margin-top: 4px; }
.cat-pct { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }

/* ============ CHARTS ============ */
.chart-section {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.chart-header h2 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--text-primary);
}

.chart-toggles { display: flex; gap: 8px; flex-wrap: wrap; }
.toggle-btn {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.toggle-btn.active { border-color: currentColor; }
.chart-container { position: relative; height: 280px; }

/* ============ SNAPSHOT TABLE ============ */
.snapshot-section {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
}
.snapshot-section h2 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.snapshot-table { width: 100%; border-collapse: collapse; }
.snapshot-table th {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.snapshot-table td {
  padding: 12px;
  font-size: 0.88rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}
.snapshot-table td:first-child { color: var(--text-primary); font-weight: 500; }
.snapshot-table td.mono { font-family: var(--font-mono); }
.snapshot-table tr:last-child td { border-bottom: none; }
.snapshot-table tr:hover td { background: var(--bg-raised); }

.tag-positive { color: var(--accent-green); }
.tag-negative { color: var(--accent-red); }

/* ============ ASSET SECTIONS ============ */
.asset-categories { display: flex; flex-direction: column; gap: 20px; }

.asset-section {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.liability-section { border-color: var(--accent-red-dim); }

.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.section-icon { font-size: 1.3rem; }
.section-header h2 { font-size: 1rem; font-weight: 600; }
.section-total { font-family: var(--font-mono); font-size: 1.05rem; color: var(--accent-gold); }
.section-total.negative { color: var(--accent-red); }

.asset-list { padding: 8px 0; }
.asset-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 80px;
  align-items: center;
  padding: 10px 20px;
  font-size: 0.86rem;
  transition: background 0.15s;
}
.asset-item:hover { background: var(--bg-raised); }
.asset-item-name { font-weight: 500; color: var(--text-primary); }
.asset-item-sub { font-size: 0.74rem; color: var(--text-muted); margin-top: 2px; }
.asset-item-value { font-family: var(--font-mono); }
.asset-item-actions { display: flex; gap: 6px; justify-content: flex-end; }
.btn-icon-sm {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-icon-sm:hover { border-color: var(--accent-gold); color: var(--accent-gold); }

/* ============ IMPORT PAGE ============ */
.import-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.import-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  cursor: pointer;
  transition: all 0.25s;
  text-align: center;
}
.import-card:hover {
  border-color: var(--accent-gold);
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(200,169,110,0.1);
}
.import-icon { font-size: 2rem; margin-bottom: 12px; }
.import-card h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 8px; }
.import-card p { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
.import-format {
  display: inline-block;
  margin-top: 12px;
  padding: 3px 10px;
  border: 1px solid var(--border-bright);
  border-radius: 20px;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.manual-card { border-style: dashed; }

.import-preview {
  background: var(--bg-surface);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-lg);
  padding: 28px;
}
.import-preview h2 { margin-bottom: 20px; font-family: var(--font-display); }
.import-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }

/* ============ INSIGHTS PAGE ============ */
.insights-container { display: flex; flex-direction: column; gap: 24px; }

.insight-controls {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.insight-type-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.insight-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}
.insight-btn.active, .insight-btn:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
  background: rgba(200,169,110,0.06);
}

.generate-btn { width: auto; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
.btn-icon { font-size: 0.85rem; }

.insights-output {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  min-height: 300px;
}

.insights-placeholder {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}
.placeholder-icon { font-size: 3rem; margin-bottom: 16px; color: var(--text-muted); }
.placeholder-note { font-size: 0.78rem; color: var(--text-muted); margin-top: 8px; }

.insight-card {
  margin-bottom: 20px;
  padding: 20px 24px;
  background: var(--bg-raised);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-gold);
  animation: slideUp 0.3s ease;
}
.insight-card h3 { font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 8px; }
.insight-card p { color: var(--text-secondary); line-height: 1.7; font-size: 0.9rem; }
.insight-card.warning { border-left-color: var(--accent-red); }
.insight-card.opportunity { border-left-color: var(--accent-green); }
.insight-card.info { border-left-color: var(--accent-blue); }

/* ============ TAX PLANNER ============ */
.tax-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tax-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.tax-card h3 {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 16px;
}
.wide-card { grid-column: 1 / -1; }

.tax-gauge { margin-bottom: 12px; }
.gauge-bar {
  height: 8px;
  background: var(--bg-raised);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}
.gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), var(--accent-gold));
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.gauge-labels { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); }

.tax-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
}
.tax-item:last-child { border-bottom: none; }
.tax-item label { color: var(--text-secondary); }
.tax-item span { font-family: var(--font-mono); }
.tax-item.highlight span { color: var(--accent-gold); font-weight: 500; }
.tax-item input {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  width: 130px;
}

/* ============ SETTINGS ============ */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.settings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.settings-card h3 {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

/* ============ MODALS ============ */
.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-lg);
  width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.8);
  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.bulk-card { width: 640px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.modal-header h2 { font-family: var(--font-display); font-size: 1.3rem; }
.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}
.modal-close:hover { color: var(--text-primary); }
.modal-subtitle { padding: 12px 24px; color: var(--text-secondary); font-size: 0.88rem; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border);
}

#asset-form-container { padding: 24px; }
#bulk-form { padding: 0 24px; max-height: 60vh; overflow-y: auto; }

.bulk-section { margin-bottom: 20px; }
.bulk-section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 10px;
  font-weight: 600;
}
.bulk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.bulk-item label { font-size: 0.88rem; color: var(--text-secondary); }
.bulk-item input {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.88rem;
  width: 180px;
  text-align: right;
}

/* ============ TOAST ============ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-bright);
  border-radius: var(--radius-md);
  padding: 14px 20px;
  font-size: 0.88rem;
  box-shadow: var(--shadow-hover);
  z-index: 2000;
  animation: slideUp 0.3s ease;
}
.toast.success { border-left: 3px solid var(--accent-green); }
.toast.error { border-left: 3px solid var(--accent-red); }
.toast.hidden { display: none; }

/* ============ SETUP STATUS ============ */
.setup-status {
  margin-top: 16px;
  font-size: 0.82rem;
  color: var(--accent-green);
  min-height: 20px;
}

/* ============ LOADING STATES ============ */
.loading-spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid var(--border-bright);
  border-top-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}

/* ============ ANIMATIONS ============ */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Category colors via data attribute */
.cat-card[data-cat="bank"]::before { background: var(--cat-bank); }
.cat-card[data-cat="equity"]::before { background: var(--cat-equity); }
.cat-card[data-cat="mf"]::before { background: var(--cat-mf); }
.cat-card[data-cat="us"]::before { background: var(--cat-us); }
.cat-card[data-cat="retirement"]::before { background: var(--cat-retirement); }
.cat-card[data-cat="realestate"]::before { background: var(--cat-realestate); }
.cat-card[data-cat="gold"]::before { background: var(--cat-gold); }
.cat-card[data-cat="fd"]::before { background: var(--cat-fd); }
.cat-card[data-cat="other"]::before { background: var(--cat-other); }
.cat-card[data-cat="liability"]::before { background: var(--cat-liability); }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }

/* Preview table */
.preview-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.preview-table th { padding: 8px 12px; text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border); }
.preview-table td { padding: 9px 12px; border-bottom: 1px solid var(--border); color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.82rem; }
.preview-table td:first-child { color: var(--text-primary); font-family: var(--font-body); }

.ai-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--text-secondary);
  font-style: italic;
}

/* ============ SPRINT 3 — RETURNS & GOALS ============ */

/* Historical snapshot banner */
.historical-banner {
  background: var(--accent-blue-dim);
  border: 1px solid var(--accent-blue);
  color: var(--accent-blue);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 0.85rem;
  text-align: center;
}
.historical-banner.hidden { display: none; }

/* ---- Returns page ---- */
.returns-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.returns-stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px 24px;
}
.returns-stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.returns-stat-value {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* ---- Goals page ---- */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.goals-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.goal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  transition: border-color 0.2s;
}
.goal-card:hover { border-color: var(--border-bright); }

.goal-ring-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}
.goal-ring-pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 500;
}

.goal-body {
  flex: 1;
  min-width: 0;
}
.goal-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.goal-amounts {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  margin-bottom: 10px;
}
.goal-progress-bar {
  height: 6px;
  background: var(--bg-raised);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}
.goal-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}
.goal-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.goal-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (max-width: 900px) {
  .returns-stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .returns-stats-row { grid-template-columns: 1fr; }
  .goal-card { flex-wrap: wrap; }
}

/* ============ OPTION A — MOBILE RESPONSIVE ============ */

/* Mobile top bar — hidden on desktop */
.mobile-topbar {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 200;
  gap: 12px;
}
.mobile-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

/* Hamburger button */
.hamburger {
  width: 40px; height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.hamburger span {
  display: block;
  width: 20px; height: 2px;
  background: var(--text-secondary);
  border-radius: 2px;
  transition: all 0.25s;
}
.hamburger:hover span { background: var(--text-primary); }

/* Sidebar close button — hidden on desktop */
.sidebar-close {
  display: none;
  margin-left: auto;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
.sidebar-close:hover { color: var(--text-primary); }

/* Sidebar overlay (dims content when sidebar open on mobile) */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 149;
}
.sidebar-overlay.active { display: block; }

/* ---- Tablet breakpoint (≤1024px) ---- */
@media (max-width: 1024px) {
  .app {
    grid-template-columns: 200px 1fr;
  }
  .nw-value { font-size: 2.6rem; }
  .returns-stats-row { grid-template-columns: repeat(2, 1fr); }
  .category-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}

/* ---- Mobile breakpoint (≤768px) ---- */
@media (max-width: 768px) {
  /* Show mobile topbar, hide sidebar by default */
  .mobile-topbar { display: flex; }
  .sidebar-close { display: block; }

  .app {
    grid-template-columns: 1fr;
    padding-top: 56px; /* topbar height */
  }

  /* Sidebar slides in from left */
  .sidebar {
    position: fixed;
    top: 0; left: 0;
    width: 260px;
    height: 100vh;
    z-index: 150;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-y: auto;
  }
  .sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 32px rgba(0,0,0,0.6);
  }

  /* Page padding reduced on mobile */
  .page { padding: 20px 16px; }

  /* Net worth hero stacks vertically */
  .networth-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px 20px;
    gap: 20px;
  }
  .hero-right { align-self: center; }
  .nw-value { font-size: 2.2rem; }

  /* Category cards: 2 columns */
  .category-grid { grid-template-columns: repeat(2, 1fr); }

  /* Snapshot table — horizontal scroll */
  .snapshot-section { overflow-x: auto; }
  .snapshot-table { min-width: 600px; }

  /* Header actions stack */
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .header-actions {
    flex-wrap: wrap;
    width: 100%;
  }
  .header-actions select,
  .header-actions button { font-size: 0.8rem; padding: 7px 12px; }

  /* Returns stats: single column */
  .returns-stats-row { grid-template-columns: 1fr 1fr; }

  /* Goals: hide ring on very small screens */
  .goal-ring-wrap { width: 64px; height: 64px; }

  /* Import grid: 1 col */
  .import-grid { grid-template-columns: 1fr; }

  /* Settings grid: 1 col */
  .settings-grid { grid-template-columns: 1fr; }

  /* Tax grid: 1 col */
  .tax-grid { grid-template-columns: 1fr; }

  /* Chart toggles: wrap & smaller */
  .chart-toggles { gap: 4px; }
  .toggle-btn { font-size: 0.72rem; padding: 3px 8px; }

  /* Asset sections */
  .asset-item {
    flex-wrap: wrap;
    gap: 6px;
  }

  /* Modal cards full-width on mobile */
  .modal-card {
    width: calc(100vw - 32px) !important;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
  }
}

/* ---- Small mobile (≤480px) ---- */
@media (max-width: 480px) {
  .category-grid { grid-template-columns: 1fr 1fr; }
  .returns-stats-row { grid-template-columns: 1fr; }
  .nw-value { font-size: 1.9rem; }
  .page-title { font-size: 1.5rem; }
  .goal-card { flex-wrap: wrap; }
}

/* ============ OPTION B — TAX PLANNER UPGRADE ============ */

/* FY badge */
.fy-badge {
  font-size: 0.68rem;
  background: var(--accent-blue-dim);
  color: var(--accent-blue);
  padding: 2px 7px;
  border-radius: 10px;
  margin-left: 8px;
  font-family: var(--font-mono);
  font-weight: 400;
  vertical-align: middle;
}

/* Regime comparison grid */
.regime-compare-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: start;
  margin-bottom: 16px;
}

.regime-card {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
  transition: border-color 0.2s;
}
.regime-card.regime-active {
  border-color: var(--accent-gold);
  background: var(--bg-hover);
}

.regime-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.regime-current-tag {
  font-size: 0.68rem;
  background: var(--accent-gold-dim);
  color: var(--accent-gold);
  padding: 2px 7px;
  border-radius: 10px;
  text-transform: none;
  letter-spacing: 0;
}
.regime-tax {
  font-family: var(--font-mono);
  font-size: 1.6rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.regime-detail { border-top: 1px solid var(--border); padding-top: 12px; }

.regime-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-muted);
  padding-top: 20px;
}

.regime-verdict {
  padding: 14px 18px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}
.verdict-good {
  background: var(--accent-green-dim);
  color: var(--accent-green);
  border: 1px solid var(--accent-green);
}
.verdict-switch {
  background: var(--accent-gold-dim);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold);
}

/* Recommendations */
.rec-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.87rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
.rec-item:last-child { border-bottom: none; }
.rec-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
.rec-warning { color: var(--accent-red); }
.rec-opportunity { color: var(--text-secondary); }
.rec-good { color: var(--accent-green); }
.rec-neutral { color: var(--text-secondary); }

/* Responsive */
@media (max-width: 768px) {
  .regime-compare-grid {
    grid-template-columns: 1fr;
  }
  .regime-vs { padding: 4px 0; }
}

/* ============ OPTION C — DASHBOARD UPGRADES ============ */

/* Section label */
.section-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  margin-bottom: 10px;
  font-weight: 600;
}

/* ---- Milestones ---- */
.milestone-section {
  margin-bottom: 20px;
}
.milestone-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.milestone-hit-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.milestone-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  font-size: 0.78rem;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.milestone-badge.milestone-hit {
  background: var(--bg-hover);
  border-color: var(--accent-gold-dim);
  color: var(--accent-gold);
}
.ms-icon { font-size: 0.9rem; }
.ms-label { font-family: var(--font-mono); font-size: 0.78rem; }

.milestone-next {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 8px;
}
.ms-next-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.ms-progress-bar {
  width: 100px;
  height: 5px;
  background: var(--bg-raised);
  border-radius: 3px;
  overflow: hidden;
}
.ms-progress-fill {
  height: 100%;
  background: var(--accent-gold);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.ms-progress-pct {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Milestone celebration toast */
.milestone-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--bg-card);
  border: 1px solid var(--accent-gold);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 2000;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  transform: translateY(80px);
  opacity: 0;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  max-width: 300px;
}
.milestone-toast.ms-toast-visible {
  transform: translateY(0);
  opacity: 1;
}
.ms-toast-icon { font-size: 1.8rem; }
.ms-toast-title {
  font-weight: 600;
  color: var(--accent-gold);
  font-size: 0.9rem;
  margin-bottom: 3px;
}
.ms-toast-sub { font-size: 0.82rem; color: var(--text-secondary); }

/* ---- Allocation ---- */
.alloc-empty {
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 8px 0;
}
.alloc-row {
  display: grid;
  grid-template-columns: 160px 1fr 90px 110px;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.83rem;
}
.alloc-row:last-child { border-bottom: none; }
.alloc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}
.alloc-bar-wrap { position: relative; }
.alloc-bar-track {
  position: relative;
  height: 8px;
  background: var(--bg-raised);
  border-radius: 4px;
  overflow: visible;
}
.alloc-bar-fill {
  height: 100%;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: width 0.4s ease;
}
.alloc-target-line {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 14px;
  background: var(--text-muted);
  border-radius: 1px;
  transform: translateX(-50%);
}
.alloc-pcts { font-size: 0.8rem; white-space: nowrap; }
.alloc-delta {
  font-size: 0.78rem;
  font-family: var(--font-mono);
  text-align: right;
}
.alloc-ok    { color: var(--accent-green); }
.alloc-over  { color: var(--accent-gold); }
.alloc-under { color: var(--accent-blue); }

/* Allocation settings */
.alloc-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.alloc-setting-row:last-of-type { border-bottom: none; }

/* ---- Savings Rate ---- */
.savings-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.savings-stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.savings-stat-value {
  font-family: var(--font-mono);
  font-size: 1.3rem;
  color: var(--text-primary);
}
.savings-bar-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 90px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
}
.savings-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: flex-end;
}
.savings-bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.4s ease;
}
.savings-bar-pos { background: var(--accent-green); opacity: 0.75; }
.savings-bar-neg { background: var(--accent-red);   opacity: 0.75; }
.savings-bar-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .alloc-row { grid-template-columns: 120px 1fr 70px; }
  .alloc-delta { display: none; }
  .savings-stats { grid-template-columns: 1fr 1fr; }
  .milestone-next { flex-wrap: wrap; }
  .ms-progress-bar { width: 60px; }
}
@media (max-width: 480px) {
  .savings-stats { grid-template-columns: 1fr; }
}

/* ============ OPTION D — AI INSIGHTS UPGRADE ============ */

/* Mode tabs */
.insights-mode-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 4px;
  width: fit-content;
}
.insights-mode-tab {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s;
}
.insights-mode-tab.active {
  background: var(--bg-hover);
  color: var(--accent-gold);
}
.insights-mode-tab:hover:not(.active) { color: var(--text-primary); }

/* Context badge */
.chat-context-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  margin-bottom: 16px;
  font-family: var(--font-mono);
}

/* Chat output area */
.chat-output {
  min-height: 200px;
  max-height: 520px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding: 4px 0;
  scroll-behavior: smooth;
}

/* Chat bubbles */
.chat-bubble {
  max-width: 88%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.87rem;
  line-height: 1.6;
  animation: fadeIn 0.2s ease;
}
.chat-user {
  align-self: flex-end;
  background: var(--accent-blue-dim);
  border: 1px solid var(--accent-blue);
  color: var(--text-primary);
  border-radius: var(--radius-md) var(--radius-md) 4px var(--radius-md);
}
.chat-ai {
  align-self: flex-start;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 4px;
}
.chat-error {
  align-self: flex-start;
  background: var(--accent-red-dim);
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  border-radius: var(--radius-md);
}

/* Typing indicator */
.chat-typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
}
.typing-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typingBounce 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-6px); opacity: 1; }
}

/* Chat input row */
.chat-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.chat-input {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.88rem;
  transition: border-color 0.2s;
}
.chat-input:focus {
  outline: none;
  border-color: var(--accent-gold);
}
.chat-input::placeholder { color: var(--text-muted); }

/* Insight card positive type */
.insight-card.positive {
  border-color: var(--accent-green-dim);
}
.insight-card.positive h3 { color: var(--accent-green); }

/* Responsive */
@media (max-width: 768px) {
  .insights-mode-tabs { width: 100%; }
  .insights-mode-tab { flex: 1; text-align: center; padding: 8px 10px; }
  .chat-bubble { max-width: 95%; }
}
