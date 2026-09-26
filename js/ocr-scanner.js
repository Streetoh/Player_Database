/**
 * JK Noova Academy - OCR Scanner & UI Controller
 * Permite importar jugadores a partir de capturas de pantalla de Sportlyzer/perfiles.
 */

(function () {
  let currentExtractedData = null;
  let isScanning = false;

  /**
   * Preprocesa una imagen (aumenta escala si es pequeña, limpia anotaciones y mejora nitidez)
   * para maximizar la tasa de acierto del motor OCR.
   * @param {HTMLImageElement|ImageBitmap} img
   * @returns {string} Data URL en formato PNG nítido sin pérdidas
   */
  function preprocessImageToCanvas(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;

    // Escalar la imagen para que el texto pequeño tenga al menos 2200px de ancho y no pierda nitidez
    let scale = 1;
    if (w < 2200) {
      scale = Math.min(3.2, Math.max(1.8, 2200 / w));
    }
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);

    // Dibujar imagen escalada
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Filtrar anotaciones rojas dibujadas sobre capturas para no estorbar el OCR
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Si el píxel es rojizo o rosa (flechas o recuadros dibujados por el usuario)
        if (r > g + 25 && r > b + 25 && r > 110) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
          continue;
        }
        // Limpiar fondos casi blancos
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        if (gray > 215) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Ignorar si hay restricción de canvas tainted
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Crea un recorte enfocado en la cabecera del perfil (Nombre y badges del jugador)
   * escalado y optimizado para OCR de alta precisión.
   * @param {HTMLImageElement|ImageBitmap} img
   * @returns {string} Data URL en formato PNG
   */
  function createHeaderCropBase64(img) {
    try {
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const cropW = Math.round(w * 0.45);
      const cropH = Math.round(h * 0.22);
      canvas.width = cropW * 3;
      canvas.height = cropH * 3;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, cropW, cropH, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > d[i + 1] + 25 && d[i] > d[i + 2] + 25 && d[i] > 110) {
          d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (e) {
      return '';
    }
  }

  /**
   * Abre el modal de importación por captura OCR
   */
  function openOcrImportModal() {
    const modal = document.getElementById('modal-ocr-import');
    if (!modal) return;

    resetOcrModal();

    if (typeof openModal === 'function') {
      openModal(modal);
    } else {
      modal.classList.add('active');
    }
  }

  /**
   * Cierra el modal de importación por captura OCR
   */
  function closeOcrModal() {
    const modal = document.getElementById('modal-ocr-import');
    if (!modal) return;

    if (typeof closeModal === 'function') {
      closeModal(modal);
    } else {
      modal.classList.remove('active');
    }
  }

  /**
   * Reinicia los estados del modal a la pantalla de subida inicial
   */
  function resetOcrModal() {
    currentExtractedData = null;
    isScanning = false;

    const dropZone = document.getElementById('ocr-dropzone');
    const loadingWrap = document.getElementById('ocr-loading-wrap');
    const resultsWrap = document.getElementById('ocr-results-wrap');
    const fileInput = document.getElementById('ocr-file-input');

    if (dropZone) dropZone.style.display = 'block';
    if (loadingWrap) loadingWrap.style.display = 'none';
    if (resultsWrap) resultsWrap.style.display = 'none';
    if (fileInput) fileInput.value = '';

    const progressBar = document.getElementById('ocr-progress-bar');
    const progressText = document.getElementById('ocr-progress-text');
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = 'Preparando imagen...';

    const btnContinue = document.getElementById('btn-ocr-continue-form');
    const btnSaveDirect = document.getElementById('btn-ocr-save-direct');
    if (btnContinue) btnContinue.style.display = 'none';
    if (btnSaveDirect) btnSaveDirect.style.display = 'none';
  }

  /**
   * Procesa un archivo de imagen (Blob o File)
   */
  function processImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Por favor, selecciona o pega una captura de pantalla válida', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const img = new Image();
      img.onload = () => {
        // Preprocesar con canvas (imagen completa optimizada y recorte de cabecera)
        const enhancedBase64 = preprocessImageToCanvas(img);
        const headerCropBase64 = createHeaderCropBase64(img);
        runOcrExtraction(enhancedBase64, headerCropBase64);
      };
      img.src = base64Data;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Ejecuta el escaneo OCR probando primero el backend y con fallback a Tesseract.js en cliente
   */
  async function runOcrExtraction(imageBase64, headerCropBase64 = '') {
    if (isScanning) return;
    isScanning = true;

    const dropZone = document.getElementById('ocr-dropzone');
    const loadingWrap = document.getElementById('ocr-loading-wrap');
    const resultsWrap = document.getElementById('ocr-results-wrap');
    const progressBar = document.getElementById('ocr-progress-bar');
    const progressText = document.getElementById('ocr-progress-text');

    if (dropZone) dropZone.style.display = 'none';
    if (resultsWrap) resultsWrap.style.display = 'none';
    if (loadingWrap) loadingWrap.style.display = 'block';

    const updateProgress = (pct, msg) => {
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = msg;
    };

    updateProgress(20, 'Optimizando captura...');

    const teams = (window.JKNoovaData && window.JKNoovaData.StorageService) 
      ? window.JKNoovaData.StorageService.getTeams() 
      : [];

    let extracted = null;

    // 1. Intentar con el endpoint de Node.js si estamos en entorno http://localhost o similar
    const canUseServer = window.location && window.location.protocol.startsWith('http');
    if (canUseServer) {
      try {
        updateProgress(45, 'Escaneando texto con motor rápido...');
        const resp = await fetch('/api/ocr-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageBase64, headerImage: headerCropBase64, teams })
        });
        if (resp.ok) {
          const json = await resp.json();
          if (json.ok && json.data) {
            extracted = json.data;
            updateProgress(100, '¡Datos extraídos con éxito!');
          }
        }
      } catch (e) {
        console.warn('Endpoint /api/ocr-extract no disponible, intentando en cliente:', e);
      }
    }

    // 2. Si no se pudo en servidor, ejecutar con Tesseract.js en el cliente
    if (!extracted) {
      updateProgress(40, 'Cargando motor de reconocimiento OCR...');
      try {
        if (typeof Tesseract === 'undefined' && !window.Tesseract) {
          // Cargar script dinámicamente si no está presente
          await loadTesseractLibrary();
        }

        const tesseractEngine = window.Tesseract || Tesseract;
        if (!tesseractEngine) {
          throw new Error('No se pudo inicializar la librería Tesseract.js');
        }

        updateProgress(65, 'Reconociendo caracteres y datos...');
        const ocrResult = await tesseractEngine.recognize(imageBase64, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text' && m.progress) {
              const p = Math.round(50 + m.progress * 35);
              updateProgress(p, `Extrayendo texto (${Math.round(m.progress * 100)}%)...`);
            }
          }
        });

        let rawText = ocrResult?.data?.text || '';
        const parser = window.JKNoovaOCRParser;
        if (parser && typeof parser.parseProfileScreenshot === 'function') {
          extracted = parser.parseProfileScreenshot(rawText, teams);

          // Si el nombre no fue capturado en la imagen completa y disponemos del recorte de cabecera
          if ((!extracted.name || !extracted.lastName) && headerCropBase64) {
            updateProgress(90, 'Extrayendo nombre del jugador...');
            try {
              const hResult = await tesseractEngine.recognize(headerCropBase64, 'eng');
              const hText = hResult?.data?.text || '';
              if (hText.trim().length > 0) {
                rawText = hText + '\n' + rawText;
                extracted = parser.parseProfileScreenshot(rawText, teams);
              }
            } catch (hErr) {
              console.warn('Fallback de cabecera en cliente omitido:', hErr);
            }
          }
        } else {
          extracted = { rawText, name: '', lastName: '', dorsal: null, birthDate: '' };
        }
        updateProgress(100, '¡Extracción completada!');
      } catch (clientErr) {
        console.error('Error en OCR cliente:', clientErr);
        showToast('No se pudo procesar la captura con OCR: ' + clientErr.message, 'error');
        resetOcrModal();
        return;
      }
    }

    isScanning = false;
    currentExtractedData = extracted;

    // Mostrar pantalla de resultados y verificación
    renderOcrResults(extracted, imageBase64);
  }

  /**
   * Carga dinámica de Tesseract.js si no estaba en la página
   */
  function loadTesseractLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Intentar primero desde biblioteca local
      script.src = 'js/libs/tesseract.min.js';
      script.onload = () => resolve();
      script.onerror = () => {
        // Fallback a CDN
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        cdnScript.onload = () => resolve();
        cdnScript.onerror = (err) => reject(err);
        document.head.appendChild(cdnScript);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Rellena la vista de resultados editables del OCR
   */
  function renderOcrResults(data, imageBase64) {
    const loadingWrap = document.getElementById('ocr-loading-wrap');
    const resultsWrap = document.getElementById('ocr-results-wrap');

    if (loadingWrap) loadingWrap.style.display = 'none';
    if (resultsWrap) resultsWrap.style.display = 'block';

    const btnContinue = document.getElementById('btn-ocr-continue-form');
    const btnSaveDirect = document.getElementById('btn-ocr-save-direct');
    if (btnContinue) btnContinue.style.display = 'inline-flex';
    if (btnSaveDirect) btnSaveDirect.style.display = 'inline-flex';

    const parser = window.JKNoovaOCRParser;

    // Rellenar campos de previsualización
    const inName = document.getElementById('ocr-res-name');
    const inLastName = document.getElementById('ocr-res-lastname');
    const inBirth = document.getElementById('ocr-res-birthdate');
    const inDorsal = document.getElementById('ocr-res-dorsal');
    const inTeam = document.getElementById('ocr-res-team');
    const inGName = document.getElementById('ocr-res-guardian-name');
    const inGPhone = document.getElementById('ocr-res-guardian-phone');
    const inGEmail = document.getElementById('ocr-res-guardian-email');
    const inGRel = document.getElementById('ocr-res-guardian-rel');
    const imgPreview = document.getElementById('ocr-res-image-preview');

    if (inName) inName.value = data.name || '';
    if (inLastName) inLastName.value = data.lastName || '';
    if (inBirth) inBirth.value = data.birthDate || '';
    if (inDorsal) inDorsal.value = data.dorsal !== null && data.dorsal !== undefined ? data.dorsal : '';
    if (inGName) inGName.value = data.guardianName || '';

    // Normalizar teléfono con formato estonio +372
    const formattedPhone = (parser && typeof parser.formatEstonianPhone === 'function')
      ? parser.formatEstonianPhone(data.guardianPhone)
      : (data.guardianPhone || '');
    if (inGPhone) {
      inGPhone.value = formattedPhone;
      // Auto-formatear al perder el foco si el usuario escribe números
      inGPhone.onblur = () => {
        if (inGPhone.value && parser && typeof parser.formatEstonianPhone === 'function') {
          inGPhone.value = parser.formatEstonianPhone(inGPhone.value);
        }
      };
    }

    if (inGEmail) inGEmail.value = data.guardianEmail || '';
    if (inGRel) inGRel.value = data.guardianRelation || 'Madre';

    if (imgPreview && imageBase64) {
      imgPreview.src = imageBase64;
      imgPreview.style.display = 'block';
    }

    // Poblar selector de equipos con asignación automática por año de nacimiento
    if (inTeam) {
      inTeam.innerHTML = '';
      const teams = (window.JKNoovaData && window.JKNoovaData.StorageService) 
        ? window.JKNoovaData.StorageService.getTeams() 
        : [];
      
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '-- Seleccionar equipo --';
      inTeam.appendChild(defaultOpt);

      teams.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.name} (${t.category || ''})`;
        if (data.teamId && data.teamId === t.id) {
          opt.selected = true;
        }
        inTeam.appendChild(opt);
      });

      // Si no se asignó equipo de forma explícita, calcularlo estrictamente por año de nacimiento (ej. 2017 -> U10)
      if (!inTeam.value && data.birthDate && parser && typeof parser.assignTeamByBirthYear === 'function') {
        const assigned = parser.assignTeamByBirthYear(data.birthDate, teams);
        if (assigned && assigned.teamId) {
          inTeam.value = assigned.teamId;
        }
      } else if (!inTeam.value && data.birthDate && typeof suggestTeamForBirthDate === 'function') {
        const suggestedId = suggestTeamForBirthDate(data.birthDate);
        if (suggestedId) inTeam.value = suggestedId;
      }

      // Si el usuario edita o cambia la fecha de nacimiento, re-sincronizar el equipo automáticamente
      if (inBirth) {
        inBirth.onchange = () => {
          if (inBirth.value && parser && typeof parser.assignTeamByBirthYear === 'function') {
            const reAssigned = parser.assignTeamByBirthYear(inBirth.value, teams);
            if (reAssigned && reAssigned.teamId) {
              inTeam.value = reAssigned.teamId;
            }
          }
        };
      }
    }
  }

  /**
   * Obtiene los datos finales verificados del formulario del OCR
   */
  function getVerifiedOcrData() {
    const name = document.getElementById('ocr-res-name')?.value.trim() || '';
    const lastName = document.getElementById('ocr-res-lastname')?.value.trim() || '';
    const birthDate = document.getElementById('ocr-res-birthdate')?.value || '';
    const dorsalStr = document.getElementById('ocr-res-dorsal')?.value.trim() || '';
    const dorsal = dorsalStr ? parseInt(dorsalStr, 10) : null;
    const teamId = document.getElementById('ocr-res-team')?.value || '';
    const guardianName = document.getElementById('ocr-res-guardian-name')?.value.trim() || '';
    
    // Normalizar teléfono guardado siempre con formato estonio +372
    const rawPhone = document.getElementById('ocr-res-guardian-phone')?.value.trim() || '';
    const parser = window.JKNoovaOCRParser;
    const guardianPhone = (parser && typeof parser.formatEstonianPhone === 'function')
      ? parser.formatEstonianPhone(rawPhone)
      : rawPhone;

    const guardianEmail = document.getElementById('ocr-res-guardian-email')?.value.trim() || '';
    const guardianRel = document.getElementById('ocr-res-guardian-rel')?.value || 'Madre';

    return {
      name,
      lastName,
      birthDate,
      dorsal,
      teamId,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation: guardianRel
    };
  }

  /**
   * Guarda directamente el jugador en la base de datos (1 clic)
   */
  function saveOcrPlayerDirectly() {
    const data = getVerifiedOcrData();

    if (!data.name) {
      showToast('Por favor, indica al menos el nombre del jugador', 'error');
      document.getElementById('ocr-res-name')?.focus();
      return;
    }

    const storage = window.JKNoovaData?.StorageService;
    if (!storage) {
      showToast('Error de almacenamiento del club', 'error');
      return;
    }

    const teams = storage.getTeams();
    const finalTeamId = data.teamId || (teams[0] ? teams[0].id : 'team_u12');

    const newPlayer = {
      id: `p_custom_${Date.now()}`,
      name: data.name,
      lastName: data.lastName,
      nickname: '',
      birthDate: data.birthDate,
      firstTrainingDate: '',
      teamId: finalTeamId,
      mainDorsal: data.dorsal || null,
      secondaryDorsal: null,
      foot: 'Diestro',
      mainPosition: 'Jugador',
      secondaryPosition: '',
      photo: '',
      originalPhoto: '',
      photoTransform: { zoom: 1, panX: 50, panY: 50, rotation: 0 },
      familyContacts: data.guardianName || data.guardianPhone ? [{
        relation: data.guardianRelation || 'Madre',
        name: data.guardianName || '',
        phone: data.guardianPhone || '',
        email: data.guardianEmail || '',
        isEmergency: true
      }] : [],
      parentContact: {
        name: data.guardianName || '',
        phone: data.guardianPhone || '',
        email: data.guardianEmail || ''
      },
      medicalNotes: '',
      hasMedicalAlert: false,
      coachNotes: [],
      equipment: window.JKNoovaData?.createDefaultEquipment ? window.JKNoovaData.createDefaultEquipment() : { official: {}, accessories: {} }
    };

    const players = storage.getPlayers();
    players.push(newPlayer);
    storage.savePlayers(players);

    closeOcrModal();
    showToast(`✅ Jugador ${newPlayer.name} ${newPlayer.lastName} registrado con éxito`, 'success');

    // Recargar vista si estamos en la página de jugadores
    if (typeof loadDataFromStorage === 'function') loadDataFromStorage();
    if (typeof renderCategoryPills === 'function') renderCategoryPills();
    if (typeof renderPlayersList === 'function') renderPlayersList();
    if (typeof updateStatsStrip === 'function') updateStatsStrip();
  }

  /**
   * Abre la ficha completa del jugador con los datos extraídos pre-rellenados
   */
  function continueToPlayerForm() {
    const data = getVerifiedOcrData();
    closeOcrModal();

    if (typeof window.openPlayerModalWithData === 'function') {
      window.openPlayerModalWithData(data);
    } else if (typeof openPlayerModal === 'function') {
      openPlayerModal(null);
      setTimeout(() => {
        applyDataToPlayerModal(data);
      }, 50);
    }
  }

  /**
   * Rellena el formulario del modal de jugador existente con los datos OCR
   */
  function applyDataToPlayerModal(data) {
    if (!data) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal('player-name', data.name);
    setVal('player-lastname', data.lastName);
    setVal('player-birthdate', data.birthDate);
    if (data.dorsal) setVal('player-dorsal-main', data.dorsal);
    if (data.teamId) setVal('player-team', data.teamId);

    // Familiares
    if (data.guardianName || data.guardianPhone || data.guardianEmail) {
      if (typeof window.tempFamilyContacts !== 'undefined') {
        window.tempFamilyContacts = [{
          relation: data.guardianRelation || 'Madre',
          name: data.guardianName || '',
          phone: data.guardianPhone || '',
          email: data.guardianEmail || '',
          isEmergency: true
        }];
        if (typeof renderFamilyContactsList === 'function') renderFamilyContactsList();
      }
    }

    if (typeof updateHeroProfileCard === 'function') updateHeroProfileCard();
    if (typeof checkPlayerModalDorsalConflict === 'function') checkPlayerModalDorsalConflict();
  }

  /**
   * Inicializa los eventos del módulo OCR
   */
  function initOcrImportModule() {
    // Botón principal "Importar desde captura"
    const btnOpen = document.getElementById('btn-import-player-ocr');
    if (btnOpen) {
      btnOpen.onclick = openOcrImportModal;
    }

    // Botón de pegar desde portapapeles en el modal
    const btnPaste = document.getElementById('btn-ocr-paste-clipboard');
    if (btnPaste) {
      btnPaste.onclick = async () => {
        try {
          if (!navigator.clipboard || !navigator.clipboard.read) {
            showToast('Pulsa Ctrl+V para pegar la captura directamente', 'info');
            return;
          }
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(t => t.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              processImageFile(blob);
              return;
            }
          }
          showToast('No se encontró ninguna imagen en el portapapeles. Copia una captura y pulsa Ctrl+V', 'warning');
        } catch (e) {
          showToast('Pulsa Ctrl+V para pegar la imagen copiada', 'info');
        }
      };
    }

    // Escuchador global de Ctrl+V / Pegar imagen
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            openOcrImportModal();
            processImageFile(file);
            break;
          }
        }
      }
    });

    // Zona de arrastre (Drag & Drop)
    const dropZone = document.getElementById('ocr-dropzone');
    const fileInput = document.getElementById('ocr-file-input');

    if (dropZone && fileInput) {
      dropZone.onclick = () => fileInput.click();

      fileInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) processImageFile(file);
      };

      dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      };

      dropZone.ondragleave = () => {
        dropZone.classList.remove('drag-over');
      };

      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) processImageFile(file);
      };
    }

    // Botones de acción en resultados
    const btnContinue = document.getElementById('btn-ocr-continue-form');
    if (btnContinue) {
      btnContinue.onclick = continueToPlayerForm;
    }

    const btnSaveDirect = document.getElementById('btn-ocr-save-direct');
    if (btnSaveDirect) {
      btnSaveDirect.onclick = saveOcrPlayerDirectly;
    }

    const btnScanAnother = document.getElementById('btn-ocr-scan-another');
    if (btnScanAnother) {
      btnScanAnother.onclick = resetOcrModal;
    }
  }

  // Exponer API global
  window.openOcrImportModal = openOcrImportModal;
  window.closeOcrModal = closeOcrModal;
  window.applyDataToPlayerModal = applyDataToPlayerModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOcrImportModule);
  } else {
    initOcrImportModule();
  }
})();
