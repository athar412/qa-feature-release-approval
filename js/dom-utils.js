import { state } from './state.js';
import { updateMetricsFromRtm } from './metrics.js';

export function setElementStyle(id, prop, val) {
      const el = document.getElementById(id);
      if (el) el.style[prop] = val;
    }

export function deleteTableRow(btn) {
      const tr = btn.closest('tr');
      if (!tr) return;
      const tbody = tr.closest('tbody');
      if (tbody && tbody.children.length <= 1) {
        alert('Tabel harus punya minimal 1 baris. Kosongkan isinya jika tidak diperlukan, alih-alih menghapus baris terakhir.');
        return;
      }
      const isRtm = !!tr.closest('#rtm-table');
      tr.remove();
      if (isRtm) updateMetricsFromRtm();
    }

export function deleteRevisionRow(btn) {
      const tr = btn.closest('tr');
      if (tr) tr.remove();
    }