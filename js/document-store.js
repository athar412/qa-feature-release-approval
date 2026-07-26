import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { updateMetricsFromRtm, updateStatusBanners } from './metrics.js';
import { openSignatureModal } from './signature.js';
import { applyAuthUI, setGeneralEditable, setKnownIssuesEditable, setAddButtonsVisible } from './auth.js';
import { fetchAllDocumentsForHome } from './dashboard.js';
import { showHomeView } from './navigation.js';

export async function updateAutoDocNumber() {
      const prefixEl = document.getElementById('doc-system-prefix');
      const numberEl = document.getElementById('doc-control-num');
      if (!prefixEl || !numberEl) return;
      
      const prefix = prefixEl.value;
      const year = new Date().getFullYear();
      const pattern = `${prefix}-REL-${year}-`;
      let nextNumber = 1;

      // Cari nomor tertinggi dari Supabase (sinkron antar device)
      if (state.supabaseClient) {
        try {
          const { data, error } = await state.supabaseClient
            .from('qa_documents')
            .select('id')
            .like('id', `${pattern}%`)
            .order('id', { ascending: false })
            .limit(1);
          
          if (!error && data && data.length > 0) {
            // Ambil angka terakhir dari ID, misal "ECM-REL-2026-007" → 7
            const lastId = data[0].id;
            const parts = lastId.split('-');
            const lastNum = parseInt(parts[parts.length - 1]) || 0;
            nextNumber = lastNum + 1;
          }
          console.log(`[DocNumber] Supabase lookup: ${pattern}* → next = ${nextNumber}`);
        } catch (err) {
          console.warn('[DocNumber] Supabase query gagal, fallback localStorage:', err.message);
          // Fallback ke localStorage jika Supabase error
          nextNumber = parseInt(localStorage.getItem('holycat_qa_doc_num_' + prefix) || '0') + 1;
        }
      } else {
        // Fallback jika Supabase belum tersedia
        nextNumber = parseInt(localStorage.getItem('holycat_qa_doc_num_' + prefix) || '0') + 1;
      }

      // Simpan juga di localStorage sebagai cache/fallback
      localStorage.setItem('holycat_qa_doc_num_' + prefix, nextNumber);
      
      const docNum = `${pattern}${String(nextNumber).padStart(3, '0')}`;
      numberEl.textContent = docNum;
      numberEl.setAttribute('data-placeholder', docNum);

      // Sinkronkan state.currentDocId & URL setiap kali nomor berubah (bukan cuma
      // sekali di awal) — supaya identitas dokumen di sisi klien selalu
      // konsisten dengan nomor yang TAMPIL, termasuk saat user mengganti
      // Kode Sistem setelah dokumen baru dibuat.
      state.currentDocId = docNum;
      const newUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(docNum)}`;
      window.history.replaceState(null, '', newUrl);
    }

export function bakeSelectedOptions(root) {
      if (!root) return;
      root.querySelectorAll('select').forEach(sel => {
        const currentValue = sel.value;
        Array.from(sel.options).forEach(opt => {
          if (opt.value === currentValue) {
            opt.setAttribute('selected', 'selected');
          } else {
            opt.removeAttribute('selected');
          }
        });
      });
      // Radio (Keputusan Rilis Go/No-Go) punya masalah yang sama seperti <select>:
      // mengklik radio hanya mengubah properti DOM, atribut HTML "checked" tidak
      // ikut berubah. Tanpa ini, pilihan NO-GO hilang saat dokumen disimpan dan
      // kembali ke GO (yang ditulis checked di HTML statis) saat dibuka lagi.
      root.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(inp => {
        if (inp.checked) {
          inp.setAttribute('checked', 'checked');
        } else {
          inp.removeAttribute('checked');
        }
      });
    }

export function getFormState() {
      const docNum = document.getElementById('doc-control-num').textContent.trim() || 'QA-REL-2026-001';
      const docName = document.getElementById('doc-control-name').textContent.trim() || 'Formulir Persetujuan Rilis';
      const docDate = document.getElementById('doc-control-date').textContent.trim() || new Date().toLocaleDateString('id-ID');
      const container = document.querySelector('.page-container');
      bakeSelectedOptions(container); // WAJIB sebelum innerHTML diambil — lihat catatan di atas
      
      const signoffs = {};
      ['qa-lead', 'tech-lead', 'product-owner'].forEach(role => {
        const img = document.querySelector(`#sig-container-${role} img`);
        signoffs[role] = img ? img.src : null;
      });

      return {
        id: docNum,
        docName: docName,
        docDate: docDate,
        html: container.innerHTML,
        status: state.docStatus,
        rejectionReason: state.rejectionReason,
        signoffs: signoffs,
        updatedAt: new Date().toISOString(),
        updatedBy: state.currentUser ? state.currentUser.username : 'guest'
      };
    }

