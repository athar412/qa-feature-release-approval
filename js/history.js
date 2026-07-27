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

      const mapDocs = {};
      const localDocs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      Object.keys(localDocs).forEach(id => {
        mapDocs[id] = { id, ...localDocs[id] };
      });
      if (Array.isArray(state.allHomeDocs)) {
        state.allHomeDocs.forEach(d => {
          if (d && d.id) {
            mapDocs[d.id] = { ...mapDocs[d.id], ...d };
          }
        });
      }

      const allDocs = Object.values(mapDocs);
      if (allDocs.length === 0) {
        container.innerHTML = '<div class="popover-empty">Belum ada riwayat dokumen.</div>';
        return;
      }

      const sortedDocs = allDocs
        .sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.timestamp || a.date || 0).getTime() || 0;
          const timeB = new Date(b.updatedAt || b.timestamp || b.date || 0).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        })
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

        const s = (doc.status || 'PENDING').toUpperCase();
        const statusClass = s === 'APPROVED' ? 'status--pass' : (s === 'REJECTED' ? 'status--fail' : 'status--pending');
        const statusText = s === 'APPROVED' ? 'Disetujui' : (s === 'REJECTED' ? 'Ditolak' : 'Pending');

        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="doc-num">${doc.id}</span>
            <span class="status ${statusClass}" style="font-size:8px; padding:1px 5px; text-transform:none;">${statusText}</span>
          </div>
          <div class="doc-title-mini">${doc.docName || doc.docTitle || 'Formulir Persetujuan Rilis'}</div>
          <div class="doc-meta">
            <span>Sprint: ${doc.sprint || doc.sprintVersion || '-'}</span>
            <span>v${doc.releaseVersion || doc.doc_version || '1.0'}</span>
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
  if (popover) {
    if (!state.allHomeDocs || state.allHomeDocs.length === 0) {
      fetchAllDocumentsForHome().then(() => renderHistoryPopoverList());
    }
    renderHistoryPopoverList();
    popover.style.display = 'flex';
  }
}

export function hideHistoryPopover() {
  const popover = document.getElementById('history-popover');
  if (popover) popover.style.display = 'none';
}
