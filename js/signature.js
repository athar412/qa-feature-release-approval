import { state } from './state.js';

export function openSignatureModal(role) {
      state.currentSigRole = role;
      const modal = document.getElementById('signature-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
      state.sigCanvas = document.getElementById('signature-canvas');
      if (state.sigCanvas) {
        state.sigCtx = state.sigCanvas.getContext('2d');
        state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height);
        state.sigCtx.strokeStyle = '#1a1a2e';
        state.sigCtx.lineWidth = 2.5;
        state.sigCtx.lineCap = 'round';
        state.sigCtx.lineJoin = 'round';

        // Remove old listeners to prevent duplicates
        state.sigCanvas.onmousedown = function(e) {
          state.sigDrawing = true;
          state.sigCtx.beginPath();
          const rect = state.sigCanvas.getBoundingClientRect();
          state.sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        };
        state.sigCanvas.onmousemove = function(e) {
          if (!state.sigDrawing) return;
          const rect = state.sigCanvas.getBoundingClientRect();
          state.sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
          state.sigCtx.stroke();
        };
        state.sigCanvas.onmouseup = function() { state.sigDrawing = false; };
        state.sigCanvas.onmouseleave = function() { state.sigDrawing = false; };

        // Touch support for mobile
        state.sigCanvas.ontouchstart = function(e) {
          e.preventDefault();
          state.sigDrawing = true;
          state.sigCtx.beginPath();
          const rect = state.sigCanvas.getBoundingClientRect();
          const touch = e.touches[0];
          state.sigCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        };
        state.sigCanvas.ontouchmove = function(e) {
          e.preventDefault();
          if (!state.sigDrawing) return;
          const rect = state.sigCanvas.getBoundingClientRect();
          const touch = e.touches[0];
          state.sigCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
          state.sigCtx.stroke();
        };
        state.sigCanvas.ontouchend = function() { state.sigDrawing = false; };
      }
    }

export function clearSignatureCanvas() {
      if (state.sigCanvas && state.sigCtx) {
        state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height);
      }
    }

export function closeSignatureModal() {
      const modal = document.getElementById('signature-modal');
      if (modal) modal.style.display = 'none';
      state.currentSigRole = null;
    }

export function applySignature() {
      if (!state.sigCanvas || !state.currentSigRole) return;
      const dataUrl = state.sigCanvas.toDataURL('image/png');
      
      // Check if canvas is blank
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = state.sigCanvas.width;
      blankCanvas.height = state.sigCanvas.height;
      if (dataUrl === blankCanvas.toDataURL('image/png')) {
        alert('Silakan gambar tanda tangan terlebih dahulu sebelum menerapkan.');
        return;
      }

      const container = document.getElementById('sig-container-' + state.currentSigRole);
      if (container) {
        container.innerHTML = '<img src="' + dataUrl + '" class="signoff-img" alt="Tanda Tangan ' + state.currentSigRole + '" style="max-height:80px; width:auto;" />';
      }

      // Store signature data
      if (!window._signoffs) window._signoffs = {};
      window._signoffs[state.currentSigRole] = dataUrl;

      closeSignatureModal();
    }