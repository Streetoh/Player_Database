/**
 * JK NOOVA - Navbar & Shared Components
 * Actualiza contadores globales, navegación activa y modal de configuración/copias de seguridad
 */

function initSharedNavbar(activePage) {
  // 1. Marcar pestaña activa según la página actual
  const navLinks = document.querySelectorAll('.nav-tab-btn');
  navLinks.forEach(link => {
    const pageTarget = link.getAttribute('data-page');
    const isActive = pageTarget === activePage;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-selected', isActive);
  });

  // 2. Actualizar contadores del header
  if (window.JKNoovaData && window.JKNoovaData.StorageService) {
    const storage = window.JKNoovaData.StorageService;
    const players = storage.getPlayers();
    const teams = storage.getTeams();
    const events = storage.getEvents();

    const badgePlayers = document.getElementById('badge-total-players');
    const badgeTeams = document.getElementById('badge-total-teams');
    const badgeEvents = document.getElementById('badge-total-events');

    if (badgePlayers) badgePlayers.textContent = players.length;
    if (badgeTeams) badgeTeams.textContent = teams.length;
    if (badgeEvents) badgeEvents.textContent = events.length;
  }

  // 2.1 Selector interactivo de idioma multilingüe (ES, EN, ET, RU)
  let langContainer = document.getElementById('lang-selector-container');
  if (!langContainer) {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      langContainer = document.createElement('div');
      langContainer.id = 'lang-selector-container';
      langContainer.className = 'lang-selector-wrapper';
      langContainer.innerHTML = `
        <select id="lang-selector" class="lang-select" aria-label="Idioma" title="Cambiar idioma / Change language">
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇬🇧 English</option>
          <option value="et">🇪🇪 Eesti</option>
          <option value="ru">🇷🇺 Русский</option>
        </select>
      `;
      headerActions.insertBefore(langContainer, headerActions.firstChild);
    }
  }

  const langSelector = document.getElementById('lang-selector');
  if (langSelector && window.i18n) {
    langSelector.value = window.i18n.getLanguage();
    langSelector.onchange = (e) => {
      window.i18n.setLanguage(e.target.value);
    };
  }

  // 3. Modal de Configuración / Backup (presente en todas las páginas)
  const btnSettings = document.getElementById('btn-open-settings');
  const modalSettings = document.getElementById('modal-settings');

  if (btnSettings && modalSettings) {
    btnSettings.onclick = (e) => {
      e.preventDefault();
      openModal(modalSettings);
    };
  }

  const btnExport = document.getElementById('btn-export-backup');
  if (btnExport && window.JKNoovaData) {
    btnExport.onclick = () => {
      const dataStr = window.JKNoovaData.StorageService.exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JK_Noova_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Copia de seguridad descargada', 'success');
    };
  }

  const fileImport = document.getElementById('file-import-input');
  if (fileImport && window.JKNoovaData) {
    fileImport.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.JKNoovaData.StorageService.importData(event.target.result);
        if (res.success) {
          showToast('Datos restaurados correctamente. Recargando...', 'success');
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast('Error al importar archivo JSON', 'error');
        }
      };
      reader.readAsText(file);
    };
  }

  const btnReset = document.getElementById('btn-reset-demo-data');
  if (btnReset && window.JKNoovaData) {
    btnReset.onclick = () => {
      if (confirm('¿Restablecer todos los datos del club a los valores originales de fábrica? Se perderán los cambios no exportados.')) {
        window.JKNoovaData.StorageService.resetAllToDefault();
        showToast('Plantilla de demostración restablecida', 'warning');
        setTimeout(() => window.location.reload(), 800);
      }
    };
  }

  // 4. Cerrar modales con botones de cierre
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-close-modal');
      const m = document.getElementById(modalId);
      if (m) closeModal(m);
    };
  });

  // Cerrar al hacer clic en el backdrop (protegido contra arrastres y modals con data-no-backdrop-close)
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    let mouseDownTarget = null;
    modal.addEventListener('mousedown', (e) => {
      mouseDownTarget = e.target;
    });

    modal.addEventListener('click', (e) => {
      // Si el modal tiene data-no-backdrop-close="true", no cerrar al pulsar fuera
      if (modal.getAttribute('data-no-backdrop-close') === 'true' || modal.dataset.noBackdropClose === 'true') {
        return;
      }
      // Solo cerrar si tanto el mousedown como el click ocurrieron directamente sobre el fondo oscuro
      if (e.target === modal && mouseDownTarget === modal) {
        closeModal(modal);
      }
    });
  });

  // 4. Registro de Service Worker para PWA y soporte sin conexión
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Registro de ServiceWorker no disponible en este entorno:', err);
      });
    });
  }

  // 5. Soporte para instalación de PWA en móvil y PC
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
      installBtn.onclick = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            installBtn.style.display = 'none';
          }
          deferredPrompt = null;
        }
      };
    }
  });
}

function openModal(modalElem) {
  if (modalElem) {
    modalElem.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalElem) {
  if (modalElem) {
    modalElem.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

function calculateAge(birthDateString) {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatAgeWithMonths(birthDateString) {
  if (!birthDateString) return '--';
  const today = new Date();
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return '--';

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  const days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  years = Math.max(0, years);
  months = Math.max(0, months);

  const tFn = window.t || ((k, p, def) => (typeof p === 'string' ? p : (def || k)));

  const yStr = years === 1 ? tFn('age.yearSingular', '1 año') : tFn('age.yearsPlural', { n: years }, `${years} años`);
  const mStr = months === 1 ? tFn('age.monthSingular', '1 mes') : tFn('age.monthsPlural', { n: months }, `${months} meses`);
  const andStr = tFn('common.and', 'y');

  if (years > 0 && months > 0) {
    return `${yStr} ${andStr} ${mStr}`;
  } else if (years > 0) {
    return yStr;
  } else {
    return mStr;
  }
}

function getFootLabel(foot) {
  const tFn = window.t || ((k, def) => def);
  if (foot === 'Zurdo') return tFn('foot.zurdo', 'Zurdo');
  if (foot === 'Ambidiestro') return tFn('foot.ambidiestro', 'Ambidiestro');
  return tFn('foot.diestro', 'Diestro');
}

window.addEventListener('languageChanged', () => {
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations();
  }
});

window.initSharedNavbar = initSharedNavbar;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.calculateAge = calculateAge;
window.formatAgeWithMonths = formatAgeWithMonths;
window.getFootLabel = getFootLabel;
window.formatDate = formatDate;
window.escapeHTML = escapeHTML;

