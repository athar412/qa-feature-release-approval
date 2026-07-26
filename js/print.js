import { state } from './state.js';

export function syncSelectPrintValues() {
        document.querySelectorAll('select').forEach(function (sel) {
          sel.setAttribute('data-val', sel.value);
        });
      }
