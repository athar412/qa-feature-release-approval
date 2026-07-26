import './globals.js';
import { checkAuth } from './auth.js';
import { showHomeView, showFormView } from './navigation.js';

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
