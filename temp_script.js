
    // ================================================================
    //  SUPABASE DATABASE INTEGRATION (WITH TRANSPARENT LOCAL STORAGE FALLBACK)
    // ================================================================
    const SUPABASE_URL = 'https://crutsnnddasqbzdymjfs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydXRzbm5kZGFzcWJ6ZHltamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NzU2MzUsImV4cCI6MjEwMDM1MTYzNX0.KN1jmW7axzbjz1QD3NSZwEKiEiHmiguQzim9w5UrEU0';
    
    let supabaseClient = null;
    try {
      if (typeof supabase !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client active.");
      }
    } catch (e) {
      console.warn("Supabase credentials not configured yet, falling back to local storage.", e);
    }

    // =============================================
    //  FIREBASE & LOCALSTORAGE BACKEND SETUP
    // =============================================
    const firebaseConfig = {
      apiKey: "AIzaSyDemoKeyForPublicForm2026AQ",
      authDomain: "holycat-qa-approval.firebaseapp.com",
      projectId: "holycat-qa-approval",
      storageBucket: "holycat-qa-approval.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:demo123456"
    };

    let db = null;
    try {
      if (window.firebase && firebase.initializeApp) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
      }
    } catch(e) {
      console.log('Firebase fallback to LocalStorage');
    }

    // =============================================
    //  3 ROLES CORRESPONDING TO 3 SIGNOFF COLUMNS
    // =============================================
    const HARDCODED_USERS = {
      'qa.lead': { pass: 'qa2026!', role: 'qa-lead', name: 'QA Lead', title: 'QA Lead / Specialist' },
      'tech.lead': { pass: 'tech2026!', role: 'tech-lead', name: 'Tech Lead', title: 'Engineering Lead / Tech Lead' },
      'manager.holycat': { pass: 'manager2026!', role: 'product-owner', name: 'Product Manager', title: 'Product Manager / Manager' }
    };

    let currentUser = null;
    let currentDocId = 'QA-REL-2026-001';
    let docStatus = 'PENDING'; // PENDING, APPROVED, REJECTED
    let rejectionReason = '';
    let activeSignatureRole = null;

    function checkAuth() {
      const savedUserStr = localStorage.getItem('holycat_qa_user');
      if (savedUserStr) {
        currentUser = JSON.parse(savedUserStr);
        applyAuthUI();
      } else {
        document.getElementById('login-modal').style.display = 'flex';
      }
    }

    function processLogin() {
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value.trim();
      const err = document.getElementById('login-error');

      if (HARDCODED_USERS[u] && HARDCODED_USERS[u].pass === p) {
        currentUser = { username: u, ...HARDCODED_USERS[u] };
        localStorage.setItem('holycat_qa_user', JSON.stringify(currentUser));
        err.style.display = 'none';
        document.getElementById('login-modal').style.display = 'none';
        applyAuthUI();
      } else {
        err.style.display = 'block';
      }
    }

    function quickLogin(type) {
      if (type === 'qa-lead') {
        document.getElementById('login-username').value = 'qa.lead';
        document.getElementById('login-password').value = 'qa2026!';
      } else if (type === 'tech-lead') {
        document.getElementById('login-username').value = 'tech.lead';
        document.getElementById('login-password').value = 'tech2026!';
      } else {
        document.getElementById('login-username').value = 'manager.holycat';
        document.getElementById('login-password').value = 'manager2026!';
      }
      processLogin();
    }

    function logoutUser() {
      localStorage.removeItem('holycat_qa_user');
      location.reload();
    }

    function applyAuthUI() {
      if (!currentUser) return;
      document.getElementById('login-modal').style.display = 'none';
      const navDisplay = document.getElementById('nav-user-display');
      if (navDisplay) {
        navDisplay.textContent = `Pengguna: ${currentUser.title}`;
      }
      const mobDisplay = document.getElementById('mobile-user-display');
      if (mobDisplay) {
        mobDisplay.textContent = `Pengguna: ${currentUser.title}`;
      }

      if (docStatus === 'APPROVED') {
        lockDocumentUI();
        updateStatusBanners();
        return;
      }

      // Hide all signature buttons initially
      document.getElementById('btn-sig-qa-lead').style.display = 'none';
      document.getElementById('btn-sig-tech-lead').style.display = 'none';
      document.getElementById('btn-sig-product-owner').style.display = 'none';
      document.getElementById('approver-action-box').style.display = 'none';

      // ROLE PRIVILEGE RULES:
      if (currentUser.role === 'qa-lead') {
        // QA Lead: Full edit access to general fields, can only sign QA Lead row
        setGeneralEditable(true);
        setKnownIssuesEditable(true);
        setAddButtonsVisible(true);
        document.getElementById('btn-sig-qa-lead').style.display = 'inline-flex';
      } 
      else if (currentUser.role === 'tech-lead') {
        // Tech Lead: Read-only for general fields, can ONLY sign Tech Lead row
        setGeneralEditable(false);
        setKnownIssuesEditable(false);
        setAddButtonsVisible(false);
        document.getElementById('btn-sig-tech-lead').style.display = 'inline-flex';
      } 
      else if (currentUser.role === 'product-owner') {
        // Product Manager: Read-only for general fields, CAN EDIT Seksi 8 (Known Issues), sign Manager row, and Approve/Reject
        setGeneralEditable(false);
        setKnownIssuesEditable(true);
        setAddButtonsVisible(false);
        document.getElementById('btn-sig-product-owner').style.display = 'inline-flex';
        document.getElementById('approver-action-box').style.display = 'block';
      }

      updateStatusBanners();
    }

    function setGeneralEditable(enable) {
      document.querySelectorAll('[contenteditable="true"], .editable-area, .doc-control-value, .editable').forEach(el => {
        // Skip Known Issues area if handled separately
        if (el.closest('#section-known-issues')) return;
        el.setAttribute('contenteditable', enable ? 'true' : 'false');
      });

      document.querySelectorAll('input[type="radio"]').forEach(el => {
        el.disabled = !enable;
      });
    }

    function setKnownIssuesEditable(enable) {
      const knownArea = document.getElementById('known-issues-area');
      if (knownArea) {
        knownArea.setAttribute('contenteditable', enable ? 'true' : 'false');
      }
    }

    function setAddButtonsVisible(visible) {
      document.querySelectorAll('.add-evidence-btn, .flowchart-area input[type="file"], .evidence-card input[type="file"]').forEach(el => {
        el.style.display = visible ? 'inline-flex' : 'none';
      });
    }

    function updateStatusBanners() {
      document.getElementById('status-banner-pending').style.display = 'none';
      document.getElementById('status-banner-approved').style.display = 'none';
      document.getElementById('status-banner-rejected').style.display = 'none';

      if (docStatus === 'APPROVED') {
        document.getElementById('status-banner-approved').style.display = 'flex';
        lockDocumentUI();
      } else if (docStatus === 'REJECTED') {
        document.getElementById('status-banner-rejected').style.display = 'flex';
        document.getElementById('rejection-reason-text').textContent = 'Catatan: ' + (rejectionReason || 'Ditolak untuk revisi');
      } else {
        document.getElementById('status-banner-pending').style.display = 'flex';
      }
    }

    // =============================================
    //  DOCUMENT SAVE, LOAD & ACTIONS
    // =============================================
    function getFormState() {
      const docNum = document.getElementById('doc-control-num').textContent.trim() || 'QA-REL-2026-001';
      const docName = document.getElementById('doc-control-name').textContent.trim() || 'Formulir Persetujuan Rilis';
      const docDate = document.getElementById('doc-control-date').textContent.trim() || new Date().toLocaleDateString('id-ID');
      const container = document.querySelector('.page-container');
      
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
        status: docStatus,
        rejectionReason: rejectionReason,
        signoffs: signoffs,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser ? currentUser.username : 'guest'
      };
    }

    
    function resetCurrentForm() {
      if (!confirm('Apakah Anda yakin ingin mengosongkan formulir dan membuat pengajuan baru?')) return;
      
      // Clear URL parameter ?id=...
      if (window.history.pushState) {
        window.history.pushState({}, document.title, window.location.pathname);
      }

      // Reset doc status
      docStatus = 'PENDING';
      rejectionReason = '';
      currentDocId = null;

      // Reload fresh page or clear editable fields
      location.href = window.location.pathname;
    }

    function clearAllLocalStorageData() {
      if (!confirm('Apakah Anda yakin ingin MENGHAPUS SELURUH RIWAYAT DOKUMEN lokal di browser ini?')) return;
      localStorage.removeItem('holycat_qa_docs');
      alert('Seluruh data lokal berhasil dibersihkan!');
      location.href = window.location.pathname;
    }


    function saveDocument() {
      if (!currentUser) { alert('Silakan login terlebih dahulu.'); return; }
      const state = getFormState();
      saveDocumentToCloud(state);
      alert(`Dokumen [${state.id}] (${state.docName}) berhasil disimpan & disinkronkan ke Cloud Database!`);
    }

    
    
    // =============================================
    //  EXTERNAL CLOUD DATABASE (REAL-TIME SYNC)
    // =============================================
    // Free high-speed global cloud REST database endpoint
    const CLOUD_API_BASE = 'https://kvdb.io/4y9pB2z8u3vX7W9qK1mN2a';

    
    // =============================================
    //  EXTERNAL CLOUD DATABASE (SUPABASE + KVDB FALLBACK)
    // =============================================

    async function saveDocumentToCloud(state) {
      if (!state || !state.id) return;
      
      // Save locally first
      let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      docs[state.id] = state;
      localStorage.setItem('holycat_qa_docs', JSON.stringify(docs));

      // Attempt to save to Supabase if client is active
      if (supabaseClient) {
        try {
          const sysCode = state.id.split('-')[0] || 'QA';
          const { data, error } = await supabaseClient
            .from('qa_documents')
            .upsert({
              id: state.id,
              system_code: sysCode,
              doc_title: state.docName || 'Formulir Persetujuan Rilis',
              doc_version: '1.0',
              release_version: '1.0',
              sprint: '1',
              status: state.status || 'PENDING',
              document_data: state,
              updated_at: new Date().toISOString()
            });
          if (error) throw error;
          console.log('Supabase Save Success:', state.id);
          return; // Skip KVDB if Supabase succeeded
        } catch (err) {
          console.warn('Supabase Save failed, falling back to KVDB:', err.message);
        }
      }

      // Fallback to legacy KVDB
      try {
        const response = await fetch(`${CLOUD_API_BASE}/${encodeURIComponent(state.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
        console.log('Legacy Cloud DB Save Status:', response.status);
      } catch (err) {
        console.warn('Legacy Cloud DB Save Warning (Offline fallback):', err);
      }
    }

    async function loadDocumentFromCloud(docId) {
      if (!docId) return;
      currentDocId = docId;

      // Check LocalStorage first for instant render
      let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      if (docs[docId]) {
        renderLoadedDoc(docs[docId]);
      }

      // Attempt to load from Supabase if client is active
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
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
        const response = await fetch(`${CLOUD_API_BASE}/${encodeURIComponent(docId)}`);
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



    function saveDocumentSilently() {
      const state = getFormState();
      saveDocumentToCloud(state);
      return state;
    }

    function shareDocumentLink() {
      const state = saveDocumentSilently();
      const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(state.id)}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Link Berbagi Dokumen berhasil disalin:\n${shareUrl}`);
      }).catch(() => {
        prompt('Salin link berbagi di bawah ini:', shareUrl);
      });
    }

    function loadDocument(docId) {
      if (!docId) return;
      currentDocId = docId;

      const docNumEl = document.getElementById('doc-control-num');
      if (docNumEl) docNumEl.textContent = docId;

      const match = docId.match(/^([A-Z]+)-REL/);
      if (match && document.getElementById('doc-system-prefix')) {
        document.getElementById('doc-system-prefix').value = match[1];
      }

      loadDocumentFromCloud(docId);
    }


    function renderLoadedDoc(data) {
      if (!data) return;
      docStatus = data.status || 'PENDING';
      rejectionReason = data.rejectionReason || '';
      
      if (data.html) {
        document.querySelector('.page-container').innerHTML = data.html;
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
    }

    function approveDocumentAction() {
      if (!currentUser || (currentUser.role !== 'product-owner' && currentUser.role !== 'tech-lead')) {
        alert('Hanya Product Manager / Tech Lead yang berhak memberikan persetujuan akhir.');
        return;
      }

      if (confirm('Apakah Anda yakin ingin menyetujui dan mengunci dokumen ini secara formal? Dokumen akan menjadi Disetujui (Read-Only).')) {
        docStatus = 'APPROVED';
        saveDocument();
        updateStatusBanners();
      }
    }

    function rejectDocumentAction() {
      if (!currentUser || (currentUser.role !== 'product-owner' && currentUser.role !== 'tech-lead')) {
        alert('Hanya Product Manager / Tech Lead yang berhak menolak dokumen.');
        return;
      }

      const reason = prompt('Masukkan alasan penolakan dokumen ini untuk perbaikan tim QA:');
      if (reason !== null && reason.trim() !== '') {
        docStatus = 'REJECTED';
        rejectionReason = reason.trim();
        saveDocument();
        updateStatusBanners();
      }
    }

    function lockDocumentUI() {
      document.getElementById('btn-save-doc').style.display = 'none';
      document.getElementById('approver-action-box').style.display = 'none';
      
      document.querySelectorAll('.btn-sig-trigger, .add-evidence-btn, input[type="file"]').forEach(el => {
        el.style.display = 'none';
      });

      document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.setAttribute('contenteditable', 'false');
      });

      document.querySelectorAll('input[type="radio"], input[type="file"]').forEach(el => {
        el.disabled = true;
      });
    }

    function copyShareLink() {
      const docNum = document.getElementById('doc-control-num').textContent.trim();
      const shareUrl = `${location.origin}${location.pathname}?id=${encodeURIComponent(docNum)}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Link berbagi dokumen berhasil disalin:
${shareUrl}`);
      });
    }

    function openHistoryModal() {
      document.getElementById('history-modal').style.display = 'flex';
      renderHistoryTable();
    }

    function renderHistoryTable() {
      const tbody = document.getElementById('history-table-body');
      const searchQuery = document.getElementById('history-search-input').value.toLowerCase().trim();
      const statusFilter = document.getElementById('history-status-filter').value;
      tbody.innerHTML = '';

      let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      const keys = Object.keys(docs);

      let filteredKeys = keys.filter(k => {
        const d = docs[k];
        const textMatch = (d.id || '').toLowerCase().includes(searchQuery) ||
                          (d.docName || '').toLowerCase().includes(searchQuery) ||
                          (d.docDate || '').toLowerCase().includes(searchQuery);
        
        let statusMatch = true;
        if (statusFilter === 'PENDING') statusMatch = (d.status === 'PENDING');
        else if (statusFilter === 'APPROVED') statusMatch = (d.status === 'APPROVED');
        else if (statusFilter === 'REJECTED') statusMatch = (d.status === 'REJECTED');

        return textMatch && statusMatch;
      });

      if (filteredKeys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="center">Tidak ada dokumen yang sesuai filter.</td></tr>';
      } else {
        filteredKeys.forEach(k => {
          const d = docs[k];
          const tr = document.createElement('tr');
          
          let statusBadge = '<span class="status status--pending">Menunggu Persetujuan</span>';
          if (d.status === 'APPROVED') statusBadge = '<span class="status status--pass">Disetujui (Read-Only)</span>';
          else if (d.status === 'REJECTED') statusBadge = '<span class="status status--fail">Ditolak</span>';

          tr.innerHTML = `
            <td><strong>${d.id}</strong></td>
            <td>${d.docName || 'Formulir Persetujuan Rilis'}</td>
            <td>${d.docDate || '-'}</td>
            <td>${statusBadge}</td>
            <td><button class="btn btn-sm btn-primary" onclick="loadDocument('${d.id}'); closeHistoryModal();">Buka</button></td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    function closeHistoryModal() {
      document.getElementById('history-modal').style.display = 'none';
    }

    // =============================================
    //  DIGITAL SIGNATURE CANVAS LOGIC
    // =============================================
    let canvas, ctx, isDrawing = false;

    function initSignatureCanvas() {
      canvas = document.getElementById('signature-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a';

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
      canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
      canvas.addEventListener('touchend', stopDrawing);
    }

    function startDrawing(e) {
      isDrawing = true;
      ctx.beginPath();
      const rect = canvas.getBoundingClientRect();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    function draw(e) {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }

    function stopDrawing() { isDrawing = false; }

    function handleTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY });
      canvas.dispatchEvent(mouseEvent);
    }

    function handleTouchMove(e) {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY });
      canvas.dispatchEvent(mouseEvent);
    }

    function clearSignatureCanvas() {
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function openSignatureModal(role) {
      if (docStatus === 'APPROVED') return;
      activeSignatureRole = role;
      document.getElementById('signature-modal').style.display = 'flex';
      setTimeout(initSignatureCanvas, 100);
    }

    function closeSignatureModal() {
      document.getElementById('signature-modal').style.display = 'none';
      clearSignatureCanvas();
    }

    function applySignature() {
      if (!activeSignatureRole || !canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const container = document.getElementById(`sig-container-${activeSignatureRole}`);
      if (container) {
        container.innerHTML = `<img src="${dataUrl}" class="signoff-img" alt="Signature" />`;
      }
      closeSignatureModal();
    }

    function uploadSignatureFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const container = document.getElementById(`sig-container-${activeSignatureRole}`);
        if (container) {
          container.innerHTML = `<img src="${e.target.result}" class="signoff-img" alt="Signature" />`;
        }
        closeSignatureModal();
      };
      reader.readAsDataURL(file);
    }

    // =============================================
    //  OTHER EDITABLE & HELPER FUNCTIONS
    // =============================================
    function previewFlowchart(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const area = document.getElementById('flowchart-drop');
        area.classList.add('has-image');
        area.innerHTML = `<img src="${e.target.result}" alt="Flowchart" />`;
      };
      reader.readAsDataURL(file);
    }

    function previewEvidence(event, input) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const area = input.parentElement;
        area.classList.add('has-image');
        area.innerHTML = `<img src="${e.target.result}" alt="Evidence" />`;
      };
      reader.readAsDataURL(file);
    }

    function addEvidenceCard() {
      const grid = document.getElementById('evidence-grid');
      const count = grid.children.length + 1;
      const card = document.createElement('div');
      card.className = 'evidence-card';
      card.innerHTML = `
        <div class="evidence-img-area">
          <span class="upload-text">Upload Screenshot</span>
          <input type="file" accept="image/*" onchange="previewEvidence(event, this)" />
        </div>
        <div class="evidence-meta">
          <div class="evidence-id" contenteditable="true" data-placeholder="TC-00${count} — PASS">TC-00${count} — PASS</div>
          <div class="evidence-desc" contenteditable="true" data-placeholder="Deskripsi bukti screenshot..."></div>
        </div>
      `;
      grid.appendChild(card);
    }

    function addRtmRow() {
      const table = document.getElementById('rtm-table').querySelector('tbody');
      const count = String(table.children.length + 1).padStart(3, '0');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="editable" contenteditable="true" data-placeholder="REQ-${count}">REQ-${count}</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi kebutuhan..."></span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="TC-${count}">TC-${count}</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Manual">Manual</span></td>
        <td class="center"><span class="status status--pass">Pass</span></td>
      `;
      table.appendChild(row);
    }

    function addDefectRow() {
      const table = document.getElementById('defect-table').querySelector('tbody');
      const count = table.children.length + 1;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="editable" contenteditable="true" data-placeholder="BUG-00${count}">BUG-00${count}</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi bug..."></span></td>
        <td class="center"><span class="priority priority--medium">Medium</span></td>
        <td class="center"><span class="status status--fail">Open</span></td>
        <td><span class="editable" contenteditable="true" data-placeholder="Assignee..."></span></td>
      `;
      table.appendChild(row);
    }

    // Status & Priority click to cycle
    document.addEventListener('click', function(e) {
      if (docStatus === 'APPROVED') return;
      
      const statusTarget = e.target.closest('.status');
      if (statusTarget) {
        const text = statusTarget.textContent.trim();
        if (text === 'Closed' || text === 'Open' || text === 'In Progress') {
          const states = [
            { cls: 'status--pass', text: 'Closed' },
            { cls: 'status--fail', text: 'Open' },
            { cls: 'status--pending', text: 'In Progress' }
          ];
          let currentIdx = states.findIndex(s => statusTarget.classList.contains(s.cls));
          let nextIdx = (currentIdx + 1) % states.length;
          statusTarget.className = 'status ' + states[nextIdx].cls;
          statusTarget.textContent = states[nextIdx].text;
        } else {
          const states = [
            { cls: 'status--pass', text: 'Pass' },
            { cls: 'status--fail', text: 'Fail' },
            { cls: 'status--pending', text: 'Pending' },
            { cls: 'status--blocked', text: 'Blocked' },
            { cls: 'status--na', text: 'N/A' }
          ];
          let currentIdx = states.findIndex(s => statusTarget.classList.contains(s.cls));
          let nextIdx = (currentIdx + 1) % states.length;
          statusTarget.className = 'status ' + states[nextIdx].cls;
          statusTarget.textContent = states[nextIdx].text;
        }
      }

      const priorityTarget = e.target.closest('.priority');
      if (priorityTarget) {
        const states = [
          { cls: 'priority--critical', text: 'Critical' },
          { cls: 'priority--high', text: 'High' },
          { cls: 'priority--medium', text: 'Medium' },
          { cls: 'priority--low', text: 'Low' }
        ];
        let currentIdx = states.findIndex(s => priorityTarget.classList.contains(s.cls));
        let nextIdx = (currentIdx + 1) % states.length;
        priorityTarget.className = 'priority ' + states[nextIdx].cls;
        priorityTarget.textContent = states[nextIdx].text;
      }
    });

    function updatePassRate() {
      const totalVal = parseInt(document.querySelector('.metric-card--total .metric-value').textContent.trim()) || 0;
      const passVal = parseInt(document.querySelector('.metric-card--pass .metric-value').textContent.trim()) || 0;
      
      let rate = 0;
      if (totalVal > 0) {
        rate = Math.round((passVal / totalVal) * 100);
      }
      if (rate < 0) rate = 0;
      if (rate > 100) rate = 100;
      
      document.getElementById('pass-rate').textContent = rate + '%';
      document.getElementById('pass-rate-fill').style.width = rate + '%';
    }

    document.querySelectorAll('.metric-value').forEach(el => {
      el.addEventListener('input', updatePassRate);
      el.addEventListener('blur', updatePassRate);
    });

    // Excel import logic
    function importRtmExcel(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {type: 'array'});
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
          
          if (json.length <= 1) return;
          const tableBody = document.getElementById('rtm-table').querySelector('tbody');
          tableBody.innerHTML = '';
          
          for (let i = 1; i < json.length; i++) {
            const rowData = json[i];
            if (rowData.length === 0 || !rowData[0]) continue;
            
            const reqId = rowData[0] || `REQ-${String(i).padStart(3, '0')}`;
            const desc = rowData[1] || '';
            const tcId = rowData[2] || `TC-${String(i).padStart(3, '0')}`;
            const method = rowData[3] || 'Manual';
            const statusText = rowData[4] || 'Pass';
            
            let statusClass = 'status--pass';
            const normStatus = String(statusText).toLowerCase();
            if (normStatus.includes('fail')) statusClass = 'status--fail';
            else if (normStatus.includes('pend')) statusClass = 'status--pending';
            else if (normStatus.includes('block')) statusClass = 'status--blocked';
            else if (normStatus.includes('na')) statusClass = 'status--na';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><span class="editable" contenteditable="true" data-placeholder="REQ-ID">${reqId}</span></td>
              <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi Kebutuhan">${desc}</span></td>
              <td><span class="editable" contenteditable="true" data-placeholder="TC-ID">${tcId}</span></td>
              <td><span class="editable" contenteditable="true" data-placeholder="Metode">${method}</span></td>
              <td class="center"><span class="status ${statusClass}">${statusText}</span></td>
            `;
            tableBody.appendChild(tr);
          }
        } catch (error) {
          console.error(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    function importDefectExcel(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {type: 'array'});
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
          
          if (json.length <= 1) return;
          const tableBody = document.getElementById('defect-table').querySelector('tbody');
          tableBody.innerHTML = '';
          
          for (let i = 1; i < json.length; i++) {
            const rowData = json[i];
            if (rowData.length === 0 || !rowData[0]) continue;
            
            const bugId = rowData[0] || `BUG-${String(i).padStart(3, '0')}`;
            const desc = rowData[1] || '';
            const severityText = rowData[2] || 'Medium';
            const statusText = rowData[3] || 'Open';
            const assignee = rowData[4] || '';
            
            let sevClass = 'priority--medium';
            const normSev = String(severityText).toLowerCase();
            if (normSev.includes('crit')) sevClass = 'priority--critical';
            else if (normSev.includes('high')) sevClass = 'priority--high';
            else if (normSev.includes('low')) sevClass = 'priority--low';
            
            let statusClass = 'status--fail';
            const normStatus = String(statusText).toLowerCase();
            if (normStatus.includes('close') || normStatus.includes('pass')) statusClass = 'status--pass';
            else if (normStatus.includes('prog')) statusClass = 'status--pending';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><span class="editable" contenteditable="true" data-placeholder="BUG-ID">${bugId}</span></td>
              <td><span class="editable" contenteditable="true" data-placeholder="Deskripsi Bug">${desc}</span></td>
              <td class="center"><span class="priority ${sevClass}">${severityText}</span></td>
              <td class="center"><span class="status ${statusClass}">${statusText}</span></td>
              <td><span class="editable" contenteditable="true" data-placeholder="Assignee">${assignee}</span></td>
            `;
            tableBody.appendChild(tr);
          }
        } catch (error) {
          console.error(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Smart print handlers
    window.addEventListener('beforeprint', function() {
      document.querySelectorAll('.editable-area').forEach(el => {
        if (!el.textContent.trim()) el.classList.add('print-empty');
      });

      const goCard = document.querySelector('.decision-card--go');
      const nogoCard = document.querySelector('.decision-card--nogo');
      const goChecked = goCard?.querySelector('input[type="radio"]')?.checked;
      const nogoChecked = nogoCard?.querySelector('input[type="radio"]')?.checked;
      if (goChecked) {
        nogoCard?.classList.add('print-empty');
        document.querySelector('.decision-grid')?.classList.add('print-single-decision');
      } else if (nogoChecked) {
        goCard?.classList.add('print-empty');
        document.querySelector('.decision-grid')?.classList.add('print-single-decision');
      }
    });

    window.addEventListener('afterprint', function() {
      document.querySelectorAll('.print-empty, .print-empty-row, .print-empty-section').forEach(el => {
        el.classList.remove('print-empty', 'print-empty-row', 'print-empty-section');
      });
      document.querySelector('.print-single-decision')?.classList.remove('print-single-decision');
    });

    
    // =============================================
    //  AUTO-DOC NUMBER GENERATOR & INCREMENT LOGIC
    // =============================================
    function generateAutoDocNumber(prefix) {
      const selectedPrefix = prefix || document.getElementById('doc-system-prefix')?.value || 'ECM';
      const currentYear = new Date().getFullYear();
      
      let maxSeq = 0;
      let docs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
      Object.keys(docs).forEach(id => {
        const match = id.match(/^[A-Z]+-REL-\d{4}-(\d+)$/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      });

      const nextSeq = String(maxSeq + 1).padStart(3, '0');
      return `${selectedPrefix}-REL-${currentYear}-${nextSeq}`;
    }

    function updateAutoDocNumber() {
      const docNumEl = document.getElementById('doc-control-num');
      const prefixEl = document.getElementById('doc-system-prefix');
      if (docNumEl && prefixEl && docStatus !== 'APPROVED') {
        const selectedPrefix = prefixEl.value;
        docNumEl.textContent = generateAutoDocNumber(selectedPrefix);
      }
    }

    // ON LOAD INIT
    window.addEventListener('DOMContentLoaded', function() {
      updatePassRate();
      checkAuth();

      const params = new URLSearchParams(location.search);
      const urlDocId = params.get('id');
      if (urlDocId) {
        loadDocument(urlDocId);
      } else {
        updateAutoDocNumber();
      }
    });
  
    // =============================================
    //  DARK/LIGHT THEME TOGGLE (PERSISTENT)
    // =============================================
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('holycat_theme', next);
      updateThemeIcon(next);
    }

    function updateThemeIcon(theme) {
      const iconBtn = document.getElementById('theme-toggle');
      if (iconBtn) {
        if (theme === 'dark') {
          iconBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        } else {
          iconBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        }
      }
    }

    // Auto-load theme preference on load
    (function() {
      const saved = localStorage.getItem('holycat_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
      window.addEventListener('DOMContentLoaded', () => {
        updateThemeIcon(saved);
      });
    })();

  
    // =============================================
    //  FLOATING HISTORY PREVIEW POPOVER LOGIC
    // =============================================
    let popoverTimeout = null;

    function showHistoryPopover() {
      if (popoverTimeout) clearTimeout(popoverTimeout);
      renderHistoryPopoverList();
      document.getElementById('history-popover').style.display = 'flex';
    }

    function hideHistoryPopover() {
      popoverTimeout = setTimeout(() => {
        document.getElementById('history-popover').style.display = 'none';
      }, 200);
    }

    function renderHistoryPopoverList() {
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
          document.getElementById('history-popover').style.display = 'none';
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

  
    // =============================================
    //  SHARE LINK PREVIEW POPOVER LOGIC
    // =============================================
    function toggleSharePopover() {
      const popover = document.getElementById('share-popover');
      if (!popover) return;
      const isVisible = popover.style.display === 'flex';
      
      // Close other popovers
      document.getElementById('history-popover').style.display = 'none';

      if (isVisible) {
        popover.style.display = 'none';
      } else {
        // Generate current link URL
        const linkInput = document.getElementById('share-link-input');
        if (linkInput) {
          linkInput.value = `${window.location.origin}${window.location.pathname}?id=${currentDocId}`;
        }
        popover.style.display = 'flex';
        // Reset copy button text
        const btn = document.getElementById('btn-copy-link');
        if (btn) btn.textContent = 'Salin';
      }
    }

    function executeShareCopy() {
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
      });
    }

    // Close popovers if clicked outside
    document.addEventListener('click', function(e) {
      const shareWrapper = document.querySelector('.share-popover-wrapper');
      const sharePopover = document.getElementById('share-popover');
      if (shareWrapper && sharePopover && !shareWrapper.contains(e.target)) {
        sharePopover.style.display = 'none';
      }
    });

  
    // =============================================
    //  MOBILE RESPONSIVE MENU TOGGLE
    // =============================================
    function toggleMobileMenu() {
      const actions = document.querySelector('.nav-actions');
      if (actions) {
        actions.classList.toggle('is-active');
      }
    }



  
    // =============================================
    //  HOME VIEW & FORM VIEW NAVIGATION ENGINE
    // =============================================
    let allHomeDocs = [];

    async function fetchAllDocumentsForHome() {
      allHomeDocs = [];
      // 1. Fetch from LocalStorage
      try {
        const localDocs = JSON.parse(localStorage.getItem('holycat_qa_docs') || '{}');
        Object.values(localDocs).forEach(d => {
          if (d && d.id) allHomeDocs.push(d);
        });
      } catch(e) {}

      // 2. Fetch from Supabase if active
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('qa_documents')
            .select('*')
            .order('updated_at', { ascending: false });

          if (!error && data) {
            data.forEach(item => {
              if (item.document_data) {
                // Upsert to local list
                const idx = allHomeDocs.findIndex(x => x.id === item.id);
                if (idx !== -1) {
                  allHomeDocs[idx] = item.document_data;
                } else {
                  allHomeDocs.push(item.document_data);
                }
              }
            });
          }
        } catch(err) {
          console.warn("Supabase fetch all for home error:", err);
        }
      }

      renderHomeDashboard();
    }

    function renderHomeDashboard() {
      // Calculate Stats
      const total = allHomeDocs.length;
      const approved = allHomeDocs.filter(d => d.status === 'APPROVED').length;
      const rejected = allHomeDocs.filter(d => d.status === 'REJECTED').length;
      const pending = total - approved - rejected;

      document.getElementById('stat-total-docs').textContent = total;
      document.getElementById('stat-approved-docs').textContent = approved;
      document.getElementById('stat-pending-docs').textContent = pending;
      document.getElementById('stat-rejected-docs').textContent = rejected;

      filterHomeDocsList();
    }

    function filterHomeDocsList() {
      const q = (document.getElementById('home-search-input').value || '').toLowerCase();
      const grid = document.getElementById('home-recent-docs-grid');
      if (!grid) return;

      const filtered = allHomeDocs.filter(d => {
        const idMatch = (d.id || '').toLowerCase().includes(q);
        const nameMatch = (d.docName || '').toLowerCase().includes(q);
        const statusMatch = (d.status || '').toLowerCase().includes(q);
        return idMatch || nameMatch || statusMatch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
            Belum ada dokumen yang sesuai. Klik <b>"Buat Dokumen Persetujuan Baru"</b> untuk memulai.
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(d => {
        const status = d.status || 'PENDING';
        let badgeClass = 'status-badge status-badge--pending';
        let statusText = 'MENUNGGU';
        if (status === 'APPROVED') {
          badgeClass = 'status-badge status-badge--approved';
          statusText = 'DISETUJUI';
        } else if (status === 'REJECTED') {
          badgeClass = 'status-badge status-badge--rejected';
          statusText = 'DITOLAK';
        }

        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(d.id)}`;

        return `
          <div class="doc-card">
            <div>
              <div class="doc-card-header">
                <span class="doc-card-id">${d.id}</span>
                <span class="${badgeClass}">${statusText}</span>
              </div>
              <div class="doc-card-title">${d.docName || 'Formulir Persetujuan Rilis'}</div>
              <div class="doc-card-meta">
                <span>📅 ${d.date || 'Terbaru'}</span>
                <span>🔢 Ver: ${d.releaseVersion || '1.0'}</span>
              </div>
            </div>
            <div class="doc-card-actions">
              <button class="btn btn-sm btn-primary" style="flex:1;" onclick="openDocumentFromHome('${d.id}')">
                📂 Buka Dokumen
              </button>
              <button class="btn btn-sm btn-secondary" title="Salin Tautan Share" onclick="copyShareUrlDirect('${shareUrl}', this)">
                🔗 Link
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function copyShareUrlDirect(url, btnElem) {
      navigator.clipboard.writeText(url).then(() => {
        const origText = btnElem.textContent;
        btnElem.textContent = '✓ Tersalin';
        btnElem.style.borderColor = '#10b981';
        setTimeout(() => {
          btnElem.textContent = origText;
          btnElem.style.borderColor = '';
        }, 2000);
      });
    }

    function scrollToDocumentsList() {
      const elem = document.getElementById('documents-board-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }

    function showHomeView() {
      document.getElementById('home-view').style.display = 'block';
      document.getElementById('form-view').style.display = 'none';
      document.getElementById('nav-btn-home').style.display = 'none';
      
      // Update URL to clean home path
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);

      fetchAllDocumentsForHome();
    }

    function showFormView(docId) {
      document.getElementById('home-view').style.display = 'none';
      document.getElementById('form-view').style.display = 'block';
      document.getElementById('nav-btn-home').style.display = 'inline-flex';

      if (docId) {
        currentDocId = docId;
        const newUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(docId)}`;
        window.history.replaceState(null, '', newUrl);
        loadDocumentFromCloud(docId);
      }
    }

    function openDocumentFromHome(docId) {
      showFormView(docId);
    }

    function createNewDocument() {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newId = `QA-REL-${year}-${randomNum}`;
      
      // Reset form to blank draft state
      docStatus = 'PENDING';
      currentDocId = newId;
      
      // Open form view with new ID
      showFormView(newId);

      // Set input values
      const idInput = document.getElementById('doc-number-input');
      if (idInput) idInput.value = newId;

      const nameInput = document.getElementById('doc-name-input');
      if (nameInput) nameInput.value = 'Pengajuan Persetujuan Rilis Fitur Baru';

      // Save initial blank draft
      saveCurrentState();
    }

    // Dynamic listener for Document Number Input changes to keep URL and Supabase ID synced
    document.addEventListener('DOMContentLoaded', function() {
      const idInput = document.getElementById('doc-number-input');
      if (idInput) {
        idInput.addEventListener('change', function() {
          const val = this.value.trim();
          if (val && val !== currentDocId) {
            console.log(`Document ID changed from ${currentDocId} to ${val}`);
            currentDocId = val;
            const newUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(val)}`;
            window.history.replaceState(null, '', newUrl);
            saveCurrentState();
          }
        });
      }
    });

    // AUTO-NAVIGATE ON INITIAL LOAD BASED ON URL QUERY PARAMS
    window.addEventListener('load', function() {
      const params = new URLSearchParams(window.location.search);
      const urlDocId = params.get('id');
      if (urlDocId) {
        showFormView(urlDocId);
      } else {
        showHomeView();
      }
    });

  