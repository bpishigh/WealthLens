// js/tax.js — Tax calculations, FY-aware, realized vs unrealized, regime comparison

const Tax = {

  // ============ FY HELPERS ============

  getCurrentFYRange() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based
    const fyStart = month >= 4
      ? new Date(year, 3, 1)        // Apr 1 this year
      : new Date(year - 1, 3, 1);   // Apr 1 last year
    const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31); // Mar 31 next year
    return { fyStart, fyEnd };
  },

  isInCurrentFY(dateStr) {
    if (!dateStr) return false;
    const d = parseIndianDate(dateStr);
    if (isNaN(d)) return false;
    const { fyStart, fyEnd } = this.getCurrentFYRange();
    return d >= fyStart && d <= fyEnd;
  },

  // ============ GAINS CALCULATION — FY-AWARE ============

  // Realized gains: from PnL records, filtered to current FY
  getRealizedGains() {
    const pnl = Data.getPnlRecords();
    let ltcg = 0, stcg = 0;

    pnl.forEach(r => {
      if (!this.isInCurrentFY(r.sellDate)) return; // only current FY
      const gain = parseFloat(r.gain) || 0;
      if (gain <= 0) return; // only count profits (loss harvesting handled separately)
      if (r.gainType === 'LTCG')       ltcg += gain;
      else if (r.gainType === 'STCG')  stcg += gain;
    });

    return { ltcg, stcg, hasData: pnl.length > 0 };
  },

  // Realized losses: for tax loss harvesting display
  getRealizedLosses() {
    const pnl = Data.getPnlRecords();
    let ltcl = 0, stcl = 0;
    pnl.forEach(r => {
      if (!this.isInCurrentFY(r.sellDate)) return;
      const gain = parseFloat(r.gain) || 0;
      if (gain >= 0) return;
      if (r.gainType === 'LTCG')      ltcl += Math.abs(gain);
      else if (r.gainType === 'STCG') stcl += Math.abs(gain);
    });
    return { ltcl, stcl };
  },

  // Unrealized gains: from current holdings (not FY-aware — no purchase dates)

  // ============ TAX CALCULATIONS ============

  // New regime FY 2025-26 slabs (updated — ₹12L rebate under 87A)
  calculateNewRegimeTax(income) {
    // Standard deduction: ₹75,000
    const taxable = Math.max(0, income - 75000);
    let tax = 0;
    if (taxable <= 400000)       tax = 0;
    else if (taxable <= 800000)  tax = (taxable - 400000) * 0.05;
    else if (taxable <= 1200000) tax = 20000 + (taxable - 800000) * 0.10;
    else if (taxable <= 1600000) tax = 60000 + (taxable - 1200000) * 0.15;
    else if (taxable <= 2000000) tax = 120000 + (taxable - 1600000) * 0.20;
    else if (taxable <= 2400000) tax = 200000 + (taxable - 2000000) * 0.25;
    else                         tax = 300000 + (taxable - 2400000) * 0.30;
    // 87A rebate: full tax rebate if income ≤ ₹12L (taxable ≤ ₹12L after std deduction)
    if (taxable <= 1200000) tax = 0;
    // 4% health & education cess
    return Math.round(tax * 1.04);
  },

  calculateOldRegimeTax(income, deductions) {
    const taxable = Math.max(0, income - deductions - 50000); // 50K standard deduction
    let tax = 0;
    if (taxable <= 250000)       tax = 0;
    else if (taxable <= 500000)  tax = (taxable - 250000) * 0.05;
    else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
    else                         tax = 112500 + (taxable - 1000000) * 0.30;
    // 87A rebate: if taxable ≤ ₹5L
    if (taxable <= 500000) tax = 0;
    return Math.round(tax * 1.04); // 4% cess
  },

  calculateLTCGTax(ltcg) {
    // ₹1.25L exemption (updated Budget 2024), 12.5% above that
    const taxable = Math.max(0, ltcg - 125000);
    return Math.round(taxable * 0.125 * 1.04);
  },

  calculateSTCGTax(stcg) {
    // 20% flat (updated Budget 2024)
    return Math.round(stcg * 0.20 * 1.04);
  },

  // ============ MAIN UPDATE ============

  update() {
    try {
      const config  = STATE.config || {};
      const income  = config.annualIncome || 0;
      const regime  = config.taxRegime || 'new';
      const { fyStart, fyEnd } = this.getCurrentFYRange();
      const fyLabel = `${fyStart.getFullYear()}-${String(fyEnd.getFullYear()).slice(-2)}`;

      const fyEl = document.getElementById('current-fy');
      if (fyEl) fyEl.textContent = fyLabel;

      const realized = this.getRealizedGains();
      const losses = this.getRealizedLosses();
      const netLTCG = Math.max(0, realized.ltcg - losses.ltcl);
      const netSTCG = Math.max(0, realized.stcg - losses.stcl);

      const d80d = parseFloat(document.getElementById('deduction-80d')?.value || 0);
      const dNPS = parseFloat(document.getElementById('deduction-nps')?.value || 0);
      const dHRA = parseFloat(document.getElementById('deduction-hra')?.value || 0);

      const c80 = Data.get80CUsed();
      const c80Total = Math.min(c80.total, 150000);
      const c80Pct = (c80Total / 150000) * 100;

      document.getElementById('80c-fill').style.width = c80Pct + '%';
      document.getElementById('80c-used').textContent = `${formatCurrencyFull(c80Total)} used`;

      const breakdown80c = document.getElementById('80c-breakdown');
      if (breakdown80c) {
        breakdown80c.innerHTML = `
          <div class="tax-item"><label>EPF (Employee)</label><span>${formatCurrencyFull(c80.epf)}</span></div>
          <div class="tax-item"><label>PPF</label><span>${formatCurrencyFull(c80.ppf)}</span></div>
          <div class="tax-item"><label>ELSS</label><span>${formatCurrencyFull(c80.elss)}</span></div>
          <div class="tax-item"><label>Remaining Room</label><span class="tag-positive">${formatCurrencyFull(Math.max(0, 150000 - c80Total))}</span></div>`;
      }

      this.renderCapitalGains(realized, losses, netLTCG, netSTCG);

      const ltcgTax = this.calculateLTCGTax(netLTCG);
      const stcgTax = this.calculateSTCGTax(netSTCG);
      const capitalGainsTax = ltcgTax + stcgTax;
      this.renderRegimeComparison(income, d80d, dNPS, dHRA, c80Total, capitalGainsTax, regime);
      this.renderRecommendations(income, regime, c80Total, d80d, dNPS, realized, losses);
    } catch (e) {
      console.error('Critical failure:', e);
      alert('Something broke. Check console.');
    }
  },

  // ============ CAPITAL GAINS SECTION ============

  renderCapitalGains(realized, losses, netLTCG, netSTCG) {
    const el = document.getElementById('capital-gains-section');
    if (!el) return;

    const ltcgTax = this.calculateLTCGTax(netLTCG);
    const stcgTax = this.calculateSTCGTax(netSTCG);
    const hasPnL  = realized.hasData;

    el.innerHTML = `
      <!-- Realized gains (from PnL) -->
      <div class="tax-card">
        <h3>Realized Gains ${hasPnL ? '<span class="fy-badge">FY filtered</span>' : ''}</h3>
        ${!hasPnL ? `<p style="color:var(--text-muted);font-size:0.83rem;margin-bottom:12px">Import Groww P&L to see realized gains</p>` : ''}
        <div class="tax-item">
          <label>LTCG (realized)</label>
          <span class="${realized.ltcg > 0 ? 'tag-positive' : ''}">${formatCurrencyFull(realized.ltcg)}</span>
        </div>
        <div class="tax-item">
          <label>STCG (realized)</label>
          <span class="${realized.stcg > 0 ? 'tag-positive' : ''}">${formatCurrencyFull(realized.stcg)}</span>
        </div>
        <div class="tax-item">
          <label>Losses (harvested)</label>
          <span class="${(losses.ltcl + losses.stcl) > 0 ? 'tag-negative' : ''}">
            -${formatCurrencyFull(losses.ltcl + losses.stcl)}
          </span>
        </div>
        <div class="tax-item highlight">
          <label>Net Taxable Gains</label>
          <span>${formatCurrencyFull(netLTCG + netSTCG)}</span>
        </div>
      </div>

      <!-- Capital gains tax -->
      <div class="tax-card">
        <h3>Capital Gains Tax (FY ${document.getElementById('current-fy')?.textContent || ''})</h3>
        <div class="tax-item">
          <label>LTCG tax (12.5% above ₹1.25L)</label>
          <span>${formatCurrencyFull(ltcgTax)}</span>
        </div>
        <div class="tax-item">
          <label>STCG tax (20% flat)</label>
          <span>${formatCurrencyFull(stcgTax)}</span>
        </div>
        <div class="tax-item">
          <label>₹1.25L exemption remaining</label>
          <span class="tag-positive">${formatCurrencyFull(Math.max(0, 125000 - netLTCG))}</span>
        </div>
        <div class="tax-item highlight">
          <label>Total Capital Gains Tax</label>
          <span style="color:var(--accent-red)">${formatCurrencyFull(ltcgTax + stcgTax)}</span>
        </div>
      </div>`;
  },

  // ============ REGIME COMPARISON ============

  renderRegimeComparison(income, d80d, dNPS, dHRA, c80, capitalGainsTax, currentRegime) {
    const el = document.getElementById('regime-comparison');
    if (!el) return;

    const oldDeductions = c80 + d80d + dNPS + dHRA;
    const newTax = this.calculateNewRegimeTax(income) + capitalGainsTax;
    const oldTax = this.calculateOldRegimeTax(income, oldDeductions) + capitalGainsTax;
    const saving  = oldTax - newTax;
    const betterRegime = saving > 0 ? 'new' : 'old';
    const savingAbs = Math.abs(saving);

    el.innerHTML = `
      <div class="regime-compare-grid">
        <div class="regime-card ${currentRegime === 'new' ? 'regime-active' : ''}">
          <div class="regime-label">New Regime ${currentRegime === 'new' ? '<span class="regime-current-tag">Current</span>' : ''}</div>
          <div class="regime-tax">${formatCurrencyFull(newTax)}</div>
          <div class="regime-detail">
            <div class="tax-item"><label>Std deduction</label><span>₹75,000</span></div>
            <div class="tax-item"><label>Income tax</label><span>${formatCurrencyFull(this.calculateNewRegimeTax(income))}</span></div>
            <div class="tax-item"><label>Capital gains tax</label><span>${formatCurrencyFull(capitalGainsTax)}</span></div>
            <div class="tax-item"><label>87A rebate</label><span>${income - 75000 <= 1200000 ? 'Applied ✓' : 'Not applicable'}</span></div>
          </div>
        </div>
        <div class="regime-vs">VS</div>
        <div class="regime-card ${currentRegime === 'old' ? 'regime-active' : ''}">
          <div class="regime-label">Old Regime ${currentRegime === 'old' ? '<span class="regime-current-tag">Current</span>' : ''}</div>
          <div class="regime-tax">${formatCurrencyFull(oldTax)}</div>
          <div class="regime-detail">
            <div class="tax-item"><label>80C + deductions</label><span>-${formatCurrencyFull(oldDeductions)}</span></div>
            <div class="tax-item"><label>Income tax</label><span>${formatCurrencyFull(this.calculateOldRegimeTax(income, oldDeductions))}</span></div>
            <div class="tax-item"><label>Capital gains tax</label><span>${formatCurrencyFull(capitalGainsTax)}</span></div>
            <div class="tax-item"><label>87A rebate</label><span>${income - oldDeductions - 50000 <= 500000 ? 'Applied ✓' : 'Not applicable'}</span></div>
          </div>
        </div>
      </div>
      <div class="regime-verdict ${betterRegime === currentRegime ? 'verdict-good' : 'verdict-switch'}">
        ${betterRegime === currentRegime
          ? `✓ You're on the right regime — saving ${formatCurrencyFull(savingAbs)} vs the alternative`
          : `⚡ Switch to <strong>${betterRegime === 'new' ? 'New' : 'Old'} Regime</strong> to save ${formatCurrencyFull(savingAbs)} this FY`
        }
      </div>`;
  },

  // ============ RECOMMENDATIONS ============

  renderRecommendations(income, regime, c80, d80d, dNPS, realized, losses) {
    const el = document.getElementById('tax-recommendations');
    if (!el) return;

    const recs = [];
    const { fyEnd } = this.getCurrentFYRange();
    const daysLeft = Math.ceil((fyEnd - new Date()) / (1000 * 60 * 60 * 24));

    // 80C room
    if (c80 < 150000 && regime === 'old') {
      recs.push({
        icon: '💡', type: 'opportunity',
        text: `₹${formatCurrency(150000 - c80)} of 80C room remaining — invest in ELSS or PPF before Mar 31`
      });
    }

    // NPS top-up
    if (dNPS < 50000 && income > 500000) {
      recs.push({
        icon: '💡', type: 'opportunity',
        text: `NPS 80CCD(1B): extra ₹50K deduction available (currently using ${formatCurrency(dNPS)})`
      });
    }

    // LTCG harvesting — exemption headroom
    const netLTCG = Math.max(0, realized.ltcg - losses.ltcl);
    const exemptionLeft = Math.max(0, 125000 - netLTCG);
    if (exemptionLeft > 0 && realized.ltcg > 0 && daysLeft > 0) {
      recs.push({
        icon: '📊', type: 'opportunity',
        text: `Tax-free LTCG harvest: sell up to ${formatCurrency(exemptionLeft)} of gains before Mar 31 — no tax due`
      });
    }

    // Loss harvesting
    if (losses.ltcl + losses.stcl === 0 && realized.ltcg > 125000) {
      recs.push({
        icon: '⚖️', type: 'neutral',
        text: `Consider tax-loss harvesting — sell loss-making positions to offset your LTCG`
      });
    }

    // LTCG warning
    if (netLTCG > 125000) {
      recs.push({
        icon: '⚠️', type: 'warning',
        text: `LTCG of ${formatCurrency(netLTCG)} exceeds ₹1.25L exemption — tax of ${formatCurrency(this.calculateLTCGTax(netLTCG))} applies`
      });
    }

    // Time pressure
    if (daysLeft <= 60 && daysLeft > 0) {
      recs.push({
        icon: '⏰', type: 'warning',
        text: `${daysLeft} days left in FY ${document.getElementById('current-fy')?.textContent || ''} — act on any tax-saving moves soon`
      });
    }

    // No recommendations
    if (recs.length === 0) {
      recs.push({ icon: '✓', type: 'good', text: 'Tax position looks well-optimized for this FY' });
    }

    el.innerHTML = recs.map(r => `
      <div class="rec-item rec-${r.type}">
        <span class="rec-icon">${r.icon}</span>
        <span>${r.text}</span>
      </div>`).join('');
  },

  // ============ INCOME TAX (kept for compatibility) ============
  calculateIncomeTax(income, regime) {
    if (regime === 'new') return this.calculateNewRegimeTax(income);
    return this.calculateOldRegimeTax(income, 0);
  }
};

function updateTax() { Tax.update(); }

// Note: parseIndianDate() is defined in data.js (loads first)
