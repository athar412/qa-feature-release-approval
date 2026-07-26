import { state } from './state.js';
import { deleteTableRow } from './dom-utils.js';
import { updateMetricsFromRtm } from './metrics.js';

export function importRtmExcel(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        const rows = text.split('\n');
        if (rows.length <= 1) {
          alert('File kosong atau format salah.');
          return;
        }
        
        const tbody = document.getElementById('rtm-table').getElementsByTagName('tbody')[0];
        
        // Remove empty placeholders if any
        if (tbody.rows.length === 1 && !tbody.rows[0].cells[1].innerText.trim()) {
           tbody.innerHTML = '';
        }

        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          // Basic CSV parsing
          const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue;
          
          // Format terbaru (5 kolom): REQ ID, Deskripsi, TC ID, Metode, Status
          // Kompatibel mundur dengan format lama (4 kolom, tanpa Metode):
          // REQ ID, Deskripsi, TC ID, Status — Metode di-default ke "Manual"
          const id = cols[0] || 'REQ-00' + i;
          const desc = cols[1] || '';
          const tc = cols[2] || 'TC-00' + i;
          let metode, status;
          if (cols.length >= 5) {
            metode = cols[3] || 'Manual';
            status = cols[4] || 'N/A';
          } else {
            metode = 'Manual';
            status = cols[3] || 'N/A';
          }
          
          const isPass = status.toUpperCase() === 'PASS';
          const isFail = status.toUpperCase() === 'FAIL';
          const isNA = !isPass && !isFail;
          
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><span class="editable" contenteditable="true">${id}</span></td>
            <td><span class="editable" contenteditable="true">${desc}</span></td>
            <td><span class="editable" contenteditable="true">${tc}</span></td>
            <td><span class="editable" contenteditable="true">${metode}</span></td>
            <td class="center">
              <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
                <option value="Pass" ${isPass ? 'selected' : ''}>Pass</option>
                <option value="Fail" ${isFail ? 'selected' : ''}>Fail</option>
                <option value="N/A" ${isNA ? 'selected' : ''}>N/A</option>
              </select>
            </td>
            <td class="center no-print"><button type="button" class="btn btn-ghost btn-sm text-danger" onclick="deleteTableRow(this)" title="Hapus Baris">🗑️</button></td>
          `;
          tbody.appendChild(tr);
        }
        updateMetricsFromRtm();
      };
      // Read as text assuming CSV for simple import
      reader.readAsText(file);
      e.target.value = ''; // Reset
    }

export function importDefectExcel(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        const rows = text.split('\n');
        if (rows.length <= 1) {
          alert('File kosong atau format salah.');
          return;
        }
        
        const tbody = document.getElementById('defect-table').getElementsByTagName('tbody')[0];
        
        // Remove empty placeholders if any
        if (tbody.rows.length === 1 && !tbody.rows[0].cells[1].innerText.trim()) {
           tbody.innerHTML = '';
        }

        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue;
          
          const id = cols[0] || 'BUG-00' + i;
          const desc = cols[1] || '';
          const sev = cols[2] || 'Medium';
          const status = cols[3] || 'Open';
          const assignee = cols[4] || '';
          
          const isLow = sev.toUpperCase() === 'LOW';
          const isMedium = sev.toUpperCase() === 'MEDIUM';
          const isHigh = sev.toUpperCase() === 'HIGH' || sev.toUpperCase() === 'CRITICAL';
          const isCritical = sev.toUpperCase() === 'CRITICAL';
          
          const isClosed = status.toUpperCase() === 'CLOSED';
          const isInProgress = status.toUpperCase() === 'IN PROGRESS';
          const isWontFix = status.toUpperCase() === "WON'T FIX";
          const isOpen = !isClosed && !isInProgress && !isWontFix;
          
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><span class="editable" contenteditable="true">${id}</span></td>
            <td><span class="editable" contenteditable="true">${desc}</span></td>
            <td class="center">
              <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
                <option value="Low" ${isLow ? 'selected' : ''}>Low</option>
                <option value="Medium" ${isMedium ? 'selected' : ''}>Medium</option>
                <option value="High" ${isHigh && !isCritical ? 'selected' : ''}>High</option>
                <option value="Critical" ${isCritical ? 'selected' : ''}>Critical</option>
              </select>
            </td>
            <td class="center">
              <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
                <option value="Open" ${isOpen ? 'selected' : ''}>Open</option>
                <option value="In Progress" ${isInProgress ? 'selected' : ''}>In Progress</option>
                <option value="Closed" ${isClosed ? 'selected' : ''}>Closed</option>
                <option value="Won't Fix" ${isWontFix ? 'selected' : ''}>Won't Fix</option>
              </select>
            </td>
            <td><span class="editable" contenteditable="true">${assignee}</span></td>
            <td class="center no-print"><button type="button" class="btn btn-ghost btn-sm text-danger" onclick="deleteTableRow(this)" title="Hapus Baris">🗑️</button></td>
          `;
          tbody.appendChild(tr);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }