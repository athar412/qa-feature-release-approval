import { state } from './state.js';
import { setElementStyle } from './dom-utils.js';
import { updateStatusBanners } from './metrics.js';
import { showHomeView } from './navigation.js';
import { lockDocumentUI } from './document-store.js';

export function processLogin() {
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

      if (usernameInput.includes('super') || usernameInput.includes('admin') || usernameInput === 'super.admin') {
        user = { username: usernameInput, role: 'super-admin', title: 'Super Admin (System Administrator)', name: 'System Super Admin' };
      } else if (usernameInput.includes('qa')) {
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

      state.currentUser = user;
      localStorage.setItem('holycat_qa_user', JSON.stringify(user));

      // Hide login modal
      setElementStyle('login-modal', 'display', 'none');

      // Apply Auth UI
      applyAuthUI();

      // Show Home View
      showHomeView();
    }

export function logoutUser() {
      localStorage.removeItem('holycat_qa_user');
      state.currentUser = null;

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

export function checkAuth() {
      const savedUserStr = localStorage.getItem('holycat_qa_user');

      if (savedUserStr) {
        try {
          state.currentUser = JSON.parse(savedUserStr);
          applyAuthUI();
          return;
        } catch (e) {
          state.currentUser = null;
        }
      }
      
      // Guest / Unauthenticated State: Lock access with login modal
      state.currentUser = null;
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

export function handleAuthClick() {
      if (state.currentUser) {
        logoutUser();
      } else {
        setElementStyle('login-modal', 'display', 'flex');
      }
    }

export function applyAuthUI() {
      if (!state.currentUser) {
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
      if (navDisplay) navDisplay.textContent = `Pengguna: ${state.currentUser.title}`;
      const mobDisplay = document.getElementById('mobile-user-display');
      if (mobDisplay) mobDisplay.textContent = `Pengguna: ${state.currentUser.title}`;

      // Tombol "Buat Dokumen Baru" di Beranda: HANYA untuk QA Lead / Specialist
      const createDocBtn = document.getElementById('btn-hero-create-doc');
      if (createDocBtn) {
        createDocBtn.style.display = (state.currentUser.role === 'qa-lead') ? 'inline-flex' : 'none';
      }

      // STRICT VIEW CONTROL FOR NAVBAR ACTION BUTTONS
      // Gunakan state.currentDocId: jika ada docId = sedang di form, tidak ada = di home
      const isFormActive = !!state.currentDocId;
      if (!isFormActive) {
        setElementStyle('btn-save-doc', 'display', 'none');
        const printBtn = document.getElementById('btn-print-doc');
        if (printBtn) printBtn.style.setProperty('display', 'none', 'important');
        const shareWrap = document.querySelector('.share-popover-wrapper');
        if (shareWrap) shareWrap.style.display = 'none';
      } else {
        setElementStyle('btn-save-doc', 'display', 'inline-flex');
        const printBtn = document.getElementById('btn-print-doc');
        if (printBtn) printBtn.style.setProperty('display', 'inline-flex', 'important');
        const shareWrap = document.querySelector('.share-popover-wrapper');
        if (shareWrap) shareWrap.style.display = 'inline-block';
      }

      if (state.docStatus === 'APPROVED' || state.docStatus === 'REJECTED') {
        lockDocumentUI();
        updateStatusBanners();
        return;
      }

      // Hide approver action box initially
      setElementStyle('approver-action-box', 'display', 'none');

      // ROLE PRIVILEGE RULES untuk dokumen PENDING:
      if (state.currentUser.role === 'super-admin') {
        setGeneralEditable(true);
        setKnownIssuesEditable(true);
        setAddButtonsVisible(true);
        applySignoffRowPermissions(state.currentUser.role);
        applySignatureHierarchy(state.currentUser.role);
        setElementStyle('approver-action-box', 'display', 'block');
      }
      else if (state.currentUser.role === 'qa-lead') {
        setGeneralEditable(true);
        setKnownIssuesEditable(true);
        setAddButtonsVisible(true);
        applySignoffRowPermissions(state.currentUser.role);
        applySignatureHierarchy(state.currentUser.role);
      }
      else if (state.currentUser.role === 'tech-lead') {
        setGeneralEditable(false);
        setKnownIssuesEditable(false);
        setAddButtonsVisible(false);
        applySignoffRowPermissions(state.currentUser.role);
        applySignatureHierarchy(state.currentUser.role);
      }
      else if (state.currentUser.role === 'product-owner') {
        setGeneralEditable(false);
        setKnownIssuesEditable(false);
        setAddButtonsVisible(false);
        applySignoffRowPermissions(state.currentUser.role);
        applySignatureHierarchy(state.currentUser.role);
        setElementStyle('approver-action-box', 'display', 'block');
      }

      updateStatusBanners();
    }

export function applySignoffRowPermissions(userRole) {
      const table = document.getElementById('signoff-table');
      if (!table) return;

      const roles = ['qa-lead', 'tech-lead', 'product-owner'];
      roles.forEach(role => {
        const row = table.querySelector(`tr[data-role-row="${role}"]`);
        if (!row) return;

        const canEdit = (userRole === 'super-admin' || userRole === role);
        row.querySelectorAll('.editable, [contenteditable]').forEach(el => {
          el.setAttribute('contenteditable', canEdit ? 'true' : 'false');
          el.style.pointerEvents = canEdit ? 'auto' : 'none';
        });
        row.querySelectorAll('select').forEach(sel => {
          sel.disabled = !canEdit;
          sel.style.pointerEvents = canEdit ? 'auto' : 'none';
        });
      });
    }

export function applySignatureHierarchy(userRole) {
      const qaSigned = !!document.querySelector('#sig-container-qa-lead img');
      const techSigned = !!document.querySelector('#sig-container-tech-lead img');

      // Default sembunyikan semua tombol TTD
      setElementStyle('btn-sig-qa-lead', 'display', 'none');
      setElementStyle('btn-sig-tech-lead', 'display', 'none');
      setElementStyle('btn-sig-product-owner', 'display', 'none');

      if (userRole === 'super-admin') {
        setElementStyle('btn-sig-qa-lead', 'display', 'inline-flex');
        setElementStyle('btn-sig-tech-lead', 'display', 'inline-flex');
        setElementStyle('btn-sig-product-owner', 'display', 'inline-flex');
      } else if (userRole === 'qa-lead') {
        setElementStyle('btn-sig-qa-lead', 'display', 'inline-flex');
      } else if (userRole === 'tech-lead') {
        // Tech Lead baru bisa melihat tombol TTD jika QA Lead sudah TTD
        if (qaSigned) {
          setElementStyle('btn-sig-tech-lead', 'display', 'inline-flex');
        }
      } else if (userRole === 'product-owner') {
        // Manager baru bisa melihat tombol TTD jika Tech Lead sudah TTD
        if (techSigned) {
          setElementStyle('btn-sig-product-owner', 'display', 'inline-flex');
        }
      }
    }

export function setGeneralEditable(enable) {
      document.querySelectorAll('[contenteditable], .editable-area, .doc-control-value, .editable, #rtm-table select, #defect-table select, #doc-system-prefix').forEach(el => {
        if (el.closest('#section-known-issues') || el.closest('#signoff-table')) return;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
          el.disabled = !enable;
          if (enable) el.removeAttribute('readonly');
          else el.setAttribute('readonly', 'readonly');
        } else {
          el.setAttribute('contenteditable', enable ? 'true' : 'false');
          el.style.pointerEvents = enable ? 'auto' : 'none';
        }
      });
    }

export function setKnownIssuesEditable(enable) {
      const knownArea = document.getElementById('known-issues-area');
      if (knownArea) {
        knownArea.setAttribute('contenteditable', enable ? 'true' : 'false');
        knownArea.style.pointerEvents = enable ? 'auto' : 'none';
      }
      document.querySelectorAll('#known-issues-table input, #known-issues-table textarea, #known-issues-table [contenteditable]').forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.disabled = !enable;
        } else {
          el.setAttribute('contenteditable', enable ? 'true' : 'false');
          el.style.pointerEvents = enable ? 'auto' : 'none';
        }
      });
    }

export function setAddButtonsVisible(visible) {
      const formView = document.getElementById('form-view');
      if (!formView) return;
      const modElements = formView.querySelectorAll(
        'button[onclick*="add"], button[onclick*="delete"], button[onclick*="import"], ' +
        '.add-evidence-btn, .btn-add-row, .btn-remove-row, .flowchart-area input[type="file"], .evidence-card input[type="file"], input[type="file"]'
      );
      modElements.forEach(el => {
        if (visible) {
          el.style.display = '';
          el.disabled = false;
        } else {
          el.style.display = 'none';
          el.disabled = true;
        }
      });
    }
