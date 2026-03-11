// ═══════════════════════════════════════════════════════
// charts.js — All Chart.js rendering
// ═══════════════════════════════════════════════════════
import { S, CATS, trendData, bdown, fmtC, fmtMon } from './data.js';

const charts = {};
export let activeCats = new Set(['total']);

export function renderDonut(bd) {
  const ctx = document.getElementById('donut').getContext('2d');
  if (charts.donut) charts.donut.destroy();
  const items = bd.filter(b => b.cat !== 'liability' && b.value > 0);
  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: items.map(b => b.label),
      datasets: [{
        data: items.map(b => b.value),
        backgroundColor: items.map(b => b.color + 'bb'),
        borderColor: items.map(b => b.color),
        borderWidth: 1,
        hoverOffset: 5,
      }],
    },
    options: {
      responsive: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${fmtC(c.parsed)}` } },
      },
    },
  });
}

export function renderTrend() {
  const ctx = document.getElementById('trend-ch').getContext('2d');
  if (charts.trend) charts.trend.destroy();
  const td = trendData();
  const ds = [];

  if (activeCats.has('total')) {
    ds.push({
      label: 'Net Worth',
      data: td.total,
      borderColor: '#c8a96e',
      backgroundColor: 'rgba(200,169,110,.07)',
      borderWidth: 2,
      fill: true,
      tension: .4,
      pointRadius: 3,
      pointBackgroundColor: '#c8a96e',
    });
  }

  Object.keys(CATS).forEach(cat => {
    if (activeCats.has(cat)) {
      ds.push({
        label: CATS[cat].label,
        data: td.cats[cat],
        borderColor: CATS[cat].color,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: .4,
        pointRadius: 2,
        borderDash: [3, 3],
      });
    }
  });

  charts.trend = new Chart(ctx, {
    type: 'line',
    data: { labels: td.labels, datasets: ds },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: ds.length > 1,
          position: 'top',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, boxWidth: 5 },
        },
        tooltip: {
          backgroundColor: '#1c2029',
          borderColor: '#303848',
          borderWidth: 1,
          padding: 10,
          callbacks: { label: c => ` ${c.dataset.label}: ${fmtC(c.parsed.y)}` },
        },
      },
      scales: {
        x: { grid: { color: '#1a1f2a' } },
        y: { grid: { color: '#1a1f2a' }, ticks: { callback: v => fmtC(v) } },
      },
    },
  });

  renderTrendToggles();
}

function renderTrendToggles() {
  const c = document.getElementById('ch-tog');
  const btns = [
    { key: 'total', label: 'Total' },
    ...Object.keys(CATS).map(k => ({ key: k, label: CATS[k].icon + ' ' + CATS[k].label.split(' ')[0] })),
  ];
  c.innerHTML = btns.map(b =>
    `<button class="tbtn${activeCats.has(b.key) ? ' on' : ''}" style="color:${b.key === 'total' ? '#c8a96e' : (CATS[b.key]?.color || '#8b93a8')}" onclick="toggleCat('${b.key}',this)">${b.label}</button>`
  ).join('');
}

export function toggleCat(key, btn) {
  if (activeCats.has(key)) {
    if (activeCats.size === 1) return;
    activeCats.delete(key);
    btn.classList.remove('on');
  } else {
    activeCats.add(key);
    btn.classList.add('on');
  }
  renderTrend();
}

// Expose toggleCat globally for onclick in HTML
window.toggleCat = toggleCat;
