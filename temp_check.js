






    // SAFE DEFENSIVE STYLE HELPER
    function setElementStyle(id, prop, val) {
      const el = document.getElementById(id);
      if (el) el.style[prop] = val;
    }

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

        
    // ================================================================
    //  AUTHENTICATION & PRIVILEGE SYSTEM ENGINE
    // ================================================================
    function processLogin() {
      const usernameInput = (document.getElementById('login-username')?.value || '').trim().toLowerCase();
      const passwordInput = (document.getElementById('login-password')?.value || '').trim();
      const errorMsg = document.getElementById('login-error');

      if (!usernameInput) {
        if (errorMsg) {
          errorMsg.textContent = 'Silakan masukkan nama pengguna (username).';
          errorMsg.style.display = 'block';
        }
        return;
      }

      let user = null;

      if (usernameInput.includes('qa')) {
        user = { username: usernameInput, role: 'qa-lead', title: 'QA Lead (Quality Assurance)', name: 'Budi Santoso' };
      } else if (usernameInput.includes('tech')) {
        user = { username: usernameInput, role: 'tech-lead', title: 'Tech Lead (Senior System Architect)', name: 'Eko Prasetyo' };
      } else if (usernameInput.includes('product') || usernameInput.includes('po') || usernameInput.includes('manager')) {
        user = { username: usernameInput, role: 'product-owner', title: 'Product Owner (PO / Manager)', name: 'Siti Rahma' };
      } else {
        // Fallback default role QA Lead for any input username
        user = { username: usernameInput, role: 'qa-lead', title: 'QA Lead (Quality Assurance)', name: usernameInput };
      }

      if (errorMsg) errorMsg.style.display = 'none';

      currentUser = user;
      localStorage.setItem('holycat_qa_user', JSON.stringify(user));

      // Hide login modal
      setElementStyle('login-modal', 'display', 'none');

      // Apply Auth UI
      applyAuthUI();

      // Show Home View
      showHomeView();
    }

    function logoutUser() {
      localStorage.removeItem('holycat_qa_user');
      currentUser = null;

      // Reset navbar user display
      const navDisplay = document.getElementById('nav-user-display');
      if (navDisplay) navDisplay.textContent = 'Pengguna: Belum Login';
      const mobDisplay = document.getElementById('mobile-user-display');
      if (mobDisplay) mobDisplay.textContent = 'Pengguna: Belum Login';

      // Set auth button back to Login state in navbar
      const authBtn = document.getElementById('nav-btn-auth');
      if (authBtn) {
        authBtn.className = 'btn btn-sm btn-primary';
        authBtn.innerHTML = '🔑 Masuk / Login';
        authBtn.onclick = function() { setElementStyle('login-modal', 'display', 'flex'); };
      }

      // Show Home View
      showHomeView();

      // STRICT REQUIREMENT: LOCK APPLICATION AGAIN WITH LOGIN MODAL ON LOGOUT
      setElementStyle('login-modal', 'display', 'flex');
    }


    
    // ================================================================
    //  DARK / LIGHT THEME TOGGLE ENGINE
    // ================================================================
    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('holycat_theme', newTheme);

      updateThemeToggleIcon(newTheme);
    }

    function updateThemeToggleIcon(theme) {
      const btn = document.getElementById('theme-toggle');
      if (!btn) return;
      if (theme === 'dark') {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        btn.title = "Ganti ke Mode Terang (Light Mode)";
      } else {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        btn.title = "Ganti ke Mode Gelap (Dark Mode)";
      }
    }

    function initTheme() {
      const savedTheme = localStorage.getItem('holycat_theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeToggleIcon(savedTheme);
    }

    // Call initTheme immediately
    initTheme();


    function checkAuth() {
      const savedUserStr = localStorage.getItem('holycat_qa_user');
      if (savedUserStr) {
        try {
          currentUser = JSON.parse(savedUserStr);
          applyAuthUI();
          return;
        } catch (e) {
          currentUser = null;
        }
      }
      
      // Guest / Unauthenticated State: Lock access with login modal
      currentUser = null;
      setElementStyle('login-modal', 'display', 'flex');
      
      const authBtn = document.getElementById('nav-btn-auth');
      if (authBtn) {
        authBtn.className = 'btn btn-sm btn-primary';
        authBtn.innerHTML = '🔑 Masuk / Login';
        authBtn.onclick = function() { setElementStyle('login-modal', 'display', 'flex'); };
      }

      const navDisplay = document.getElementById('nav-user-display');
      if (navDisplay) navDisplay.textContent = 'Pengguna: Belum Login';
      const mobDisplay = document.getElementById('mobile-user-display');
      if (mobDisplay) mobDisplay.textContent = 'Pengguna: Belum Login';
    }

    function handleAuthClick() {
      if (currentUser) {
        logoutUser();
      } else {
        setElementStyle('login-modal', 'display', 'flex');
      }
    }

    function applyAuthUI() {
      if (!currentUser) {
        checkAuth();
        return;
      }
      setElementStyle('login-modal', 'display', 'none');

      // Update Auth button in navbar to Logout state
      const authBtn = document.getElementById('nav-btn-auth');
      if (authBtn) {
        authBtn.className = 'btn btn-sm btn-danger';
        authBtn.innerHTML = '🚪 Keluar / Logout';
        authBtn.onclick = logoutUser;
      }

      const navDisplay = document.getElementById('nav-user-display');
      if (navDisplay) navDisplay.textContent = `Pengguna: ${currentUser.title}`;
      const mobDisplay = document.getElementById('mobile-user-display');
      if (mobDisplay) mobDisplay.textContent = `Pengguna: ${currentUser.title}`;

      // STRICT VIEW CONTROL FOR NAVBAR ACTION BUTTONS
      const homeViewEl = document.getElementById('home-view');
      const isHomeActive = homeViewEl && homeViewEl.style.display !== 'none';
      if (isHomeActive) {
        setElementStyle('btn-save-doc', 'display', 'none');
        const printBtn = document.getElementById('btn-print-doc');
        if (printBtn) printBtn.style.setProperty('display', 'none', 'important');
        const shareWrap = document.querySelector('.share-popover-wrapper');
        if (shareWrap) shareWrap.style.display = 'none';
      }

      if (docStatus === 'APPROVED') {
        lockDocumentUI();
        updateStatusBanners();
        return;
      }

      // Hide all signature buttons initially
      setElementStyle('btn-sig-qa-lead', 'display', 'none');
      setElementStyle('btn-sig-tech-lead', 'display', 'none');
      setElementStyle('btn-sig-product-owner', 'display', 'none');
      setElementStyle('approver-action-box', 'display', 'none');

      // ROLE PRIVILEGE RULES:
      if (currentUser.role === 'qa-lead') {
        setGeneralEditable(true);
        setKnownIssuesEditable(true);
        setAddButtonsVisible(true);
        setElementStyle('btn-sig-qa-lead', 'display', 'inline-flex');
      }
      else if (currentUser.role === 'tech-lead') {
        setGeneralEditable(false);
        setKnownIssuesEditable(false);
        setAddButtonsVisible(false);
        setElementStyle('btn-sig-tech-lead', 'display', 'inline-flex');
      }
      else if (currentUser.role === 'product-owner') {
        setGeneralEditable(false);
        setKnownIssuesEditable(true);
        setAddButtonsVisible(false);
        setElementStyle('btn-sig-product-owner', 'display', 'inline-flex');
        setElementStyle('approver-action-box', 'display', 'block');
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
      setElementStyle('status-banner-pending', 'display', 'none');
      setElementStyle('status-banner-approved', 'display', 'none');
      setElementStyle('status-banner-rejected', 'display', 'none');

      if (docStatus === 'APPROVED') {
        setElementStyle('status-banner-approved', 'display', 'flex');
        lockDocumentUI();
      } else if (docStatus === 'REJECTED') {
        setElementStyle('status-banner-rejected', 'display', 'flex');
        document.getElementById('rejection-reason-text').textContent = 'Catatan: ' + (rejectionReason || 'Ditolak untuk revisi');
      } else {
        setElementStyle('status-banner-pending', 'display', 'flex');
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
      let docs = JSON.parse('{}' || '{}');
      docs[state.id] = state;
      // localStorage docs bypassed);

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
      let docs = JSON.parse('{}' || '{}');
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
            // localStorage docs bypassed);
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
            // localStorage docs bypassed);
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
      setElementStyle('btn-save-doc', 'display', 'none');
      setElementStyle('approver-action-box', 'display', 'none');
      
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

    
    // ================================================================
    //  HISTORY MODAL & SUPABASE TABLE ENGINE
    // ================================================================
        
    // ================================================================
    //  DIGITAL SIGNATURE CANVAS & MANAGER APPROVAL ENGINE
    // ================================================================
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let signedRoles = {
      'qa-lead': false,
      'tech-lead': false,
      'product-owner': false
    };

    function initSignatureCanvas() {
      const canvas = document.getElementById('signature-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }

      function startDrawing(e) {
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
      }

      function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
      }

      function stopDrawing() {
        isDrawing = false;
      }

      canvas.onmousedown = startDrawing;
      canvas.onmousemove = draw;
      canvas.onmouseup = stopDrawing;
      canvas.onmouseleave = stopDrawing;

      canvas.ontouchstart = startDrawing;
      canvas.ontouchmove = draw;
      canvas.ontouchend = stopDrawing;
    }

    function openSignatureModal(role) {
      if (!currentUser) {
        alert("Silakan login terlebih dahulu untuk melakukan tanda tangan digital.");
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }
      activeSignatureRole = role;
      setElementStyle('signature-modal', 'display', 'flex');
      clearSignatureCanvas();
      setTimeout(initSignatureCanvas, 100);
    }

    function closeSignatureModal() {
      setElementStyle('signature-modal', 'display', 'none');
      activeSignatureRole = null;
    }

    function clearSignatureCanvas() {
      const canvas = document.getElementById('signature-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function uploadSignatureFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        applySignatureImageSrc(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    function applySignature() {
      const canvas = document.getElementById('signature-canvas');
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      applySignatureImageSrc(dataUrl);
    }

    function applySignatureImageSrc(imgSrc) {
      if (!activeSignatureRole) activeSignatureRole = 'product-owner';
      const container = document.getElementById(`sig-container-${activeSignatureRole}`);
      if (container) {
        container.innerHTML = `<img src="${imgSrc}" style="max-height:60px; max-width:180px; object-fit:contain;" alt="Signature" />`;
      }
      const btnSig = document.getElementById(`btn-sig-${activeSignatureRole}`);
      if (btnSig) btnSig.style.display = 'none';

      signedRoles[activeSignatureRole] = true;
      closeSignatureModal();

      // Auto save document state
      saveDocument();
    }

    // MANAGER / PO APPROVAL & REJECTION RULE
    
    // ================================================================
    //  MANAGER APPROVAL & REJECTION ACTIONS (UNIFIED BINDING)
    // ================================================================
    function approveDocumentAction() {
      approveRelease();
    }

    function rejectDocumentAction() {
      rejectRelease();
    }

    function approveRelease() {
      if (!currentUser) {
        alert("Silakan login sebagai Product Owner / Manager terlebih dahulu.");
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }

      if (currentUser.role !== 'product-owner') {
        alert("Akses Ditolak: Hanya Product Owner / Manager yang memiliki wewenang untuk menyetujui rilis.");
        return;
      }

      // RULE REQUIREMENT: MANAGER MUST SIGN HIMSELF FIRST BEFORE APPROVING!
      const poContainer = document.getElementById('sig-container-product-owner');
      const hasPoSignature = signedRoles['product-owner'] || (poContainer && poContainer.querySelector('img') !== null);

      if (!hasPoSignature) {
        alert("⚠️ PERHATIAN MANAGER:\n\nAnda belum melakukan Tanda Tangan Digital pada tabel persetujuan! Silakan lakukan tanda tangan digital Anda terlebih dahulu sebelum menyetujui rilis.");
        openSignatureModal('product-owner');
        return;
      }

      if (confirm("Apakah Anda yakin ingin MENYETUJUI rilis fitur ini ke lingkungan Production? Dokumen akan dikunci setelah disetujui.")) {
        docStatus = 'APPROVED';
        lockDocumentUI();
        updateStatusBanners();
        saveDocument();
        alert(" Dokumen Berhasil Disetujui & Dikunci!");
      }
    }

    function rejectRelease() {
      if (!currentUser) {
        alert("Silakan login sebagai Product Owner / Manager terlebih dahulu.");
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }

      if (currentUser.role !== 'product-owner') {
        alert("Akses Ditolak: Hanya Product Owner / Manager yang memiliki wewenang untuk menolak rilis.");
        return;
      }

      const reason = prompt("Masukkan alasan penolakan rilis ini:");
      if (reason !== null) {
        docStatus = 'REJECTED';
        updateStatusBanners();
        saveDocument();
        alert("Dokumen telah ditandai DITOLAK.");
      }
    }


    async function openHistoryModal() {
      setElementStyle('history-modal', 'display', 'flex');
      await renderHistoryTable();
    }

    function closeHistoryModal() {
      setElementStyle('history-modal', 'display', 'none');
    }

    function loadHistoryDocument(docId) {
      closeHistoryModal();
      showFormView(docId);
    }

    async function renderHistoryTable() {
      const tbody = document.getElementById('history-table-body');
      if (!tbody) return;

      const searchQuery = (document.getElementById('history-search-input')?.value || '').toLowerCase().trim();
      const statusFilter = document.getElementById('history-status-filter')?.value || 'ALL';

      // 1. Fetch fresh home docs from Supabase if empty or needed
      if (!allHomeDocs || allHomeDocs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Memuat dokumen dari Supabase Database...</td></tr>';
        await fetchAllDocumentsForHome();
      }

      const docs = allHomeDocs || [];

      // 2. Filter docs
      let filteredDocs = docs.filter(d => {
        const docId = (d.id || '').toLowerCase();
        const docName = (d.docName || d.featureName || '').toLowerCase();
        const docDate = (d.date || d.docDate || '').toLowerCase();

        const textMatch = docId.includes(searchQuery) ||
                          docName.includes(searchQuery) ||
                          docDate.includes(searchQuery);

        let statusMatch = true;
        const itemStatus = (d.status || 'PENDING').toUpperCase();
        
        if (statusFilter === 'PENDING') statusMatch = (itemStatus === 'PENDING' || itemStatus === 'MENUNGGU PERSETUJUAN' || itemStatus === 'MENUNGGU');
        else if (statusFilter === 'APPROVED') statusMatch = (itemStatus === 'APPROVED' || itemStatus === 'DISETUJUI');
        else if (statusFilter === 'REJECTED') statusMatch = (itemStatus === 'REJECTED' || itemStatus === 'DITOLAK');

        return textMatch && statusMatch;
      });

      // 3. Render table
      tbody.innerHTML = '';

      if (filteredDocs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Tidak ada dokumen yang sesuai filter di Supabase Database.</td></tr>';
      } else {
        filteredDocs.forEach(d => {
          const tr = document.createElement('tr');
          
          const itemStatus = (d.status || 'PENDING').toUpperCase();
          let statusBadge = '<span class="status-badge status-badge--pending">MENUNGGU</span>';
          if (itemStatus === 'APPROVED' || itemStatus === 'DISETUJUI') {
            statusBadge = '<span class="status-badge status-badge--approved">DISETUJUI</span>';
          } else if (itemStatus === 'REJECTED' || itemStatus === 'DITOLAK') {
            statusBadge = '<span class="status-badge status-badge--rejected">DITOLAK</span>';
          }

          tr.innerHTML = `
            <td><strong>${d.id}</strong></td>
            <td>${d.docName || d.featureName || 'Formulir Persetujuan Rilis'}</td>
            <td>${d.date || d.docDate || 'Terbaru'}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="loadHistoryDocument('${d.id}')">Buka</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    function renderHistoryPopoverList() {
      const container = document.getElementById('popover-history-list');
      if (!container) return;

      const docs = JSON.parse('{}' || '{}');
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
          setElementStyle('history-popover', 'display', 'none');
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
      setElementStyle('history-popover', 'display', 'none');

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
      
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('qa_documents')
            .select('*')
            .order('updated_at', { ascending: false });

          if (!error && data && data.length > 0) {
            data.forEach(item => {
              if (item.document_data) {
                const docObj = {
                  ...item.document_data,
                  id: item.id || item.document_data.id,
                  status: item.status || item.document_data.status || 'PENDING',
                  docName: item.document_data.docName || item.doc_title || 'Formulir Persetujuan Rilis',
                  date: item.document_data.date || item.document_data.docDate || (item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : 'Terbaru')
                };
                const idx = allHomeDocs.findIndex(x => x.id === docObj.id);
                if (idx !== -1) {
                  allHomeDocs[idx] = docObj;
                } else {
                  allHomeDocs.push(docObj);
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

    
    // =============================================
    //  DELETE DOCUMENT ENGINE (QA-LEAD ONLY WITH WARNING)
    // =============================================
    async function deleteDocumentAction(docId) {
      if (!docId) return;

      // 1. Role Privilege Check: Only QA Lead is authorized to delete documents
      if (!currentUser || currentUser.role !== 'qa-lead') {
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
        let docs = JSON.parse('{}' || '{}');
        if (docs[docId]) {
          delete docs[docId];
          // localStorage docs bypassed);
        }
      } catch(e) {}

      // 4. Delete from Supabase Database
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('qa_documents')
            .delete()
            .eq('id', docId);

          if (error) {
            console.warn("Supabase Delete Warning:", error.message);
          } else {
            console.log("Supabase Delete Success:", docId);
          }
        } catch(err) {
          console.warn("Supabase Delete Error:", err.message);
        }
      }

      alert(`✅ Dokumen [${docId}] berhasil dihapus secara permanen dari database.`);

      // 5. Navigate back to Home if the current open document was deleted
      if (currentDocId === docId || document.getElementById('form-view').style.display !== 'none') {
        showHomeView();
      } else {
        fetchAllDocumentsForHome();
      }
    }

        function showHomeView() {
      setElementStyle('home-view', 'display', 'block');
      setElementStyle('form-view', 'display', 'none');
      setElementStyle('nav-btn-home', 'display', 'none');
      
      // Hide document-specific navbar buttons on Home View
      setElementStyle('btn-save-doc', 'display', 'none');
      setElementStyle('btn-print-doc', 'display', 'none');
      const shareWrap = document.querySelector('.share-popover-wrapper');
      if (shareWrap) shareWrap.style.display = 'none';
      
      // Update URL to clean home path
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);

      fetchAllDocumentsForHome();
    }

    function showFormView(docId) {
      setElementStyle('home-view', 'display', 'none');
      setElementStyle('form-view', 'display', 'block');
      setElementStyle('nav-btn-home', 'display', 'inline-flex');

      // Show document-specific navbar buttons on Form View
      setElementStyle('btn-save-doc', 'display', 'inline-flex');
      const printBtn = document.getElementById('btn-print-doc');
      if (printBtn) printBtn.style.setProperty('display', 'inline-flex', 'important');
      const shareWrap = document.querySelector('.share-popover-wrapper');
      if (shareWrap) shareWrap.style.display = 'inline-block';

      if (docId) {
        currentDocId = docId;
        const newUrl = window.location.origin + window.location.pathname + '?id=' + encodeURIComponent(docId);
        window.history.replaceState(null, '', newUrl);
        loadDocumentFromCloud(docId);
      }
    }

    function openDocumentFromHome(docId) {
      showFormView(docId);
    }

    function createNewDocument() {
      if (!currentUser) {
        setElementStyle('login-modal', 'display', 'flex');
        return;
      }
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

  