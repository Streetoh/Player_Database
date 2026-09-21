/**
 * JK Noova Academy - Interactive Photo Cropper / Adjuster
 * Permite recortar, rotar, hacer zoom y desplazar la foto conservando siempre la imagen original sin pérdida ni bordes negros.
 */

(function() {
  let cropperModal = null;
  let cropperCanvas = null;
  let ctx = null;
  let sourceImage = null;
  let originalImageBase64 = null;
  let onCompleteCallback = null;

  let zoom = 1.0;
  let panX = 0;
  let panY = 0;
  let rotation = 0; // 0, 90, 180, 270

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startPanX = 0;
  let startPanY = 0;

  /**
   * Normaliza un archivo de imagen a una resolución maestra HD (máx 1200px)
   * para conservar máxima nitidez sin saturar el almacenamiento de LocalStorage.
   */
  function normalizeImageSource(fileOrDataUrl, maxDim = 1200) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const cx = c.getContext('2d');
          cx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.90));
        } else {
          // Si ya es un dataURL y mide <= 1200px
          if (typeof fileOrDataUrl === 'string') {
            resolve(fileOrDataUrl);
          } else {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(fileOrDataUrl);
          }
        }
      };
      img.onerror = () => {
        if (typeof fileOrDataUrl === 'string') {
          resolve(fileOrDataUrl);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(fileOrDataUrl);
        }
      };

      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(fileOrDataUrl);
      }
    });
  }

  function injectModalIfNeeded() {
    if (document.getElementById('modal-photo-crop')) {
      cropperModal = document.getElementById('modal-photo-crop');
      cropperCanvas = document.getElementById('photo-crop-canvas');
      if (cropperCanvas) ctx = cropperCanvas.getContext('2d');
      return;
    }

    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal-backdrop';
    modalDiv.id = 'modal-photo-crop';
    modalDiv.setAttribute('data-no-backdrop-close', 'true');
    modalDiv.style.zIndex = '3000';

    modalDiv.innerHTML = `
      <div class="modal-window" style="max-width: 460px; box-shadow: 0 10px 40px rgba(0,0,0,0.85);">
        <div class="modal-header">
          <h3 style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem;">
            <span>✂️</span> Ajustar y encuadrar foto
          </h3>
          <button type="button" class="modal-close-btn" id="crop-modal-btn-close">&times;</button>
        </div>
        <div class="modal-body" style="align-items: center; padding: 1.25rem; gap: 1rem;">
          <p style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin: 0;">
            Arrastra con el ratón o dedo para centrar la cara y usa el zoom. La foto original completa nunca se pierde.
          </p>
          
          <div class="photo-crop-viewport-container" id="photo-crop-viewport" style="background: #18233c;">
            <canvas id="photo-crop-canvas" class="photo-crop-canvas" width="270" height="270"></canvas>
            <div class="photo-crop-overlay-guide"></div>
          </div>

          <div class="photo-crop-toolbar" style="flex-wrap: wrap; gap: 0.75rem;">
            <div class="photo-crop-slider-group" style="flex: 1; min-width: 200px;">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">🔍 Zoom</span>
              <button type="button" class="btn btn-secondary btn-xs" id="crop-btn-zoom-out" style="padding: 0.25rem 0.55rem; font-weight: 800;">-</button>
              <input type="range" id="crop-slider-zoom" min="0.5" max="3.5" step="0.05" value="1">
              <button type="button" class="btn btn-secondary btn-xs" id="crop-btn-zoom-in" style="padding: 0.25rem 0.55rem; font-weight: 800;">+</button>
            </div>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button type="button" class="btn btn-secondary btn-xs" id="crop-btn-rotate" title="Rotar 90 grados" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                🔄 Rotar
              </button>
              <button type="button" class="btn btn-secondary btn-xs" id="crop-btn-change-file" title="Cargar otra foto desde el dispositivo" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: var(--accent-cyan);">
                📷 Cambiar foto
              </button>
              <input type="file" id="crop-file-picker-input" accept="image/*" style="display: none;">
            </div>
          </div>
        </div>
        <div class="modal-footer" style="justify-content: space-between;">
          <button type="button" class="btn btn-secondary" id="crop-btn-cancel">Cancelar</button>
          <button type="button" class="btn btn-primary" id="crop-btn-apply">✅ Aplicar foto</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
    cropperModal = modalDiv;
    cropperCanvas = document.getElementById('photo-crop-canvas');
    if (cropperCanvas) ctx = cropperCanvas.getContext('2d');

    setupEventListeners();
  }

  function setupEventListeners() {
    const btnClose = document.getElementById('crop-modal-btn-close');
    const btnCancel = document.getElementById('crop-btn-cancel');
    const btnApply = document.getElementById('crop-btn-apply');
    const zoomSlider = document.getElementById('crop-slider-zoom');
    const btnZoomIn = document.getElementById('crop-btn-zoom-in');
    const btnZoomOut = document.getElementById('crop-btn-zoom-out');
    const btnRotate = document.getElementById('crop-btn-rotate');
    const btnChangeFile = document.getElementById('crop-btn-change-file');
    const filePicker = document.getElementById('crop-file-picker-input');
    const viewport = document.getElementById('photo-crop-viewport');

    if (btnClose) btnClose.onclick = closeCropper;
    if (btnCancel) btnCancel.onclick = closeCropper;

    if (btnChangeFile && filePicker) {
      btnChangeFile.onclick = () => filePicker.click();
      filePicker.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const normalized = await normalizeImageSource(file, 1200);
        originalImageBase64 = normalized;
        zoom = 1.0;
        panX = 0;
        panY = 0;
        rotation = 0;
        if (zoomSlider) zoomSlider.value = 1.0;

        sourceImage = new Image();
        sourceImage.onload = () => draw();
        sourceImage.src = normalized;
      };
    }

    if (btnApply) {
      btnApply.onclick = () => {
        if (!sourceImage || !onCompleteCallback) {
          closeCropper();
          return;
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = 360;
        outCanvas.height = 360;
        const outCtx = outCanvas.getContext('2d');

        // Renderizado proporcional exacto idéntico a la vista previa
        renderCroppedToContext(outCtx, 360, 360);

        // Se usa PNG para garantizar transparencia limpia y 0 bordes negros
        const resultCroppedBase64 = outCanvas.toDataURL('image/png');

        const cropSettings = { zoom, panX, panY, rotation };
        const rawPhoto = originalImageBase64 || resultCroppedBase64;

        const cb = onCompleteCallback;
        closeCropper();
        if (typeof cb === 'function') {
          cb(resultCroppedBase64, rawPhoto, cropSettings);
        }
      };
    }

    if (zoomSlider) {
      zoomSlider.oninput = (e) => {
        zoom = parseFloat(e.target.value) || 1.0;
        draw();
      };
    }

    if (btnZoomIn) {
      btnZoomIn.onclick = () => {
        zoom = Math.min(3.5, zoom + 0.15);
        if (zoomSlider) zoomSlider.value = zoom;
        draw();
      };
    }

    if (btnZoomOut) {
      btnZoomOut.onclick = () => {
        zoom = Math.max(0.5, zoom - 0.15);
        if (zoomSlider) zoomSlider.value = zoom;
        draw();
      };
    }

    if (btnRotate) {
      btnRotate.onclick = () => {
        rotation = (rotation + 90) % 360;
        draw();
      };
    }

    // Arrastre con ratón o táctil
    if (viewport) {
      viewport.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPanX = panX;
        startPanY = panY;
        viewport.setPointerCapture(e.pointerId);
      });

      viewport.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Desplazamiento 1:1 intuitivo con la mano o ratón
        panX = startPanX + dx;
        panY = startPanY + dy;
        draw();
      });

      const endDrag = (e) => {
        if (isDragging) {
          isDragging = false;
          try {
            viewport.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }
      };

      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);

      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoom = Math.max(0.5, Math.min(3.5, zoom + delta));
        if (zoomSlider) zoomSlider.value = zoom;
        draw();
      }, { passive: false });
    }
  }

  /**
   * Dibuja la imagen centrada y escalada proporcionalmente según la dimensión del lienzo destino (W, H).
   * El cálculo es 100% idéntico tanto para la previsualización interactiva (270x270) como para la exportación (360x360).
   */
  function renderCroppedToContext(targetCtx, W, H) {
    if (!sourceImage || !targetCtx) return;

    const scaleFactor = W / 270;
    const effPanX = panX * scaleFactor;
    const effPanY = panY * scaleFactor;

    const naturalW = sourceImage.naturalWidth || sourceImage.width;
    const naturalH = sourceImage.naturalHeight || sourceImage.height;

    const isFlipped = rotation === 90 || rotation === 270;
    const effImgW = isFlipped ? naturalH : naturalW;
    const effImgH = isFlipped ? naturalW : naturalH;

    // Escala base para cubrir el círculo al 100% en zoom 1.0
    const baseScale = Math.max(W / effImgW, H / effImgH);
    const totalScale = baseScale * zoom;

    const drawW = naturalW * totalScale;
    const drawH = naturalH * totalScale;

    targetCtx.clearRect(0, 0, W, H);
    targetCtx.save();

    // 1. Trasladar al centro del lienzo con desplazamiento de usuario
    targetCtx.translate((W / 2) + effPanX, (H / 2) + effPanY);

    // 2. Rotar alrededor del centro de la imagen
    targetCtx.rotate((rotation * Math.PI) / 180);

    // 3. Dibujar la imagen centrada en (0, 0)
    targetCtx.drawImage(
      sourceImage,
      - (drawW / 2),
      - (drawH / 2),
      drawW,
      drawH
    );

    targetCtx.restore();
  }

  function draw() {
    if (!ctx || !cropperCanvas) return;
    renderCroppedToContext(ctx, 270, 270);
  }

  /**
   * openCropper
   * @param {string|File|Blob} imageInput - Imagen original sin recortar
   * @param {Object} [existingSettings] - Parámetros previos { zoom, panX, panY, rotation }
   * @param {Function} callback - function(croppedBase64, originalPhotoBase64, cropSettings)
   */
  async function openCropper(imageInput, existingSettings, callback) {
    if (typeof existingSettings === 'function') {
      callback = existingSettings;
      existingSettings = null;
    }

    injectModalIfNeeded();
    onCompleteCallback = callback;

    // Restaurar o inicializar parámetros de encuadre
    if (existingSettings && typeof existingSettings === 'object') {
      zoom = typeof existingSettings.zoom === 'number' ? existingSettings.zoom : 1.0;
      panX = typeof existingSettings.panX === 'number' ? existingSettings.panX : 0;
      panY = typeof existingSettings.panY === 'number' ? existingSettings.panY : 0;
      rotation = typeof existingSettings.rotation === 'number' ? existingSettings.rotation : 0;
    } else {
      zoom = 1.0;
      panX = 0;
      panY = 0;
      rotation = 0;
    }

    const zoomSlider = document.getElementById('crop-slider-zoom');
    if (zoomSlider) zoomSlider.value = zoom;

    const normalizedDataUrl = await normalizeImageSource(imageInput, 1200);
    originalImageBase64 = normalizedDataUrl;

    sourceImage = new Image();
    sourceImage.onload = () => {
      openModal(cropperModal);
      draw();
    };
    sourceImage.src = normalizedDataUrl;
  }

  function closeCropper() {
    if (cropperModal) {
      closeModal(cropperModal);
    }
  }

  window.openPhotoCropper = openCropper;
})();
