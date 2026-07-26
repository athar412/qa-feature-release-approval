import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { loadDocument, deleteDocumentAction } from './document-store.js';
import { fetchAllDocumentsForHome } from './dashboard.js';
import { showFormView } from './navigation.js';

export function loadHistoryDocument(docId) {
      closeHistoryModal();
      showFormView(docId);
    }

export function renderHistoryPopoverList() {
      const container = document.getElementById('popover-history-list');
      if (!container) return;

      const docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      const docIds = Object.keys(docs);

      if (docIds.length === 0) {
        container.innerHTML = '<div class="popover-empty">Belum ada riwayat dokumen.</div>';
        return;
      }

      // Sort docs to show the 3 most recently updated ones
      const sortedDocs = docIds
        .map(id => ({ id, ...docs[id] }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 3);

      container.innerHTML = '';
      sortedDocs.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'popover-item';
        item.onclick = (e) => {
          e.stopPropagation();
          loadDocument(doc.id);
          setElementStyle('history-popover', 'display', 'none');
        };

        const statusClass = doc.status === 'APPROVED' ? 'status--pass' : (doc.status === 'REJECTED' ? 'status--fail' : 'status--pending');
        const statusText = doc.status === 'APPROVED' ? 'Disetujui' : (doc.status === 'REJECTED' ? 'Ditolak' : 'Pending');

        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="doc-num">${doc.id}</span>
            <span class="status ${statusClass}" style="font-size:8px; padding:1px 5px; text-transform:none;">${statusText}</span>
          </div>
          <div class="doc-title-mini">${doc.docTitle || 'Feature Release Laporan'}</div>
          <div class="doc-meta">
            <span>Sprint: ${doc.sprintVersion || '-'}</span>
            <span>v${doc.releaseVersion || '1.0.0'}</span>
          </div>
        `;
        container.appendChild(item);
      });
    }

export function closeHistoryModal() {
      setElementStyle('history-modal', 'display', 'none');
    }

export async function openHistoryModal() {
      setElementStyle('history-modal', 'display', 'flex');
      await renderHistoryTable();
    }

export async function renderHistoryTable() {
      const tbody = document.getElementById('history-table-body');
      if (!tbody) return;

      const searchQuery = (document.getElementById('history-search-input')?.value || '').toLowerCase().trim();
      const statusFilter = document.getElementById('history-status-filter')?.value || 'ALL';

      // 1. Fetch fresh home docs from Supabase if empty or needed
      if (!state.allHomeDocs || state.allHomeDocs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Memuat dokumen dari Supabase Database...</td></tr>';
        await fetchAllDocumentsForHome();
      }

      const docs = state.allHomeDocs || [];

      // 2. Filter docs
      let filteredDocs = docs.filter(d => {
        const docId = (d.id || '').toLowerCase();
        const docName = (d.docName || d.featureName || '').toLowerCase();
        const docDate = (d.date || d.docDate || '').toLowerCase();

        const textMatch = docId.includes(searchQuery) ||
                          docName.includes(searchQuery) ||
                          docDate.includes(searchQuery);

        let statusMatch = true;
        const itemStatus = (d.status || 'PENDING').toUpperCase();
        
        if (statusFilter === 'PENDING') statusMatch = (itemStatus === 'PENDING' || itemStatus === 'MENUNGGU PERSETUJUAN' || itemStatus === 'MENUNGGU');
        else if (statusFilter === 'APPROVED') statusMatch = (itemStatus === 'APPROVED' || itemStatus === 'DISETUJUI');
        else if (statusFilter === 'REJECTED') statusMatch = (itemStatus === 'REJECTED' || itemStatus === 'DITOLAK');

        return textMatch && statusMatch;
      });

      // 3. Render table
      tbody.innerHTML = '';

      if (filteredDocs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Tidak ada dokumen yang sesuai filter di Supabase Database.</td></tr>';
      } else {
        filteredDocs.forEach(d => {
          const tr = document.createElement('tr');
          
          const itemStatus = (d.status || 'PENDING').toUpperCase();
          let statusBadge = '<span class="status-badge status-badge--pending">MENUNGGU</span>';
          if (itemStatus === 'APPROVED' || itemStatus === 'DISETUJUI') {
            statusBadge = '<span class="status-badge status-badge--approved">DISETUJUI</span>';
          } else if (itemStatus === 'REJECTED' || itemStatus === 'DITOLAK') {
            statusBadge = '<span class="status-badge status-badge--rejected">DITOLAK</span>';
          }

          tr.innerHTML = `
            <td><strong>${d.id}</strong></td>
            <td>${d.docName || d.featureName || 'Formulir Persetujuan Rilis'}</td>
            <td>${d.date || d.docDate || 'Terbaru'}</td>
            <td>${statusBadge}</td>
            <td style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-primary" onclick="loadHistoryDocument('${d.id}')">Buka</button>
              <button class="btn btn-sm btn-danger-outline" title="Hapus Dokumen Permanen" onclick="deleteDocumentAction('${d.id}').then(() => renderHistoryTable())">🗑️ Hapus</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

export function showHistoryPopover() {
  const popover = document.getElementById('history-popover');
  if (popover) popover.style.display = 'flex';
}

export function hideHistoryPopover() {
  const popover = document.getElementById('history-popover');
  if (popover) popover.style.display = 'none';
}
