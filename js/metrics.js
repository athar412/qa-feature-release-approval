import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { lockDocumentUI } from './document-store.js';

export function calculatePassRate() {
      const rtmTable = document.getElementById('rtm-table').getElementsByTagName('tbody')[0];
      const rows = rtmTable.getElementsByTagName('tr');
      let total = 0, passed = 0, failed = 0, skipped = 0;

      for (let i = 0; i < rows.length; i++) {
        let statusText = '';
        // Kolom Status ada di index 4 (REQ ID, Deskripsi, TC ID, Metode, Status)
        const statusCell = rows[i].cells[4];
        if (!statusCell) continue;
        const selectEl = statusCell.querySelector('select');
        if (selectEl) {
          statusText = selectEl.value.toUpperCase();
        } else {
          statusText = statusCell.innerText.trim().toUpperCase();
        }
        
        if (statusText === 'PASS') { passed++; }
        else if (statusText === 'FAIL') { failed++; }
        else if (statusText === 'N/A' || statusText === 'SKIP') { skipped++; }
      }

      total = passed + failed;
      const rate = total === 0 ? 0 : Math.round((passed / total) * 100);

      const elTotal = document.getElementById('metric-total');
      const elPass = document.getElementById('metric-pass');
      const elFail = document.getElementById('metric-fail');
      const elSkip = document.getElementById('metric-skip');
      const elRate = document.getElementById('pass-rate');
      const elRateFill = document.getElementById('pass-rate-fill');

      if (elTotal) elTotal.innerText = total + skipped;
      if (elPass) elPass.innerText = passed;
      if (elFail) elFail.innerText = failed;
      if (elSkip) elSkip.innerText = skipped;
      
      if (elRate) {
        elRate.innerText = rate + '%';
        if (rate >= 90) elRate.style.color = 'var(--linear-green)';
        else if (rate >= 75) elRate.style.color = 'var(--linear-amber)';
        else elRate.style.color = 'var(--linear-red)';
      }
      if (elRateFill) {
        elRateFill.style.width = rate + '%';
        if (rate >= 90) elRateFill.style.background = 'var(--linear-green)';
        else if (rate >= 75) elRateFill.style.background = 'var(--linear-amber)';
        else elRateFill.style.background = 'var(--linear-red)';
      }
    }

export function updateMetricsFromRtm() {
      calculatePassRate();
    }

export function updateStatusBanners() {
      setElementStyle('status-banner-pending', 'display', 'none');
      setElementStyle('status-banner-approved', 'display', 'none');
      setElementStyle('status-banner-rejected', 'display', 'none');

      if (state.docStatus === 'APPROVED') {
        setElementStyle('status-banner-approved', 'display', 'flex');
        lockDocumentUI();
      } else if (state.docStatus === 'REJECTED') {
        setElementStyle('status-banner-rejected', 'display', 'flex');
        const reasonEl = document.getElementById('rejection-reason-text');
        if (reasonEl) {
          reasonEl.innerHTML = '<strong>Alasan Penolakan:</strong> ' + (state.rejectionReason || 'Ditolak untuk revisi dan perbaikan tim');
        }
        lockDocumentUI();
      } else {
        setElementStyle('status-banner-pending', 'display', 'flex');
      }
    }
