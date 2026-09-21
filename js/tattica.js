/**
 * JK NOOVA - Pizarra Táctica Interactiva de Alineación
 * Soporta Fútbol 7, Fútbol 8 y Fútbol 11 con formaciones reglamentarias,
 * colocación de jugadores convocados, banquillo interactivo y persistencia en event.lineup
 */

let currentTacticalEvent = null;
let currentPitchType = 'f7'; // 'f7' | 'f8' | 'f11'
let currentFormation = '1-3-2-1';
let tacticalStarters = {}; // { [slotKey]: playerId }
let tacticalBench = []; // [playerId, ...]
let selectedTacticalToken = null; // { type: 'pitch' | 'bench', slotKey?: string, playerId: string }
let tacticalCustomPositions = {}; // { [slotKey]: { x: number, y: number } }
let tacticalBall = { x: 50, y: 50, attachedToSlot: null, attachedToRivalId: null };
let tacticalRivals = []; // [{ id, number, label, color, x, y }]
let currentRivalColor = '#ef4444';

// Estado de herramientas de dibujo táctico
let currentDrawingTool = 'move'; // 'move' | 'pencil' | 'arrow' | 'eraser'
let currentDrawingColor = '#facc15';
let tacticalDrawings = []; // array de trazos { type, color, width, points / start / end }
let isDrawingActive = false;
let currentStroke = null;
let tacticalCanvasEl = null;
let tacticalCtx = null;


// Definición de formaciones y coordenadas porcentuales en el campo (left %, top %)
// top: 0% es portería rival (arriba), top: 100% es portería propia (abajo)
const FORMATIONS_CONFIG = {
  f7: {
    name: 'Fútbol 7 (7 jugadores)',
    capacity: 7,
    formations: {
      '1-3-2-1': {
        name: '1-3-2-1 (Árbol de Navidad)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 88 },
          { key: 'dfi', label: 'DFI', x: 22, y: 66 },
          { key: 'dfc', label: 'DFC', x: 50, y: 69 },
          { key: 'dfd', label: 'DFD', x: 78, y: 66 },
          { key: 'mci', label: 'MCI', x: 35, y: 44 },
          { key: 'mcd', label: 'MCD', x: 65, y: 44 },
          { key: 'del', label: 'DC',  x: 50, y: 20 }
        ]
      },
      '1-2-3-1': {
        name: '1-2-3-1 (Equilibrio)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 88 },
          { key: 'dfi', label: 'DFI', x: 32, y: 68 },
          { key: 'dfd', label: 'DFD', x: 68, y: 68 },
          { key: 'mi',  label: 'MI',  x: 22, y: 44 },
          { key: 'mc',  label: 'MC',  x: 50, y: 47 },
          { key: 'md',  label: 'MD',  x: 78, y: 44 },
          { key: 'del', label: 'DC',  x: 50, y: 20 }
        ]
      },
      '1-3-1-2': {
        name: '1-3-1-2 (Doble punta)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 88 },
          { key: 'dfi', label: 'DFI', x: 22, y: 66 },
          { key: 'dfc', label: 'DFC', x: 50, y: 69 },
          { key: 'dfd', label: 'DFD', x: 78, y: 66 },
          { key: 'mc',  label: 'MC',  x: 50, y: 45 },
          { key: 'dli', label: 'DI',  x: 35, y: 20 },
          { key: 'dld', label: 'DD',  x: 65, y: 20 }
        ]
      }
    }
  },
  f8: {
    name: 'Fútbol 8 (8 jugadores)',
    capacity: 8,
    formations: {
      '1-3-3-1': {
        name: '1-3-3-1 (Clásica F8)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 88 },
          { key: 'dfi', label: 'DFI', x: 22, y: 68 },
          { key: 'dfc', label: 'DFC', x: 50, y: 70 },
          { key: 'dfd', label: 'DFD', x: 78, y: 68 },
          { key: 'mi',  label: 'MI',  x: 24, y: 45 },
          { key: 'mc',  label: 'MC',  x: 50, y: 48 },
          { key: 'md',  label: 'MD',  x: 76, y: 45 },
          { key: 'del', label: 'DC',  x: 50, y: 20 }
        ]
      },
      '1-3-2-2': {
        name: '1-3-2-2 (Doble delantera)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 88 },
          { key: 'dfi', label: 'DFI', x: 22, y: 68 },
          { key: 'dfc', label: 'DFC', x: 50, y: 70 },
          { key: 'dfd', label: 'DFD', x: 78, y: 68 },
          { key: 'mci', label: 'MCI', x: 35, y: 46 },
          { key: 'mcd', label: 'MCD', x: 65, y: 46 },
          { key: 'dli', label: 'DI',  x: 35, y: 20 },
          { key: 'dld', label: 'DD',  x: 65, y: 20 }
        ]
      },
      '1-2-4-1': {
        name: '1-2-4-1 (Ofensiva)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 88 },
          { key: 'dfi', label: 'DFI', x: 32, y: 70 },
          { key: 'dfd', label: 'DFD', x: 68, y: 70 },
          { key: 'li',  label: 'LI',  x: 18, y: 46 },
          { key: 'mci', label: 'MCI', x: 39, y: 48 },
          { key: 'mcd', label: 'MCD', x: 61, y: 48 },
          { key: 'ld',  label: 'LD',  x: 82, y: 46 },
          { key: 'del', label: 'DC',  x: 50, y: 20 }
        ]
      }
    }
  },
  f9: {
    name: 'Fútbol 9 (9 jugadores)',
    capacity: 9,
    formations: {
      '1-3-3-2': {
        name: '1-3-3-2 (Equilibrada con 2 delanteros)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 91 },
          { key: 'dfi', label: 'DFI', x: 22, y: 73 },
          { key: 'dfc', label: 'DFC', x: 50, y: 75 },
          { key: 'dfd', label: 'DFD', x: 78, y: 73 },
          { key: 'mi',  label: 'MI',  x: 22, y: 48 },
          { key: 'mc',  label: 'MC',  x: 50, y: 50 },
          { key: 'md',  label: 'MD',  x: 78, y: 48 },
          { key: 'dli', label: 'DI',  x: 36, y: 20 },
          { key: 'dld', label: 'DD',  x: 64, y: 20 }
        ]
      },
      '1-3-4-1': {
        name: '1-3-4-1 (Control de mediocampo)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 91 },
          { key: 'dfi', label: 'DFI', x: 22, y: 73 },
          { key: 'dfc', label: 'DFC', x: 50, y: 75 },
          { key: 'dfd', label: 'DFD', x: 78, y: 73 },
          { key: 'mi',  label: 'MI',  x: 18, y: 48 },
          { key: 'mci', label: 'MCI', x: 39, y: 50 },
          { key: 'mcd', label: 'MCD', x: 61, y: 50 },
          { key: 'md',  label: 'MD',  x: 82, y: 48 },
          { key: 'dc',  label: 'DC',  x: 50, y: 19 }
        ]
      },
      '1-4-3-1': {
        name: '1-4-3-1 (Solidez defensiva)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 91 },
          { key: 'li',  label: 'LI',  x: 18, y: 73 },
          { key: 'dci', label: 'DCI', x: 39, y: 75 },
          { key: 'dcd', label: 'DCD', x: 61, y: 75 },
          { key: 'ld',  label: 'LD',  x: 82, y: 73 },
          { key: 'mci', label: 'MCI', x: 32, y: 48 },
          { key: 'mc',  label: 'MC',  x: 50, y: 45 },
          { key: 'mcd', label: 'MCD', x: 68, y: 48 },
          { key: 'dc',  label: 'DC',  x: 50, y: 19 }
        ]
      },
      '1-3-2-3': {
        name: '1-3-2-3 (Tridente ofensivo)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 91 },
          { key: 'dfi', label: 'DFI', x: 22, y: 73 },
          { key: 'dfc', label: 'DFC', x: 50, y: 75 },
          { key: 'dfd', label: 'DFD', x: 78, y: 73 },
          { key: 'mci', label: 'MCI', x: 38, y: 52 },
          { key: 'mcd', label: 'MCD', x: 62, y: 52 },
          { key: 'ei',  label: 'EI',  x: 20, y: 24 },
          { key: 'dc',  label: 'DC',  x: 50, y: 18 },
          { key: 'ed',  label: 'ED',  x: 80, y: 24 }
        ]
      },
      '1-2-4-2': {
        name: '1-2-4-2 (Doble punta y carrileros)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 91 },
          { key: 'dfi', label: 'DFI', x: 35, y: 75 },
          { key: 'dfd', label: 'DFD', x: 65, y: 75 },
          { key: 'li',  label: 'LI',  x: 18, y: 48 },
          { key: 'mci', label: 'MCI', x: 39, y: 50 },
          { key: 'mcd', label: 'MCD', x: 61, y: 50 },
          { key: 'ld',  label: 'LD',  x: 82, y: 48 },
          { key: 'dli', label: 'DI',  x: 36, y: 20 },
          { key: 'dld', label: 'DD',  x: 64, y: 20 }
        ]
      }
    }
  },
  f11: {
    name: 'Fútbol 11 (11 jugadores)',
    capacity: 11,
    formations: {
      '1-4-3-3': {
        name: '1-4-3-3 (Ofensiva con extremos)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 90 },
          { key: 'li',  label: 'LI',  x: 16, y: 72 },
          { key: 'dci', label: 'DCI', x: 38, y: 74 },
          { key: 'dcd', label: 'DCD', x: 62, y: 74 },
          { key: 'ld',  label: 'LD',  x: 84, y: 72 },
          { key: 'mi',  label: 'MI',  x: 28, y: 50 },
          { key: 'mc',  label: 'MC',  x: 50, y: 53 },
          { key: 'md',  label: 'MD',  x: 72, y: 50 },
          { key: 'ei',  label: 'EI',  x: 20, y: 24 },
          { key: 'dc',  label: 'DC',  x: 50, y: 18 },
          { key: 'ed',  label: 'ED',  x: 80, y: 24 }
        ]
      },
      '1-4-4-2': {
        name: '1-4-4-2 (Clásica equilibrada)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 90 },
          { key: 'li',  label: 'LI',  x: 16, y: 72 },
          { key: 'dci', label: 'DCI', x: 38, y: 74 },
          { key: 'dcd', label: 'DCD', x: 62, y: 74 },
          { key: 'ld',  label: 'LD',  x: 84, y: 72 },
          { key: 'mi',  label: 'MI',  x: 18, y: 46 },
          { key: 'mci', label: 'MCI', x: 39, y: 49 },
          { key: 'mcd', label: 'MCD', x: 61, y: 49 },
          { key: 'md',  label: 'MD',  x: 82, y: 46 },
          { key: 'dci2',label: 'DI',  x: 35, y: 19 },
          { key: 'dcd2',label: 'DD',  x: 65, y: 19 }
        ]
      },
      '1-4-2-3-1': {
        name: '1-4-2-3-1 (Mediapunta y doble pivote)',
        slots: [
          { key: 'por', label: 'POR', x: 50, y: 90 },
          { key: 'li',  label: 'LI',  x: 16, y: 72 },
          { key: 'dci', label: 'DCI', x: 38, y: 74 },
          { key: 'dcd', label: 'DCD', x: 62, y: 74 },
          { key: 'ld',  label: 'LD',  x: 84, y: 72 },
          { key: 'mcd1',label: 'MCD', x: 36, y: 55 },
          { key: 'mcd2',label: 'MCD', x: 64, y: 55 },
          { key: 'ei',  label: 'EI',  x: 20, y: 34 },
          { key: 'mco', label: 'MCO', x: 50, y: 36 },
          { key: 'ed',  label: 'ED',  x: 80, y: 34 },
          { key: 'dc',  label: 'DC',  x: 50, y: 17 }
        ]
      }
    }
  }
};

