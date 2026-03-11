// ═══════════════════════════════════════════════════════
// insights.js — Claude API calls and insight rendering
// ═══════════════════════════════════════════════════════
import { S, totalNW, bdown, momChange, fmtC, fmtCF, fmtP, getFY } from './data.js';
import { navTo, toast } from './ui.js';

export function genInsights() {
  navTo('insights');
  const type = document.querySelector('.ibtn.on')?.dataset?.t || 'monthly';
  const out  = document.getElementById('insights-out');
  out.innerHTML = `<div style="padding:28px;color:var(--text2)"><span class="spin"></span>Generating ${type} insights...</div>`;

  const key = localStorage.getItem('wl_claude') || '';
  if (!key)     { out.innerHTML = '<div style="padding:28px;color:var(--red)">Claude API key not set — go to Settings.</div>'; return; }
  if (!totalNW()) { out.innerHTML = '<div style="padding:28px;color:var(--text2)">Add assets first.</div>'; return; }

  const ctx    = buildCtx();
  const prompt = buildPrompt(type, ctx);

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: 'You are a concise personal finance advisor for an Indian investor. Give actionable insights in structured sections with clear headers. Be specific with numbers. Under 600 tokens.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
    .then(r => r.json())
    .then(d => {
      const text = d.content?.[0]?.text || d.error?.message || 'Error';
      out.innerHTML =
        `<div class="imeta">Generated ${new Date().toLocaleString('en-IN')} · ${d.usage?.input_tokens || 0} in / ${d.usage?.output_tokens || 0} out tokens</div>` +
        fmtInsight(text);
    })
    .catch(e => { out.innerHTML = `<div style="padding:28px;color:var(--red)">Error: ${e.message}</div>`; });
}

function buildCtx() {
  const bd    = bdown(), total = totalNW(), mom = momChange();
  const snaps = S.snaps.slice(-6);
  const locked = S.snaps.filter(s => s.locked).length;
  const cats  = bd.map(b => {
    const p = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
    const g = b.cost > 0 ? ((b.value - b.cost) / b.cost * 100).toFixed(1) : 0;
    return `${b.label}: ₹${(b.value / 1e5).toFixed(1)}L (${p}% NW, ${g}% gain)`;
  }).join('; ');
  return {
    total:        fmtCF(total),
    mom:          fmtC(mom.amt) + '(' + fmtP(mom.pct) + ')',
    cats,
    trend:        snaps.length >= 2 ? 'Trend: ' + snaps.map(s => fmtC(s.total)).join('→') : 'First snapshot',
    income:       S.cfg.income ? '₹' + (S.cfg.income / 1e5).toFixed(0) + 'L/yr' : 'unknown',
    regime:       S.cfg.regime || 'new',
    fy:           getFY(),
    lockedMonths: locked,
  };
}

function buildPrompt(type, c) {
  const base = `Portfolio: ${c.total}, MoM: ${c.mom}\nBreakdown: ${c.cats}\n${c.trend}\nIncome: ${c.income}, Regime: ${c.regime}, FY: ${c.fy}, Locked months: ${c.lockedMonths}\n\n`;
  const p = {
    monthly:      base + 'Provide: 1) MoM summary 2) 3 key observations 3) 2 action items this month. Be specific with ₹ amounts.',
    growth:       base + 'Analyze: 1) Growth drivers 2) Laggards and why 3) CAGR estimate 4) What is holding back growth',
    allocation:   base + 'Assess: 1) Allocation vs ideal for this income 2) Concentration risks 3) Missing classes 4) Rebalancing suggestions with ₹ amounts',
    tax:          base + 'Analyze: 1) LTCG exposure 2) 80C opportunities 3) Tax loss harvesting candidates 4) Best moves before March 31',
    opportunities:base + 'Identify: 1) 3 underweight sectors with structural opportunity 2) Specific fund categories to explore 3) Fresh capital deployment priority order',
    rebalance:    base + 'Suggest: 1) Target allocation % for each category 2) What to trim with reason 3) What to increase 4) New categories to add 5) Specific ₹ amounts',
  };
  return p[type] || p.monthly;
}

function fmtInsight(text) {
  const parts = text.split(/\n(?=\d[\).]\s|\#{1,3}\s)/);
  if (parts.length <= 1) return `<div class="icard2"><div>${md(text)}</div></div>`;
  return parts.map((s, i) => {
    if (!s.trim()) return '';
    const lines = s.trim().split('\n');
    const h     = lines[0].replace(/^[\d#*.)\s]+/, '').replace(/\*\*/g, '').trim();
    const body  = lines.slice(1).join('\n');
    const cls   = h.toLowerCase().match(/risk|concern|warn|miss/) ? ' warn'
                : h.toLowerCase().match(/opportun|action|suggest/) ? ' opp'
                : h.toLowerCase().match(/tax|ltcg/) ? ' info2' : '';
    return `<div class="icard2${cls} up" style="animation-delay:${i * .07}s"><h3>${h}</h3><div>${md(body)}</div></div>`;
  }).join('');
}

function md(t) {
  return t
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="margin-left:16px;margin-top:4px">$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

window.genInsights = genInsights;
