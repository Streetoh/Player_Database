/**
 * JK NOOVA - Módulo de Control de Asistencia ("Pasar Lista")
 * Lista clara e intuitiva con tick verde ✔ (Presente) y tick rojo ✖ (Ausente),
 * soporte para grupos y estadísticas de asistencia.
 */

let activeAttendanceTeamId = '';
let activeAttendanceDate = '';
let tempSessionAttendance = {}; // { [playerId]: 'present' | 'absent' }

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
      if (!isNaN(d.getTime()) && d >= cutoff && datesObj[dStr] && datesObj[dStr][playerId]) {
        const st = datesObj[dStr][playerId];
        total++;
        if (st === 'present') {
          present++;
        }
      }
    }
  }

  const pct = total > 0 ? Math.round((present / total) * 100) : 100;
  return { totalSessions: total, presentCount: present, percentage: pct };
}

/**
 * Inicializa los eventos del modal de asistencia
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

  const dateInput = document.getElementById('attendance-date-input') || document.getElementById('attendance-date');
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

  const btnAllAbsent = document.getElementById('btn-attendance-all-absent');
  if (btnAllAbsent) {
    btnAllAbsent.onclick = markAllAbsent;
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
function openAttendanceModal(defaultTeamId = null, defaultDate = null) {
  const modal = document.getElementById('modal-attendance');
  if (!modal) return;

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const allPlayers = storage.getPlayers();
  const teamSelect = document.getElementById('attendance-team-select');

  if (teamSelect) {
    teamSelect.innerHTML = '';

    // Opción Todos los jugadores
    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = `🌟 Todos los equipos (${allPlayers.length} jugadores)`;
    teamSelect.appendChild(optAll);

    // Opciones por equipo con número de jugadores
    teams.forEach(t => {
      const pCount = allPlayers.filter(p => p.teamId === t.id).length;
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${pCount} jugadores)`;
      teamSelect.appendChild(opt);
    });

    if (defaultTeamId && (defaultTeamId === 'all' || teams.some(t => t.id === defaultTeamId))) {
      activeAttendanceTeamId = defaultTeamId;
    } else {
      // Buscar equipo con más jugadores para que nunca abra vacío
      const sortedTeams = [...teams].sort((a, b) => {
        const ca = allPlayers.filter(p => p.teamId === a.id).length;
        const cb = allPlayers.filter(p => p.teamId === b.id).length;
        return cb - ca;
      });
      activeAttendanceTeamId = sortedTeams[0]?.id || 'all';
    }
    teamSelect.value = activeAttendanceTeamId;
  }

  const dateInput = document.getElementById('attendance-date-input') || document.getElementById('attendance-date');
  if (dateInput) {
    const targetDate = defaultDate || new Date().toISOString().split('T')[0];
    activeAttendanceDate = targetDate;
    dateInput.value = targetDate;
  }

  loadSessionData();
  renderAttendanceRoster();

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }

  // Garantizar que los botones y selectores estén activos cada vez que se abre el modal
  const btnSave = document.getElementById('btn-save-attendance');
  if (btnSave) {
    btnSave.onclick = saveCurrentAttendanceSession;
  }
  const btnAllPresent = document.getElementById('btn-attendance-all-present');
  if (btnAllPresent) {
    btnAllPresent.onclick = markAllPresent;
  }
  const btnAllAbsent = document.getElementById('btn-attendance-all-absent');
  if (btnAllAbsent) {
    btnAllAbsent.onclick = markAllAbsent;
  }
  if (teamSelect) {
    teamSelect.onchange = (e) => {
      activeAttendanceTeamId = e.target.value;
      loadSessionData();
      renderAttendanceRoster();
    };
  }
  if (dateInput) {
    dateInput.onchange = (e) => {
      activeAttendanceDate = e.target.value;
      loadSessionData();
      renderAttendanceRoster();
    };
  }
}

/**
 * Carga los datos de asistencia para el equipo y la fecha activos
 */
function loadSessionData() {
  tempSessionAttendance = {};
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  const attendance = storage.getAttendance() || {};
  const allPlayers = storage.getPlayers();

  const players = (activeAttendanceTeamId === 'all')
    ? allPlayers
    : allPlayers.filter(p => p.teamId === activeAttendanceTeamId);

  players.forEach(p => {
    const tId = p.teamId || 'no_team';
    const teamData = attendance[tId] || {};
    const existingSession = teamData[activeAttendanceDate];

    if (existingSession && existingSession[p.id]) {
      tempSessionAttendance[p.id] = existingSession[p.id];
    } else {
      tempSessionAttendance[p.id] = 'present'; // Por defecto presente
    }
  });
}