/**
 * Inicializa el modal táctico
 */
function initTacticalBoardLogic() {
  const pitchTypeSelect = document.getElementById('tactical-pitch-type-select');
  if (pitchTypeSelect) {
    pitchTypeSelect.onchange = (e) => {
      currentPitchType = e.target.value;
      populateFormationsDropdown();
      const availableForms = Object.keys(FORMATIONS_CONFIG[currentPitchType].formations);
      currentFormation = availableForms[0];
      document.getElementById('tactical-formation-select').value = currentFormation;
      adjustLineupForCapacity();
      renderTacticalStage();
    };
  }

  const formSelect = document.getElementById('tactical-formation-select');
  if (formSelect) {
    formSelect.onchange = (e) => {
      currentFormation = e.target.value;
      tacticalCustomPositions = {};
      renderTacticalStage();
    };
  }

  const btnResetPos = document.getElementById('btn-reset-formation-positions');
  if (btnResetPos) {
    btnResetPos.onclick = () => {
      tacticalCustomPositions = {};
      renderTacticalStage();
      if (typeof showToast === 'function') {
        const msg = (typeof t === 'function') ? t('tactical.resetFormation', 'Posiciones restablecidas a la formación predefinida') : 'Posiciones restablecidas a la formación predefinida';
        showToast(msg, 'info');
      }
    };
  }

  const btnSave = document.getElementById('btn-save-tactical-lineup');
  if (btnSave) {
    btnSave.onclick = saveTacticalLineup;
  }

  const btnShare = document.getElementById('btn-copy-tactical-lineup');
  if (btnShare) {
    btnShare.onclick = copyTacticalLineupToWhatsApp;
  }

  // Modos de dibujo táctico (Mover, Lápiz, Flecha, Borrador)
  const toolBtns = document.querySelectorAll('.draw-tool-btn[data-tool]');
  toolBtns.forEach(btn => {
    btn.onclick = () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDrawingTool = btn.getAttribute('data-tool');
      updateCanvasModeClass();
    };
  });

  // Selector de colores de dibujo
  const colorBtns = document.querySelectorAll('.color-swatch-btn[data-color]');
  colorBtns.forEach(btn => {
    btn.onclick = () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDrawingColor = btn.getAttribute('data-color');
    };
  });

  // Deshacer trazo
  const btnUndo = document.getElementById('btn-undo-drawing');
  if (btnUndo) {
    btnUndo.onclick = () => {
      if (tacticalDrawings.length > 0) {
        tacticalDrawings.pop();
        renderTacticalDrawings();
      }
    };
  }

  // Limpiar pizarra
  const btnClear = document.getElementById('btn-clear-drawing');
  if (btnClear) {
    btnClear.onclick = () => {
      if (tacticalDrawings.length > 0) {
        tacticalDrawings = [];
        renderTacticalDrawings();
        if (typeof showToast === 'function') {
          showToast('Pizarra táctica despejada', 'info');
        }
      }
    };
  }

  // Centrar balón
  const btnCenterBall = document.getElementById('btn-center-ball');
  if (btnCenterBall) {
    btnCenterBall.onclick = () => {
      tacticalBall = { x: 50, y: 50, attachedToSlot: null, attachedToRivalId: null };
      renderTacticalStage();
      if (typeof showToast === 'function') {
        showToast('⚽ Balón colocado en el centro del campo', 'info');
      }
    };
  }

  // Añadir rival
  const btnAddRival = document.getElementById('btn-add-rival');
  if (btnAddRival) {
    btnAddRival.onclick = () => {
      const rivalCount = tacticalRivals.length + 1;
      const col = (rivalCount - 1) % 5;
      const row = Math.floor((rivalCount - 1) / 5);
      const startX = 20 + col * 15;
      const startY = 16 + row * 18;
      const defaultLabel = getDefaultRivalPosition(rivalCount);
      const newRival = {
        id: 'rival_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        number: String(rivalCount),
        label: defaultLabel,
        color: currentRivalColor,
        x: Math.min(85, Math.max(15, startX)),
        y: Math.min(48, Math.max(10, startY))
      };
      tacticalRivals.push(newRival);
      renderTacticalStage();
      if (typeof showToast === 'function') {
        showToast(`Ficha rival #${rivalCount} (${defaultLabel}) añadida. Haz clic para editar su nombre/posición`, 'info');
      }
    };
  }

  // Quitar todos los rivales
  const btnClearRivals = document.getElementById('btn-clear-rivals');
  if (btnClearRivals) {
    btnClearRivals.onclick = () => {
      if (tacticalRivals.length > 0) {
        if (tacticalBall.attachedToRivalId) {
          tacticalBall.attachedToRivalId = null;
          tacticalBall.x = 50;
          tacticalBall.y = 50;
        }
        tacticalRivals = [];
        renderTacticalStage();
        if (typeof showToast === 'function') {
          showToast('Fichas rivales eliminadas', 'info');
        }
      }
    };
  }

  // Selector de colores de rivales
  const rivalColorBtns = document.querySelectorAll('.rival-color-swatch[data-rival-color]');
  rivalColorBtns.forEach(btn => {
    btn.onclick = () => {
      rivalColorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRivalColor = btn.getAttribute('data-rival-color');
    };
  });

  window.addEventListener('resize', () => {
    const modal = document.getElementById('modal-tactical-board');
    if (modal && modal.classList.contains('active')) {
      initTacticalCanvas();
    }
  });
}

