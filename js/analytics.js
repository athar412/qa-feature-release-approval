import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { fetchAllDocumentsForHome, openDocumentFromHome } from './dashboard.js';
import { copyShareUrlDirect } from './share.js';
import { deleteDocumentAction } from './document-store.js';

let pieChartInstance = null;
let barChartInstance = null;

export function computeAnalytics(docs) {
  const byAppCode = {
    'PSY': 0,
    'ECM': 0,
    'WPF': 0,
    'MRC': 0
  };
  const byStatus = {
    'APPROVED': 0,
    'PENDING': 0,
    'REJECTED': 0
  };

  (docs || []).forEach(d => {
    const code = ((d.id || '').split('-')[0] || 'LAIN').toUpperCase();
    byAppCode[code] = (byAppCode[code] || 0) + 1;

    const status = (d.status || 'PENDING').toUpperCase();
    if (status === 'APPROVED') byStatus.APPROVED++;
    else if (status === 'REJECTED') byStatus.REJECTED++;
    else byStatus.PENDING++;
  });

  return { byAppCode, byStatus };
}

export function renderAnalyticsCharts() {
  if (typeof window.Chart === 'undefined') {
    console.warn('Chart.js belum dimuat dari CDN.');
    return;
  }

  const { byAppCode, byStatus } = computeAnalytics(state.allHomeDocs || []);

  const styles = getComputedStyle(document.documentElement);
  const textMain = styles.getPropertyValue('--text-main').trim() || '#1e293b';
  const textMuted = styles.getPropertyValue('--text-muted').trim() || '#64748b';
  const borderColor = styles.getPropertyValue('--border').trim() || '#e2e8f0';

  const colorGreen = styles.getPropertyValue('--linear-green').trim() || '#10b981';
  const colorAmber = styles.getPropertyValue('--linear-amber').trim() || '#f59e0b';
  const colorRed = styles.getPropertyValue('--linear-red').trim() || '#ef4444';
  const colorBlue = '#3b82f6';
  const colorPurple = '#8b5cf6';
  const colorCyan = '#06b6d4';

  const appLabels = Object.keys(byAppCode);
  const appData = Object.values(byAppCode);
  const appColors = [colorBlue, colorGreen, colorAmber, colorPurple, colorCyan, colorRed];

  // 1. Pie / Doughnut Chart — Aplikasi
  const canvasApp = document.getElementById('chart-by-appcode');
  if (canvasApp) {
    if (pieChartInstance) {
      pieChartInstance.destroy();
      pieChartInstance = null;
    }
    pieChartInstance = new window.Chart(canvasApp, {
      type: 'doughnut',
      data: {
        labels: appLabels,
        datasets: [{
          data: appData,
          backgroundColor: appColors.slice(0, appLabels.length),
          borderColor: styles.getPropertyValue('--bg-card').trim() || '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textMain,
              font: { family: 'Poppins', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.parsed || 0;
                return ` ${context.label}: ${val} dokumen`;
              }
            }
          }
        }
      }
    });
  }

  // 2. Bar Chart — Status Persetujuan
  const canvasStatus = document.getElementById('chart-by-status');
  if (canvasStatus) {
    if (barChartInstance) {
      barChartInstance.destroy();
      barChartInstance = null;
    }
    barChartInstance = new window.Chart(canvasStatus, {
      type: 'bar',
      data: {
        labels: ['Disetujui', 'Menunggu', 'Ditolak'],
        datasets: [{
          label: 'Jumlah Dokumen',
          data: [byStatus.APPROVED, byStatus.PENDING, byStatus.REJECTED],
          backgroundColor: [colorGreen, colorAmber, colorRed],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: borderColor },
            ticks: { color: textMain, font: { family: 'Poppins', size: 12 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: textMuted,
              font: { family: 'JetBrains Mono', size: 11 }
            },
            grid: { color: borderColor }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

export function renderAnalyticsList() {
  const searchInput = document.getElementById('analytics-search-input');
  const statusFilterEl = document.getElementById('analytics-status-filter');
  const appFilterEl = document.getElementById('analytics-appcode-filter');
  const grid = document.getElementById('analytics-docs-grid');
  if (!grid) return;

  const q = (searchInput && searchInput.value ? searchInput.value : '').toLowerCase();
  const statusFilter = statusFilterEl ? statusFilterEl.value : 'ALL';
  const appFilter = appFilterEl ? appFilterEl.value : 'ALL';

  const docs = state.allHomeDocs || [];
  const filtered = docs.filter(d => {
    const idStr = (d.id || '').toLowerCase();
    const nameStr = (d.docName || '').toLowerCase();
    const matchesSearch = idStr.includes(q) || nameStr.includes(q);

    const docStatus = (d.status || 'PENDING').toUpperCase();
    const matchesStatus = (statusFilter === 'ALL') || (docStatus === statusFilter);

    const docAppCode = ((d.id || '').split('-')[0] || '').toUpperCase();
    const matchesApp = (appFilter === 'ALL') || (docAppCode === appFilter);

    return matchesSearch && matchesStatus && matchesApp;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        Belum ada dokumen yang sesuai dengan filter pencarian.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(d => {
    const status = (d.status || 'PENDING').toUpperCase();
    let badgeClass = 'status-badge status-badge--pending';
    let statusText = 'MENUNGGU';
    if (status === 'APPROVED') {
      badgeClass = 'status-badge status-badge--approved';
      statusText = 'DISETUJUI';
    } else if (status === 'REJECTED') {
      badgeClass = 'status-badge status-badge--rejected';
      statusText = 'DITOLAK';
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(d.id)}`;

    return `
      <div class="doc-card">
        <div>
          <div class="doc-card-header">
            <span class="doc-card-id">${d.id}</span>
            <span class="${badgeClass}">${statusText}</span>
          </div>
          <div class="doc-card-title">${d.docName || 'Formulir Persetujuan Rilis'}</div>
          <div class="doc-card-meta">
            <span>📅 ${d.date || 'Terbaru'}</span>
            <span>📦 Ver: ${d.releaseVersion || '1.0'}</span>
          </div>
        </div>
        <div class="doc-card-actions">
          <button class="btn btn-sm btn-primary" style="flex:1;" onclick="openDocumentFromHome('${d.id}')">
            📂 Buka Dokumen
          </button>
          <button class="btn btn-sm btn-secondary" title="Salin Tautan Share" onclick="copyShareUrlDirect('${shareUrl}', this)">
            🔗 Link
          </button>
          <button class="btn btn-sm btn-danger-outline" title="Hapus Dokumen Permanen" onclick="deleteDocumentAction('${d.id}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export async function showAnalyticsView() {
  setElementStyle('home-view', 'display', 'none');
  setElementStyle('form-view', 'display', 'none');
  setElementStyle('analytics-view', 'display', 'block');
  setElementStyle('nav-btn-home', 'display', 'inline-flex');
  setElementStyle('nav-brand-tag', 'display', 'inline-flex');

  // Hide document-specific navbar buttons
  setElementStyle('btn-save-doc', 'display', 'none');
  setElementStyle('btn-print-doc', 'display', 'none');
  setElementStyle('btn-delete-doc', 'display', 'none');
  const shareWrap = document.querySelector('.share-popover-wrapper');
  if (shareWrap) shareWrap.style.display = 'none';

  if (!state.allHomeDocs || state.allHomeDocs.length === 0) {
    await fetchAllDocumentsForHome();
  }

  renderAnalyticsCharts();
  renderAnalyticsList();

  const url = `${window.location.origin}${window.location.pathname}?view=analytics`;
  window.history.replaceState(null, '', url);
}
