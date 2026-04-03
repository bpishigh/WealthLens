// js/insights.js — Claude API integration for AI-powered insights
// Token-optimized: compressed context, structured prompts, ~500-800 tokens per call

const Insights = {

  buildPortfolioContext() {
    const breakdown = Data.getCategoryBreakdown();
    const total = Data.getTotalNetWorth();
    const mom = Data.getMoMChange();
    const snapshots = Data.getSnapshots().slice(-6);
    const config = STATE.config || {};

    // Compressed context — minimize tokens
    const catSummary = breakdown.map(b => {
      const pct = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
      const gain = b.cost > 0 ? (((b.value - b.cost) / b.cost) * 100).toFixed(1) : 0;
      return `${b.label}: ₹${(b.value/100000).toFixed(1)}L (${pct}% of NW, ${gain}% gain)`;
    }).join('; ');

    const trend = snapshots.length >= 2
      ? `NW trend last ${snapshots.length}m: ${snapshots.map(s => formatCurrency(s.total)).join(' → ')}`
      : 'First snapshot';

    return {
      total: formatCurrencyFull(total),
      mom: `${formatCurrency(mom.amount)} (${formatPct(mom.pct)})`,
      categories: catSummary,
      trend,
      income: config.annualIncome ? `₹${(config.annualIncome/100000).toFixed(0)}L/yr` : 'unknown',
      regime: config.taxRegime || 'new',
      fy: getCurrentFY()
    };
  },

  getSystemPrompt() {
    return `You are a concise personal finance advisor for an Indian investor. Analyze portfolio data and give actionable insights. Format responses as structured sections with clear headers. Be specific with numbers. Keep total response under 600 tokens.`;
  },

  getInsightPrompt(type, ctx) {
    const prompts = {
      monthly: `Portfolio snapshot: Total NW ${ctx.total}, MoM change: ${ctx.mom}
Breakdown: ${ctx.categories}
${ctx.trend}
Income: ${ctx.income}, Tax regime: ${ctx.regime}, FY: ${ctx.fy}

Provide: 1) MoM summary 2) 3 key observations 3) 2 action items for this month. Be specific.`,

      growth: `Portfolio: ${ctx.total}, MoM: ${ctx.mom}
${ctx.trend}
Breakdown: ${ctx.categories}

Analyze: 1) Growth drivers 2) Laggards and why 3) CAGR estimate 4) What's holding back growth`,

      allocation: `Portfolio breakdown: ${ctx.categories}
Total: ${ctx.total}
Income: ${ctx.income}

Assess: 1) Allocation vs ideal for income level 2) Concentration risks 3) Missing asset classes 4) 2 specific rebalancing suggestions`,

      tax: `Breakdown: ${ctx.categories}
Income: ${ctx.income}, Regime: ${ctx.regime}, FY: ${ctx.fy}

Analyze: 1) LTCG exposure estimate 2) 80C utilization opportunities 3) Tax loss harvesting candidates 4) Best tax-saving moves before March`,

      opportunities: `Portfolio: ${ctx.categories}
Total: ${ctx.total}, Income: ${ctx.income}

Identify: 1) 3 underweight sectors vs macro opportunity 2) Specific fund/stock categories to explore 3) Any structural tailwinds being missed 4) Fresh capital deployment priority`,

      rebalance: `Current allocation: ${ctx.categories}
Total: ${ctx.total}

Suggest: 1) Target allocation percentages 2) Assets to trim (with reason) 3) Assets to increase 4) New categories to add 5) Specific action with ₹ amounts`
    };
    return prompts[type] || prompts.monthly;
  },

  async generate(type = 'monthly') {
    const claudeKey = localStorage.getItem('wl_claude_key');
    if (!claudeKey) {
      return { error: 'Claude API key not configured. Add it in Settings.' };
    }

    const ctx = this.buildPortfolioContext();
    const totalNW = Data.getTotalNetWorth();

    if (totalNW === 0) {
      return { error: 'No portfolio data yet. Add assets first to get insights.' };
    }

    const prompt = this.getInsightPrompt(type, ctx);

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
          model: 'claude-haiku-4-5-20251001', // Cheapest model — ~1/30th cost of Opus
          max_tokens: 700,
          system: this.getSystemPrompt(),
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return { error: err.error?.message || 'API error' };
      }

      const data = await response.json();
      const text = data.content[0]?.text || '';
      return {
        text,
        tokens: data.usage,
        type,
        generatedAt: new Date().toISOString()
      };
    } catch (e) {
      return { error: e.message };
    }
  },

  formatInsightHTML(result) {
    if (result.error) {
      return `<div class="insight-card warning">
        <h3>⚠ Unable to Generate Insight</h3>
        <p>${result.error}</p>
      </div>`;
    }

    // Parse markdown-ish text into cards
    const text = result.text;
    const sections = text.split(/\n(?=\d\)|#+\s|\*\*[A-Z])/);

    let html = `<div class="insight-meta">
      Generated ${new Date(result.generatedAt).toLocaleString('en-IN')} 
      · ${result.tokens?.input_tokens || 0} in / ${result.tokens?.output_tokens || 0} out tokens
    </div>`;

    if (sections.length <= 1) {
      // Single block — format as one card
      html += `<div class="insight-card">
        <div class="insight-text">${formatInsightText(text)}</div>
      </div>`;
    } else {
      sections.forEach((section, i) => {
        if (!section.trim()) return;
        const lines = section.trim().split('\n');
        const heading = lines[0].replace(/^[\d#*\.)]+\s*/, '').replace(/\*\*/g, '');
        const body = lines.slice(1).join('\n');
        const cardType = detectCardType(heading);

        html += `<div class="insight-card ${cardType}" style="animation-delay:${i * 0.08}s">
          <h3>${heading}</h3>
          <div class="insight-text">${formatInsightText(body)}</div>
        </div>`;
      });
    }

    return html;
  }
};

function formatInsightText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

function detectCardType(heading) {
  const h = heading.toLowerCase();
  if (h.includes('risk') || h.includes('concern') || h.includes('warning') || h.includes('miss')) return 'warning';
  if (h.includes('opportunit') || h.includes('potential') || h.includes('action') || h.includes('suggestion')) return 'opportunity';
  if (h.includes('tax') || h.includes('ltcg') || h.includes('harvest')) return 'info';
  return '';
}
