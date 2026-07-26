import { state } from './state.js';
import './globals.js';
import { checkAuth } from './auth.js';
import { showHomeView, showFormView } from './navigation.js';
import './dot-cursor.js'; // Execute dot cursor effect

// 1. Snapshot Pristine HTML
state.PRISTINE_PAGE_HTML = (function () {
  const el = document.querySelector('.page-container');
  return el ? el.innerHTML : '';
})();

// 2. Init Supabase
try {
  if (typeof window.supabase !== 'undefined' && state.SUPABASE_URL && !state.SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
    state.supabaseClient = window.supabase.createClient(state.SUPABASE_URL, state.SUPABASE_ANON_KEY);
    console.log("Supabase client active.");
  }
} catch (e) {
  console.warn("Supabase credentials not configured yet, falling back to local storage.", e);
}

// 3. Init Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForPublicForm2026AQ",
  authDomain: "holycat-qa-approval.firebaseapp.com",
  projectId: "holycat-qa-approval",
  storageBucket: "holycat-qa-approval.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo123456"
};
try {
  if (window.firebase && window.firebase.initializeApp) {
    window.firebase.initializeApp(firebaseConfig);
    state.db = window.firebase.firestore();
  }
} catch(e) {
  console.log('Firebase fallback to LocalStorage');
}

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
