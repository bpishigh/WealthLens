// js/tax.js — Tax calculations and planner

const Tax = {

  update() {
    const config = STATE.config || {};
    const income = config.annualIncome || 0;
    const regime = config.taxRegime || 'new';

    // LTCG from equity
    const gains = Data.getEquityGains();
    const ltcgEquity = Math.max(0, gains.ltcg - 100000); // ₹1L exemption
    const ltcgTax = ltcgEquity * 0.10;

    document.getElementById('ltcg-equity').textContent = formatCurrencyFull(gains.ltcg);
    document.getElementById('ltcg-debt').textContent = '—';
    document.getElementById('ltcg-tax').textContent = formatCurrencyFull(ltcgTax);
    document.getElementById('stcg-equity').textContent = formatCurrencyFull(gains.stcg);
    document.getElementById('stcg-other').textContent = '—';

    // 80C
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
        <div class="tax-item"><label>Remaining 80C Room</label><span class="tag-positive">${formatCurrencyFull(150000 - c80Total)}</span></div>
      `;
    }

    // Tax summary
    this.renderSummary(income, regime, c80Total, ltcgTax, gains);
  },

  renderSummary(income, regime, c80, ltcgTax, gains) {
    const el = document.getElementById('tax-summary');
    if (!el) return;

    const d80d = parseFloat(document.getElementById('deduction-80d')?.value || 0);
    const dNPS = parseFloat(document.getElementById('deduction-nps')?.value || 0);
    const dHRA = parseFloat(document.getElementById('deduction-hra')?.value || 0);

    let taxableIncome = income;
    let deductions = 0;
    let recommendations = [];

    if (regime === 'old') {
      deductions = c80 + d80d + dNPS + dHRA + 50000; // standard deduction
      taxableIncome = Math.max(0, income - deductions);
    } else {
      taxableIncome = Math.max(0, income - 75000); // standard deduction new regime
    }

    const incomeTax = this.calculateIncomeTax(taxableIncome, regime);
    const totalTax = incomeTax + ltcgTax;

    // Generate recommendations
    if (c80 < 150000 && regime === 'old') {
      recommendations.push(`💡 Invest ₹${formatCurrency(150000 - c80)} more in 80C instruments (ELSS, PPF) before March`);
    }
    if (gains.ltcg > 100000) {
      recommendations.push(`⚠️ LTCG of ₹${formatCurrency(gains.ltcg)} — consider tax loss harvesting to offset`);
    }
    if (dNPS < 50000 && income > 500000) {
      recommendations.push(`💡 NPS 80CCD(1B) — extra ₹50K deduction available, currently using ₹${formatCurrency(dNPS)}`);
    }
    if (regime === 'new' && (c80 + d80d + dNPS + dHRA) > 200000) {
      recommendations.push(`💡 Your deductions (₹${formatCurrency(c80 + d80d + dNPS + dHRA)}) suggest Old Regime may save more tax`);
    }

    el.innerHTML = `
      <div class="tax-item"><label>Gross Income</label><span>${formatCurrencyFull(income)}</span></div>
      ${regime === 'old' ? `<div class="tax-item"><label>Total Deductions</label><span class="tag-positive">-${formatCurrencyFull(deductions)}</span></div>` : ''}
      <div class="tax-item"><label>Taxable Income</label><span>${formatCurrencyFull(taxableIncome)}</span></div>
      <div class="tax-item"><label>Income Tax (${regime === 'new' ? 'New' : 'Old'} Regime)</label><span>${formatCurrencyFull(incomeTax)}</span></div>
      <div class="tax-item"><label>LTCG Tax</label><span>${formatCurrencyFull(ltcgTax)}</span></div>
      <div class="tax-item highlight"><label>Estimated Total Tax</label><span>${formatCurrencyFull(totalTax)}</span></div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:10px">Recommendations</div>
        ${recommendations.length > 0
          ? recommendations.map(r => `<div style="padding:8px 0;font-size:0.86rem;color:var(--text-secondary);border-bottom:1px solid var(--border)">${r}</div>`).join('')
          : '<div style="color:var(--text-muted);font-size:0.86rem">Tax position looks optimal!</div>'
        }
      </div>`;
  },

  calculateIncomeTax(income, regime) {
    if (regime === 'new') {
      // New regime FY 2024-25 slabs
      if (income <= 300000) return 0;
      if (income <= 600000) return (income - 300000) * 0.05;
      if (income <= 900000) return 15000 + (income - 600000) * 0.10;
      if (income <= 1200000) return 45000 + (income - 900000) * 0.15;
      if (income <= 1500000) return 90000 + (income - 1200000) * 0.20;
      return 150000 + (income - 1500000) * 0.30;
    } else {
      // Old regime
      if (income <= 250000) return 0;
      if (income <= 500000) return (income - 250000) * 0.05;
      if (income <= 1000000) return 12500 + (income - 500000) * 0.20;
      return 112500 + (income - 1000000) * 0.30;
    }
  }
};

function updateTax() { Tax.update(); }
