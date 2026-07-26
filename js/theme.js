import { state } from './state.js';

export function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('holycat_theme', newTheme);

      updateThemeToggleIcon(newTheme);
    }

export function updateThemeToggleIcon(theme) {
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

export function initTheme() {
      const savedTheme = localStorage.getItem('holycat_theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeToggleIcon(savedTheme);
    }
