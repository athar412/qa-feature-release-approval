import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { updateMetricsFromRtm } from './metrics.js';
import { applyAuthUI } from './auth.js';
import { updateAutoDocNumber, loadDocumentFromCloud } from './document-store.js';

export function toggleMobileMenu() {
      const actions = document.querySelector('.nav-actions');
      if (actions) {
        actions.classList.toggle('is-active');
      }
    }

export function showHomeView() {
      setElementStyle('home-view', 'display', 'block');
      setElementStyle('form-view', 'display', 'none');
      setElementStyle('nav-btn-home', 'display', 'none');
      
      // Badge "QA APPROVAL" hanya relevan sebagai identitas produk di Beranda —
      // di Form QA navbar sudah padat tombol, jadi badge disembunyikan (lihat showFormView)
      setElementStyle('nav-brand-tag', 'display', 'inline-flex');

      // Hide document-specific navbar buttons on Home View
      setElementStyle('btn-save-doc', 'display', 'none');
      setElementStyle('btn-print-doc', 'display', 'none');
      setElementStyle('btn-delete-doc', 'display', 'none');
      const shareWrap = document.querySelector('.share-popover-wrapper');
      if (shareWrap) shareWrap.style.display = 'none';
      
      // Update URL to clean home path
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);

      fetchAllDocumentsForHome();
    }

export function showFormView(docId) {
      setElementStyle('home-view', 'display', 'none');
      setElementStyle('form-view', 'display', 'block');
      setElementStyle('nav-btn-home', 'display', 'inline-flex');

      // Sembunyikan badge "QA APPROVAL": di halaman Form QA navbar dipadati tombol
      // aksi dokumen (Simpan/Hapus/Riwayat/Salin Link/Cetak/Logout), sehingga badge
      // identitas ini hanya menambah kepadatan tanpa memberi informasi baru.
      setElementStyle('nav-brand-tag', 'display', 'none');

      // Show document-specific navbar buttons on Form View
      setElementStyle('btn-save-doc', 'display', 'inline-flex');
      setElementStyle('btn-delete-doc', 'display', 'inline-flex');
      const printBtn = document.getElementById('btn-print-doc');
      if (printBtn) printBtn.style.setProperty('display', 'inline-flex', 'important');
      const shareWrap = document.querySelector('.share-popover-wrapper');
      if (shareWrap) shareWrap.style.display = 'inline-block';

      if (docId) {
        state.currentDocId = docId;
        const newUrl = window.location.origin + window.location.pathname + '?id=' + encodeURIComponent(docId);
        window.history.replaceState(null, '', newUrl);
        loadDocumentFromCloud(docId);
      }
    }

export function createNewDocument() {
      if (!state.currentUser) {
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }
      if (state.currentUser.role !== 'qa-lead') {
        alert('⛔ Akses Ditolak: Hanya QA Lead / Specialist yang berwenang membuat dokumen persetujuan rilis baru.\n\nTech Lead dan Product Owner hanya dapat meninjau & menandatangani dokumen yang sudah dibuat oleh QA.');
        return;
      }

      // WAJIB: kembalikan form ke template kosong/pristine dulu.
      // Tanpa ini, dokumen baru akan MEWARISI seluruh isi & status (termasuk
      // status terkunci/disetujui) dari dokumen yang SEBELUMNYA sedang dibuka,
      // karena .page-container tidak pernah di-reset — hanya nomor & nama
      // dokumen yang diubah, sisanya (RTM, defect, tanda tangan, banner status)
      // tetap menampilkan data dokumen lama.
      const container = document.querySelector('.page-container');
      if (container && state.PRISTINE_PAGE_HTML) {
        container.innerHTML = state.PRISTINE_PAGE_HTML;
      }

      // Reset seluruh state JS terkait dokumen (variabel ini di luar DOM,
      // jadi harus direset manual, tidak ikut ter-reset oleh innerHTML di atas)
      state.docStatus = 'PENDING';
      state.rejectionReason = '';
      state.signedRoles = {};
      state.currentDocId = null;

      // Buka form kosong (tanpa docId) — memakai template pristine, TIDAK memuat dokumen lain
      showFormView();

      // Nama dokumen dikosongkan agar user mengisi sendiri (placeholder tetap tampil)
      const nameEl = document.getElementById('doc-control-name');
      if (nameEl) nameEl.textContent = '';

      // Nomor dokumen dibuat OTOMATIS berdasarkan Kode Sistem yang dipilih +
      // nomor urut berikutnya dari dokumen terakhir yang tersimpan (Supabase/localStorage)
      // (state.currentDocId & URL disinkronkan otomatis di dalam updateAutoDocNumber())
      updateAutoDocNumber().then(() => {
        // Pastikan field terbuka/dapat diisi sesuai peran (form pristine defaultnya
        // tidak terkunci, tapi ini memastikan banner status & tombol tanda tangan
        // konsisten dengan peran user yang sedang login)
        applyAuthUI();
        updateMetricsFromRtm();
        // CATATAN: SENGAJA TIDAK auto-save ke database di sini.
        // Kalau langsung disimpan sekarang, dokumen akan tersimpan dengan Kode
        // Sistem DEFAULT (opsi pertama di dropdown) — SEBELUM user sempat
        // memilih Kode Sistem yang sebenarnya. Akibatnya database kebanjiran
        // baris kosong dengan kode sistem yang salah setiap kali dokumen baru
        // dibuat. Dokumen baru sekarang hanya tersimpan ke database saat user
        // benar-benar menekan "Simpan Dokumen" (atau membagikan link / tanda
        // tangan / approve, yang semuanya sudah otomatis memicu simpan) —
        // di titik itu Kode Sistem yang dipilih user sudah pasti benar.
      });
    }