/**
 * Abre la pizarra táctica para un partido específico
 * @param {object} event 
 */
function openTacticalModal(event) {
  if (!event) return;
  currentTacticalEvent = event;
  selectedTacticalToken = null;

  const modal = document.getElementById('modal-tactical-board');
  if (!modal) return;

  const titleEl = document.getElementById('modal-tactical-title');
  if (titleEl) {
    titleEl.innerHTML = `⚽ <span>${escapeHTML(event.title || ('JK Noova vs ' + event.rival))}</span>`;
  }

  // Determinar tipo de campo
  if (event.lineup && event.lineup.pitchType) {
    currentPitchType = event.lineup.pitchType;
  } else {
    // Deducir por categoría de equipo
    const storage = window.JKNoovaData.StorageService;
    const team = storage.getTeams().find(t => t.id === event.teamId);
    if (team && (team.id === 'team_u12' || team.category?.includes('Alevín'))) {
      currentPitchType = 'f8';
    } else if (team && (team.id === 'team_u14' || team.category?.includes('Infantil') || team.category?.includes('Cadete'))) {
      currentPitchType = 'f11';
    } else {
      currentPitchType = 'f7';
    }
  }

  const pitchSelect = document.getElementById('tactical-pitch-type-select');
  if (pitchSelect) pitchSelect.value = currentPitchType;

  populateFormationsDropdown();

  // Determinar formación
  if (event.lineup && event.lineup.formation && FORMATIONS_CONFIG[currentPitchType].formations[event.lineup.formation]) {
    currentFormation = event.lineup.formation;
  } else {
    currentFormation = Object.keys(FORMATIONS_CONFIG[currentPitchType].formations)[0];
  }

  const formSelect = document.getElementById('tactical-formation-select');
  if (formSelect) formSelect.value = currentFormation;

  // Cargar o inicializar jugadores en alineación
  initializeLineupFromEvent();
  renderTacticalStage();

  // Cargar trazos de dibujo previos
  tacticalDrawings = (event.lineup && Array.isArray(event.lineup.drawings)) ? [...event.lineup.drawings] : [];
  currentDrawingTool = 'move';
  const moveBtn = document.getElementById('tool-move');
  if (moveBtn) {
    document.querySelectorAll('.draw-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    moveBtn.classList.add('active');
  }

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }

  setTimeout(() => {
    initTacticalCanvas();
  }, 60);
}

function populateFormationsDropdown() {
  const formSelect = document.getElementById('tactical-formation-select');
  if (!formSelect) return;
  formSelect.innerHTML = '';
  const forms = FORMATIONS_CONFIG[currentPitchType].formations;
  for (const fKey in forms) {
    const opt = document.createElement('option');
    opt.value = fKey;
    opt.textContent = forms[fKey].name;
    formSelect.appendChild(opt);
  }
}

function initializeLineupFromEvent() {
  tacticalStarters = {};
  tacticalBench = [];
  tacticalCustomPositions = (currentTacticalEvent.lineup && currentTacticalEvent.lineup.customPositions)
    ? { ...currentTacticalEvent.lineup.customPositions }
    : {};
  tacticalBall = (currentTacticalEvent.lineup && currentTacticalEvent.lineup.ball)
    ? {
        x: typeof currentTacticalEvent.lineup.ball.x === 'number' ? currentTacticalEvent.lineup.ball.x : 50,
        y: typeof currentTacticalEvent.lineup.ball.y === 'number' ? currentTacticalEvent.lineup.ball.y : 50,
        attachedToSlot: currentTacticalEvent.lineup.ball.attachedToSlot || null,
        attachedToRivalId: currentTacticalEvent.lineup.ball.attachedToRivalId || null
      }
    : { x: 50, y: 50, attachedToSlot: null, attachedToRivalId: null };
  tacticalRivals = (currentTacticalEvent.lineup && Array.isArray(currentTacticalEvent.lineup.rivals))
    ? currentTacticalEvent.lineup.rivals.map((r, idx) => ({
        id: r.id || ('rival_' + idx + '_' + Date.now()),
        number: r.number || String(idx + 1),
        label: r.label || r.name || getDefaultRivalPosition(idx + 1),
        color: r.color || '#ef4444',
        x: typeof r.x === 'number' ? r.x : 50,
        y: typeof r.y === 'number' ? r.y : 25
      }))
    : [];

  const callUpIds = (currentTacticalEvent.callUp || []).map(c => c.playerId);
  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const summonedPlayers = allPlayers.filter(p => callUpIds.includes(p.id));

  // Si ya existía una alineación guardada para este evento
  if (currentTacticalEvent.lineup && currentTacticalEvent.lineup.starters) {
    const savedStarters = currentTacticalEvent.lineup.starters;
    const assignedIds = [];

    for (const slotKey in savedStarters) {
      const pid = savedStarters[slotKey];
      if (pid && callUpIds.includes(pid)) {
        tacticalStarters[slotKey] = pid;
        assignedIds.push(pid);
      }
    }

    // El resto al banquillo
    summonedPlayers.forEach(p => {
      if (!assignedIds.includes(p.id)) {
        tacticalBench.push(p.id);
      }
    });

    adjustLineupForCapacity();
  } else {
    // Asignación automática inicial inteligente
    const slots = FORMATIONS_CONFIG[currentPitchType].formations[currentFormation].slots;
    const remaining = [...summonedPlayers];

    // 1. Asignar portero si existe
    const gkIndex = remaining.findIndex(p => p.mainPosition === 'POR' || p.mainPosition === 'PT');
    if (gkIndex !== -1 && slots.some(s => s.key === 'por')) {
      tacticalStarters['por'] = remaining[gkIndex].id;
      remaining.splice(gkIndex, 1);
    }

    // 2. Asignar el resto de huecos de titulares
    slots.forEach(slot => {
      if (!tacticalStarters[slot.key] && remaining.length > 0) {
        tacticalStarters[slot.key] = remaining.shift().id;
      }
    });

    // 3. Los restantes van al banquillo
    remaining.forEach(p => {
      tacticalBench.push(p.id);
    });
  }
}

