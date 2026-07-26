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

      if (!state.currentUser) {
        alert('Silakan login terlebih dahulu untuk membagikan dokumen.');
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }

      const linkInput = document.getElementById('share-link-input');
      const copyBtn = document.getElementById('btn-copy-link');

      // Tampilkan popover dulu dengan status "menyimpan..." — supaya user tahu
      // link yang akan dibagikan mencerminkan data TERBARU, bukan data lama.
      if (linkInput) linkInput.value = 'Menyimpan dokumen sebelum membuat link...';
      if (copyBtn) { copyBtn.disabled = true; copyBtn.textContent = '...'; }
      popover.style.display = 'flex';

      // WAJIB: simpan dulu sebelum membuat link, supaya penerima link melihat
      // data TERBARU (bukan versi lama/kosong jika user belum sempat klik
      // "Simpan Dokumen" secara manual).
      const result = await saveDocument(true);

      if (copyBtn) { copyBtn.disabled = false; copyBtn.textContent = 'Salin'; }

      if (!result || !result.success) {
        if (linkInput) linkInput.value = '';
        alert(`❌ Gagal menyimpan dokumen sebelum membuat link berbagi.\n\nAlasan: ${result ? result.reason : 'tidak diketahui'}\n\nLink TIDAK dibuat. Silakan perbaiki koneksi lalu coba lagi.`);
        popover.style.display = 'none';
        return;
      }

      if (result.target === 'legacy_kvdb') {
        alert(`⚠️ Dokumen tersimpan lewat jalur cadangan (bukan Supabase). Link tetap dibuat, tapi sebaiknya cek lagi nanti untuk memastikan data sudah tersinkron penuh.\n\nDetail: ${result.warning || ''}`);
      }

      if (linkInput) {
        linkInput.value = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(state.currentDocId)}`;
      }
    }

export function executeShareCopy() {
      const linkInput = document.getElementById('share-link-input');
      if (!linkInput) return;
      
      linkInput.select();
      linkInput.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(linkInput.value).then(() => {
        const btn = document.getElementById('btn-copy-link');
        if (btn) {
          btn.textContent = 'Tersalin!';
          setTimeout(() => {
            btn.textContent = 'Salin';
          }, 2000);
        }
      }).catch(err => {
        console.warn("Clipboard failed:", err);
        prompt("Salin link berbagi di bawah ini:", linkInput.value);
      });
    }

export function copyShareUrlDirect(url, btnElem) {
      navigator.clipboard.writeText(url).then(() => {
        const origText = btnElem.textContent;
        btnElem.textContent = '✓ Tersalin';
        btnElem.style.borderColor = '#44af7c';
        setTimeout(() => {
          btnElem.textContent = origText;
          btnElem.style.borderColor = '';
        }, 2000);
      }).catch(err => {
        console.warn("Clipboard failed:", err);
        prompt("Salin link berbagi di bawah ini:", url);
      });
    }

export function shareDocumentLink() {
      const formState = saveDocumentSilently();
      const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(formState.id)}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Link Berbagi Dokumen berhasil disalin:\n${shareUrl}`);
      }).catch(() => {
        prompt('Salin link berbagi di bawah ini:', shareUrl);
      });
    }
