// ═══════════════════════════════════════════════════════
// tax.js — Tax calculations and rendering
// ═══════════════════════════════════════════════════════
import { S, aVal, aCost, fmtC, fmtCF, getFY } from './data.js';

export function renderTax() {
  document.getElementById('fy-label').textContent = getFY();
  let ltcg = 0;
  S.assets
    .filter(a => a.category === 'equity' || a.category === 'mf')
    .forEach(a => { const g = aVal(a) - aCost(a); if (g > 0) ltcg += g; });

  const ltcgTax = Math.max(0, ltcg - 100000) * 0.10;
  document.getElementById('t-ltcg').textContent    = fmtCF(ltcg);
  document.getElementById('t-ltcgtax').textContent = fmtCF(ltcgTax);
  document.getElementById('t-stcg').textContent    = '₹0';

  const epf  = S.assets.filter(a => a.category === 'retirement').reduce((s, a) => s + (+a.ytdContrib || 0), 0);
  const elss = S.assets.filter(a => a.category === 'mf' && a.mfType === 'Equity').reduce((s, a) => s + (+a.invested || 0) * 0.1, 0);
  const c80  = Math.min(epf + elss, 150000);

  document.getElementById('c80-fill').style.width = (c80 / 150000 * 100).toFixed(1) + '%';
  document.getElementById('c80-used').textContent = fmtCF(c80) + ' used';
  document.getElementById('c80-detail').innerHTML =
    `<div class="titem"><label>EPF Contribution</label><span>${fmtCF(epf)}</span></div>` +
    `<div class="titem"><label>ELSS (est.)</label><span>${fmtCF(elss)}</span></div>` +
    `<div class="titem" style="color:var(--green)"><label>80C Room Left</label><span>${fmtCF(Math.max(0, 150000 - c80))}</span></div>`;

  updateTax();
}

export function updateTax() {
  const income  = S.cfg.income || 0;
  const regime  = S.cfg.regime || 'new';
  const d80d    = +(document.getElementById('d-80d')?.value || 0);
  const dNPS    = +(document.getElementById('d-nps')?.value || 0);
  const dHRA    = +(document.getElementById('d-hra')?.value || 0);

  let taxable = income, deduct = 0;
  if (regime === 'old') {
    deduct  = 150000 + d80d + dNPS + dHRA + 50000;
    taxable = Math.max(0, income - deduct);
  } else {
    taxable = Math.max(0, income - 75000);
  }

  const itax = calcTax(taxable, regime);
  let ltcg = 0;
  S.assets.filter(a => a.category === 'equity' || a.category === 'mf').forEach(a => {
    const g = aVal(a) - aCost(a);
    if (g > 0) ltcg += g;
  });
  const ltcgTax = Math.max(0, ltcg - 100000) * 0.10;
  const total   = itax + ltcgTax;

  const c80 = Math.min(
    S.assets.filter(a => a.category === 'retirement').reduce((s, a) => s + (+a.ytdContrib || 0), 0),
    150000
  );

  const recs = [];
  if (c80 < 150000 && regime === 'old')       recs.push('💡 Invest ₹' + fmtC(150000 - c80) + ' more in 80C before March (ELSS/PPF)');
  if (ltcg > 100000)                          recs.push('⚠️ LTCG ₹' + fmtC(ltcg) + ' — consider tax loss harvesting to offset');
  if (dNPS < 50000 && income > 500000)        recs.push('💡 NPS 80CCD(1B) — ₹' + fmtC(50000 - dNPS) + ' more deduction available');
  if (regime === 'new' && (c80 + d80d + dNPS + dHRA) > 200000)
    recs.push('💡 Your deductions suggest Old Regime may save more tax — compare both');

  document.getElementById('tax-summary').innerHTML =
    `<div class="titem"><label>Gross Income</label><span>${fmtCF(income)}</span></div>` +
    (regime === 'old' ? `<div class="titem"><label>Total Deductions</label><span style="color:var(--green)">-${fmtCF(deduct)}</span></div>` : '') +
    `<div class="titem"><label>Taxable Income</label><span>${fmtCF(taxable)}</span></div>` +
    `<div class="titem"><label>Income Tax (${regime === 'new' ? 'New' : 'Old'} Regime)</label><span>${fmtCF(itax)}</span></div>` +
    `<div class="titem"><label>LTCG Tax</label><span>${fmtCF(ltcgTax)}</span></div>` +
    `<div class="titem hl"><label>Estimated Total Tax</label><span>${fmtCF(total)}</span></div>` +
    `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">` +
    `<div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Recommendations</div>` +
    (recs.length
      ? recs.map(r => `<div style="padding:7px 0;font-size:.82rem;color:var(--text2);border-bottom:1px solid var(--border)">${r}</div>`).join('')
      : '<div style="color:var(--muted);font-size:.82rem">Tax position looks good!</div>') +
    '</div>';
}

export function calcTax(income, regime) {
  if (regime === 'new') {
    if (income <= 300000)  return 0;
    if (income <= 600000)  return (income - 300000) * .05;
    if (income <= 900000)  return 15000 + (income - 600000) * .10;
    if (income <= 1200000) return 45000 + (income - 900000) * .15;
    if (income <= 1500000) return 90000 + (income - 1200000) * .20;
    return 150000 + (income - 1500000) * .30;
  } else {
    if (income <= 250000)  return 0;
    if (income <= 500000)  return (income - 250000) * .05;
    if (income <= 1000000) return 12500 + (income - 500000) * .20;
    return 112500 + (income - 1000000) * .30;
  }
}

window.updateTax = updateTax;