function adjustLineupForCapacity() {
  const currentSlots = FORMATIONS_CONFIG[currentPitchType].formations[currentFormation].slots;
  const validSlotKeys = currentSlots.map(s => s.key);

  // Mover titulares de huecos inexistentes al banquillo
  for (const sKey in tacticalStarters) {
    if (!validSlotKeys.includes(sKey)) {
      const pid = tacticalStarters[sKey];
      if (pid && !tacticalBench.includes(pid)) {
        tacticalBench.push(pid);
      }
      delete tacticalStarters[sKey];
    }
  }

  // Si sobran huecos y hay suplentes, rellenar
  currentSlots.forEach(slot => {
    if (!tacticalStarters[slot.key] && tacticalBench.length > 0) {
      tacticalStarters[slot.key] = tacticalBench.shift();
    }
  });
}

/**
 * Asigna una posición abreviada por defecto a los rivales según su dorsal
 */
function getDefaultRivalPosition(index) {
  const map = {
    1: 'POR',
    2: 'LD',
    3: 'DFC',
    4: 'DFC',
    5: 'LI',
    6: 'MCD',
    7: 'MC',
    8: 'MC',
    9: 'DC',
    10: 'MCO',
    11: 'EXT'
  };
  return map[index] || `R${index}`;
}

/**
 * Comprueba con alta precisión si el puntero o un elemento arrastrado se encuentra
 * sobre una ficha objetivo (calculando distancia en píxeles de pantalla y porcentaje de campo)
 */
function isPointerNearTarget(pointerEv, targetElement, normX, normY, targetX, targetY, maxDistPx = 56, maxDistPct = 9.5) {
  if (targetElement && pointerEv && typeof pointerEv.clientX === 'number') {
    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pxDist = Math.hypot(pointerEv.clientX - centerX, pointerEv.clientY - centerY);
    if (pxDist <= maxDistPx) {
      return { isNear: true, dist: pxDist };
    }
  }
  if (typeof normX === 'number' && typeof targetX === 'number') {
    const pctDist = Math.hypot(normX - targetX, normY - targetY);
    if (pctDist <= maxDistPct) {
      return { isNear: true, dist: pctDist * 5 };
    }
  }
  return { isNear: false, dist: Infinity };
}

/**
 * Motor de arrastre continuo en tiempo real a 60fps con Pointer Events
 * Elimina por completo el clon/fantasma estático de HTML5
 * @param {HTMLElement} element - El elemento que se desplaza
 * @param {object} options - { type, slotKey, rivalId, playerId, onMove, onEnd, onClick }
 */
function setupLiveDrag(element, options) {
  element.onpointerdown = (e) => {
    // Si no estamos en modo mover o es un clic secundario, no iniciar arrastre
    if (currentDrawingTool !== 'move' || e.button !== 0) return;

    // Si se interactúa con el botón de eliminar, el nombre editable o un botón/input interno, ignorar arrastre
    if (e.target.closest('.tactical-rival-delete') || e.target.closest('.tactical-rival-name') || e.target.closest('.tactical-rival-edit-icon') || e.target.closest('button') || e.target.closest('input')) {
      return;
    }

    const pitchEl = document.getElementById('tactical-pitch-stage');
    if (!pitchEl) return;

    e.preventDefault();
    e.stopPropagation();

    const pointerId = e.pointerId;
    try {
      element.setPointerCapture(pointerId);
    } catch (_) {}

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    let hasMoved = false;

    let currentNormX = parseFloat(element.style.left) || 50;
    let currentNormY = parseFloat(element.style.top) || 50;

    const onPointerMove = (moveEv) => {
      if (moveEv.pointerId !== pointerId) return;

      const dist = Math.hypot(moveEv.clientX - startClientX, moveEv.clientY - startClientY);
      if (dist > 3) {
        if (!hasMoved) {
          hasMoved = true;
          element.classList.add('is-live-dragging');
        }

        const rect = pitchEl.getBoundingClientRect();
        currentNormX = Math.round(Math.max(4, Math.min(96, ((moveEv.clientX - rect.left) / rect.width) * 100)));
        currentNormY = Math.round(Math.max(4, Math.min(96, ((moveEv.clientY - rect.top) / rect.height) * 100)));

        element.style.left = `${currentNormX}%`;
        element.style.top = `${currentNormY}%`;

        if (options.onMove) {
          options.onMove(currentNormX, currentNormY, moveEv, pitchEl);
        }
      }
    };

    const onPointerUp = (upEv) => {
      if (upEv.pointerId !== pointerId) return;

      try {
        element.releasePointerCapture(pointerId);
      } catch (_) {}

      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);

      element.classList.remove('is-live-dragging');

      if (hasMoved) {
        if (options.onEnd) {
          options.onEnd(currentNormX, currentNormY, upEv, pitchEl);
        }
      } else {
        if (options.onClick) {
          options.onClick(upEv);
        }
      }
    };

    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
  };
}

/**
 * Renderiza el campo verde 2D con los tokens, balón, rivales y el banquillo
 */
