import { state } from './state.js';
import { deleteTableRow, deleteRevisionRow } from './dom-utils.js';
import { updateMetricsFromRtm } from './metrics.js';
import { previewEvidence } from './upload.js';

export function addRtmRow() {
      const table = document.getElementById('rtm-table');
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rowCount = tbody.children.length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="editable" contenteditable="true" data-placeholder="REQ-${String(rowCount).padStart(3,'0')}">REQ-${String(rowCount).padStart(3,'0')}</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi kebutuhan..."></span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="TC-${String(rowCount).padStart(3,'0')}">TC-${String(rowCount).padStart(3,'0')}</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Manual">Manual</span></td>
        <td class="center">
          <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
            <option value="Pass" selected>Pass</option>
            <option value="Fail">Fail</option>
            <option value="N/A">N/A</option>
          </select>
        </td>
        <td class="center no-print"><button type="button" class="btn btn-ghost btn-sm text-danger" onclick="deleteTableRow(this)" title="Hapus Baris">🗑️</button></td>
      `;
      tbody.appendChild(tr);
      updateMetricsFromRtm(); // Sertakan baris baru ke perhitungan Pass Rate
    }

export function addRiskRow() {
      const table = document.getElementById('risk-table');
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rowCount = tbody.children.length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="center">${rowCount}</td>
        <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi risiko..."></span></td>
        <td class="center">
          <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
            <option value="Low">Low</option>
            <option value="Medium" selected>Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </td>
        <td><span class="editable" contenteditable="true" data-placeholder="Mitigasi..."></span></td>
        <td class="center no-print"><button type="button" class="btn btn-ghost btn-sm text-danger" onclick="deleteTableRow(this)" title="Hapus Baris">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    }

export function addDefectRow() {
      const table = document.getElementById('defect-table');
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rowCount = tbody.children.length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="editable" contenteditable="true" data-placeholder="BUG-${String(rowCount).padStart(3,'0')}">BUG-${String(rowCount).padStart(3,'0')}</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi bug..."></span></td>
        <td class="center">
          <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High" selected>High</option>
            <option value="Critical">Critical</option>
          </select>
        </td>
        <td class="center">
          <select class="form-control form-control-sm" style="width:auto; padding:2px 6px; font-size:11px;">
            <option value="Open" selected>Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
            <option value="Won\'t Fix">Won\'t Fix</option>
          </select>
        </td>
        <td><span class="editable" contenteditable="true" data-placeholder="Assignee..."></span></td>
        <td class="center no-print"><button type="button" class="btn btn-ghost btn-sm text-danger" onclick="deleteTableRow(this)" title="Hapus Baris">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    }

export function addEvidenceCard() {
      const grid = document.getElementById('evidence-grid');
      if (!grid) return;
      const cardCount = grid.querySelectorAll('.evidence-card').length + 1;
      const card = document.createElement('div');
      card.className = 'evidence-card';
      card.innerHTML = `
        <div style="position:absolute; top:6px; right:6px; z-index:15;" class="no-print">
          <button type="button" class="btn btn-ghost btn-sm text-danger" style="padding:2px 6px; font-size:12px; background:rgba(0,0,0,0.5); border-radius:4px;" onclick="deleteEvidenceCard(this)" title="Hapus Kartu">🗑️</button>
        </div>
        <div class="evidence-img-area">
          <span class="upload-text">Upload Screenshot</span>
          <input type="file" accept="image/*" onchange="previewEvidence(event, this)" />
        </div>
        <div class="evidence-meta">
          <div class="evidence-id" contenteditable="true" data-placeholder="TC-${String(cardCount).padStart(3,'0')}">TC-${String(cardCount).padStart(3,'0')}</div>
          <div class="evidence-desc" contenteditable="true" data-placeholder="Deskripsi bukti screenshot..."></div>
        </div>
      `;
      grid.appendChild(card);
    }

export function deleteEvidenceCard(btn) {
      const card = btn.closest('.evidence-card');
      if (card) card.remove();
    }

export function addTestCaseRow() {
      const tbody = document.getElementById('test-cases-table-body') || document.querySelector('#section-test-cases tbody');
      if (!tbody) return;
      const rowCount = tbody.children.length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="editable" contenteditable="true">TC-${String(rowCount).padStart(3, '0')}</span></td>
        <td><span class="editable" contenteditable="true">Uji skenario fitur baru...</span></td>
        <td>
          <select class="form-control form-control-sm doc-control-value" style="width: auto; padding: 2px 6px;">
            <option value="PASSED" selected>PASSED</option>
            <option value="FAILED">FAILED</option>
            <option value="SKIPPED">SKIPPED</option>
          </select>
        </td>
        <td><span class="editable" contenteditable="true">Hasil pengujian sesuai ekspektasi</span></td>
        <td><button class="btn btn-ghost btn-sm text-danger no-print" onclick="deleteTestCaseRow(this)" title="Hapus Baris">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    }

export function deleteTestCaseRow(btn) {
      const tr = btn.closest('tr');
      if (tr) tr.remove();
    }

export function addKnownIssueRow() {
      const tbody = document.getElementById('known-issues-table-body') || document.querySelector('#section-known-issues tbody');
      if (!tbody) return;
      const rowCount = tbody.children.length + 1;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="editable" contenteditable="true">ISSUE-${String(rowCount).padStart(3, '0')}</span></td>
        <td><span class="editable" contenteditable="true">Deskripsi catatan kendala / bug minor...</span></td>
        <td>
          <select class="form-control form-control-sm doc-control-value" style="width: auto; padding: 2px 6px;">
            <option value="LOW">LOW</option>
            <option value="MEDIUM" selected>MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </td>
        <td><span class="editable" contenteditable="true">Akan diperbaiki pada sprint berikutnya</span></td>
        <td><button class="btn btn-ghost btn-sm text-danger no-print" onclick="deleteKnownIssueRow(this)" title="Hapus Baris">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    }

export function deleteKnownIssueRow(btn) {
      const tr = btn.closest('tr');
      if (tr) tr.remove();
    }

export function addRevisionRow() {
      const tbody = document.getElementById('revision-history-table-body') || document.querySelector('#section-revisions tbody');
      if (!tbody) return;
      const rowCount = tbody.children.length + 1;
      const tr = document.createElement('tr');
      const today = new Date().toLocaleDateString('id-ID');
      tr.innerHTML = `
        <td><span class="editable" contenteditable="true">v1.${rowCount}</span></td>
        <td><span class="editable" contenteditable="true">${today}</span></td>
        <td><span class="editable" contenteditable="true">Pembaruan dokumen dan penyesuaian catatan</span></td>
        <td><span class="editable" contenteditable="true">${state.currentUser ? state.currentUser.name : 'QA Lead'}</span></td>
        <td><button class="btn btn-ghost btn-sm text-danger no-print" onclick="deleteRevisionRow(this)" title="Hapus Baris">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    }
