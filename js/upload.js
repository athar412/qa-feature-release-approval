import { state } from './state.js';

export function previewFlowchart(event) {
      const file = event.target.files[0];
      if (!file) return;
      const dropArea = event.target.closest('.flowchart-area');
      if (!dropArea) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const uploadText = dropArea.querySelector('.upload-text');
        const uploadHint = dropArea.querySelector('.upload-hint');
        if (uploadText) uploadText.style.display = 'none';
        if (uploadHint) uploadHint.style.display = 'none';

        let img = dropArea.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          dropArea.insertBefore(img, dropArea.firstChild);
        }
        img.src = e.target.result;
        img.alt = file.name;
      };
      reader.readAsDataURL(file);
    }

export function previewEvidence(event, inputEl) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const imgArea = inputEl.closest('.evidence-img-area');
        if (imgArea) {
          const uploadText = imgArea.querySelector('.upload-text');
          if (uploadText) uploadText.style.display = 'none';
          
          let img = imgArea.querySelector('img');
          if (!img) {
            img = document.createElement('img');
            img.style.cssText = 'width:100%; height:auto; max-height:180px; object-fit:cover; display:block;';
            imgArea.insertBefore(img, imgArea.firstChild);
          }
          img.src = e.target.result;
          img.alt = file.name;
        }
      };
      reader.readAsDataURL(file);
    }