function renderTacticalStage() {
  const pitchEl = document.getElementById('tactical-pitch-stage');
  const benchEl = document.getElementById('tactical-bench-container');
  if (!pitchEl || !benchEl) return;

  pitchEl.innerHTML = '';
  benchEl.innerHTML = '';

  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const formationConfig = FORMATIONS_CONFIG[currentPitchType].formations[currentFormation];
  const slots = formationConfig.slots;

  // Permitir soltar suplentes del banquillo sobre el campo
  pitchEl.ondragover = (e) => e.preventDefault();
  pitchEl.ondrop = (e) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      const dragData = JSON.parse(raw);
      if (dragData.type === 'bench' && dragData.playerId) {
        const rect = pitchEl.getBoundingClientRect();
        const dropX = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
        const dropY = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
        let nearestKey = null;
        let minDist = Infinity;
        slots.forEach(s => {
          const cPos = tacticalCustomPositions[s.key];
          const sX = cPos ? cPos.x : s.x;
          const sY = cPos ? cPos.y : s.y;
          const d = Math.hypot(sX - dropX, sY - dropY);
          if (d < minDist) {
            minDist = d;
            nearestKey = s.key;
          }
        });
        if (nearestKey) {
          handleTacticalSwap(dragData, { type: 'pitch', slotKey: nearestKey });
        }
      }
    } catch (err) {}
  };

  // Actualizar contador de alineación
  const startersCount = Object.values(tacticalStarters).filter(Boolean).length;
  const countEl = document.getElementById('tactical-lineup-counter');
  if (countEl) {
    countEl.textContent = `${startersCount} / ${slots.length} titulares (${tacticalBench.length} suplentes)`;
  }

  // Renderizar cada posición sobre el césped
  slots.forEach(slot => {
    const playerId = tacticalStarters[slot.key];
    const player = allPlayers.find(p => p.id === playerId);
    const customPos = tacticalCustomPositions[slot.key];
    const posX = customPos ? customPos.x : slot.x;
    const posY = customPos ? customPos.y : slot.y;

    const isHoldingBall = tacticalBall.attachedToSlot === slot.key;
    const slotNode = document.createElement('div');
    slotNode.className = `tactical-slot ${selectedTacticalToken?.slotKey === slot.key ? 'is-selected' : ''} ${isHoldingBall ? 'has-ball-possession' : ''}`;
    slotNode.style.left = `${posX}%`;
    slotNode.style.top = `${posY}%`;
    slotNode.setAttribute('data-slot-key', slot.key);

    if (player) {
      const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;
      slotNode.innerHTML = `
        <div class="tactical-token" title="Arrastra en tiempo real por el campo o haz clic para sustituir">
          <div class="tactical-avatar-wrap">
            <img src="${avatarUrl}" alt="${player.name}" class="tactical-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
            <span class="tactical-dorsal-tag">#${player.mainDorsal || '-'}</span>
          </div>
          <div class="tactical-player-name">${escapeHTML(player.name)}</div>
          <div class="tactical-role-badge">${slot.label}</div>
        </div>
      `;

      // Arrastre a tiempo real continuo
      setupLiveDrag(slotNode, {
        type: 'pitch',
        slotKey: slot.key,
        playerId: player.id,
        onMove: (normX, normY, moveEv, pEl) => {
          // Si este jugador tiene el balón, mover el balón simultáneamente en tiempo real a su lado
          if (tacticalBall.attachedToSlot === slot.key) {
            const ballEl = pEl.querySelector('.tactical-ball-token');
            if (ballEl) {
              ballEl.style.left = `${Math.min(93, normX + 3.4)}%`;
              ballEl.style.top = `${Math.min(93, normY + 3.6)}%`;
            }
          }

          // Iluminar posibles destinos de intercambio si pasa por encima de otro compañero
          slots.forEach(s => {
            if (s.key !== slot.key) {
              const sNode = pEl.querySelector(`.tactical-slot[data-slot-key="${s.key}"]`);
              if (sNode) {
                const sX = parseFloat(sNode.style.left);
                const sY = parseFloat(sNode.style.top);
                const check = isPointerNearTarget(moveEv, sNode, normX, normY, sX, sY, 56, 9.5);
                sNode.classList.toggle('drop-hover', check.isNear);
              }
            }
          });
        },
        onEnd: (normX, normY, upEv, pEl) => {
          pEl.querySelectorAll('.tactical-slot').forEach(n => n.classList.remove('drop-hover'));

          // Comprobar si se soltó sobre otro compañero para intercambiar posiciones
          let targetSwap = null;
          let minD = Infinity;
          slots.forEach(s => {
            if (s.key !== slot.key) {
              const sNode = pEl.querySelector(`.tactical-slot[data-slot-key="${s.key}"]`);
              if (sNode) {
                const sX = parseFloat(sNode.style.left);
                const sY = parseFloat(sNode.style.top);
                const check = isPointerNearTarget(upEv, sNode, normX, normY, sX, sY, 56, 9.5);
                if (check.isNear && check.dist < minD) {
                  minD = check.dist;
                  targetSwap = s.key;
                }
              }
            }
          });

          if (targetSwap) {
            handleTacticalSwap({ type: 'pitch', slotKey: slot.key }, { type: 'pitch', slotKey: targetSwap });
            if (typeof showToast === 'function') {
              showToast('Posiciones de compañeros intercambiadas', 'info');
            }
          } else {
            tacticalCustomPositions[slot.key] = { x: normX, y: normY };
            if (tacticalBall.attachedToSlot === slot.key) {
              tacticalBall.x = Math.min(93, normX + 3.4);
              tacticalBall.y = Math.min(93, normY + 3.6);
            }
            renderTacticalStage();
          }
        },
        onClick: () => {
          handleTacticalClick({ type: 'pitch', slotKey: slot.key, playerId: player.id });
        }
      });
    } else {
      slotNode.innerHTML = `
        <div class="tactical-empty-slot">
          <span class="tactical-empty-plus">➕</span>
          <span class="tactical-role-badge">${slot.label}</span>
        </div>
      `;

      slotNode.onclick = () => {
        handleTacticalClick({ type: 'pitch', slotKey: slot.key });
      };
    }

    // Permitir soltar suplentes del banquillo sobre este hueco
    slotNode.ondragover = (e) => e.preventDefault();
    slotNode.ondrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        const dragData = JSON.parse(raw);
        handleTacticalSwap(dragData, { type: 'pitch', slotKey: slot.key });
      } catch (err) {}
    };

    pitchEl.appendChild(slotNode);
  });

  // Renderizar los Jugadores Rivales 🔴 🟣 🟠 ⚫ ⚪ con Nombre y Posición Editable
  tacticalRivals.forEach((rival, idx) => {
    const isHoldingBall = tacticalBall.attachedToRivalId === rival.id;
    const rivalNode = document.createElement('div');
    rivalNode.className = `tactical-rival-token ${isHoldingBall ? 'has-ball-possession' : ''}`;
    rivalNode.style.left = `${rival.x}%`;
    rivalNode.style.top = `${rival.y}%`;
    rivalNode.setAttribute('data-rival-id', rival.id);

    const isLight = rival.color.toLowerCase() === '#ffffff' || rival.color.toLowerCase() === 'white';
    const circleColor = rival.color;
    const textColor = isLight ? '#0f172a' : '#ffffff';
    const borderColor = isLight ? '#0f172a' : '#ffffff';
    const rivalLabel = rival.label || getDefaultRivalPosition(idx + 1);

    rivalNode.innerHTML = `
      <div class="tactical-rival-circle" style="background-color: ${circleColor}; color: ${textColor}; border-color: ${borderColor};">
        <span class="tactical-rival-num">${escapeHTML(rival.number || String(idx + 1))}</span>
        <button type="button" class="tactical-rival-delete" title="Eliminar ficha rival">&times;</button>
      </div>
      <div class="tactical-rival-name-wrap" title="Haz clic para editar nombre o posición (ej: DC, POR, Mbappé)">
        <span class="tactical-rival-name" contenteditable="true" spellcheck="false">${escapeHTML(rivalLabel)}</span>
        <span class="tactical-rival-edit-icon" title="Editar nombre / posición">✏️</span>
      </div>
    `;

    // Lógica de edición en línea de nombre/posición
    const nameSpan = rivalNode.querySelector('.tactical-rival-name');
    const editIcon = rivalNode.querySelector('.tactical-rival-edit-icon');

    if (nameSpan) {
      nameSpan.onpointerdown = (e) => e.stopPropagation();
      nameSpan.onclick = (e) => e.stopPropagation();

      const saveRivalLabel = () => {
        const val = nameSpan.textContent.trim();
        if (val) {
          rival.label = val;
        } else {
          rival.label = getDefaultRivalPosition(idx + 1);
          nameSpan.textContent = rival.label;
        }
      };

      nameSpan.onblur = saveRivalLabel;
      nameSpan.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameSpan.blur();
        }
      };

      if (editIcon) {
        editIcon.onpointerdown = (e) => e.stopPropagation();
        editIcon.onclick = (e) => {
          e.stopPropagation();
          nameSpan.focus();
          try {
            const range = document.createRange();
            range.selectNodeContents(nameSpan);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          } catch (_) {}
        };
      }
    }

    // Botón eliminar rival
    const deleteBtn = rivalNode.querySelector('.tactical-rival-delete');
    if (deleteBtn) {
      deleteBtn.onpointerdown = (e) => e.stopPropagation();
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (tacticalBall.attachedToRivalId === rival.id) {
          tacticalBall.attachedToRivalId = null;
          tacticalBall.x = rival.x;
          tacticalBall.y = rival.y;
        }
        tacticalRivals = tacticalRivals.filter(r => r.id !== rival.id);
        renderTacticalStage();
      };
    }

    // Arrastre en tiempo real continuo del rival
    setupLiveDrag(rivalNode, {
      type: 'rival',
      rivalId: rival.id,
      onMove: (normX, normY, moveEv, pEl) => {
        // Si este rival tiene el balón, mover el balón simultáneamente en tiempo real a su lado
        if (tacticalBall.attachedToRivalId === rival.id) {
          const ballEl = pEl.querySelector('.tactical-ball-token');
          if (ballEl) {
            ballEl.style.left = `${Math.min(93, normX + 3.4)}%`;
            ballEl.style.top = `${Math.min(93, normY + 3.6)}%`;
          }
        }
      },
      onEnd: (normX, normY) => {
        rival.x = normX;
        rival.y = normY;
        if (tacticalBall.attachedToRivalId === rival.id) {
          tacticalBall.x = Math.min(93, normX + 3.4);
          tacticalBall.y = Math.min(93, normY + 3.6);
        }
        renderTacticalStage();
      }
    });

    pitchEl.appendChild(rivalNode);
  });

  // Renderizar el Balón de Fútbol ⚽ (Libre o Acoplado a un jugador propio o rival)
  let ballX = tacticalBall.x;
  let ballY = tacticalBall.y;
  let attachedPlayerName = null;

  if (tacticalBall.attachedToSlot) {
    const targetSlot = slots.find(s => s.key === tacticalBall.attachedToSlot);
    if (targetSlot) {
      const customPos = tacticalCustomPositions[targetSlot.key];
      const sX = customPos ? customPos.x : targetSlot.x;
      const sY = customPos ? customPos.y : targetSlot.y;
      ballX = Math.min(93, sX + 3.4);
      ballY = Math.min(93, sY + 3.6);
      const pId = tacticalStarters[targetSlot.key];
      const p = allPlayers.find(x => x.id === pId);
      attachedPlayerName = p ? `${p.name} (#${p.mainDorsal || '-'})` : targetSlot.label;
    } else {
      tacticalBall.attachedToSlot = null;
    }
  } else if (tacticalBall.attachedToRivalId) {
    const targetRival = tacticalRivals.find(r => r.id === tacticalBall.attachedToRivalId);
    if (targetRival) {
      ballX = Math.min(93, targetRival.x + 3.4);
      ballY = Math.min(93, targetRival.y + 3.6);
      attachedPlayerName = `Rival #${targetRival.number} ${targetRival.label ? '(' + targetRival.label + ')' : ''}`;
    } else {
      tacticalBall.attachedToRivalId = null;
    }
  }

  const isBallAttached = Boolean(tacticalBall.attachedToSlot || tacticalBall.attachedToRivalId);
  const ballNode = document.createElement('div');
  ballNode.className = `tactical-ball-token ${isBallAttached ? 'is-attached' : ''}`;
  ballNode.style.left = `${ballX}%`;
  ballNode.style.top = `${ballY}%`;
  ballNode.setAttribute('title', isBallAttached
    ? `⚽ Balón en posesión de ${attachedPlayerName} (Arrastra a otro jugador o al césped)`
    : '⚽ Balón de fútbol libre (Arrastra sobre un jugador o rival para acoplarlo)');
  ballNode.innerHTML = `⚽`;

  // Arrastre a tiempo real continuo del balón
  setupLiveDrag(ballNode, {
    type: 'ball',
    onMove: (normX, normY, moveEv, pEl) => {
      // 1. Iluminar compañeros de equipo receptores
      slots.forEach(s => {
        const sNode = pEl.querySelector(`.tactical-slot[data-slot-key="${s.key}"]`);
        if (sNode) {
          const sX = parseFloat(sNode.style.left);
          const sY = parseFloat(sNode.style.top);
          const check = isPointerNearTarget(moveEv, sNode, normX, normY, sX, sY, 56, 9.5);
          sNode.classList.toggle('drop-hover', check.isNear);
        }
      });

      // 2. Iluminar rivales receptores
      tacticalRivals.forEach(r => {
        const rNode = pEl.querySelector(`.tactical-rival-token[data-rival-id="${r.id}"]`);
        if (rNode) {
          const rX = parseFloat(rNode.style.left);
          const rY = parseFloat(rNode.style.top);
          const check = isPointerNearTarget(moveEv, rNode, normX, normY, rX, rY, 56, 9.5);
          rNode.classList.toggle('drop-hover', check.isNear);
        }
      });
    },
    onEnd: (normX, normY, upEv, pEl) => {
      pEl.querySelectorAll('.tactical-slot, .tactical-rival-token').forEach(n => n.classList.remove('drop-hover'));

      let bestTarget = null;
      let minAttachDist = Infinity;

      // 1. Comprobar jugadores propios
      slots.forEach(s => {
        const sNode = pEl.querySelector(`.tactical-slot[data-slot-key="${s.key}"]`);
        if (sNode) {
          const sX = parseFloat(sNode.style.left);
          const sY = parseFloat(sNode.style.top);
          const check = isPointerNearTarget(upEv, sNode, normX, normY, sX, sY, 56, 9.5);
          if (check.isNear && check.dist < minAttachDist) {
            minAttachDist = check.dist;
            const pId = tacticalStarters[s.key];
            const p = allPlayers.find(x => x.id === pId);
            bestTarget = {
              type: 'slot',
              slotKey: s.key,
              name: p ? `${p.name} (#${p.mainDorsal || '-'})` : s.label
            };
          }
        }
      });

      // 2. Comprobar rivales
      tacticalRivals.forEach(r => {
        const rNode = pEl.querySelector(`.tactical-rival-token[data-rival-id="${r.id}"]`);
        if (rNode) {
          const rX = parseFloat(rNode.style.left);
          const rY = parseFloat(rNode.style.top);
          const check = isPointerNearTarget(upEv, rNode, normX, normY, rX, rY, 56, 9.5);
          if (check.isNear && check.dist < minAttachDist) {
            minAttachDist = check.dist;
            bestTarget = {
              type: 'rival',
              rivalId: r.id,
              name: `Rival #${r.number} ${r.label ? '(' + r.label + ')' : ''}`
            };
          }
        }
      });

      if (bestTarget) {
        if (bestTarget.type === 'slot') {
          tacticalBall.attachedToSlot = bestTarget.slotKey;
          tacticalBall.attachedToRivalId = null;
        } else {
          tacticalBall.attachedToRivalId = bestTarget.rivalId;
          tacticalBall.attachedToSlot = null;
        }
        renderTacticalStage();
        if (typeof showToast === 'function') {
          showToast(`⚽ Balón en posesión de ${bestTarget.name}`, 'info');
        }
      } else {
        tacticalBall.attachedToSlot = null;
        tacticalBall.attachedToRivalId = null;
        tacticalBall.x = normX;
        tacticalBall.y = normY;
        renderTacticalStage();
      }
    },
    onClick: () => {
      if (tacticalBall.attachedToSlot || tacticalBall.attachedToRivalId) {
        tacticalBall.attachedToSlot = null;
        tacticalBall.attachedToRivalId = null;
        renderTacticalStage();
        if (typeof showToast === 'function') {
          showToast('⚽ Balón desacoplado', 'info');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('💡 Arrastra el balón sobre cualquier jugador o rival para acoplarlo', 'info');
        }
      }
    }
  });

  pitchEl.appendChild(ballNode);

  // Actualizar indicador de balón en el panel lateral
  const ballStatusHint = document.getElementById('tactical-ball-status-hint');
  if (ballStatusHint) {
    if (isBallAttached && attachedPlayerName) {
      ballStatusHint.textContent = `En posesión de ${attachedPlayerName}`;
      ballStatusHint.style.color = tacticalBall.attachedToRivalId ? '#f87171' : '#facc15';
    } else {
      ballStatusHint.textContent = `Libre en campo`;
      ballStatusHint.style.color = 'var(--text-muted)';
    }
  }

  // Renderizar el Banquillo de Suplentes (Disposición vertical sin scroll lateral)
  if (tacticalBench.length === 0) {
    benchEl.innerHTML = `
      <div style="font-size: 0.78rem; color: var(--text-muted); padding: 1rem 0.5rem; text-align: center; width: 100%;">
        Todos los convocados están de titulares en el campo.
      </div>
    `;
    return;
  }

  tacticalBench.forEach(bId => {
    const player = allPlayers.find(p => p.id === bId);
    if (!player) return;

    const bCard = document.createElement('div');
    bCard.className = `tactical-bench-card ${selectedTacticalToken?.playerId === player.id && selectedTacticalToken?.type === 'bench' ? 'is-selected' : ''}`;
    bCard.draggable = true;

    const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;

    const eqStatus = (window.JKNoovaData && window.JKNoovaData.checkPlayerOfficialEquipment)
      ? window.JKNoovaData.checkPlayerOfficialEquipment(player)
      : { complete: true };
    const kitBadge = !eqStatus.complete ? `<span style="font-size: 0.65rem; color: #f87171; font-weight: 700;" title="Falta equipación oficial">⚠️ Falta equip.</span>` : '';

    bCard.innerHTML = `
      <div class="tactical-avatar-wrap" style="position: relative; width: 34px; height: 34px; flex-shrink: 0;">
        <img src="${avatarUrl}" alt="${player.name}" class="tactical-avatar" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
        <span class="tactical-dorsal-tag" style="font-size: 0.58rem; padding: 0.05rem 0.25rem;">#${player.mainDorsal || '-'}</span>
      </div>
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div style="font-weight: 700; color: #fff; font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHTML(player.name)} ${escapeHTML(player.lastName)}
        </div>
        <div style="font-size: 0.68rem; display: flex; align-items: center; gap: 0.4rem;">
          <span style="color: var(--accent-cyan); font-weight: 700;">${player.mainPosition || 'JUG'}</span>
          ${kitBadge}
        </div>
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted); flex-shrink: 0;" title="Clic o arrastra para sustituir">
        ⇄
      </div>
    `;

    bCard.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'bench', playerId: player.id }));
    };

    bCard.onclick = () => {
      handleTacticalClick({ type: 'bench', playerId: player.id });
    };

    benchEl.appendChild(bCard);
  });
}

