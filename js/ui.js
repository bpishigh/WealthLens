// js/ui.js — UI rendering, forms, navigation

const UI = {

  // ============ NAVIGATION ============
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.remove('hidden');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    if (page === 'dashboard') this.renderDashboard();
    if (page === 'assets')    this.renderAssets();
    if (page === 'returns')   this.renderReturns();
    if (page === 'goals')     this.renderGoals();
    if (page === 'tax')       Tax.update();
    if (page === 'settings')  this.renderSettings();
    if (page === 'import')    this.renderImportHistory();
  },

  // ============ DASHBOARD ============
  renderDashboard(snapshotOverride = null) {
    const isHistorical = !!snapshotOverride;
    const total     = isHistorical ? snapshotOverride.total : Data.getTotalNetWorth();
    const mom       = Data.getMoMChange();
    const breakdown = isHistorical
      ? this._breakdownFromSnapshot(snapshotOverride)
      : Data.getCategoryBreakdown();

    const elNW = document.getElementById('total-networth');
    if (elNW) elNW.textContent = formatCurrencyFull(total);

    const monthKey = isHistorical ? snapshotOverride.month : Data.getCurrentMonthKey();
    const elMonth = document.getElementById('current-month');
    if (elMonth) elMonth.textContent = formatMonth(monthKey);

    // Historical banner
    const bannerEl = document.getElementById('historical-banner');
    if (bannerEl) {
      if (isHistorical) {
        bannerEl.textContent = `Viewing snapshot: ${formatMonth(snapshotOverride.month)} — switch to "Current" to return`;
        bannerEl.classList.remove('hidden');
      } else {
        bannerEl.classList.add('hidden');
      }
    }

    const changeEl   = document.getElementById('nw-change');
    const arrowEl    = document.querySelector('.change-arrow');
    const amountEl   = document.getElementById('change-amount');
    const pctEl      = document.getElementById('change-pct');
    const isPos      = mom.amount >= 0;
    if (changeEl) changeEl.className = 'nw-change ' + (isPos ? 'positive' : 'negative');
    if (arrowEl)  arrowEl.textContent  = isPos ? '↑' : '↓';
    if (amountEl) amountEl.textContent = formatCurrency(Math.abs(mom.amount));
    if (pctEl)    pctEl.textContent    = `(${formatPct(mom.pct)})`;

    this.renderCategoryCards(breakdown, total);
    Charts.renderDonut('donut-chart', breakdown);

    const trendData = Data.getTrendData();
    Charts.buildChartToggles('chart-toggles');
    Charts.renderTrend('trend-chart', trendData, [...activeChartCategories]);

    this.renderSnapshotTable(breakdown, total);
    this.populateMonthSelector(isHistorical ? snapshotOverride.month : 'current');

    if (!isHistorical) {
      this.renderMilestones();
      this.renderAllocation();
      this.renderSavingsRate();
    }
  },

  _breakdownFromSnapshot(snapshot) {
    return Object.keys(CONFIG.CATEGORIES)
      .filter(cat => snapshot.categories?.[cat])
      .map(cat => ({
        category: cat,
        label:    CONFIG.CATEGORIES[cat].label,
        icon:     CONFIG.CATEGORIES[cat].icon,
        color:    CONFIG.CATEGORIES[cat].color,
        value:    snapshot.categories[cat].value || 0,
        cost:     snapshot.categories[cat].cost  || 0,
        count:    0
      }))
      .filter(b => b.value !== 0);
  },

  renderCategoryCards(breakdown, total) {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    grid.innerHTML = breakdown.map(b => {
      const mom  = Data.getCategoryMoM(b.category);
      const pct  = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
      const isPos = mom.amount >= 0;
      return `<div class="cat-card" data-cat="${b.category}" onclick="UI.navigate('assets')">
        <div class="cat-icon">${b.icon}</div>
        <div class="cat-name">${b.label}</div>
        <div class="cat-value">${formatCurrency(b.value)}</div>
        <div class="cat-change ${isPos ? 'tag-positive' : 'tag-negative'}">
          ${isPos ? '↑' : '↓'} ${formatCurrency(Math.abs(mom.amount))} ${formatPct(mom.pct)}
        </div>
        <div class="cat-pct">${pct}% of portfolio</div>
      </div>`;
    }).join('');
  },

  renderSnapshotTable(breakdown, total) {
    const tbody = document.getElementById('snapshot-body');
    if (!tbody) return;
    tbody.innerHTML = breakdown.map(b => {
      const gain    = b.value - b.cost;
      const gainPct = b.cost > 0 ? (gain / b.cost) * 100 : 0;
      const mom     = Data.getCategoryMoM(b.category);
      const nwPct   = total > 0 ? ((b.value / total) * 100).toFixed(1) : 0;
      return `<tr>
        <td>${b.icon} ${b.label}</td>
        <td class="mono">${formatCurrencyFull(b.value)}</td>
        <td class="mono">${b.cost > 0 ? formatCurrencyFull(b.cost) : '—'}</td>
        <td class="mono ${gain >= 0 ? 'tag-positive' : 'tag-negative'}">
          ${gain !== 0 ? formatCurrency(gain) + ' (' + formatPct(gainPct) + ')' : '—'}
        </td>
        <td class="mono">${nwPct}%</td>
        <td class="mono ${mom.amount >= 0 ? 'tag-positive' : 'tag-negative'}">
          ${mom.amount !== 0 ? formatPct(mom.pct) : '—'}
        </td>
      </tr>`;
    }).join('');

    const totalCost = breakdown.reduce((s, b) => s + b.cost, 0);
    const totalGain = total - totalCost;
    const mom = Data.getMoMChange();
    tbody.innerHTML += `<tr style="border-top:2px solid var(--border-bright);font-weight:600">
      <td style="color:var(--text-primary)">Total Net Worth</td>
      <td class="mono" style="color:var(--accent-gold)">${formatCurrencyFull(total)}</td>
      <td class="mono">${formatCurrencyFull(totalCost)}</td>
      <td class="mono ${totalGain >= 0 ? 'tag-positive' : 'tag-negative'}">${formatCurrency(totalGain)}</td>
      <td class="mono">100%</td>
      <td class="mono ${mom.amount >= 0 ? 'tag-positive' : 'tag-negative'}">${formatPct(mom.pct)}</td>
    </tr>`;
  },

  populateMonthSelector(selected = 'current') {
    const sel = document.getElementById('month-selector');
    if (!sel) return;
    const months  = Data.getSnapshotMonths();
    const current = Data.getCurrentMonthKey();
    sel.innerHTML =
      `<option value="current" ${selected === 'current' ? 'selected' : ''}>Current (${formatMonth(current)})</option>` +
      [...months].reverse().map(m =>
        `<option value="${m}" ${selected === m ? 'selected' : ''}>${formatMonth(m)}</option>`
      ).join('');
  },

  // ============ RETURNS PAGE ============
  renderReturns() {
    const snaps = Data.getSnapshots();
    const catReturns = Data.getCategoryReturns();
    const xirr = Data.getPortfolioXIRR();
    const total = Data.getTotalNetWorth();
    const totalCost = catReturns.reduce((s, r) => s + r.cost, 0);
    const totalGain = total - totalCost;
    const totalReturnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Header stats
    const el = id => document.getElementById(id);
    if (el('returns-xirr')) {
      el('returns-xirr').textContent = xirr !== null
        ? formatPct(xirr) + ' p.a.'
        : snaps.length < 2 ? 'Need 2+ snapshots' : 'N/A';
      el('returns-xirr').className = xirr !== null
        ? (xirr >= 0 ? 'returns-stat-value tag-positive' : 'returns-stat-value tag-negative')
        : 'returns-stat-value';
    }
    if (el('returns-total-gain'))  el('returns-total-gain').textContent  = formatCurrency(totalGain);
    if (el('returns-total-pct'))   el('returns-total-pct').textContent   = formatPct(totalReturnPct);
    if (el('returns-snap-count'))  el('returns-snap-count').textContent  = snaps.length + ' months tracked';

    // Returns bar chart
    Charts.renderReturnsBar('returns-bar-chart', catReturns);

    // Category returns table
    const tbody = document.getElementById('returns-table-body');
    if (tbody) {
      tbody.innerHTML = catReturns
        .filter(r => r.cost > 0 && r.category !== 'liability')
        .sort((a, b) => (b.gainPct || 0) - (a.gainPct || 0))
        .map(r => `<tr>
          <td>${r.icon} ${r.label}</td>
          <td class="mono">${formatCurrencyFull(r.value)}</td>
          <td class="mono">${formatCurrencyFull(r.cost)}</td>
          <td class="mono ${r.gain >= 0 ? 'tag-positive' : 'tag-negative'}">${formatCurrency(r.gain)}</td>
          <td class="mono ${(r.gainPct || 0) >= 0 ? 'tag-positive' : 'tag-negative'}">${r.gainPct !== null ? formatPct(r.gainPct) : '—'}</td>
          <td class="mono ${(r.cagr || 0) >= 0 ? 'tag-positive' : 'tag-negative'}">${r.cagr !== null ? formatPct(r.cagr) + ' p.a.' : '—'}</td>
        </tr>`).join('') ||
        '<tr><td colspan="6" style="color:var(--text-muted);padding:16px">Add assets with cost basis to see returns</td></tr>';
    }
  },

  // ============ GOALS PAGE ============
  renderGoals() {
    const goals = Data.getGoals();
    const container = document.getElementById('goals-list');
    if (!container) return;

    if (goals.length === 0) {
      container.innerHTML = `<div class="goals-empty">
        <div style="font-size:2rem;margin-bottom:12px">🎯</div>
        <p style="color:var(--text-muted)">No goals yet. Set your first wealth target.</p>
      </div>`;
      return;
    }

    container.innerHTML = goals.map(goal => {
      const p = Data.getGoalProgress(goal);
      const ringId = 'goal-ring-' + goal.id;
      const pctDisplay = p.progress.toFixed(1);
      const color = p.progress >= 100 ? 'var(--accent-green)' : p.progress >= 60 ? 'var(--accent-gold)' : 'var(--accent-blue)';

      let projectionText = '';
      if (p.monthsToTarget !== null) {
        if (p.monthsToTarget <= 0) {
          projectionText = '🎉 Goal reached!';
        } else if (p.monthsToTarget <= 120) {
          const yr  = Math.floor(p.monthsToTarget / 12);
          const mo  = p.monthsToTarget % 12;
          projectionText = `~${yr > 0 ? yr + 'y ' : ''}${mo > 0 ? mo + 'm' : ''} at current pace`;
        } else {
          projectionText = '>10 years at current pace';
        }
      } else {
        projectionText = 'Need more data to project';
      }

      return `<div class="goal-card">
        <div class="goal-ring-wrap">
          <canvas id="${ringId}" width="80" height="80"></canvas>
          <div class="goal-ring-pct" style="color:${color}">${pctDisplay}%</div>
        </div>
        <div class="goal-body">
          <div class="goal-name">${goal.name}</div>
          <div class="goal-amounts">
            <span style="color:var(--accent-gold)">${formatCurrency(p.currentNW)}</span>
            <span style="color:var(--text-muted)"> / ${formatCurrency(p.target)}</span>
          </div>
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width:${pctDisplay}%;background:${color}"></div>
          </div>
          <div class="goal-meta">
            <span style="color:var(--text-muted)">${projectionText}</span>
            <span style="color:var(--text-muted)">Remaining: ${formatCurrency(p.remaining)}</span>
          </div>
        </div>
        <div class="goal-actions">
          <button class="btn-icon-sm" onclick="editGoal('${goal.id}')">✎</button>
          <button class="btn-icon-sm" onclick="deleteGoal('${goal.id}')">✕</button>
        </div>
      </div>`;
    }).join('');

    // Render rings after DOM updates
    requestAnimationFrame(() => {
      goals.forEach(goal => {
        const p = Data.getGoalProgress(goal);
        Charts.renderGoalRing('goal-ring-' + goal.id, p.progress);
      });
    });
  },

  showGoalForm(existingGoal = null) {
    const modal = document.getElementById('goal-modal');
    const title = existingGoal ? 'Edit Goal' : 'New Goal';
    document.getElementById('goal-modal-title').textContent = title;

    const f = existingGoal || {};
    document.getElementById('goal-form-container').innerHTML = `
      <input type="hidden" id="goal-form-id" value="${f.id || ''}">
      <div class="input-group">
        <label>Goal Name</label>
        <input type="text" id="goal-name" placeholder="e.g. Financial Independence, Buy a Home" value="${f.name || ''}">
      </div>
      <div class="input-group">
        <label>Target Net Worth ₹</label>
        <input type="number" id="goal-target" placeholder="10000000" value="${f.targetAmount || ''}">
        <span class="input-hint">Current: ${formatCurrencyFull(Data.getTotalNetWorth())}</span>
      </div>
      <div class="input-group">
        <label>Target Date (optional)</label>
        <input type="date" id="goal-date" value="${f.targetDate || ''}">
      </div>
      <div class="input-group">
        <label>Notes</label>
        <input type="text" id="goal-notes" placeholder="Optional" value="${f.notes || ''}">
      </div>
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn-secondary" style="flex:1" onclick="closeModal('goal-modal')">Cancel</button>
        <button class="btn-primary" style="flex:1;margin:0" onclick="saveGoalForm()">
          ${existingGoal ? 'Update' : 'Add Goal'}
        </button>
      </div>`;
    modal.classList.remove('hidden');
  },

  // ============ MILESTONES ============
  renderMilestones() {
    const el = document.getElementById('milestone-strip');
    if (!el) return;
    const { hit, next, nextProgress } = Data.getMilestoneStatus();
    const newHit = Data.getNewlyHitMilestone();
    if (newHit) this._celebrateMilestone(newHit);

    const hitHtml = hit.map(m =>
      `<div class="milestone-badge milestone-hit" title="${m.label} reached">
        <span class="ms-icon">${m.icon}</span>
        <span class="ms-label">${m.label}</span>
      </div>`
    ).join('');

    const nextHtml = next
      ? `<div class="milestone-next">
          <div class="ms-next-label">Next: ${next.icon} ${next.label}</div>
          <div class="ms-progress-bar">
            <div class="ms-progress-fill" style="width:${Math.min(nextProgress, 100).toFixed(1)}%"></div>
          </div>
          <div class="ms-progress-pct">${nextProgress.toFixed(0)}%</div>
        </div>`
      : `<div class="milestone-badge" style="background:var(--accent-gold-dim);border-color:var(--accent-gold)">
          <span class="ms-icon">👑</span><span class="ms-label">All milestones hit!</span>
        </div>`;

    el.innerHTML = `
      <div class="milestone-hit-row">${hitHtml || '<span style="color:var(--text-muted);font-size:0.82rem">No milestones reached yet</span>'}</div>
      ${nextHtml}`;
  },

  _celebrateMilestone(milestone) {
    const key = 'wl_celebrated_' + milestone.value;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const toast = document.createElement('div');
    toast.className = 'milestone-toast';
    toast.innerHTML = `
      <div class="ms-toast-icon">${milestone.icon}</div>
      <div>
        <div class="ms-toast-title">Milestone reached!</div>
        <div class="ms-toast-sub">Net worth crossed ${milestone.label} 🎉</div>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('ms-toast-visible'), 50);
    setTimeout(() => {
      toast.classList.remove('ms-toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  },

  // ============ ALLOCATION ============
  renderAllocation() {
    const el = document.getElementById('allocation-section');
    if (!el) return;
    const status     = Data.getAllocationStatus();
    const hasTargets = status.some(a => a.target > 0);

    if (!hasTargets) {
      el.innerHTML = `<div class="alloc-empty">
        Set allocation targets in
        <a href="#" onclick="UI.navigate('settings');return false" style="color:var(--accent-gold)">Settings → Allocation Targets</a>
        to see your over/under analysis.
      </div>`;
      return;
    }

    const rows = status
      .filter(a => a.target > 0 || a.actual > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    el.innerHTML = rows.map(a => {
      const isOk    = Math.abs(a.delta) < 2;
      const isOver  = a.delta > 2;
      const cls     = isOk ? 'alloc-ok' : isOver ? 'alloc-over' : 'alloc-under';
      const label   = isOk ? 'On target' : isOver ? `+${a.delta.toFixed(1)}% over` : `${a.delta.toFixed(1)}% under`;
      const maxBar  = 60;
      const actPct  = Math.min(a.actual, maxBar) / maxBar * 100;
      const tgtPct  = Math.min(a.target, maxBar) / maxBar * 100;

      return `<div class="alloc-row">
        <div class="alloc-label"><span>${a.icon}</span><span>${a.label}</span></div>
        <div class="alloc-bar-wrap">
          <div class="alloc-bar-track">
            <div class="alloc-bar-fill" style="width:${actPct.toFixed(1)}%;background:${a.color}99;border-color:${a.color}"></div>
            <div class="alloc-target-line" style="left:${tgtPct.toFixed(1)}%" title="Target: ${a.target}%"></div>
          </div>
        </div>
        <div class="alloc-pcts">
          <span style="color:${a.color};font-family:var(--font-mono)">${a.actual}%</span>
          <span style="color:var(--text-muted)"> / ${a.target}%</span>
        </div>
        <div class="alloc-delta ${cls}">${label}</div>
      </div>`;
    }).join('');
  },

  // ============ SAVINGS RATE ============
  renderSavingsRate() {
    const el = document.getElementById('savings-rate-section');
    if (!el) return;
    const history = Data.getSavingsRateHistory();
    const income  = STATE.config?.annualIncome || 0;

    if (history.length === 0) {
      el.innerHTML = `<span style="color:var(--text-muted);font-size:0.82rem">Need 2+ snapshots to track savings rate</span>`;
      return;
    }

    const recent3  = history.slice(-3);
    const avgDelta = recent3.reduce((s, h) => s + h.delta, 0) / recent3.length;
    const avgRate  = income > 0
      ? recent3.reduce((s, h) => s + (h.savingsRate || 0), 0) / recent3.length
      : null;

    const rateDisplay = avgRate !== null
      ? `<span class="${avgRate >= 20 ? 'tag-positive' : avgRate >= 0 ? '' : 'tag-negative'}" style="font-family:var(--font-mono);font-size:1.3rem">${avgRate.toFixed(0)}%</span>`
      : `<span style="color:var(--text-muted);font-size:0.85rem">Set income in Settings to see rate</span>`;

    el.innerHTML = `
      <div class="savings-stats">
        <div class="savings-stat">
          <div class="savings-stat-label">Avg monthly growth (3m)</div>
          <div class="savings-stat-value ${avgDelta >= 0 ? 'tag-positive' : 'tag-negative'}">${formatCurrency(avgDelta)}</div>
        </div>
        <div class="savings-stat">
          <div class="savings-stat-label">Implied savings rate</div>
          <div class="savings-stat-value">${rateDisplay}</div>
        </div>
        <div class="savings-stat">
          <div class="savings-stat-label">Months tracked</div>
          <div class="savings-stat-value" style="font-family:var(--font-mono);font-size:1.3rem">${history.length}</div>
        </div>
      </div>
      <div class="savings-bar-row">
        ${history.map(h => {
          const isPos  = h.delta >= 0;
          const income2 = income / 12;
          const height = income2 > 0
            ? Math.max(4, Math.min(80, Math.abs(h.delta / income2) * 80))
            : Math.max(4, Math.min(80, Math.abs(h.delta) / 50000));
          return `<div class="savings-bar-col" title="${h.label}: ${formatCurrency(h.delta)}${h.savingsRate !== null ? ' (' + h.savingsRate.toFixed(0) + '% rate)' : ''}">
            <div class="savings-bar ${isPos ? 'savings-bar-pos' : 'savings-bar-neg'}" style="height:${height.toFixed(0)}px"></div>
            <div class="savings-bar-label">${h.label.split(' ')[0]}</div>
          </div>`;
        }).join('')}
      </div>`;
  },

  // ============ ALLOCATION TARGET SETTINGS ============
  renderAllocationSettings() {
    const el = document.getElementById('allocation-targets-form');
    if (!el) return;
    const targets = Data.getAllocationTargets();
    const cats    = Object.keys(CONFIG.CATEGORIES).filter(c => c !== 'liability');
    el.innerHTML  = cats.map(cat => {
      const c = CONFIG.CATEGORIES[cat];
      return `<div class="alloc-setting-row">
        <label>${c.icon} ${c.label}</label>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" id="alloc-target-${cat}"
            value="${targets[cat] || 0}" min="0" max="100" step="1"
            oninput="updateAllocTotal()"
            style="width:64px;background:var(--bg-raised);border:1px solid var(--border);
                   border-radius:var(--radius-sm);padding:6px 8px;color:var(--text-primary);text-align:right">
          <span style="color:var(--text-muted);font-size:0.85rem">%</span>
        </div>
      </div>`;
    }).join('') + `
      <div id="alloc-total-indicator" style="margin-top:10px;font-size:0.82rem"></div>
      <button class="btn-secondary" style="margin-top:12px;width:100%" onclick="saveAllocationTargets()">Save Targets</button>`;
    updateAllocTotal();
  },

  // ============ SETTINGS (updated) ============
  renderSettings() {
    const el = id => document.getElementById(id);
    if (el('settings-api-key'))       el('settings-api-key').value       = localStorage.getItem('wl_gs_key')     || '';
    if (el('settings-sheet-id'))      el('settings-sheet-id').value      = localStorage.getItem('wl_gs_id')      || '';
    if (el('settings-claude-key'))    el('settings-claude-key').value    = localStorage.getItem('wl_claude_key') || '';
    if (el('settings-script-url'))    el('settings-script-url').value    = localStorage.getItem('wl_script_url') || '';
    if (el('usd-inr-rate'))           el('usd-inr-rate').value           = STATE.usdInr;
    if (el('gold-rate'))              el('gold-rate').value              = STATE.goldRate;
    if (el('settings-annual-income')) el('settings-annual-income').value = STATE.config?.annualIncome || '';
    if (el('settings-tax-regime')) {
      el('settings-tax-regime').value = STATE.config?.taxRegime || 'new';
    }
    this.renderSalarySettings();
    this.renderAllocationSettings();
  },

  // ============ SALARY SETTINGS ============
  renderSalarySettings() {
    const histEl   = document.getElementById('salary-history');
    const previewEl = document.getElementById('salary-hike-preview');
    if (!histEl) return;

    const history  = Data.getSalaryHistory();
    const current  = STATE.config?.annualIncome || 0;

    // Wire up live hike preview when input changes
    const incomeInput = document.getElementById('settings-annual-income');
    if (incomeInput && !incomeInput._salaryWired) {
      incomeInput._salaryWired = true;
      incomeInput.addEventListener('input', () => {
        const newVal = parseFloat(incomeInput.value) || 0;
        if (!previewEl) return;
        if (newVal > 0 && current > 0 && newVal !== current) {
          const pct  = ((newVal - current) / current * 100);
          const isUp = pct >= 0;
          previewEl.innerHTML = `
            <span class="${isUp ? 'tag-positive' : 'tag-negative'}">
              ${isUp ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% ${isUp ? 'hike' : 'reduction'}
            </span>
            <span style="color:var(--text-muted)">
              ${formatCurrencyFull(current)} → ${formatCurrencyFull(newVal)}
              &nbsp;(${formatCurrencyFull(newVal / 12)}/mo)
            </span>`;
          previewEl.classList.remove('hidden');
        } else {
          previewEl.classList.add('hidden');
        }
      });
    }

    // Salary history table
    if (history.length === 0) {
      histEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.82rem;margin-top:12px">No salary history yet. Current income: ${current > 0 ? formatCurrencyFull(current) + '/yr' : 'not set'}</p>`;
      return;
    }

    const rows = [...history].reverse(); // newest first
    histEl.innerHTML = `
      <div style="margin-top:16px">
        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px">Salary History</div>
        <table style="width:100%;font-size:0.82rem;border-collapse:collapse">
          <thead>
            <tr style="color:var(--text-muted);border-bottom:1px solid var(--border)">
              <th style="text-align:left;padding:6px 8px">Annual Income</th>
              <th style="text-align:left;padding:6px 8px">Monthly</th>
              <th style="text-align:left;padding:6px 8px">Regime</th>
              <th style="text-align:left;padding:6px 8px">From</th>
              <th style="text-align:left;padding:6px 8px">Change</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((entry, i) => {
              const isCurrent = entry.effectiveUntil === null;
              const hikePct   = entry.hikePercent;
              const hikeTag   = hikePct !== null
                ? `<span class="${hikePct >= 0 ? 'tag-positive' : 'tag-negative'}" style="font-size:0.75rem">
                    ${hikePct >= 0 ? '↑' : '↓'} ${Math.abs(hikePct).toFixed(1)}%
                   </span>`
                : '—';
              return `<tr style="border-bottom:1px solid var(--border);${isCurrent ? 'color:var(--text-primary);font-weight:500' : 'color:var(--text-secondary)'}">
                <td style="padding:8px">${formatCurrencyFull(entry.amount)}${isCurrent ? ' <span style="font-size:0.7rem;background:var(--accent-green-dim);color:var(--accent-green);padding:1px 6px;border-radius:8px">current</span>' : ''}</td>
                <td style="padding:8px;font-family:var(--font-mono)">${formatCurrency(entry.amount / 12)}</td>
                <td style="padding:8px">${entry.regime === 'new' ? 'New' : 'Old'}</td>
                <td style="padding:8px">${entry.date || '—'}</td>
                <td style="padding:8px">${hikeTag}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ============ ASSETS ============
  renderAssets() {
    Object.keys(CONFIG.CATEGORIES).forEach(cat => {
      const assets  = Data.getAssets(cat);
      const total   = Data.getCategoryTotal(cat);
      const totalEl = document.getElementById(`${cat}-total`);
      if (totalEl) totalEl.textContent = formatCurrencyFull(total);
      const listEl = document.getElementById(`list-${cat}`);
      if (listEl) listEl.innerHTML = this.renderAssetList(assets, cat);
    });
  },

  renderAssetList(assets, cat) {
    if (assets.length === 0) {
      return `<div style="padding:16px 20px;color:var(--text-muted);font-size:0.83rem">
        No ${CONFIG.CATEGORIES[cat].label} added yet
      </div>`;
    }
    return assets.map(a => {
      const value   = Data.getAssetValue(a);
      const cost    = Data.getAssetCost(a);
      const gain    = value - cost;
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
      const subtitle = getAssetSubtitle(a);
      const sourceTag = a.source && a.source !== 'manual'
        ? `<span style="font-size:0.7rem;background:var(--bg-hover);color:var(--text-muted);padding:1px 6px;border-radius:4px;margin-left:6px">${CONFIG.IMPORT_SOURCES[a.source] || a.source}</span>`
        : '';
      return `<div class="asset-item">
        <div>
          <div class="asset-item-name">${a.name}${sourceTag}</div>
          <div class="asset-item-sub">${subtitle}</div>
        </div>
        <div class="asset-item-value mono">${formatCurrencyFull(value)}</div>
        <div class="mono ${gain >= 0 ? 'tag-positive' : 'tag-negative'}">
          ${cost > 0 ? formatCurrency(gain) + ' (' + formatPct(gainPct) + ')' : '—'}
        </div>
        <div class="mono" style="color:var(--text-muted)">${cost > 0 ? formatCurrencyFull(cost) : '—'}</div>
        <div class="asset-item-actions">
          <button class="btn-icon-sm" onclick="editAsset('${a.id}')">✎</button>
          <button class="btn-icon-sm" onclick="deleteAsset('${a.id}')">✕</button>
        </div>
      </div>`;
    }).join('');
  },

  // ============ ASSET FORMS ============
  showAddAssetModal() {
    const cats = Object.keys(CONFIG.CATEGORIES);
    document.getElementById('asset-modal-title').textContent = 'Add Asset';
    document.getElementById('asset-form-container').innerHTML = `
      <input type="hidden" id="form-asset-id" value="">
      <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.88rem">Select asset type:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${cats.map(cat => {
          const c = CONFIG.CATEGORIES[cat];
          return `<button class="btn-secondary" style="justify-content:flex-start;gap:10px;padding:12px 14px"
            onclick="UI.showAssetForm('${cat}')">
            <span>${c.icon}</span> <span>${c.label}</span>
          </button>`;
        }).join('')}
      </div>`;
    document.getElementById('asset-modal').classList.remove('hidden');
  },

  showAssetForm(category, existingAsset = null) {
    const fields = CONFIG.ASSET_FORMS[category];
    if (!fields) return;
    const title = existingAsset
      ? `Edit ${CONFIG.CATEGORIES[category].label}`
      : `Add ${CONFIG.CATEGORIES[category].label}`;
    document.getElementById('asset-modal-title').textContent = title;

    const formHtml = `
      <input type="hidden" id="form-category" value="${category}">
      <input type="hidden" id="form-asset-id" value="${existingAsset?.id || ''}">
      ${fields.map(f => {
        const val = existingAsset?.[f.id] || '';
        if (f.type === 'select') {
          return `<div class="input-group"><label>${f.label}</label>
            <select id="form-${f.id}">
              ${f.options.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}
            </select></div>`;
        }
        return `<div class="input-group"><label>${f.label}</label>
          <input type="${f.type}" id="form-${f.id}" placeholder="${f.placeholder || ''}" value="${val}">
          </div>`;
      }).join('')}
      <div style="display:flex;gap:12px;margin-top:8px">
        ${!existingAsset ? `<button class="btn-secondary" style="flex:0 0 auto;padding:10px 16px" onclick="UI.showAddAssetModal()">← Back</button>` : ''}
        <button class="btn-secondary" style="flex:1" onclick="closeModal('asset-modal')">Cancel</button>
        <button class="btn-primary" style="flex:1;margin:0" onclick="saveAssetForm()">
          ${existingAsset ? 'Update' : 'Add Asset'}
        </button>
      </div>`;
    document.getElementById('asset-form-container').innerHTML = formHtml;
    document.getElementById('asset-modal').classList.remove('hidden');
  },

  // ============ BULK ENTRY ============
  showBulkEntry() {
    const now = new Date();
    document.getElementById('bulk-month-label').textContent =
      now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const sections = Object.keys(CONFIG.CATEGORIES)
      .map(key => ({ key, items: Data.getAssets(key) }))
      .filter(s => s.items.length > 0 && s.key !== 'liability');
    const formHtml = sections.map(s => {
      const cat = CONFIG.CATEGORIES[s.key];
      return `<div class="bulk-section">
        <div class="bulk-section-title">${cat.icon} ${cat.label}</div>
        ${s.items.map(a => `
          <div class="bulk-item">
            <label>${a.name}</label>
            <input type="number" id="bulk-${a.id}" value="${Data.getAssetValue(a).toFixed(0)}" placeholder="Current value ₹">
          </div>`).join('')}
      </div>`;
    }).join('');
    document.getElementById('bulk-form').innerHTML = formHtml ||
      '<p style="padding:16px;color:var(--text-muted)">Add assets first before using bulk entry.</p>';
    document.getElementById('bulk-modal').classList.remove('hidden');
  },

  // ============ IMPORT HISTORY ============
  renderImportHistory() {
    const imports   = Data.getImports();
    const container = document.getElementById('import-history');
    if (!container) return;
    if (imports.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:12px 0">No imports yet.</p>';
      return;
    }
    container.innerHTML = `
      <table style="width:100%;font-size:0.82rem;border-collapse:collapse">
        <thead><tr style="color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border)">
          <th style="padding:6px 8px">File</th>
          <th style="padding:6px 8px">Source</th>
          <th style="padding:6px 8px">Records</th>
          <th style="padding:6px 8px">Imported</th>
        </tr></thead>
        <tbody>
          ${[...imports].reverse().map(imp => `
            <tr style="border-bottom:1px solid var(--border);color:var(--text-secondary)">
              <td style="padding:6px 8px;color:var(--text-primary)">${imp.fileName}</td>
              <td style="padding:6px 8px">${CONFIG.IMPORT_SOURCES[imp.source] || imp.source}</td>
              <td style="padding:6px 8px">${imp.assetCount}</td>
              <td style="padding:6px 8px">${new Date(imp.importedAt).toLocaleDateString('en-IN')}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  },

};

