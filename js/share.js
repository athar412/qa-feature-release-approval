import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { saveDocument, saveDocumentSilently } from './document-store.js';

export async function toggleSharePopover() {
  const popover = document.getElementById('share-popover');
  if (!popover) return;

  const isVisible = popover.style.display === 'flex';
  
  // Close other popovers
  setElementStyle('history-popover', 'display', 'none');

  if (isVisible) {
    popover.style.display = 'none';
    return;
  }

  const docId = state.currentDocId || 'QA-REL-2026-001';
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(docId)}`;
  
  const linkInput = document.getElementById('share-link-input');
  const copyBtn = document.getElementById('btn-copy-link');

  if (linkInput) linkInput.value = shareUrl;
  if (copyBtn) { copyBtn.disabled = false; copyBtn.textContent = 'Salin'; }

  popover.style.display = 'flex';

  // Trigger silent save in background if user is logged in
  if (state.currentUser) {
    saveDocumentSilently();
  }
}

export function executeShareCopy() {
  const linkInput = document.getElementById('share-link-input');
  if (!linkInput) return;
  
  const textToCopy = linkInput.value;
  if (!textToCopy) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showCopiedFeedback();
    }).catch(() => {
      fallbackCopy(linkInput);
    });
  } else {
    fallbackCopy(linkInput);
  }
}

function fallbackCopy(inputEl) {
  inputEl.select();
  inputEl.setSelectionRange(0, 99999);
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showCopiedFeedback();
    } else {
      prompt('Salin link berbagi di bawah ini:', inputEl.value);
    }
  } catch (err) {
    prompt('Salin link berbagi di bawah ini:', inputEl.value);
  }
}

function showCopiedFeedback() {
  const btn = document.getElementById('btn-copy-link');
  if (btn) {
    const origText = btn.textContent;
    btn.textContent = 'Tersalin!';
    btn.style.background = '#10B981';
    btn.style.color = '#FFFFFF';
    setTimeout(() => {
      btn.textContent = origText || 'Salin';
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  }
}

export function copyShareUrlDirect(url, btnElem) {
  if (!url) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      if (btnElem) {
        const origText = btnElem.textContent;
        btnElem.textContent = '✓ Tersalin';
        btnElem.style.borderColor = '#44af7c';
        setTimeout(() => {
          btnElem.textContent = origText;
          btnElem.style.borderColor = '';
        }, 2000);
      } else {
        alert(`Link berhasil disalin:\n${url}`);
      }
    }).catch(() => {
      prompt('Salin link berbagi di bawah ini:', url);
    });
  } else {
    prompt('Salin link berbagi di bawah ini:', url);
  }
}

export function shareDocumentLink() {
  const docId = state.currentDocId || 'QA-REL-2026-001';
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(docId)}`;
  
  copyShareUrlDirect(shareUrl, null);
  
  if (state.currentUser) {
    saveDocumentSilently();
  }
}
