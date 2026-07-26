import { state } from './state.js';
import { copyShareUrlDirect } from './share.js';
import { deleteDocumentAction } from './document-store.js';

export function renderHomeDashboard() {
      // Calculate Stats
      const total = state.allHomeDocs.length;
      const approved = state.allHomeDocs.filter(d => d.status === 'APPROVED').length;
      const rejected = state.allHomeDocs.filter(d => d.status === 'REJECTED').length;
      const pending = total - approved - rejected;

      document.getElementById('stat-total-docs').textContent = total;
      document.getElementById('stat-approved-docs').textContent = approved;
      document.getElementById('stat-pending-docs').textContent = pending;
      document.getElementById('stat-rejected-docs').textContent = rejected;

      filterHomeDocsList();
    }

export function filterHomeDocsList() {
      const q = (document.getElementById('home-search-input').value || '').toLowerCase();
      const grid = document.getElementById('home-recent-docs-grid');
      if (!grid) return;

      const filtered = state.allHomeDocs.filter(d => {
        const idMatch = (d.id || '').toLowerCase().includes(q);
        const nameMatch = (d.docName || '').toLowerCase().includes(q);
        const statusMatch = (d.status || '').toLowerCase().includes(q);
        return idMatch || nameMatch || statusMatch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
            Belum ada dokumen yang sesuai. Klik <b>"Buat Dokumen Persetujuan Baru"</b> untuk memulai.
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(d => {
        const status = d.status || 'PENDING';
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
                <span>🔢 Ver: ${d.releaseVersion || '1.0'}</span>
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