import { state } from './state.js';
import { copyShareUrlDirect } from './share.js';
import { deleteDocumentAction } from './document-store.js';
import { showFormView } from './navigation.js';

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

export async function fetchAllDocumentsForHome() {
      state.allHomeDocs = [];
      
      if (state.supabaseClient) {
        try {
          const { data, error } = await state.supabaseClient
            .from('qa_documents')
            .select('*')
            .order('updated_at', { ascending: false });

          if (!error && data && data.length > 0) {
            data.forEach(item => {
              if (item.document_data) {
                const docObj = {
                  ...item.document_data,
                  id: item.id || item.document_data.id,
                  status: item.status || item.document_data.status || 'PENDING',
                  docName: item.document_data.docName || item.doc_title || 'Formulir Persetujuan Rilis',
                  date: item.document_data.date || item.document_data.docDate || (item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : 'Terbaru')
                };
                const idx = state.allHomeDocs.findIndex(x => x.id === docObj.id);
                if (idx !== -1) {
                  state.allHomeDocs[idx] = docObj;
                } else {
                  state.allHomeDocs.push(docObj);
                }
              }
            });
          }
        } catch(err) {
          console.warn("Supabase fetch all for home error:", err);
        }
      }

      renderHomeDashboard();
    }

export function openDocumentFromHome(docId) {
      showFormView(docId);
    }
