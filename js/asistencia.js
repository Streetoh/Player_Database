/**
 * JK NOOVA - Módulo de Control de Asistencia a Entrenamientos ("Pasar Lista")
 * Permite registrar asistencia diaria con 4 estados (🟢 Presente, 🔴 Ausente, 🟡 Justificado, 🟠 Lesionado)
 * y calcular el % de asistencia mensual por jugador.
 */

let activeAttendanceTeamId = '';
let activeAttendanceDate = '';
let tempSessionAttendance = {}; // { [playerId]: 'present' | 'absent' | 'justified' | 'injured' }

/**
 * Devuelve las estadísticas de asistencia de un jugador en los últimos N días
 * @param {string} playerId
 * @param {number} days (por defecto 30 días)
 * @returns {{ totalSessions: number, presentCount: number, percentage: number }}
 */
function getPlayerAttendanceStats(playerId, days = 30) {
  if (!window.JKNoovaData || !window.JKNoovaData.StorageService) {
    return { totalSessions: 0, presentCount: 0, percentage: 100 };
  }
  const attendance = window.JKNoovaData.StorageService.getAttendance() || {};
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  let total = 0;
  let present = 0;

  for (const tId in attendance) {
    const datesObj = attendance[tId] || {};
    for (const dStr in datesObj) {
      const d = new Date(dStr);
      // Comprobar si la fecha entra en la ventana y el jugador estaba registrado en esa sesión
      if (!isNaN(d.getTime()) && d >= cutoff && datesObj[dStr] && datesObj[dStr][playerId]) {
        const st = datesObj[dStr][playerId];
        total++;
        if (st === 'present' || st === 'justified') {
          present++;
        }
      }
    }
  }

  const pct = total > 0 ? Math.round((present / total) * 100) : 100;
  return { totalSessions: total, presentCount: present, percentage: pct };
}

/**
 * Inicializa el modal de asistencia y sus controles
 */
function initAttendanceModal() {
  const btnOpen = document.getElementById('btn-open-attendance');
  if (btnOpen) {
    btnOpen.onclick = () => {
      openAttendanceModal();
    };
  }

  const teamSelect = document.getElementById('attendance-team-select');
  if (teamSelect) {
    teamSelect.onchange = (e) => {
      activeAttendanceTeamId = e.target.value;
      loadSessionData();
      renderAttendanceRoster();
    };
  }

  const dateInput = document.getElementById('attendance-date-input');
  if (dateInput) {
    dateInput.onchange = (e) => {
      activeAttendanceDate = e.target.value;
      loadSessionData();
      renderAttendanceRoster();
    };
  }

  const btnAllPresent = document.getElementById('btn-attendance-all-present');
  if (btnAllPresent) {
    btnAllPresent.onclick = markAllPresent;
  }

  const btnSave = document.getElementById('btn-save-attendance');
  if (btnSave) {
    btnSave.onclick = saveCurrentAttendanceSession;
  }
}

/**
 * Abre el modal de asistencia para el equipo y fecha seleccionada
 * @param {string} defaultTeamId 
 */
