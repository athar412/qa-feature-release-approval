import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { loadDocument } from './document-store.js';
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