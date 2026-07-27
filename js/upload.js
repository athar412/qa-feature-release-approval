import { state } from './state.js';

function compressImage(file, maxDimension = 900, quality = 0.65) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = function() {
        resolve(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.onerror = function() {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}

export async function previewFlowchart(event) {
      const file = event.target.files[0];
      if (!file) return;
      const dropArea = event.target.closest('.flowchart-area');
      if (!dropArea) return;

      const compressedSrc = await compressImage(file, 1280, 0.78);
      if (!compressedSrc) return;

      const uploadText = dropArea.querySelector('.upload-text');
      const uploadHint = dropArea.querySelector('.upload-hint');
      if (uploadText) uploadText.style.display = 'none';
      if (uploadHint) uploadHint.style.display = 'none';

      let img = dropArea.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        dropArea.insertBefore(img, dropArea.firstChild);
      }
      img.src = compressedSrc;
      img.alt = file.name;
    }

export async function previewEvidence(event, inputEl) {
      const file = event.target.files[0];
      if (!file) return;
      const imgArea = inputEl.closest('.evidence-img-area');
      if (!imgArea) return;

      const compressedSrc = await compressImage(file, 1080, 0.75);
      if (!compressedSrc) return;

      const uploadText = imgArea.querySelector('.upload-text');
      if (uploadText) uploadText.style.display = 'none';
      
      let img = imgArea.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.style.cssText = 'width:100%; height:auto; max-height:220px; object-fit:contain; display:block; margin:0 auto;';
        imgArea.insertBefore(img, imgArea.firstChild);
      }
      img.src = compressedSrc;
      img.alt = file.name;
    }