function openAttendanceModal(defaultTeamId = null) {
  const modal = document.getElementById('modal-attendance');
  if (!modal) return;

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const teamSelect = document.getElementById('attendance-team-select');

  if (teamSelect) {
    teamSelect.innerHTML = '';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.category || ''})`;
      teamSelect.appendChild(opt);
    });

    if (defaultTeamId && teams.some(t => t.id === defaultTeamId)) {
      activeAttendanceTeamId = defaultTeamId;
    } else if (typeof activeTeamFilter !== 'undefined' && activeTeamFilter && activeTeamFilter !== 'all') {
      activeAttendanceTeamId = activeTeamFilter;
    } else {
      activeAttendanceTeamId = teams[0]?.id || '';
    }
    teamSelect.value = activeAttendanceTeamId;
  }

  const dateInput = document.getElementById('attendance-date-input');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    activeAttendanceDate = today;
    dateInput.value = today;
  }

  loadSessionData();
  renderAttendanceRoster();

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }
}

/**
 * Carga los datos de asistencia para el equipo y la fecha activos
 */
function loadSessionData() {
  tempSessionAttendance = {};
  if (!window.JKNoovaData) return;
  const attendance = window.JKNoovaData.StorageService.getAttendance() || {};
  const teamData = attendance[activeAttendanceTeamId] || {};
  const existingSession = teamData[activeAttendanceDate];

  const storage = window.JKNoovaData.StorageService;
  const players = storage.getPlayers().filter(p => p.teamId === activeAttendanceTeamId);

  players.forEach(p => {
    if (existingSession && existingSession[p.id]) {
      tempSessionAttendance[p.id] = existingSession[p.id];
    } else {
      tempSessionAttendance[p.id] = 'present'; // Por defecto presente
    }
  });
}

/**
 * Marca a todos los jugadores del equipo activo como 'present'
 */
function markAllPresent() {
  const storage = window.JKNoovaData.StorageService;
  const players = storage.getPlayers().filter(p => p.teamId === activeAttendanceTeamId);
  players.forEach(p => {
    tempSessionAttendance[p.id] = 'present';
  });
  renderAttendanceRoster();
  if (typeof showToast === 'function') {
    showToast('Todos los jugadores marcados como presentes', 'success');
  }
}

/**
 * Renderiza la lista de jugadores y sus 4 botones de estado
 */
function renderAttendanceRoster() {
  const container = document.getElementById('attendance-roster-list');
  if (!container) return;
  container.innerHTML = '';

  const storage = window.JKNoovaData.StorageService;
  const players = storage.getPlayers().filter(p => p.teamId === activeAttendanceTeamId);

  if (players.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: 8px;">
        No hay jugadores dados de alta en este equipo.
      </div>
    `;
    updateAttendanceCounters(0, 0, 0, 0);
    return;
  }

  // Ordenar por dorsal
  players.sort((a, b) => (a.mainDorsal || 99) - (b.mainDorsal || 99));

  let presentCount = 0;
  let absentCount = 0;
  let justifiedCount = 0;
  let injuredCount = 0;

  players.forEach(p => {
    const currentStatus = tempSessionAttendance[p.id] || 'present';
    if (currentStatus === 'present') presentCount++;
    else if (currentStatus === 'absent') absentCount++;
    else if (currentStatus === 'justified') justifiedCount++;
    else if (currentStatus === 'injured') injuredCount++;

    const stats = getPlayerAttendanceStats(p.id, 30);
    const avatarUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name + '+' + p.lastName)}&background=18233c&color=fff`;

    const row = document.createElement('div');
    row.className = 'attendance-row-item';
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.85rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      margin-bottom: 0.45rem;
      gap: 0.75rem;
      flex-wrap: wrap;
    `;

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 200px;">
        <img src="${avatarUrl}" alt="${p.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1);">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.88rem;">
            #${p.mainDorsal || '-'} ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; gap: 0.4rem; align-items: center; margin-top: 1px;">
            <span>${p.mainPosition || 'JUG'}</span>
            <span>•</span>
            <span style="color: ${stats.percentage >= 80 ? '#34d399' : stats.percentage >= 60 ? '#fbbf24' : '#f87171'}; font-weight: 600;">
              ⚡ ${stats.percentage}% asist. mes
            </span>
          </div>
        </div>
      </div>

      <div class="attendance-buttons-group" style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
        <button type="button" class="btn-att ${currentStatus === 'present' ? 'active-present' : ''}" data-status="present" data-pid="${p.id}">
          🟢 Presente
        </button>
        <button type="button" class="btn-att ${currentStatus === 'absent' ? 'active-absent' : ''}" data-status="absent" data-pid="${p.id}">
          🔴 Ausente
        </button>
        <button type="button" class="btn-att ${currentStatus === 'justified' ? 'active-justified' : ''}" data-status="justified" data-pid="${p.id}">
          🟡 Justificado
        </button>
        <button type="button" class="btn-att ${currentStatus === 'injured' ? 'active-injured' : ''}" data-status="injured" data-pid="${p.id}">
          🟠 Lesionado
        </button>
      </div>
    `;

    row.querySelectorAll('.btn-att').forEach(btn => {
      btn.onclick = () => {
        const st = btn.getAttribute('data-status');
        const pid = btn.getAttribute('data-pid');
        tempSessionAttendance[pid] = st;
        renderAttendanceRoster();
      };
    });

    container.appendChild(row);
  });

  updateAttendanceCounters(presentCount, absentCount, justifiedCount, injuredCount);
}

/**
 * Actualiza los contadores de la cabecera del modal
 */
function updateAttendanceCounters(present, absent, justified, injured) {
  const elPres = document.getElementById('att-count-present');
  const elAbs = document.getElementById('att-count-absent');
  const elJust = document.getElementById('att-count-justified');
  const elInj = document.getElementById('att-count-injured');
  const total = present + absent + justified + injured;
  const pct = total > 0 ? Math.round(((present + justified) / total) * 100) : 0;

  if (elPres) elPres.textContent = `${present} (${pct}%)`;
  if (elAbs) elAbs.textContent = `${absent}`;
  if (elJust) elJust.textContent = `${justified}`;
  if (elInj) elInj.textContent = `${injured}`;
}

/**
 * Guarda la sesión de asistencia en el StorageService
 */
function saveCurrentAttendanceSession() {
  if (!activeAttendanceTeamId || !activeAttendanceDate) return;
  const storage = window.JKNoovaData.StorageService;
  const allAttendance = storage.getAttendance() || {};

  if (!allAttendance[activeAttendanceTeamId]) {
    allAttendance[activeAttendanceTeamId] = {};
  }

  allAttendance[activeAttendanceTeamId][activeAttendanceDate] = { ...tempSessionAttendance };
  storage.saveAttendance(allAttendance);

  if (typeof showToast === 'function') {
    showToast(`Asistencia guardada para el ${formatAttendanceDate(activeAttendanceDate)}`, 'success');
  }

  const modal = document.getElementById('modal-attendance');
  if (modal) {
    if (typeof closeModal === 'function') {
      closeModal(modal);
    } else {
      modal.classList.remove('active');
    }
  }

  // Refrescar vista si existe en la página
  if (typeof renderTeamsBoard === 'function') {
    renderTeamsBoard();
  }
}

function formatAttendanceDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Exponer globalmente
window.getPlayerAttendanceStats = getPlayerAttendanceStats;
window.initAttendanceModal = initAttendanceModal;
window.openAttendanceModal = openAttendanceModal;
