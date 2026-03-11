// js/charts.js — Chart rendering with Chart.js

Chart.defaults.color = '#8b93a8';
Chart.defaults.borderColor = '#252b38';
Chart.defaults.font.family = 'DM Mono, monospace';
Chart.defaults.font.size = 11;

const Charts = {

  renderDonut(canvasId, breakdown) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (STATE.charts.donut) STATE.charts.donut.destroy();

    const filtered = breakdown.filter(b => b.category !== 'liability' && b.value > 0);

    STATE.charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: filtered.map(b => b.label),
        datasets: [{
          data: filtered.map(b => b.value),
          backgroundColor: filtered.map(b => b.color + 'cc'),
          borderColor: filtered.map(b => b.color),
          borderWidth: 1,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`
            }
          }
        }
      }
    });
  },

  renderTrend(canvasId, data, activeCategories = null) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (STATE.charts.trend) STATE.charts.trend.destroy();

    const cats = activeCategories || ['total'];
    const datasets = [];

    if (cats.includes('total')) {
      datasets.push({
        label: 'Net Worth',
        data: data.total,
        borderColor: '#c8a96e',
        backgroundColor: 'rgba(200,169,110,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#c8a96e'
      });
    }

    Object.keys(CONFIG.CATEGORIES).forEach(cat => {
      if (cats.includes(cat) && data.categories[cat]) {
        datasets.push({
          label: CONFIG.CATEGORIES[cat].label,
          data: data.categories[cat],
          borderColor: CONFIG.CATEGORIES[cat].color,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [4, 4]
        });
      }
    });

    STATE.charts.trend = new Chart(ctx, {
      type: 'line',
      data: { labels: data.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: datasets.length > 1,
            position: 'top',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, boxWidth: 6 }
          },
          tooltip: {
            backgroundColor: '#1c2029',
            borderColor: '#303848',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#1a1f2a' },
            ticks: { maxRotation: 0 }
          },
          y: {
            grid: { color: '#1a1f2a' },
            ticks: {
              callback: (val) => formatCurrency(val)
            }
          }
        }
      }
    });
  },

  renderCategoryBar(canvasId, breakdown) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (STATE.charts.bar) STATE.charts.bar.destroy();

    const positive = breakdown.filter(b => b.value > 0 && b.category !== 'liability');

    STATE.charts.bar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: positive.map(b => b.icon + ' ' + b.label),
        datasets: [
          {
            label: 'Current Value',
            data: positive.map(b => b.value),
            backgroundColor: positive.map(b => b.color + '99'),
            borderColor: positive.map(b => b.color),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Cost Basis',
            data: positive.map(b => b.cost),
            backgroundColor: positive.map(b => b.color + '33'),
            borderColor: positive.map(b => b.color + '55'),
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: '#1a1f2a' },
            ticks: { callback: (val) => formatCurrency(val) }
          }
        }
      }
    });
  },

  buildChartToggles(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const buttons = [
      { key: 'total', label: 'Total NW' },
      ...Object.keys(CONFIG.CATEGORIES).map(k => ({
        key: k,
        label: CONFIG.CATEGORIES[k].icon + ' ' + CONFIG.CATEGORIES[k].label.split(' ')[0]
      }))
    ];

    container.innerHTML = buttons.map(b =>
      `<button class="toggle-btn ${b.key === 'total' ? 'active' : ''}"
        data-key="${b.key}"
        style="${b.key === 'total' ? 'color:#c8a96e;border-color:#c8a96e' : `color:${CONFIG.CATEGORIES[b.key]?.color || '#8b93a8'}`}"
        onclick="toggleChartCategory('${b.key}', this)">${b.label}</button>`
    ).join('');
  }
};

const activeChartCategories = new Set(['total']);

function toggleChartCategory(key, btn) {
  if (activeChartCategories.has(key)) {
    if (activeChartCategories.size === 1) return; // Keep at least one
    activeChartCategories.delete(key);
    btn.classList.remove('active');
  } else {
    activeChartCategories.add(key);
    btn.classList.add('active');
  }
  const data = Data.getTrendData();
  Charts.renderTrend('trend-chart', data, [...activeChartCategories]);
}