/**
 * Maneja el clic para intercambiar jugadores entre campo y banquillo
 */
function handleTacticalClick(item) {
  if (!selectedTacticalToken) {
    // Si no había ninguno seleccionado, seleccionar este
    selectedTacticalToken = item;
    renderTacticalStage();
    if (typeof showToast === 'function') {
      showToast('Selecciona ahora el hueco o jugador destino para intercambiar', 'info');
    }
  } else {
    // Ejecutar intercambio
    handleTacticalSwap(selectedTacticalToken, item);
    selectedTacticalToken = null;
    renderTacticalStage();
  }
}

/**
 * Lógica de intercambio (Swap)
 */
function handleTacticalSwap(source, target) {
  // Caso 1: De pitch a pitch (intercambio entre dos posiciones de campo)
  if (source.type === 'pitch' && target.type === 'pitch') {
    const temp = tacticalStarters[source.slotKey];
    tacticalStarters[source.slotKey] = tacticalStarters[target.slotKey];
    tacticalStarters[target.slotKey] = temp;
  }
  // Caso 2: De banquillo a pitch (sustitución de suplente por titular)
  else if (source.type === 'bench' && target.type === 'pitch') {
    const previousStarter = tacticalStarters[target.slotKey];
    tacticalStarters[target.slotKey] = source.playerId;
    const bIndex = tacticalBench.indexOf(source.playerId);
    if (bIndex !== -1) {
      tacticalBench.splice(bIndex, 1);
    }
    if (previousStarter) {
      tacticalBench.push(previousStarter);
    }
  }
  // Caso 3: De pitch a banquillo (titular al banquillo)
  else if (source.type === 'pitch' && target.type === 'bench') {
    const starterId = tacticalStarters[source.slotKey];
    tacticalStarters[source.slotKey] = target.playerId;
    const bIndex = tacticalBench.indexOf(target.playerId);
    if (bIndex !== -1) {
      tacticalBench.splice(bIndex, 1);
    }
    if (starterId) {
      tacticalBench.push(starterId);
    }
  }

  renderTacticalStage();
}