// ============ GLOBAL HELPERS ============

function getAssetSubtitle(a) {
  switch (a.category) {
    case 'equity':     return `${a.qty} shares @ ₹${parseFloat(a.avgPrice || 0).toFixed(0)} avg · ${a.exchange || 'NSE'}`;
    case 'mf':         return `${parseFloat(a.units || 0).toFixed(3)} units · NAV ₹${parseFloat(a.nav || 0).toFixed(2)} · ${a.mfType || ''}`;
    case 'us':         return `${a.qty} shares · $${parseFloat(a.priceUSD || 0).toFixed(2)} · ${a.platform || ''} ${a.isESOP !== 'No' ? '· ESOP' : ''}`;
    case 'bank':       return a.account || 'Savings';
    case 'gold':       return `${a.qty}g · ₹${parseFloat(a.rate || STATE.goldRate).toFixed(0)}/g`;
    case 'fd':         return `${a.fdType || 'FD'} · ${a.rate || 0}% · Matures ${a.maturityDate || '—'}`;
    case 'realestate': return `${a.propertyType || ''} · Loan: ${a.loanBalance ? formatCurrency(parseFloat(a.loanBalance)) : 'Nil'}`;
    case 'retirement': return a.notes || '';
    case 'liability':  return `${a.loanType || ''} · EMI ₹${parseFloat(a.emi || 0).toLocaleString()}`;
    default:           return a.notes || '';
  }
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function showAddAssetModal() { UI.showAddAssetModal(); }

function showAssetForm(category, existingAsset = null) {
  UI.showAssetForm(category, existingAsset);
}

function saveAssetForm() {
  const cat    = document.getElementById('form-category')?.value;
  const id     = document.getElementById('form-asset-id')?.value;
  const fields = CONFIG.ASSET_FORMS[cat];
  if (!fields) return;
  const asset = { category: cat, source: 'manual' };
  fields.forEach(f => {
    const el = document.getElementById(`form-${f.id}`);
    asset[f.id] = el?.value || '';
  });
  if (id) {
    Data.updateAsset(id, asset);
    showToast('Asset updated', 'success');
  } else {
    Data.addAsset(asset);
    showToast('Asset added ✓', 'success');
  }
  closeModal('asset-modal');
  UI.renderAssets();
  UI.renderDashboard();
}

function editAsset(id) {
  const asset = STATE.assets.find(a => a.id === id);
  if (!asset) return;
  UI.showAssetForm(asset.category, asset);
}

function deleteAsset(id) {
  if (confirm('Delete this asset?')) {
    Data.deleteAsset(id);
    UI.renderAssets();
    UI.renderDashboard();
    showToast('Asset deleted');
  }
}

function saveBulkEntry() {
  STATE.assets.forEach(a => {
    const el = document.getElementById(`bulk-${a.id}`);
    if (!el) return;
    const newVal = parseFloat(el.value);
    if (isNaN(newVal)) return;
    switch (a.category) {
      case 'bank':       Data.updateAsset(a.id, { balance: newVal }); break;
      case 'retirement': Data.updateAsset(a.id, { balance: newVal }); break;
      case 'realestate': Data.updateAsset(a.id, { currentValue: newVal }); break;
      case 'equity': {
        const qty = parseFloat(a.qty) || 1;
        Data.updateAsset(a.id, { ltp: (newVal / qty).toFixed(2) }); break;
      }
      case 'mf': {
        const units = parseFloat(a.units) || 1;
        Data.updateAsset(a.id, { nav: (newVal / units).toFixed(4) }); break;
      }
      case 'us': {
        const qty = parseFloat(a.qty) || 1;
        Data.updateAsset(a.id, { priceUSD: (newVal / qty / (STATE.usdInr || 84)).toFixed(2) }); break;
      }
      case 'gold':  Data.updateAsset(a.id, { rate:    (newVal / (parseFloat(a.qty) || 1)).toFixed(0) }); break;
      case 'fd':    Data.updateAsset(a.id, { maturity: newVal }); break;
      case 'other': Data.updateAsset(a.id, { value:    newVal }); break;
    }
  });
  Data.takeSnapshot();
  closeModal('bulk-modal');
  UI.renderDashboard();
  showToast('Snapshot saved for ' + formatMonth(Data.getCurrentMonthKey()), 'success');
}

// ============ GOAL ACTIONS (global) ============
function showGoalModal() { UI.showGoalForm(); }

function editGoal(id) {
  const goal = (STATE.goals || []).find(g => g.id === id);
  if (goal) UI.showGoalForm(goal);
}

function deleteGoal(id) {
  if (confirm('Delete this goal?')) {
    Data.deleteGoal(id);
    UI.renderGoals();
    showToast('Goal deleted');
  }
}

function saveGoalForm() {
  const id     = document.getElementById('goal-form-id')?.value;
  const name   = document.getElementById('goal-name')?.value.trim();
  const target = parseFloat(document.getElementById('goal-target')?.value);
  const date   = document.getElementById('goal-date')?.value;
  const notes  = document.getElementById('goal-notes')?.value.trim();

  if (!name || !target) { showToast('Name and target amount are required', 'error'); return; }

  const goalData = {
    name,
    targetAmount: target,
    targetDate:   date   || null,
    notes:        notes  || '',
    startAmount:  Data.getTotalNetWorth()
  };

  if (id) {
    Data.updateGoal(id, goalData);
    showToast('Goal updated ✓', 'success');
  } else {
    Data.addGoal(goalData);
    showToast('Goal added ✓', 'success');
  }
  closeModal('goal-modal');
  UI.renderGoals();
}

// ============ ALLOCATION TARGET GLOBALS ============
function updateAllocTotal() {
  const cats  = Object.keys(CONFIG.CATEGORIES).filter(c => c !== 'liability');
  const total = cats.reduce((sum, cat) => {
    return sum + (parseFloat(document.getElementById(`alloc-target-${cat}`)?.value) || 0);
  }, 0);
  const el = document.getElementById('alloc-total-indicator');
  if (!el) return;
  const diff = total - 100;
  if (Math.abs(diff) < 0.5) {
    el.textContent = '✓ Totals 100%';
    el.style.color = 'var(--accent-green)';
  } else {
    el.textContent = `Total: ${total}% (${diff > 0 ? '+' : ''}${diff.toFixed(0)}% vs 100%)`;
    el.style.color = 'var(--accent-red)';
  }
}

function saveAllocationTargets() {
  const cats    = Object.keys(CONFIG.CATEGORIES).filter(c => c !== 'liability');
  const targets = {};
  cats.forEach(cat => {
    targets[cat] = parseFloat(document.getElementById(`alloc-target-${cat}`)?.value) || 0;
  });
  Data.setAllocationTargets(targets);
  showToast('Allocation targets saved ✓', 'success');
}

// ============ TOAST (FIXED) ============
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ============ MONTH SELECTOR HANDLER ============
function loadMonthData(monthKey) {
  if (monthKey === 'current' || !monthKey) {
    UI.renderDashboard();
    return;
  }
  const snap = Data.getSnapshotForMonth(monthKey);
  if (!snap) {
    showToast('No snapshot found for ' + formatMonth(monthKey), 'error');
    return;
  }
  UI.renderDashboard(snap);
}
