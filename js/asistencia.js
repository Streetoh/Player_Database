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
/**
 * Devuelve el historial y estadísticas completas de asistencia de un jugador en los últimos N días
 * @param {string} playerId
 * @param {number|null} days (30, 90, o null/0/365 para toda la temporada)
 * @returns {{
 *   totalSessions: number,
 *   presentCount: number,
 *   absentCount: number,
 *   percentage: number,
 *   hasRecords: boolean,
 *   sessions: Array<{ date: string, parsedDate: Date, status: 'present'|'absent', title: string, location: string }>
 * }}
 */
function getPlayerAttendanceHistory(playerId, days = 30) {
  if (!playerId || !window.JKNoovaData || !window.JKNoovaData.StorageService) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      percentage: 0,
      hasRecords: false,
      sessions: []
    };
  }

  const storage = window.JKNoovaData.StorageService;
  const attendance = storage.getAttendance() || {};
  const trainings = typeof storage.getTrainingSessions === 'function' ? storage.getTrainingSessions() : [];

  // Mapeo rápido de entrenamientos por fecha para enriquecer el historial con el título/lugar
  const trainingByDate = {};
  if (Array.isArray(trainings)) {
    trainings.forEach(tr => {
      if (tr && tr.date) {
        if (!trainingByDate[tr.date]) trainingByDate[tr.date] = tr;
      }
    });
  }

  let cutoffDate = null;
  if (days && days > 0 && days < 3650) {
    cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);
  }

  // Deduplicación por fecha YYYY-MM-DD
  const sessionMap = {};

  for (const tId in attendance) {
    const datesObj = attendance[tId];
    if (!datesObj || typeof datesObj !== 'object') continue;

    for (const dStr in datesObj) {
      const dayData = datesObj[dStr];
      if (!dayData || typeof dayData !== 'object') continue;

      if (dayData[playerId]) {
        const st = dayData[playerId]; // 'present' o 'absent'

        const parts = dStr.split('-');
        let sessionDate = null;
        if (parts.length === 3) {
          sessionDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          sessionDate = new Date(dStr);
        }

        if (cutoffDate && sessionDate < cutoffDate) {
          continue;
        }

        // Si ya existía y este es 'present', o no existía aún, registrarlo
        if (!sessionMap[dStr] || st === 'present') {
          const trInfo = trainingByDate[dStr];
          sessionMap[dStr] = {
            date: dStr,
            parsedDate: sessionDate,
            status: st,
            title: trInfo ? trInfo.title : 'Entrenamiento',
            location: trInfo ? trInfo.location : ''
          };
        }
      }
    }
  }

  const sessions = Object.values(sessionMap).sort((a, b) => {
    return (b.parsedDate || 0) - (a.parsedDate || 0); // más reciente primero
  });

  let presentCount = 0;
  let absentCount = 0;
  sessions.forEach(s => {
    if (s.status === 'present') presentCount++;
    else if (s.status === 'absent') absentCount++;
  });

  const totalSessions = sessions.length;
  const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
  const hasRecords = totalSessions > 0;

  return {
    totalSessions,
    presentCount,
    absentCount,
    percentage,
    hasRecords,
    sessions
  };
}

/**
 * Devuelve las estadísticas de asistencia de un jugador en los últimos N días
 * @param {string} playerId
 * @param {number} days (por defecto 30 días)
 * @returns {{ totalSessions: number, presentCount: number, absentCount: number, percentage: number, hasRecords: boolean }}
 */