export function resetCurrentForm() {
      if (!confirm('Apakah Anda yakin ingin mengosongkan formulir dan membuat pengajuan baru?')) return;
      
      // Clear URL parameter ?id=...
      if (window.history.pushState) {
        window.history.pushState({}, document.title, window.location.pathname);
      }

      // Reset doc status
      state.docStatus = 'PENDING';
      state.rejectionReason = '';
      state.currentDocId = null;

      // Reload fresh page or clear editable fields
      location.href = window.location.pathname;
    }

export function clearAllLocalStorageData() {
      if (!confirm('Apakah Anda yakin ingin MENGHAPUS SELURUH RIWAYAT DOKUMEN lokal di browser ini?')) return;
      localStorage.removeItem('holycat_qa_docs');
      alert('Seluruh data lokal berhasil dibersihkan!');
      location.href = window.location.pathname;
    }

export async function saveDocument(silent = false) {
      if (!state.currentUser) { alert('Silakan login terlebih dahulu.'); return { success: false, reason: 'Belum login.' }; }
      const formState = getFormState();
      const result = await saveDocumentToCloud(formState);
      if (silent) return result;

      if (result && result.success) {
        if (result.target === 'legacy_kvdb') {
          alert(`⚠️ Dokumen [${formState.id}] tersimpan lewat jalur CADANGAN, bukan database utama (Supabase).\n\nKemungkinan ada gangguan koneksi: ${result.warning || 'tidak diketahui'}\n\nSilakan cek lagi nanti untuk memastikan data benar-benar tersinkron ke database utama.`);
        } else {
          alert(`✅ Dokumen [${formState.id}] (${formState.docName}) berhasil disimpan & disinkronkan ke Cloud Database!`);
        }
      } else {
        alert(`❌ GAGAL menyimpan dokumen [${formState.id}] ke database!\n\nAlasan: ${result ? result.reason : 'tidak diketahui'}\n\nPerubahan Anda TIDAK tersimpan secara permanen. Silakan coba lagi, atau hubungi admin jika terus berulang.`);
      }
      return result;
    }

