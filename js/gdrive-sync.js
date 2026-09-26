/**
 * JK NOOVA - Sincronización en la Nube con Google Drive
 * Permite sincronizar en tiempo real PC (localhost) <-> Google Drive <-> Móvil (Android APK / Web)
 * Utiliza un conector ligero, seguro y gratuito de Google Apps Script alojado en la cuenta del usuario.
 */

const GoogleDriveSync = {
  STORAGE_KEY_URL: 'jknoova_gdrive_sync_url_v1',
  STORAGE_KEY_LAST_SYNC: 'jknoova_gdrive_last_sync_v1',
  _debounceTimer: null,
  _isSyncing: false,

  getUrl() {
    if (typeof window === 'undefined' || !window.SafeStorage) {
      try { return localStorage.getItem(this.STORAGE_KEY_URL) || ''; } catch (e) { return ''; }
    }
    return window.SafeStorage.getItem(this.STORAGE_KEY_URL) || '';
  },

  setUrl(url) {
    const clean = (url || '').trim();
    if (typeof window !== 'undefined') {
      if (window.SafeStorage) {
        window.SafeStorage.setItem(this.STORAGE_KEY_URL, clean);
      }
      try { localStorage.setItem(this.STORAGE_KEY_URL, clean); } catch (e) {}
    }
    return clean;
  },

  getLastSyncTime() {
    if (typeof window === 'undefined' || !window.SafeStorage) {
      try { return localStorage.getItem(this.STORAGE_KEY_LAST_SYNC) || ''; } catch (e) { return ''; }
    }
    return window.SafeStorage.getItem(this.STORAGE_KEY_LAST_SYNC) || '';
  },

  setLastSyncTime() {
    const now = new Date().toISOString();
    if (typeof window !== 'undefined') {
      if (window.SafeStorage) {
        window.SafeStorage.setItem(this.STORAGE_KEY_LAST_SYNC, now);
      }
      try { localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, now); } catch (e) {}
    }
    return now;
  },

  isEnabled() {
    const url = this.getUrl();
    return !!url && url.startsWith('https://script.google.com/');
  },

  /**
   * Sube todos los datos actuales de la aplicación a Google Drive
   */
  async uploadToDrive(silent = false) {
    const url = this.getUrl();
    if (!this.isEnabled()) return { success: false, error: 'URL no configurada' };

    if (!window.JKNoovaData || !window.JKNoovaData.StorageService) {
      return { success: false, error: 'StorageService no disponible' };
    }

    try {
      this._isSyncing = true;
      this._setSyncButtonLoading('btn-gdrive-upload', true, 'Subiendo...');
      const fullData = window.JKNoovaData.StorageService.exportAllData();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: fullData,
        redirect: 'follow'
      });

      const resText = await response.text();
      let resJson = {};
      try { resJson = JSON.parse(resText); } catch (e) {}

      this._isSyncing = false;
      this._setSyncButtonLoading('btn-gdrive-upload', false, '⬆️ Subir a Drive');

      if (response.ok && (resJson.ok !== false)) {
        this.setLastSyncTime();
        if (!silent && typeof showToast === 'function') {
          showToast('☁️ Datos guardados y sincronizados con tu Google Drive', 'success');
        }
        this.updateUi();
        return { success: true, updatedAt: resJson.updatedAt || new Date().toISOString() };
      } else {
        throw new Error(resJson.error || 'Respuesta inválida de Google Drive');
      }
    } catch (err) {
      this._isSyncing = false;
      this._setSyncButtonLoading('btn-gdrive-upload', false, '⬆️ Subir a Drive');
      console.warn('[GoogleDriveSync] Error al subir datos:', err);
      if (!silent && typeof showToast === 'function') {
        showToast('Error al sincronizar con Google Drive: ' + err.message, 'error');
      }
      return { success: false, error: err.message };
    }
  },

  /**
   * Descarga la última base de datos desde Google Drive e integra los datos
   */
  async downloadFromDrive(silent = false) {
    const url = this.getUrl();
    if (!this.isEnabled()) return { success: false, error: 'URL no configurada' };

    if (!window.JKNoovaData || !window.JKNoovaData.StorageService) {
      return { success: false, error: 'StorageService no disponible' };
    }

    try {
      this._isSyncing = true;
      this._setSyncButtonLoading('btn-gdrive-download', true, 'Descargando...');
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al contactar con Google Drive`);
      }

      const jsonText = await response.text();
      let parsed = {};
      try {
        parsed = JSON.parse(jsonText);
      } catch (err) {
        throw new Error('El archivo en Google Drive no es un JSON válido');
      }

      // Si el archivo en Drive aún no tiene datos o está vacío
      if (parsed.empty) {
        console.log('[GoogleDriveSync] Archivo vacío en Drive, inicializando con datos locales...');
        await this.uploadToDrive(true);
        this._isSyncing = false;
        this._setSyncButtonLoading('btn-gdrive-download', false, '⬇️ Descargar de Drive');
        return { success: true, initialized: true };
      }

      // Seguridad adicional: si Drive contiene 0 jugadores pero localmente tenemos jugadores
      if (Array.isArray(parsed.players) && parsed.players.length === 0) {
        const localPlayers = window.JKNoovaData.StorageService.getPlayers();
        if (localPlayers && localPlayers.length > 0) {
          console.log('[GoogleDriveSync] Drive tiene 0 jugadores pero local tiene datos. Protegiendo y subiendo datos locales...');
          await this.uploadToDrive(true);
          this._isSyncing = false;
          this._setSyncButtonLoading('btn-gdrive-download', false, '⬇️ Descargar de Drive');
          return { success: true, protected: true };
        }
      }

      if (!parsed.players && !parsed.teams) {
        throw new Error('El archivo en Google Drive no contiene una estructura válida de JK Noova');
      }

      const res = await window.JKNoovaData.StorageService.importDataAsync(jsonText);
      this._isSyncing = false;
      this._setSyncButtonLoading('btn-gdrive-download', false, '⬇️ Descargar de Drive');

      if (res.success) {
        this.setLastSyncTime();
        this.updateUi();
        if (!silent && typeof showToast === 'function') {
          showToast('☁️ Base de datos sincronizada desde tu Google Drive', 'success');
        }
        window.dispatchEvent(new CustomEvent('jknoova_storage_synced'));
        return { success: true };
      } else {
        throw new Error(res.error || 'Error al importar datos');
      }
    } catch (err) {
      this._isSyncing = false;
      this._setSyncButtonLoading('btn-gdrive-download', false, '⬇️ Descargar de Drive');
      console.warn('[GoogleDriveSync] Error al descargar de Drive:', err);
      if (!silent && typeof showToast === 'function') {
        showToast('Error al conectar con Google Drive: ' + err.message, 'error');
      }
      return { success: false, error: err.message };
    }
  },

  /**
   * Sincronización diferida (Debounce) tras cualquier cambio local en PC o móvil
   */
  scheduleAutoUpload() {
    if (!this.isEnabled() || this._isSyncing) return;
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.uploadToDrive(true);
    }, 2000); // 2 segundos de margen para agrupar cambios rápidos
  },

  /**
   * Probar conexión con Google Apps Script
   */
  async testConnection(urlToTest = null) {
    const url = (urlToTest || this.getUrl()).trim();
    if (!url || !url.startsWith('https://script.google.com/')) {
      return { success: false, error: 'El enlace debe empezar por https://script.google.com/' };
    }

    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      let json = {};
      try { json = JSON.parse(text); } catch (e) {}
      return { success: true, data: json };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  _setSyncButtonLoading(btnId, isLoading, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = isLoading;
    if (text) btn.innerHTML = text;
  },

  /**
   * Inyecta la interfaz de Google Drive en el modal de configuración de la página
   */
  initUi() {
    const modalSettings = document.getElementById('modal-settings');
    if (!modalSettings) return;

    const modalBody = modalSettings.querySelector('.modal-body');
    if (!modalBody) return;

    if (document.getElementById('gdrive-sync-section')) {
      this.updateUi();
      return;
    }

    const syncCard = document.createElement('div');
    syncCard.id = 'gdrive-sync-section';
    syncCard.style.cssText = 'margin-bottom: 1.25rem; background: var(--bg-secondary, #1e293b); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 10px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';

    syncCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.35rem;">☁️</span>
          <div>
            <strong style="font-size: 0.95rem; color: var(--text-primary, #fff);">Sincronización en la Nube (Google Drive)</strong>
            <p style="font-size: 0.73rem; color: var(--text-muted, #94a3b8); margin: 0;">Sincroniza PC (localhost) ⇄ Móvil en tiempo real</p>
          </div>
        </div>
        <span id="gdrive-sync-badge" style="font-size: 0.72rem; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(148, 163, 184, 0.3); background: rgba(148, 163, 184, 0.1); color: #94a3b8; transition: all 0.3s ease;">
          ⚪ No conectado
        </span>
      </div>

      <div style="margin-top: 0.75rem;">
        <label for="gdrive-sync-url-input" style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary, #cbd5e1); margin-bottom: 4px;">
          URL de tu Web App de Google Apps Script:
        </label>
        <div style="display: flex; gap: 6px;">
          <input type="text" id="gdrive-sync-url-input" placeholder="https://script.google.com/macros/s/.../exec" style="flex: 1; font-size: 0.8rem; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--border-color, #334155); background: var(--bg-tertiary, #0f172a); color: var(--text-primary, #fff); outline: none;">
          <button type="button" class="btn btn-primary btn-sm" id="btn-gdrive-save-test" style="white-space: nowrap; padding: 7px 14px; font-size: 0.8rem; font-weight: 600; background: #2563eb;">
            Conectar
          </button>
        </div>
        <div id="gdrive-last-sync-time" style="font-size: 0.72rem; color: #10b981; margin-top: 5px; min-height: 16px;"></div>
      </div>

      <!-- Botones de sincronización manual -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 0.75rem;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-gdrive-upload" style="display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 0.78rem; padding: 7px 8px; font-weight: 500;">
          ⬆️ Subir a Drive
        </button>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-gdrive-download" style="display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 0.78rem; padding: 7px 8px; font-weight: 500;">
          ⬇️ Descargar de Drive
        </button>
      </div>

      <!-- Guía de configuración en 3 pasos con copiado rápido -->
      <details style="margin-top: 0.85rem; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 0.6rem;">
        <summary style="font-size: 0.76rem; color: #60a5fa; cursor: pointer; user-select: none; font-weight: 600;">
          📘 ¿Cómo configurar tu Google Drive en 2 minutos? (Paso a paso)
        </summary>
        <div style="font-size: 0.74rem; color: var(--text-secondary, #cbd5e1); line-height: 1.5; margin-top: 0.5rem; background: rgba(0,0,0,0.22); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
          <ol style="margin: 0; padding-left: 1.2rem;">
            <li>Entra en <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">script.google.com</a> con tu cuenta de Google y pulsa <strong>"Nuevo proyecto"</strong>.</li>
            <li>Borra todo el texto que aparezca, pulsa el botón <strong>"Copiar código del Script"</strong> de abajo y pégalo allí. Pulsa Guardar (Ctrl+S).</li>
            <li>Arriba a la derecha pulsa <strong>Implementar ➔ Nueva implementación</strong>:
              <ul style="margin: 3px 0; padding-left: 1rem;">
                <li>En Tipo (icono engranaje) elige: <strong>Aplicación web</strong>.</li>
                <li>En <em>Quién tiene acceso</em> elige: <strong>Cualquiera</strong> (Anyone).</li>
                <li>Pulsa <strong>Implementar</strong>, concede los permisos de tu cuenta y copia la <strong>URL de la aplicación web</strong> (termina en <code>/exec</code>).</li>
              </ul>
            </li>
            <li>Pega esa URL en el campo de arriba y pulsa <strong>Conectar</strong>. ¡Listo! Se creará un archivo <code>JK_Noova_Database.json</code> en tu Drive y se sincronizará automáticamente.</li>
          </ol>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-gdrive-copy-code" style="width: 100%; margin-top: 9px; font-size: 0.76rem; padding: 6px 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); color: #93c5fd;">
            📋 Copiar código de Google Apps Script
          </button>
        </div>
      </details>
    `;

    modalBody.insertBefore(syncCard, modalBody.firstChild);

    // Event listeners
    const input = document.getElementById('gdrive-sync-url-input');
    const btnSaveTest = document.getElementById('btn-gdrive-save-test');
    const btnUpload = document.getElementById('btn-gdrive-upload');
    const btnDownload = document.getElementById('btn-gdrive-download');
    const btnCopyCode = document.getElementById('btn-gdrive-copy-code');

    if (btnSaveTest && input) {
      btnSaveTest.onclick = async () => {
        const urlVal = (input.value || '').trim();
        if (!urlVal) {
          if (typeof showToast === 'function') showToast('Por favor introduce la URL de tu Google Apps Script', 'warning');
          return;
        }
        if (!urlVal.startsWith('https://script.google.com/')) {
          if (typeof showToast === 'function') showToast('La URL debe comenzar por https://script.google.com/', 'error');
          return;
        }

        btnSaveTest.disabled = true;
        btnSaveTest.textContent = 'Probando...';

        const testRes = await this.testConnection(urlVal);
        btnSaveTest.disabled = false;
        btnSaveTest.textContent = 'Conectar';

        if (testRes.success) {
          this.setUrl(urlVal);
          this.updateUi();
          if (typeof showToast === 'function') {
            showToast('✅ Conectado con éxito a tu Google Drive', 'success');
          }
          // Si el archivo en Drive está vacío o es nuevo, subir los datos actuales locales
          if (testRes.data && testRes.data.empty) {
            await this.uploadToDrive(true);
          } else {
            // Si ya existía, sincronizar
            await this.downloadFromDrive(false);
          }
        } else {
          if (typeof showToast === 'function') {
            showToast('❌ Error de conexión: ' + testRes.error + '. Comprueba los permisos (Cualquiera/Anyone).', 'error');
          }
        }
      };
    }

    if (btnUpload) {
      btnUpload.onclick = () => this.uploadToDrive(false);
    }

    if (btnDownload) {
      btnDownload.onclick = () => this.downloadFromDrive(false);
    }

    if (btnCopyCode) {
      btnCopyCode.onclick = () => this.copyCodeToClipboard();
    }

    this.updateUi();
  },

  copyCodeToClipboard() {
    const code = this.getScriptCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        if (typeof showToast === 'function') showToast('📋 Código de Google Apps Script copiado al portapapeles', 'success');
      }).catch(() => {
        this._fallbackCopyText(code);
      });
    } else {
      this._fallbackCopyText(code);
    }
  },

  _fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      if (typeof showToast === 'function') showToast('📋 Código copiado al portapapeles', 'success');
    } catch (err) {
      if (typeof showToast === 'function') showToast('No se pudo copiar automáticamente. Por favor selecciónalo manualmente.', 'warning');
    }
    document.body.removeChild(ta);
  },

  updateUi() {
    const badge = document.getElementById('gdrive-sync-badge');
    const input = document.getElementById('gdrive-sync-url-input');
    const lastSyncEl = document.getElementById('gdrive-last-sync-time');
    const headerIndicator = document.getElementById('header-sync-indicator');

    const isConn = this.isEnabled();
    const currentUrl = this.getUrl();

    if (input && !input.value && currentUrl) {
      input.value = currentUrl;
    }

    if (badge) {
      if (isConn) {
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.color = '#34d399';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.innerHTML = '🟢 Conectado';
      } else {
        badge.style.background = 'rgba(148, 163, 184, 0.15)';
        badge.style.color = '#94a3b8';
        badge.style.borderColor = 'rgba(148, 163, 184, 0.3)';
        badge.innerHTML = '⚪ No conectado';
      }
    }

    if (headerIndicator) {
      if (isConn) {
        headerIndicator.innerHTML = '☁️ <span style="font-size: 0.72rem; color: #34d399;">Nube OK</span>';
        headerIndicator.title = 'Conectado a Google Drive (Sincronización activa)';
      } else {
        headerIndicator.innerHTML = '☁️ <span style="font-size: 0.72rem; color: #94a3b8;">Nube</span>';
        headerIndicator.title = 'Configurar sincronización con Google Drive';
      }
    }

    if (lastSyncEl) {
      const last = this.getLastSyncTime();
      if (last) {
        try {
          const d = new Date(last);
          lastSyncEl.textContent = `Última sincronización: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch (e) {
          lastSyncEl.textContent = '';
        }
      } else {
        lastSyncEl.textContent = '';
      }
    }
  },

  // Código estándar de Google Apps Script para copiar y pegar
  getScriptCode() {
    return `// ========================================================
// JK NOOVA ACADEMY - Conector Oficial para Google Drive
// ========================================================
// Guarda este archivo en Google Apps Script y despliégalo
// como Aplicación Web ("Cualquiera" / "Anyone").

function doGet(e) {
  try {
    var files = DriveApp.getFilesByName("JK_Noova_Database.json");
    if (files.hasNext()) {
      var content = files.next().getBlob().getDataAsString();
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, empty: true, message: "Base de datos inicializada" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var files = DriveApp.getFilesByName("JK_Noova_Database.json");
    var file;
    if (files.hasNext()) {
      file = files.next();
      file.setContent(raw);
      while (files.hasNext()) {
        files.next().setTrashed(true);
      }
    } else {
      file = DriveApp.createFile("JK_Noova_Database.json", raw, "application/json");
    }
    return ContentService.createTextOutput(JSON.stringify({ 
      ok: true, 
      bytes: raw.length, 
      updatedAt: new Date().toISOString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
  }
};

// Registro global y enlace automático
if (typeof window !== 'undefined') {
  window.GoogleDriveSync = GoogleDriveSync;

  const onInit = () => {
    GoogleDriveSync.initUi();

    // Auto-sincronización silenciosa al abrir la app si ya está configurado
    if (GoogleDriveSync.isEnabled()) {
      setTimeout(() => {
        GoogleDriveSync.downloadFromDrive(true);
      }, 1200);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onInit);
  } else {
    onInit();
  }
}