/**
 * Guarda la alineación actual en el partido
 */
function saveTacticalLineup() {
  if (!currentTacticalEvent) return;

  currentTacticalEvent.lineup = {
    pitchType: currentPitchType,
    formation: currentFormation,
    starters: { ...tacticalStarters },
    bench: [...tacticalBench],
    customPositions: { ...tacticalCustomPositions },
    drawings: [...tacticalDrawings],
    ball: { ...tacticalBall },
    rivals: JSON.parse(JSON.stringify(tacticalRivals))
  };

  const storage = window.JKNoovaData.StorageService;
  const events = storage.getEvents();
  const evIndex = events.findIndex(e => e.id === currentTacticalEvent.id);
  if (evIndex !== -1) {
    events[evIndex] = currentTacticalEvent;
    storage.saveEvents(events);
  }

  if (typeof showToast === 'function') {
    showToast('Alineación táctica guardada con éxito', 'success');
  }

  const modal = document.getElementById('modal-tactical-board');
  if (modal) {
    if (typeof closeModal === 'function') {
      closeModal(modal);
    } else {
      modal.classList.remove('active');
    }
  }
}

/**
 * Formatea y copia la alineación para enviar por WhatsApp
 */
function copyTacticalLineupToWhatsApp() {
  if (!currentTacticalEvent) return;

  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const formationConfig = FORMATIONS_CONFIG[currentPitchType].formations[currentFormation];
  const slots = formationConfig.slots;

  let msg = `⚽ *ALINEACIÓN OFICIAL - JK NOOVA ACADEMY*\n`;
  msg += `🏆 *${currentTacticalEvent.title || ('JK Noova vs ' + currentTacticalEvent.rival)}*\n`;
  msg += `📋 Sistema táctico: *${formationConfig.name}* (${FORMATIONS_CONFIG[currentPitchType].name})\n\n`;

  msg += `🟢 *ALINEACIÓN TITULAR:*\n`;
  slots.forEach(slot => {
    const pid = tacticalStarters[slot.key];
    const p = allPlayers.find(x => x.id === pid);
    const hasBall = tacticalBall.attachedToSlot === slot.key ? ' ⚽' : '';
    if (p) {
      msg += `• [${slot.label}] #${p.mainDorsal || '-'} ${p.name} ${p.lastName}${hasBall}\n`;
    } else {
      msg += `• [${slot.label}] (Sin asignar)\n`;
    }
  });

  if (tacticalBall.attachedToRivalId) {
    const r = tacticalRivals.find(x => x.id === tacticalBall.attachedToRivalId);
    if (r) {
      msg += `\n⚽ *Posesión del balón:* Rival #${r.number} (${r.label || 'Rival'})\n`;
    }
  }

  if (tacticalBench.length > 0) {
    msg += `\n🟡 *BANQUILLO / SUPLENTES:*\n`;
    tacticalBench.forEach(bId => {
      const p = allPlayers.find(x => x.id === bId);
      if (p) {
        msg += `• #${p.mainDorsal || '-'} ${p.name} ${p.lastName} (${p.mainPosition || 'JUG'})\n`;
      }
    });
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      showToast('Alineación copiada para WhatsApp', 'success');
    }).catch(() => {
      showToast('No se pudo copiar automáticamente', 'error');
    });
  } else {
    showToast('Alineación lista para compartir', 'info');
  }
}