function getPlayerAttendanceStats(playerId, days = 30) {
  const history = getPlayerAttendanceHistory(playerId, days);
  return {
    totalSessions: history.totalSessions,
    presentCount: history.presentCount,
    absentCount: history.absentCount,
    percentage: history.totalSessions > 0 ? history.percentage : 100,
    hasRecords: history.hasRecords
  };
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
    const todayLocal = (typeof formatLocalDateToISO === 'function')
      ? formatLocalDateToISO(new Date())
      : (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
    const targetDate = defaultDate || todayLocal;
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
    activeAttendanceDate = (typeof formatLocalDateToISO === 'function')
      ? formatLocalDateToISO(new Date())
      : (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
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

function formatSpanishAttendanceDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dayOfWeek = dayNames[dateObj.getDay()] || '';
    const month = monthNames[m] || '';
    return `${dayOfWeek}, ${d} ${month} ${y}`;
  }
  return dateStr;
}

let currentModalPlayerId = null;
let currentModalAttPeriod = 30;

function initPlayerModalAttendanceEvents() {
  const section = document.getElementById('player-modal-attendance-section');
  if (!section || section.dataset.eventsBound) return;
  section.dataset.eventsBound = 'true';

  section.addEventListener('click', (e) => {
    const btn = e.target.closest('.att-period-btn');
    if (!btn) return;
    const period = parseInt(btn.dataset.period, 10);
    if (!isNaN(period) && currentModalPlayerId) {
      renderPlayerModalAttendance(currentModalPlayerId, period);
    }
  });
}

function renderPlayerModalAttendance(playerId = null, days = 30) {
  currentModalPlayerId = playerId;
  currentModalAttPeriod = days;
  initPlayerModalAttendanceEvents();

  const section = document.getElementById('player-modal-attendance-section');
  if (!section) return;

  const emptyEl = document.getElementById('player-att-empty');
  const statsContent = document.getElementById('player-att-stats-content');
  const pctEl = document.getElementById('player-att-pct');
  const totalEl = document.getElementById('player-att-total');
  const presentEl = document.getElementById('player-att-present');
  const absentEl = document.getElementById('player-att-absent');
  const progressBar = document.getElementById('player-att-progress-bar');
  const countSummary = document.getElementById('player-att-count-summary');
  const historyList = document.getElementById('player-att-history-list');

  // Actualizar estilos de los botones de periodo
  const periodButtons = section.querySelectorAll('.att-period-btn');
  periodButtons.forEach(btn => {
    const p = parseInt(btn.dataset.period, 10);
    if (p === days) {
      btn.style.background = 'rgba(6, 182, 212, 0.25)';
      btn.style.borderColor = '#06b6d4';
      btn.style.color = '#67e8f9';
      btn.style.fontWeight = '700';
    } else {
      btn.style.background = 'var(--bg-secondary)';
      btn.style.borderColor = 'var(--border-subtle)';
      btn.style.color = 'var(--text-secondary)';
      btn.style.fontWeight = '500';
    }
  });

  if (!playerId) {
    if (emptyEl) {
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = 'ℹ️ Guarda la ficha del jugador para ver sus estadísticas de asistencia.';
    }
    if (statsContent) statsContent.style.display = 'none';
    return;
  }

  const att = getPlayerAttendanceHistory(playerId, days);

  if (!att.hasRecords) {
    if (emptyEl) {
      emptyEl.style.display = 'block';
      const periodLabel = days >= 365 ? 'en toda la temporada' : `en los últimos ${days} días`;
      emptyEl.innerHTML = `ℹ️ No hay sesiones de asistencia registradas para este jugador ${periodLabel}.`;
    }
    if (statsContent) statsContent.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (statsContent) statsContent.style.display = 'block';

  let color = '#10b981'; // >=80%
  if (att.percentage < 60) color = '#f87171'; // <60%
  else if (att.percentage < 80) color = '#fbbf24'; // 60-79%

  if (pctEl) {
    pctEl.textContent = `${att.percentage}%`;
    pctEl.style.color = color;
  }
  if (totalEl) totalEl.textContent = att.totalSessions;
  if (presentEl) presentEl.textContent = att.presentCount;
  if (absentEl) absentEl.textContent = att.absentCount;

  if (progressBar) {
    progressBar.style.width = `${att.percentage}%`;
    progressBar.style.background = color;
  }

  if (countSummary) {
    countSummary.textContent = `${att.sessions.length} ${att.sessions.length === 1 ? 'sesión' : 'sesiones'} (${days >= 365 ? 'Temporada' : `${days}d`})`;
  }

  if (historyList) {
    historyList.innerHTML = att.sessions.map(s => {
      const isPresent = s.status === 'present';
      const badgeStyle = isPresent
        ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);'
        : 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);';
      const icon = isPresent ? '✔ Presente' : '✖ Ausente';
      const dateFormatted = formatSpanishAttendanceDate(s.date);

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.65rem; background: var(--bg-secondary); border-radius: 6px; border: 1px solid var(--border-subtle); font-size: 0.78rem;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; color: #fff;">${dateFormatted}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${escapeHTML(s.title)}${s.location ? ` • ${escapeHTML(s.location)}` : ''}</span>
          </div>
          <span style="padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.72rem; ${badgeStyle}">
            ${icon}
          </span>
        </div>
      `;
    }).join('');
  }
}

// Exponer globalmente
window.getPlayerAttendanceHistory = getPlayerAttendanceHistory;
window.getPlayerAttendanceStats = getPlayerAttendanceStats;
window.renderPlayerModalAttendance = renderPlayerModalAttendance;
window.formatSpanishAttendanceDate = formatSpanishAttendanceDate;
window.initAttendanceModal = initAttendanceModal;
window.openAttendanceModal = openAttendanceModal;
window.saveCurrentAttendanceSession = saveCurrentAttendanceSession;
window.markAllPresent = markAllPresent;
window.markAllAbsent = markAllAbsent;
