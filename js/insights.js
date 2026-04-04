// js/insights.js — Claude API integration for AI-powered insights
// v1.1: Richer context (XIRR, goals, PnL, allocation), free-form mode, better output

const Insights = {

  // ============ CONTEXT BUILDER ============
  // Now includes XIRR, goals, realized PnL, allocation deltas, tax position

  buildPortfolioContext() {
    const breakdown  = Data.getCategoryBreakdown();
    const total      = Data.getTotalNetWorth();
    const mom        = Data.getMoMChange();
    const snapshots  = Data.getSnapshots().slice(-6);
    const config     = STATE.config || {};

    // Core portfolio summary
    const catSummary = breakdown.map(b => {
      const pct  = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
      const gain = b.cost > 0 ? (((b.value - b.cost) / b.cost) * 100).toFixed(1) : 'N/A';
      return `${b.label}: ₹${(b.value / 100000).toFixed(1)}L (${pct}% NW, ${gain}% gain)`;
    }).join('; ');

    const trend = snapshots.length >= 2
      ? `NW last ${snapshots.length}m: ${snapshots.map(s => formatCurrency(s.total)).join(' → ')}`
      : 'First snapshot';

    // XIRR
    const xirr = Data.getPortfolioXIRR();
    const xirrStr = xirr !== null ? `${xirr.toFixed(1)}% p.a.` : 'insufficient data';

    // Goals
    const goals = Data.getGoals();
    const goalsSummary = goals.length > 0
      ? goals.map(g => {
          const p = Data.getGoalProgress(g);
          const eta = p.monthsToTarget
            ? `~${Math.ceil(p.monthsToTarget / 12)}y`
            : 'unknown ETA';
          return `${g.name}: ${p.progress.toFixed(0)}% of ${formatCurrency(p.target)} (${eta})`;
        }).join('; ')
      : 'none set';

    // Realized PnL (current FY)
    const pnl = Data.getPnlRecords();
    let realizedLTCG = 0, realizedSTCG = 0;
    const fyRange = { start: new Date(new Date().getFullYear() - (new Date().getMonth() < 3 ? 1 : 0), 3, 1) };
    pnl.forEach(r => {
      const d = new Date(r.sellDate);
      if (isNaN(d) || d < fyRange.start) return;
      if (r.gainType === 'LTCG' && r.gain > 0) realizedLTCG += r.gain;
      if (r.gainType === 'STCG' && r.gain > 0) realizedSTCG += r.gain;
    });
    const pnlStr = pnl.length > 0
      ? `Realized LTCG: ${formatCurrency(realizedLTCG)}, STCG: ${formatCurrency(realizedSTCG)} (current FY)`
      : 'no PnL data imported';

    // Allocation deltas
    const allocStatus = Data.getAllocationStatus();
    const allocDeltas = allocStatus
      .filter(a => Math.abs(a.delta) >= 3)
      .map(a => `${a.label} ${a.delta > 0 ? '+' : ''}${a.delta.toFixed(0)}% vs target`)
      .join('; ');

    // Savings rate
    const srHistory = Data.getSavingsRateHistory().slice(-3);
    const avgRate = srHistory.length > 0 && config.annualIncome
      ? (srHistory.reduce((s, h) => s + (h.savingsRate || 0), 0) / srHistory.length).toFixed(0) + '%'
      : 'unknown';

    // Milestone
    const { latest } = Data.getMilestoneStatus();
    const milestoneStr = latest ? `Latest milestone: ${latest.label}` : 'No milestones hit yet';

    return {
      total:        formatCurrencyFull(total),
      mom:          `${formatCurrency(mom.amount)} (${formatPct(mom.pct)})`,
      categories:   catSummary,
      trend,
      xirr:         xirrStr,
      goals:        goalsSummary,
      pnl:          pnlStr,
      allocDeltas:  allocDeltas || 'all within target range',
      savingsRate:  avgRate,
      milestone:    milestoneStr,
      income:       config.annualIncome ? `₹${(config.annualIncome / 100000).toFixed(0)}L/yr` : 'unknown',
      regime:       config.taxRegime || 'new',
      fy:           getCurrentFY(),
    };
  },

  getSystemPrompt() {
    return `You are a sharp, concise personal finance advisor for an Indian investor. You have access to their full portfolio data. Give specific, actionable insights — avoid generic advice. Use ₹ for amounts. Format with numbered sections and clear headers. Max 700 tokens.`;
  },

  // ============ PRESET PROMPTS (enriched) ============

  getInsightPrompt(type, ctx, freeformQuestion = null) {
    if (type === 'freeform' && freeformQuestion) {
      return `Portfolio data:
NW: ${ctx.total} | MoM: ${ctx.mom} | XIRR: ${ctx.xirr}
Breakdown: ${ctx.categories}
${ctx.trend}
Goals: ${ctx.goals}
Realized gains (FY): ${ctx.pnl}
Allocation vs targets: ${ctx.allocDeltas}
Savings rate (3m avg): ${ctx.savingsRate}
Income: ${ctx.income} | Regime: ${ctx.regime} | FY: ${ctx.fy}
${ctx.milestone}

Question: ${freeformQuestion}

Answer specifically and concisely using the portfolio data above.`;
    }

    const prompts = {
      monthly: `Portfolio snapshot:
NW: ${ctx.total} | MoM: ${ctx.mom} | XIRR: ${ctx.xirr}
${ctx.trend}
Breakdown: ${ctx.categories}
Savings rate (3m): ${ctx.savingsRate} | ${ctx.milestone}
Goals: ${ctx.goals}

Provide:
1) MoM Performance — what drove the change, which categories led/lagged
2) Key Observations — 3 specific data-driven observations
3) This Month's Actions — 2 concrete things to do now with ₹ amounts where possible`,

      growth: `Portfolio growth analysis:
NW: ${ctx.total} | XIRR: ${ctx.xirr} | MoM: ${ctx.mom}
${ctx.trend}
Breakdown: ${ctx.categories}
Savings rate: ${ctx.savingsRate} | Income: ${ctx.income}

Analyze:
1) Growth Drivers — what's working and why
2) Laggards — underperforming categories with reason
3) XIRR Context — is ${ctx.xirr} good for this asset mix?
4) Acceleration — specific moves to improve growth rate`,

      allocation: `Allocation analysis:
Breakdown: ${ctx.categories}
Allocation vs targets: ${ctx.allocDeltas}
Total: ${ctx.total} | Income: ${ctx.income} | XIRR: ${ctx.xirr}

Assess:
1) Current vs Ideal — is this mix right for the income level?
2) Concentration Risks — any dangerous overweights?
3) Gaps — missing asset classes worth adding
4) Rebalancing Actions — specific moves with ₹ amounts`,

      tax: `Tax position:
Breakdown: ${ctx.categories}
Realized gains (FY ${ctx.fy}): ${ctx.pnl}
Income: ${ctx.income} | Regime: ${ctx.regime}
XIRR: ${ctx.xirr}

Analyze:
1) Capital Gains Position — LTCG/STCG exposure and tax estimate
2) 80C Status — utilization and room remaining
3) Harvesting Opportunities — specific positions to sell/book
4) Regime Check — is ${ctx.regime} regime optimal given the numbers?`,

      opportunities: `Opportunity scan:
Portfolio: ${ctx.categories}
Total: ${ctx.total} | Income: ${ctx.income} | XIRR: ${ctx.xirr}
Allocation gaps: ${ctx.allocDeltas}
Goals: ${ctx.goals}

Identify:
1) Underweight Opportunities — 2-3 categories with strongest case for more allocation
2) Fresh Capital Priority — where to deploy new money first
3) Macro Tailwinds — structural trends this portfolio is missing
4) Quick Wins — 1-2 specific actions that could improve XIRR`,

      rebalance: `Rebalancing plan:
Current: ${ctx.categories}
Allocation vs targets: ${ctx.allocDeltas}
Total: ${ctx.total} | XIRR: ${ctx.xirr}
Goals: ${ctx.goals}

Suggest:
1) What to Trim — overweight categories with ₹ amounts
2) What to Grow — underweight categories with ₹ amounts
3) New Additions — any missing categories worth starting
4) Priority Order — sequence these moves for tax efficiency`
    };

    return prompts[type] || prompts.monthly;
  },

  // ============ GENERATE ============

  async generate(type = 'monthly', freeformQuestion = null) {
    const claudeKey = localStorage.getItem('wl_claude_key');
    if (!claudeKey) {
      return { error: 'Claude API key not configured. Add it in Settings.' };
    }
    if (Data.getTotalNetWorth() === 0) {
      return { error: 'No portfolio data yet. Add assets first to get insights.' };
    }

    const ctx    = this.buildPortfolioContext();
    const prompt = this.getInsightPrompt(type, ctx, freeformQuestion);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system:     this.getSystemPrompt(),
          messages:   [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return { error: err.error?.message || 'API error' };
      }

      const data = await response.json();
      return {
        text:        data.content[0]?.text || '',
        tokens:      data.usage,
        type,
        question:    freeformQuestion,
        generatedAt: new Date().toISOString()
      };
    } catch (e) {
      return { error: e.message };
    }
  },

  // ============ CONVERSATION HISTORY (for ask-anything mode) ============

  _history: [],

  async chat(userMessage) {
    const claudeKey = localStorage.getItem('wl_claude_key');
    if (!claudeKey) return { error: 'Claude API key not configured.' };

    const ctx = this.buildPortfolioContext();

    // Build system prompt with full portfolio context embedded
    const systemWithContext = `${this.getSystemPrompt()}

PORTFOLIO DATA (always use this for answers):
NW: ${ctx.total} | MoM: ${ctx.mom} | XIRR: ${ctx.xirr}
Breakdown: ${ctx.categories}
${ctx.trend}
Goals: ${ctx.goals}
Realized gains: ${ctx.pnl}
Allocation vs targets: ${ctx.allocDeltas}
Savings rate: ${ctx.savingsRate} | Income: ${ctx.income} | Regime: ${ctx.regime} | FY: ${ctx.fy}
${ctx.milestone}`;

    this._history.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system:     systemWithContext,
          messages:   this._history.slice(-10) // keep last 10 turns
        })
      });

      if (!response.ok) {
        const err = await response.json();
        this._history.pop();
        return { error: err.error?.message || 'API error' };
      }

      const data  = await response.json();
      const reply = data.content[0]?.text || '';
      this._history.push({ role: 'assistant', content: reply });
      return { text: reply, tokens: data.usage, generatedAt: new Date().toISOString() };
    } catch (e) {
      this._history.pop();
      return { error: e.message };
    }
  },

  clearHistory() {
    this._history = [];
  },

  // ============ FORMAT OUTPUT ============

  formatInsightHTML(result) {
    if (result.error) {
      return `<div class="insight-card warning">
        <h3>⚠ Unable to Generate Insight</h3>
        <p>${result.error}</p>
      </div>`;
    }

    const text = result.text;
    const meta = `<div class="insight-meta">
      Generated ${new Date(result.generatedAt).toLocaleString('en-IN')}
      · ${result.tokens?.input_tokens || 0} in / ${result.tokens?.output_tokens || 0} out tokens
    </div>`;

    // Split on numbered sections: "1)", "2)", or "## Header" or "**Header**"
    const sections = text.split(/\n(?=\d[\)\.]\s|#{1,3}\s|\*\*[A-Z])/);

    if (sections.length <= 1) {
      return meta + `<div class="insight-card">
        <div class="insight-text">${formatInsightText(text)}</div>
      </div>`;
    }

    const cards = sections.map((section, i) => {
      if (!section.trim()) return '';
      const lines   = section.trim().split('\n');
      const rawHead = lines[0].replace(/^[\d#*\.)]+\s*/, '').replace(/\*\*/g, '').trim();
      const body    = lines.slice(1).join('\n').trim();
      const cardCls = detectCardType(rawHead);

      return `<div class="insight-card ${cardCls}" style="animation-delay:${i * 0.07}s">
        <h3>${rawHead}</h3>
        <div class="insight-text">${formatInsightText(body)}</div>
      </div>`;
    }).join('');

    return meta + cards;
  },

  formatChatHTML(result, isUser = false) {
    if (isUser) {
      return `<div class="chat-bubble chat-user">${escapeHtml(result)}</div>`;
    }
    if (result.error) {
      return `<div class="chat-bubble chat-error">⚠ ${result.error}</div>`;
    }
    return `<div class="chat-bubble chat-ai">${formatInsightText(result.text)}</div>`;
  }
};

// ============ HELPERS ============

function formatInsightText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

function detectCardType(heading) {
  const h = heading.toLowerCase();
  if (h.includes('risk') || h.includes('concern') || h.includes('warning') || h.includes('laggard')) return 'warning';
  if (h.includes('opportunit') || h.includes('action') || h.includes('quick win') || h.includes('accelerat')) return 'opportunity';
  if (h.includes('tax') || h.includes('ltcg') || h.includes('harvest') || h.includes('regime')) return 'info';
  if (h.includes('growth') || h.includes('xirr') || h.includes('driver')) return 'positive';
  return '';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