/* ==========================================================================
   MOTOR DE DIBUJO EN CANVAS PARA PIZARRA TÁCTICA
   ========================================================================== */

function initTacticalCanvas() {
  tacticalCanvasEl = document.getElementById('tactical-drawing-canvas');
  if (!tacticalCanvasEl) return;
  tacticalCtx = tacticalCanvasEl.getContext('2d');

  const wrapper = document.getElementById('tactical-pitch-wrapper');
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    tacticalCanvasEl.width = Math.round(rect.width * dpr);
    tacticalCanvasEl.height = Math.round(rect.height * dpr);
  }

  // Pointer events (unifica ratón, stylus y táctil)
  tacticalCanvasEl.onpointerdown = handleCanvasPointerDown;
  tacticalCanvasEl.onpointermove = handleCanvasPointerMove;
  tacticalCanvasEl.onpointerup = handleCanvasPointerUp;
  tacticalCanvasEl.onpointercancel = handleCanvasPointerUp;

  updateCanvasModeClass();
  renderTacticalDrawings();
}

function updateCanvasModeClass() {
  if (!tacticalCanvasEl) return;
  if (currentDrawingTool === 'move') {
    tacticalCanvasEl.classList.remove('active-draw-mode');
  } else {
    tacticalCanvasEl.classList.add('active-draw-mode');
  }
}

function getCanvasCoords(e) {
  if (!tacticalCanvasEl) return { normX: 0, normY: 0 };
  const rect = tacticalCanvasEl.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;
  const normX = Math.max(0, Math.min(1, rawX / rect.width));
  const normY = Math.max(0, Math.min(1, rawY / rect.height));
  return { normX, normY };
}

function handleCanvasPointerDown(e) {
  if (currentDrawingTool === 'move') return;
  e.preventDefault();
  isDrawingActive = true;
  try { tacticalCanvasEl.setPointerCapture(e.pointerId); } catch (_) {}

  const coords = getCanvasCoords(e);

  if (currentDrawingTool === 'pencil') {
    currentStroke = {
      type: 'pencil',
      color: currentDrawingColor,
      width: 3.5,
      points: [{ x: coords.normX, y: coords.normY }]
    };
  } else if (currentDrawingTool === 'arrow') {
    currentStroke = {
      type: 'arrow',
      color: currentDrawingColor,
      width: 3.5,
      start: { x: coords.normX, y: coords.normY },
      end: { x: coords.normX, y: coords.normY }
    };
  } else if (currentDrawingTool === 'eraser') {
    eraseNear(coords.normX, coords.normY);
  }
}

function handleCanvasPointerMove(e) {
  if (!isDrawingActive) return;
  e.preventDefault();
  const coords = getCanvasCoords(e);

  if (currentDrawingTool === 'pencil' && currentStroke) {
    currentStroke.points.push({ x: coords.normX, y: coords.normY });
    renderTacticalDrawings(currentStroke);
  } else if (currentDrawingTool === 'arrow' && currentStroke) {
    currentStroke.end = { x: coords.normX, y: coords.normY };
    renderTacticalDrawings(currentStroke);
  } else if (currentDrawingTool === 'eraser') {
    eraseNear(coords.normX, coords.normY);
  }
}

function handleCanvasPointerUp(e) {
  if (!isDrawingActive) return;
  isDrawingActive = false;
  try { tacticalCanvasEl.releasePointerCapture(e.pointerId); } catch (_) {}

  if (currentStroke) {
    if (currentStroke.type === 'pencil' && currentStroke.points && currentStroke.points.length > 1) {
      tacticalDrawings.push(currentStroke);
    } else if (currentStroke.type === 'arrow') {
      const dist = Math.hypot(currentStroke.end.x - currentStroke.start.x, currentStroke.end.y - currentStroke.start.y);
      if (dist > 0.015) {
        tacticalDrawings.push(currentStroke);
      }
    }
    currentStroke = null;
  }
  renderTacticalDrawings();
}

function eraseNear(normX, normY) {
  const threshold = 0.04;
  const beforeLen = tacticalDrawings.length;
  tacticalDrawings = tacticalDrawings.filter(stroke => {
    if (stroke.type === 'pencil') {
      return !stroke.points.some(pt => Math.hypot(pt.x - normX, pt.y - normY) < threshold);
    } else if (stroke.type === 'arrow') {
      const d = distToSegment({ x: normX, y: normY }, stroke.start, stroke.end);
      return d >= threshold;
    }
    return true;
  });
  if (tacticalDrawings.length !== beforeLen) {
    renderTacticalDrawings();
  }
}

function distToSegment(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function renderTacticalDrawings(previewStroke = null) {
  if (!tacticalCanvasEl || !tacticalCtx) return;
  const w = tacticalCanvasEl.width;
  const h = tacticalCanvasEl.height;
  tacticalCtx.clearRect(0, 0, w, h);

  const strokesToDraw = [...tacticalDrawings];
  if (previewStroke) strokesToDraw.push(previewStroke);

  strokesToDraw.forEach(stroke => {
    tacticalCtx.strokeStyle = stroke.color;
    tacticalCtx.fillStyle = stroke.color;
    tacticalCtx.lineWidth = (stroke.width || 3.5) * (window.devicePixelRatio || 1);
    tacticalCtx.lineCap = 'round';
    tacticalCtx.lineJoin = 'round';

    if (stroke.type === 'pencil' && stroke.points && stroke.points.length > 0) {
      tacticalCtx.beginPath();
      tacticalCtx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
      for (let i = 1; i < stroke.points.length; i++) {
        tacticalCtx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
      }
      tacticalCtx.stroke();
    } else if (stroke.type === 'arrow' && stroke.start && stroke.end) {
      drawArrow(tacticalCtx, stroke.start.x * w, stroke.start.y * h, stroke.end.x * w, stroke.end.y * h, tacticalCtx.lineWidth);
    }
  });
}

function drawArrow(ctx, fromX, fromY, toX, toY, lineWidth) {
  const headlen = Math.max(16, lineWidth * 3.5);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  // Línea principal
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Punta de flecha (triángulo)
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// Exponer globalmente
window.initTacticalBoardLogic = initTacticalBoardLogic;
window.openTacticalModal = openTacticalModal;
window.initTacticalCanvas = initTacticalCanvas;
window.renderTacticalDrawings = renderTacticalDrawings;