/**
 * Marca a todos los jugadores mostrados como 'present'
 */
function markAllPresent() {
  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const players = (activeAttendanceTeamId === 'all')
    ? allPlayers
    : allPlayers.filter(p => p.teamId === activeAttendanceTeamId);

  players.forEach(p => {
    tempSessionAttendance[p.id] = 'present';
  });
  renderAttendanceRoster();
  if (typeof showToast === 'function') {
    showToast('Todos los jugadores marcados como presentes ✔', 'success');
  }
}

/**
 * Marca a todos los jugadores mostrados como 'absent'
 */
function markAllAbsent() {
  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const players = (activeAttendanceTeamId === 'all')
    ? allPlayers
    : allPlayers.filter(p => p.teamId === activeAttendanceTeamId);

  players.forEach(p => {
    tempSessionAttendance[p.id] = 'absent';
  });
  renderAttendanceRoster();
  if (typeof showToast === 'function') {
    showToast('Todos los jugadores marcados como ausentes ✖', 'info');
  }
}

/**
 * Renderiza la lista con botones de tick verde ✔ si está y tick rojo ✖ si no está
 */
function renderAttendanceRoster() {
  const container = document.getElementById('attendance-roster-list');
  if (!container) return;
  container.innerHTML = '';

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const allPlayers = storage.getPlayers();
  const players = (activeAttendanceTeamId === 'all')
    ? [...allPlayers]
    : allPlayers.filter(p => p.teamId === activeAttendanceTeamId);

  if (players.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: 8px;">
        No hay jugadores dados de alta en este grupo.
      </div>
    `;
    updateAttendanceCounters(0, 0);
    return;
  }

  // Ordenar por dorsal o nombre
  players.sort((a, b) => {
    const da = parseInt(a.mainDorsal, 10) || 999;
    const db = parseInt(b.mainDorsal, 10) || 999;
    if (da !== db) return da - db;
    return (a.name || '').localeCompare(b.name || '');
  });

  let presentCount = 0;
  let absentCount = 0;

  players.forEach(p => {
    const currentStatus = tempSessionAttendance[p.id] || 'present';
    const isPresent = currentStatus === 'present';

    if (isPresent) {
      presentCount++;
    } else {
      absentCount++;
    }

    const teamObj = teams.find(t => t.id === p.teamId);
    const avatarUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name + '+' + p.lastName)}&background=18233c&color=fff`;

    const row = document.createElement('div');
    row.className = 'att-player-card';
    row.style.border = isPresent ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)';

    row.innerHTML = `
      <div class="att-player-info">
        <img class="att-avatar" src="${avatarUrl}" alt="${p.name}" style="border-color: ${teamObj?.color || 'rgba(255,255,255,0.2)'};" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=18233c&color=fff'">
        <div class="att-name-box">
          <div class="att-name-line">
            <span style="color: var(--accent-cyan); margin-right: 4px; font-weight: 800;">#${p.mainDorsal || '-'}</span>
            ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
          </div>
          <div class="att-meta-line">
            <span style="color: var(--accent-cyan); font-weight: 700; background: rgba(6,182,212,0.12); padding: 0 0.35rem; border-radius: 4px;">${p.mainPosition || 'JUG'}</span>
            ${teamObj ? `<span style="color: ${teamObj.color || 'var(--text-muted)'}; font-weight: 600;">${escapeHTML(teamObj.name)}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- BOTONES COMPACTOS ✔ Y ✖ (100% estables, 42x36px cada uno, sin solapamiento) -->
      <div class="att-btn-actions">
        <button type="button" class="att-btn-compact att-btn-compact-pres ${isPresent ? 'is-active' : ''}" data-pid="${p.id}" title="Marcar como Presente (✔)">
          ✔
        </button>
        <button type="button" class="att-btn-compact att-btn-compact-abs ${!isPresent ? 'is-active' : ''}" data-pid="${p.id}" title="Marcar como Ausente (✖)">
          ✖
        </button>
      </div>
    `;

    const btnPres = row.querySelector('.att-btn-compact-pres');
    const btnAbs = row.querySelector('.att-btn-compact-abs');

    const updateRowState = (status) => {
      tempSessionAttendance[p.id] = status;
      if (status === 'present') {
        btnPres.classList.add('is-active');
        btnAbs.classList.remove('is-active');
        row.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      } else {
        btnAbs.classList.add('is-active');
        btnPres.classList.remove('is-active');
        row.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      }
      recalculateAttendanceStats();
    };

    if (btnPres) {
      btnPres.onclick = () => updateRowState('present');
    }

    if (btnAbs) {
      btnAbs.onclick = () => updateRowState('absent');
    }

    container.appendChild(row);
  });

  recalculateAttendanceStats();
}

function recalculateAttendanceStats() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const players = (activeAttendanceTeamId === 'all')
    ? allPlayers
    : allPlayers.filter(p => p.teamId === activeAttendanceTeamId);

  let present = 0;
  let absent = 0;
  players.forEach(p => {
    const st = tempSessionAttendance[p.id] || 'present';
    if (st === 'present') present++;
    else absent++;
  });
  updateAttendanceCounters(present, absent);
}

/**
 * Actualiza los contadores de la cabecera del modal
 */
function updateAttendanceCounters(present, absent) {
  const elPres = document.getElementById('att-count-present');
  const elAbs = document.getElementById('att-count-absent');
  const elTotal = document.getElementById('att-count-total');
  const total = present + absent;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  if (elPres) elPres.textContent = `${present} (${pct}%)`;
  if (elAbs) elAbs.textContent = `${absent}`;
  if (elTotal) elTotal.textContent = `${total}`;
}

/**
 * Guarda la sesión de asistencia en el StorageService
 */
function saveCurrentAttendanceSession() {
  const teamSelect = document.getElementById('attendance-team-select');
  const dateInput = document.getElementById('attendance-date-input') || document.getElementById('attendance-date');

  if (!activeAttendanceTeamId && teamSelect) {
    activeAttendanceTeamId = teamSelect.value;
  }
  if (!activeAttendanceDate && dateInput) {
    activeAttendanceDate = dateInput.value;
  }

  if (!activeAttendanceDate) {
    activeAttendanceDate = new Date().toISOString().split('T')[0];
  }
  if (!activeAttendanceTeamId) {
    activeAttendanceTeamId = 'all';
  }

  if (!window.JKNoovaData || !window.JKNoovaData.StorageService) {
    console.error('StorageService no disponible');
    if (typeof showToast === 'function') {
      showToast('Error: Servicio de datos no disponible', 'error');
    }
    return;
  }

  const storage = window.JKNoovaData.StorageService;
  const allAttendance = storage.getAttendance() || {};

  if (activeAttendanceTeamId === 'all') {
    const allPlayers = storage.getPlayers();
    allPlayers.forEach(p => {
      const tId = p.teamId || 'no_team';
      if (!allAttendance[tId]) allAttendance[tId] = {};
      if (!allAttendance[tId][activeAttendanceDate]) allAttendance[tId][activeAttendanceDate] = {};
      if (tempSessionAttendance[p.id]) {
        allAttendance[tId][activeAttendanceDate][p.id] = tempSessionAttendance[p.id];
      }
    });
    if (!allAttendance['all']) allAttendance['all'] = {};
    allAttendance['all'][activeAttendanceDate] = { ...tempSessionAttendance };
  } else {
    if (!allAttendance[activeAttendanceTeamId]) {
      allAttendance[activeAttendanceTeamId] = {};
    }
    allAttendance[activeAttendanceTeamId][activeAttendanceDate] = { ...tempSessionAttendance };
  }

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

  // Refrescar equipos si está en equipos.html
  if (typeof renderTeamsBoard === 'function') {
    renderTeamsBoard();
  }

  // Refrescar vistas de calendario y entrenamientos en tiempo real
  if (typeof window.renderWeeklyCalendarStrip === 'function') {
    window.renderWeeklyCalendarStrip();
  }
  if (typeof window.renderSelectedDayTrainings === 'function') {
    window.renderSelectedDayTrainings();
  }
  if (typeof window.renderTrainingSessions === 'function') {
    window.renderTrainingSessions();
  }
  if (typeof window.renderMonthlyCalendar === 'function') {
    window.renderMonthlyCalendar();
  }
  if (typeof window.renderTrainingCalendarView === 'function') {
    window.renderTrainingCalendarView();
  }
  if (typeof window.renderAttendanceStats === 'function') {
    window.renderAttendanceStats();
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

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Exponer globalmente
window.getPlayerAttendanceStats = getPlayerAttendanceStats;
window.initAttendanceModal = initAttendanceModal;
window.openAttendanceModal = openAttendanceModal;
window.saveCurrentAttendanceSession = saveCurrentAttendanceSession;
window.markAllPresent = markAllPresent;
window.markAllAbsent = markAllAbsent;