export async function saveDocumentToCloud(formState) {
      if (!formState || !formState.id) return { success: false, reason: 'Data dokumen tidak valid.' };
      
      // Save locally first
      let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      docs[formState.id] = formState;
      localStorage.setItem('holycat_qa_docs', JSON.stringify(docs));

      let supabaseErrorMsg = null;

      // Attempt to save to Supabase if client is active
      if (state.supabaseClient) {
        try {
          const sysCode = formState.id.split('-')[0] || 'QA';
          const { data, error } = await state.supabaseClient
            .from('qa_documents')
            .upsert({
              id: formState.id,
              system_code: sysCode,
              doc_title: formState.docName || 'Formulir Persetujuan Rilis',
              doc_version: '1.0',
              release_version: '1.0',
              sprint: '1',
              status: formState.status || 'PENDING',
              document_data: formState,
              updated_at: new Date().toISOString()
            });
          if (error) throw error;
          console.log('Supabase Save Success:', formState.id);
          return { success: true, target: 'supabase' }; // Skip KVDB if Supabase succeeded
        } catch (err) {
          console.warn('Supabase Save failed, falling back to KVDB:', err.message);
          supabaseErrorMsg = err.message;
        }
      } else {
        supabaseErrorMsg = 'Koneksi Supabase belum aktif.';
      }

      // Fallback to legacy KVDB (cadangan darurat, bukan sumber kebenaran utama)
      try {
        const response = await fetch(`${state.CLOUD_API_BASE}/${encodeURIComponent(formState.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState)
        });
        console.log('Legacy Cloud DB Save Status:', response.status);
        if (response.ok) {
          return { success: true, target: 'legacy_kvdb', warning: supabaseErrorMsg };
        }
        return { success: false, reason: supabaseErrorMsg || `Cadangan gagal (status ${response.status}).` };
      } catch (err) {
        console.warn('Legacy Cloud DB Save Warning (Offline fallback):', err);
        return { success: false, reason: supabaseErrorMsg || err.message };
      }
    }

export async function loadDocumentFromCloud(docId) {
      if (!docId) return;
      state.currentDocId = docId;

      // Check LocalStorage first for instant render
      let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      if (docs[docId]) {
        renderLoadedDoc(docs[docId]);
      }

      // Attempt to load from Supabase if client is active
      if (state.supabaseClient) {
        try {
          const { data, error } = await state.supabaseClient
            .from('qa_documents')
            .select('document_data')
            .eq('id', docId)
            .single();

          if (!error && data && data.document_data) {
            const supabaseData = data.document_data;
            docs[docId] = supabaseData;
            localStorage.setItem('holycat_qa_docs', JSON.stringify(docs));
            renderLoadedDoc(supabaseData);
            console.log('Document loaded successfully from Supabase!');
            return; // Skip KVDB if Supabase succeeded
          } else {
            console.warn('Supabase load returned empty, checking legacy cloud...');
          }
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to legacy cloud:', err.message);
        }
      }

      // Fallback to legacy KVDB
      try {
        const response = await fetch(`${state.CLOUD_API_BASE}/${encodeURIComponent(docId)}`);
        if (response.ok) {
          const cloudData = await response.json();
          if (cloudData && cloudData.id) {
            docs[docId] = cloudData;
            localStorage.setItem('holycat_qa_docs', JSON.stringify(docs));
            renderLoadedDoc(cloudData);
            console.log('Document synced from Legacy Cloud DB!');
          }
        }
      } catch (err) {
        console.warn('Legacy Cloud DB Fetch Warning:', err);
      }
    }

export function saveDocumentSilently() {
      const formState = getFormState();
      saveDocumentToCloud(formState);
      return state;
    }

export function loadDocument(docId) {
      if (!docId) return;
      state.currentDocId = docId;

      const docNumEl = document.getElementById('doc-control-num');
      if (docNumEl) docNumEl.textContent = docId;

      const match = docId.match(/^([A-Z]+)-REL/);
      if (match && document.getElementById('doc-system-prefix')) {
        document.getElementById('doc-system-prefix').value = match[1];
      }

      loadDocumentFromCloud(docId);
    }

export function renderLoadedDoc(data) {
      if (!data) return;
      state.docStatus = data.status || 'PENDING';
      state.rejectionReason = data.rejectionReason || '';
      
      if (data.html) {
        document.querySelector('.page-container').innerHTML = data.html;
      }

      // PERBAIKAN KOMPATIBILITAS MUNDUR: dokumen yang tersimpan SEBELUM fix
      // bakeSelectedOptions() bisa punya dropdown "Kode Sistem" yang salah
      // tampil (selalu balik ke opsi pertama). ID dokumen (mis. "MRC-REL-...")
      // adalah sumber kebenaran yang selalu akurat, jadi dipakai untuk
      // memastikan dropdown menampilkan kode sistem yang benar meski data
      // HTML-nya sendiri sudah kadung salah.
      const prefixSel = document.getElementById('doc-system-prefix');
      if (prefixSel && data.id) {
        const derivedPrefix = data.id.split('-')[0];
        const validOption = Array.from(prefixSel.options).some(o => o.value === derivedPrefix);
        if (validOption) prefixSel.value = derivedPrefix;
      }

      if (data.signoffs) {
        Object.keys(data.signoffs).forEach(role => {
          if (data.signoffs[role]) {
            const container = document.getElementById(`sig-container-${role}`);
            if (container) {
              container.innerHTML = `<img src="${data.signoffs[role]}" class="signoff-img" alt="Signature" />`;
            }
          }
        });
      }

      updateStatusBanners();
      applyAuthUI();
      updateMetricsFromRtm(); // Hitung ulang Pass Rate & progress bar segera setelah dokumen dimuat
    }

export async function approveDocumentAction() {
      if (!state.currentUser) {
        alert("Silakan login sebagai Product Owner / Manager terlebih dahulu.");
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }

      if (state.currentUser.role !== 'product-owner' && state.currentUser.role !== 'tech-lead') {
        alert("Akses Ditolak: Hanya Product Owner / Manager atau Tech Lead yang memiliki wewenang untuk menyetujui rilis.");
        return;
      }

      // RULE REQUIREMENT: MANAGER MUST SIGN HIMSELF FIRST BEFORE APPROVING!
      const poContainer = document.getElementById('sig-container-product-owner');
      const hasPoSignature = state.signedRoles['product-owner'] || (poContainer && poContainer.querySelector('img') !== null);

      if (!hasPoSignature) {
        alert("⚠️ PERHATIAN MANAGER:\n\nAnda belum melakukan Tanda Tangan Digital pada tabel persetujuan! Silakan lakukan tanda tangan digital Anda terlebih dahulu sebelum menyetujui rilis.");
        openSignatureModal('product-owner');
        return;
      }

      if (confirm("Apakah Anda yakin ingin MENYETUJUI rilis fitur ini ke lingkungan Production? Dokumen akan dikunci secara formal setelah disetujui.")) {
        state.docStatus = 'APPROVED';
        lockDocumentUI();
        updateStatusBanners();
        const result = await saveDocument(true);
        if (result && result.success) {
          alert(" Dokumen Berhasil Disetujui & Dikunci!");
        } else {
          alert(`⚠️ Status sudah ditandai DISETUJUI, TAPI GAGAL tersimpan ke database (${result ? result.reason : 'error tidak diketahui'}).\n\nSilakan tekan "Simpan Dokumen" secara manual untuk mencoba lagi, agar persetujuan ini benar-benar tercatat.`);
        }
      }
    }

export async function rejectDocumentAction() {
      if (!state.currentUser) {
        alert("Silakan login sebagai Product Owner / Manager terlebih dahulu.");
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }

      if (state.currentUser.role !== 'product-owner' && state.currentUser.role !== 'tech-lead') {
        alert("Akses Ditolak: Hanya Product Owner / Manager atau Tech Lead yang memiliki wewenang untuk menolak rilis.");
        return;
      }

      const reason = prompt("Masukkan alasan penolakan rilis dokumen ini untuk perbaikan tim QA:");
      if (reason !== null && reason.trim() !== '') {
        state.docStatus = 'REJECTED';
        state.rejectionReason = reason.trim();
        updateStatusBanners();
        const result = await saveDocument(true);
        if (result && result.success) {
          alert("Dokumen telah ditandai DITOLAK.");
        } else {
          alert(`⚠️ Status sudah ditandai DITOLAK, TAPI GAGAL tersimpan ke database (${result ? result.reason : 'error tidak diketahui'}).\n\nSilakan tekan "Simpan Dokumen" secara manual untuk mencoba lagi.`);
        }
      }
    }

export function approveRelease() {
      approveDocumentAction();
    }

export function rejectRelease() {
      rejectDocumentAction();
    }

export async function deleteDocumentAction(docId) {
      if (!docId) return;

      // 1. Role Privilege Check: Only QA Lead is authorized to delete documents
      if (!state.currentUser || state.currentUser.role !== 'qa-lead') {
        alert("⛔ Akses Ditolak: Hanya pengguna dengan peran QA Lead / Specialist yang memiliki wewenang untuk menghapus dokumen dari database!");
        return;
      }

      // 2. High-Severity Warning Confirmation Pop-up
      const confirmDelete = confirm(
        `⚠️ PERINGATAN KEAMANAN TINGKAT TINGGI!\n\n` +
        `Apakah Anda yakin ingin menghapus dokumen [${docId}] ini secara PERMANEN dari database Supabase & Cloud Backup?\n\n` +
        `• Seluruh skenario RTM, temuan defect, dan tanda tangan digital di dalamnya akan DIHAPUS PERMANEN.\n` +
        `• Tindakan ini TIDAK DAPAT DIBATALKAN!\n\n` +
        `Tekan OK untuk melanjutkan penghapusan.`
      );

      if (!confirmDelete) return;

      console.log(`Deleting document [${docId}]...`);

      // 3. Delete from LocalStorage
      try {
        let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
        if (docs[docId]) {
          delete docs[docId];
          localStorage.setItem('holycat_qa_docs', JSON.stringify(docs));
        }
      } catch(e) {}

      // 4. Delete from Supabase Database
      let cloudDeleteFailed = false;
      let cloudDeleteErrorMsg = '';
      if (state.supabaseClient) {
        try {
          const { error } = await state.supabaseClient
            .from('qa_documents')
            .delete()
            .eq('id', docId);

          if (error) {
            console.warn("Supabase Delete Warning:", error.message);
            cloudDeleteFailed = true;
            cloudDeleteErrorMsg = error.message;
          } else {
            console.log("Supabase Delete Success:", docId);
          }
        } catch(err) {
          console.warn("Supabase Delete Error:", err.message);
          cloudDeleteFailed = true;
          cloudDeleteErrorMsg = err.message;
        }
      }

      if (cloudDeleteFailed) {
        alert(
          `⚠️ Dokumen [${docId}] dihapus dari tampilan lokal, TAPI GAGAL dihapus dari Database Cloud Supabase.\n\n` +
          `Kemungkinan besar penyebabnya: Row Level Security (RLS) policy pada tabel "qa_documents" belum mengizinkan operasi DELETE untuk role "anon".\n\n` +
          `Detail error: ${cloudDeleteErrorMsg}\n\n` +
          `Dokumen ini akan MUNCUL KEMBALI saat Anda refresh / buka dari device lain. Silakan periksa pengaturan RLS di dashboard Supabase Anda.`
        );
      } else {
        alert(`✅ Dokumen [${docId}] berhasil dihapus secara permanen dari database.`);
      }

      // 5. Navigate back to Home if the current open document was deleted
      if (state.currentDocId === docId || document.getElementById('form-view').style.display !== 'none') {
        showHomeView();
      } else {
        fetchAllDocumentsForHome();
      }
    }

export function lockDocumentUI() {
  setGeneralEditable(false);
  setKnownIssuesEditable(false);
  setAddButtonsVisible(false);
  setElementStyle('btn-sig-qa-lead', 'display', 'none');
  setElementStyle('btn-sig-tech-lead', 'display', 'none');
  setElementStyle('btn-sig-product-owner', 'display', 'none');
  setElementStyle('approver-action-box', 'display', 'none');
}
