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

function getLocalDateISO(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSessionAttendanceTaken(session, allAttendance) {
  if (!session) return false;
  if (session.attendanceTaken) return true;
  if (!allAttendance && window.JKNoovaData?.StorageService) {
    allAttendance = window.JKNoovaData.StorageService.getAttendance() || {};
  }
  if (!allAttendance) return false;
  const dateStr = session.date;
  if (!dateStr) return false;
  const teamId = session.teamId;

  if (teamId && allAttendance[teamId] && allAttendance[teamId][dateStr] && Object.keys(allAttendance[teamId][dateStr]).length > 0) {
    return true;
  }
  if (allAttendance['all'] && allAttendance['all'][dateStr] && Object.keys(allAttendance['all'][dateStr]).length > 0) {
    return true;
  }
  for (const tId in allAttendance) {
    if (allAttendance[tId] && allAttendance[tId][dateStr] && Object.keys(allAttendance[tId][dateStr]).length > 0) {
      return true;
    }
  }
  return false;
}

function getPastPendingAttendanceSessions() {
  if (!window.JKNoovaData?.StorageService) return [];
  const storage = window.JKNoovaData.StorageService;
  const sessions = typeof storage.getTrainingSessions === 'function' ? storage.getTrainingSessions() : [];
  const allAttendance = storage.getAttendance() || {};
  const todayStr = getLocalDateISO(new Date());

  const pastPending = sessions.filter(s => {
    if (!s || !s.date) return false;
    if (s.date >= todayStr) return false;
    return !isSessionAttendanceTaken(s, allAttendance);
  });

  pastPending.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return pastPending;
}

function renderPastPendingBanner() {
  const banner = document.getElementById('attendance-past-pending-banner');
  if (!banner) return;
  const pastPending = getPastPendingAttendanceSessions();
  if (pastPending.length === 0) {
    banner.style.display = 'none';
    banner.innerHTML = '';
    return;
  }

  const tFn = window.t || ((k, def) => def);
  banner.style.display = 'block';
  banner.innerHTML = `
    <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: var(--radius-lg, 10px); padding: 0.85rem 1.15rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">⚠️</span>
        <div>
          <div style="font-weight: 800; color: #f87171; font-size: 0.92rem;">
            ${tFn('attendance.pastPendingAlert', 'Sesiones de días anteriores pendientes de pasar lista')} (${pastPending.length})
          </div>
          <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
            ${tFn('attendance.pastPendingDesc', 'Tienes sesiones de días anteriores en las que aún no se ha registrado la asistencia:')}
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" id="btn-banner-view-pending" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); font-weight: 700;">
        Ver sesiones (${pastPending.length})
      </button>
    </div>
  `;

  const btnView = banner.querySelector('#btn-banner-view-pending');
  if (btnView) {
    btnView.onclick = () => {
      openTodayTrainingsAttendanceModal();
    };
  }
}

function openTodayTrainingsAttendanceModal() {
  const modal = document.getElementById('modal-today-sessions-attendance');
  if (!modal) {
    openAttendanceModal();
    return;
  }

  const storage = window.JKNoovaData?.StorageService;
  if (!storage) {
    openAttendanceModal();
    return;
  }

  const tFn = window.t || ((k, def) => def);
  const todayDate = new Date();
  const todayStr = getLocalDateISO(todayDate);
  const formattedToday = formatSpanishAttendanceDate(todayStr);

  const dateHeader = document.getElementById('today-sessions-modal-date');
  if (dateHeader) {
    dateHeader.textContent = formattedToday;
  }

  const sessions = typeof storage.getTrainingSessions === 'function' ? storage.getTrainingSessions() : [];
  const allAttendance = storage.getAttendance() || {};
  const teams = storage.getTeams();

  const todaySessions = sessions.filter(s => s && s.date === todayStr);

  const container = document.getElementById('today-sessions-container');
  if (container) {
    container.innerHTML = '';

    if (todaySessions.length === 0) {
      const emptyDesc = tFn('attendance.noTrainingsTodayDesc', 'No hay sesiones de entrenamiento programadas para hoy ({date}).').replace('{date}', formattedToday);
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1.25rem; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">⚽</div>
          <div style="font-weight: 700; color: #fff; font-size: 1rem; margin-bottom: 0.35rem;">
            ${tFn('attendance.noTrainingsToday', 'No hay entrenamientos planificados para hoy')}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            ${emptyDesc}
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-today-empty-manual-att" style="font-weight: 700;">
            📋 Pasar lista manual (elegir equipo)
          </button>
        </div>
      `;
      const btnManual = container.querySelector('#btn-today-empty-manual-att');
      if (btnManual) {
        btnManual.onclick = () => {
          if (typeof closeModal === 'function') closeModal(modal);
          else modal.classList.remove('active');
          openAttendanceModal('all', todayStr, null, true);
        };
      }
    } else {
      todaySessions.forEach(session => {
        const team = teams.find(t => t.id === session.teamId);
        const teamName = team ? team.name : (session.teamName || 'Equipo');
        const teamColor = team ? team.color : 'var(--accent-cyan)';
        const isTaken = isSessionAttendanceTaken(session, allAttendance);

        const card = document.createElement('div');
        card.style.background = 'var(--bg-secondary)';
        card.style.border = isTaken ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)';
        card.style.borderRadius = '10px';
        card.style.padding = '0.9rem 1.1rem';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.gap = '0.75rem';
        card.style.flexWrap = 'wrap';

        const badgeHtml = isTaken
          ? `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); padding: 0.2rem 0.55rem; border-radius: 6px; font-weight: 700; font-size: 0.74rem;">${tFn('attendance.badgeDone', '✔ Lista pasada')}</span>`
          : `<span style="background: rgba(234, 179, 8, 0.15); color: #fbbf24; border: 1px solid rgba(234, 179, 8, 0.35); padding: 0.2rem 0.55rem; border-radius: 6px; font-weight: 700; font-size: 0.74rem;">${tFn('attendance.badgePending', '⏳ Sin pasar lista')}</span>`;

        const btnClass = isTaken ? 'btn-secondary' : 'btn-primary';
        const btnStyle = isTaken ? 'font-weight: 700; color: #34d399; border-color: rgba(16, 185, 129, 0.4);' : 'background: #10b981; border-color: #059669; font-weight: 700;';
        const btnText = isTaken ? tFn('attendance.modifyList', '✏️ Modificar lista') : tFn('attendance.takeListNow', '📋 Pasar lista ahora');

        card.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${teamColor};"></span>
              <strong style="color: #fff; font-size: 0.95rem;">${escapeHTML(teamName)}</strong>
              ${badgeHtml}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 1px;">
              ⚽ ${escapeHTML(session.title || 'Entrenamiento')}
              ${session.timeStart ? ` • ⏰ ${session.timeStart}${session.timeEnd ? ` - ${session.timeEnd}` : ''}` : ''}
              ${session.location ? ` • 📍 ${escapeHTML(session.location)}` : ''}
            </div>
          </div>
          <div>
            <button type="button" class="btn ${btnClass} btn-sm btn-session-action" style="${btnStyle}">
              ${btnText}
            </button>
          </div>
        `;

        const actionBtn = card.querySelector('.btn-session-action');
        if (actionBtn) {
          actionBtn.onclick = () => {
            if (typeof closeModal === 'function') closeModal(modal);
            else modal.classList.remove('active');
            openAttendanceModal(session.teamId, session.date, session, true);
          };
        }

        container.appendChild(card);
      });

      // Botón para pasar lista manual de otro grupo o fecha
      const manualFooter = document.createElement('div');
      manualFooter.style.marginTop = '0.4rem';
      manualFooter.innerHTML = `
        <button type="button" class="btn btn-link btn-xs" id="btn-today-manual-other" style="color: var(--text-muted); text-decoration: underline; cursor: pointer; padding: 0.2rem 0;">
          📋 Pasar lista para otro grupo o fecha manual...
        </button>
      `;
      const btnOther = manualFooter.querySelector('#btn-today-manual-other');
      if (btnOther) {
        btnOther.onclick = () => {
          if (typeof closeModal === 'function') closeModal(modal);
          else modal.classList.remove('active');
          openAttendanceModal('all', todayStr, null, true);
        };
      }
      container.appendChild(manualFooter);
    }
  }

  // Sección de pendientes de días anteriores
  const pastPending = getPastPendingAttendanceSessions();
  const pastSection = document.getElementById('today-modal-past-pending-section');
  const pastList = document.getElementById('today-modal-past-pending-list');

  if (pastSection && pastList) {
    if (pastPending.length === 0) {
      pastSection.style.display = 'none';
      pastList.innerHTML = '';
    } else {
      pastSection.style.display = 'block';
      pastList.innerHTML = '';

      pastPending.forEach(ps => {
        const team = teams.find(t => t.id === ps.teamId);
        const teamName = team ? team.name : (ps.teamName || 'Equipo');
        const teamColor = team ? team.color : 'var(--accent-cyan)';

        const item = document.createElement('div');
        item.style.background = 'rgba(239, 68, 68, 0.08)';
        item.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        item.style.borderRadius = '8px';
        item.style.padding = '0.65rem 0.85rem';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.gap = '0.6rem';
        item.style.flexWrap = 'wrap';

        item.innerHTML = `
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="font-weight: 800; color: #f87171; font-size: 0.82rem;">${formatSpanishAttendanceDate(ps.date)}</span>
              <span style="font-weight: 700; color: ${teamColor}; font-size: 0.82rem;">${escapeHTML(teamName)}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              ${escapeHTML(ps.title || 'Entrenamiento')}${ps.timeStart ? ` (${ps.timeStart})` : ''}${ps.location ? ` • ${escapeHTML(ps.location)}` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-xs btn-past-take-att" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); font-weight: 700; font-size: 0.74rem; padding: 0.3rem 0.6rem;">
            ${tFn('attendance.takeList', '📋 Pasar lista')}
          </button>
        `;

        const btnPast = item.querySelector('.btn-past-take-att');
        if (btnPast) {
          btnPast.onclick = () => {
            if (typeof closeModal === 'function') closeModal(modal);
            else modal.classList.remove('active');
            openAttendanceModal(ps.teamId, ps.date, ps, true);
          };
        }

        pastList.appendChild(item);
      });
    }
  }

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }
}

/**
 * Abre el modal de asistencia para el equipo y fecha seleccionada
 * @param {string} defaultTeamId 
 * @param {string} defaultDate
 * @param {object|null} sessionInfo
 * @param {boolean} fromTodayModal
 */
function openAttendanceModal(defaultTeamId = null, defaultDate = null, sessionInfo = null, fromTodayModal = false) {
  const modal = document.getElementById('modal-attendance');
  if (!modal) return;

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const allPlayers = storage.getPlayers();
  const teamSelect = document.getElementById('attendance-team-select');

  // Configurar botones de volver si se abrió desde la ventana de entrenamientos de hoy
  const btnBackHeader = document.getElementById('btn-attendance-back-to-today');
  const btnBackFooter = document.getElementById('btn-attendance-back-to-today-footer');

  const onBackClick = () => {
    if (typeof closeModal === 'function') closeModal(modal);
    else modal.classList.remove('active');
    openTodayTrainingsAttendanceModal();
  };

  const btnCancel = modal.querySelector('.modal-footer [data-close-modal="modal-attendance"]');
  const btnCloseX = modal.querySelector('.modal-header .modal-close-btn[data-close-modal="modal-attendance"]');
  const tFn = window.t || ((k, def) => def);

  if (btnBackHeader) {
    if (fromTodayModal) {
      btnBackHeader.style.display = 'inline-flex';
      btnBackHeader.onclick = onBackClick;
    } else {
      btnBackHeader.style.display = 'none';
      btnBackHeader.onclick = null;
    }
  }

  if (btnBackFooter) {
    if (fromTodayModal) {
      btnBackFooter.style.display = 'inline-flex';
      btnBackFooter.onclick = onBackClick;
    } else {
      btnBackFooter.style.display = 'none';
      btnBackFooter.onclick = null;
    }
  }

  if (fromTodayModal) {
    if (btnCancel) {
      btnCancel.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onBackClick();
      };
      btnCancel.innerHTML = `← ${tFn('common.back', 'Volver')}`;
    }
    if (btnCloseX) {
      btnCloseX.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onBackClick();
      };
    }
  } else {
    if (btnCancel) {
      btnCancel.onclick = null;
      btnCancel.innerHTML = tFn('common.cancel', 'Cancelar');
    }
    if (btnCloseX) {
      btnCloseX.onclick = null;
    }
  }

  // Mostrar info de sesión específica si se ha pasado como parámetro
  const infoBadge = document.getElementById('attendance-session-info-badge');
  if (infoBadge) {
    if (sessionInfo) {
      infoBadge.style.display = 'block';
      const sTitle = escapeHTML(sessionInfo.title || 'Entrenamiento');
      const sDate = formatAttendanceDate(sessionInfo.date || defaultDate);
      const sTime = sessionInfo.timeStart ? ` • ⏰ ${sessionInfo.timeStart}${sessionInfo.timeEnd ? ` - ${sessionInfo.timeEnd}` : ''}` : '';
      const sLoc = sessionInfo.location ? ` • 📍 ${escapeHTML(sessionInfo.location)}` : '';
      infoBadge.innerHTML = `⚽ <strong style="color: #fff;">${sTitle}</strong> <span style="color: var(--accent-cyan); font-weight: 600;">(${sDate})</span><span style="color: var(--text-secondary); font-size: 0.78rem;">${sTime}${sLoc}</span>`;
    } else {
      infoBadge.style.display = 'none';
      infoBadge.innerHTML = '';
    }
  }

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

  // Marcar attendanceTaken = true en las sesiones correspondientes
  if (typeof storage.getTrainingSessions === 'function' && typeof storage.saveTrainingSessions === 'function') {
    const sessions = storage.getTrainingSessions();
    let modified = false;
    sessions.forEach(s => {
      if (s && s.date === activeAttendanceDate) {
        if (!activeAttendanceTeamId || activeAttendanceTeamId === 'all' || s.teamId === activeAttendanceTeamId) {
          s.attendanceTaken = true;
          modified = true;
        }
      }
    });
    if (modified) {
      storage.saveTrainingSessions(sessions);
    }
  }

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

  // Refrescar banner de alerta de pendientes si procede
  if (typeof renderPastPendingBanner === 'function') {
    renderPastPendingBanner();
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
  if (typeof renderAttendanceDashboard === 'function') {
    renderAttendanceDashboard();
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

/* ==========================================================================
   PANEL Y CUADRO DE MANDO GENERAL DE ASISTENCIA (asistencia.html)
   ========================================================================== */
let dashSelectedPeriod = 30; // 30, 90, 365
let dashSelectedTeamId = 'all';
let dashSearchQuery = '';

function initAttendanceDashboardPage() {
  if (typeof initSharedNavbar === 'function') {
    initSharedNavbar('attendance');
  }
  initAttendanceModal();

  const btnOpenAtt = document.getElementById('btn-dash-open-attendance');
  if (btnOpenAtt) {
    btnOpenAtt.onclick = () => openTodayTrainingsAttendanceModal();
  }

  // Selector de periodo (30d, 90d, temporada)
  const periodBtns = document.querySelectorAll('.att-dash-period-btn');
  periodBtns.forEach(btn => {
    btn.onclick = () => {
      periodBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
      });
      btn.classList.add('active');
      btn.style.background = '#10b981';
      btn.style.color = '#fff';
      dashSelectedPeriod = parseInt(btn.getAttribute('data-period'), 10) || 30;
      renderAttendanceDashboard();
    };
  });

  // Selector de equipo
  const teamSelect = document.getElementById('att-dash-team-select');
  if (teamSelect && window.JKNoovaData?.StorageService) {
    const teams = window.JKNoovaData.StorageService.getTeams();
    teamSelect.innerHTML = '<option value="all">🌟 Todos los equipos</option>';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      teamSelect.appendChild(opt);
    });
    teamSelect.onchange = (e) => {
      dashSelectedTeamId = e.target.value;
      renderAttendanceDashboard();
    };
  }

  // Barra de búsqueda de jugador
  const searchInput = document.getElementById('att-dash-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      dashSearchQuery = e.target.value.toLowerCase().trim();
      renderAttendanceDashboard();
    };
  }

  renderAttendanceDashboard();
  renderPastPendingBanner();

  window.addEventListener('languageChanged', () => {
    renderAttendanceDashboard();
    renderPastPendingBanner();
  });
}

function renderAttendanceDashboard() {
  const container = document.getElementById('attendance-teams-accordion-container');
  if (!container || !window.JKNoovaData?.StorageService) return;
  container.innerHTML = '';

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const allPlayers = storage.getPlayers();
  const tFn = window.t || ((k, def) => def);

  const filteredTeams = (dashSelectedTeamId === 'all')
    ? teams
    : teams.filter(t => t.id === dashSelectedTeamId);

  let totalSessionsSum = 0;
  let totalAttPctSum = 0;
  let totalEvaluatedPlayers = 0;
  let topPlayersCount = 0;
  let lowPlayersCount = 0;

  // Renderizar cada equipo en su tarjeta de acordeón
  filteredTeams.forEach(team => {
    let teamPlayers = allPlayers.filter(p => p.teamId === team.id);
    if (dashSearchQuery) {
      teamPlayers = teamPlayers.filter(p => {
        const full = `${p.name} ${p.lastName} ${p.mainDorsal || ''} ${p.mainPosition || ''}`.toLowerCase();
        return full.includes(dashSearchQuery);
      });
    }

    // Calcular estadísticas de asistencia de cada jugador
    const playerStatsList = teamPlayers.map(p => {
      const stats = getPlayerAttendanceHistory(p.id, dashSelectedPeriod);
      return { player: p, stats };
    });

    // Calcular número de sesiones únicas en las que ha participado el equipo
    const teamSessionsSet = new Set();
    playerStatsList.forEach(ps => {
      ps.stats.sessions.forEach(s => teamSessionsSet.add(s.date));
    });
    const totalTeamSessions = teamSessionsSet.size;

    // Calcular media de asistencia del equipo
    const activePlayersWithSessions = playerStatsList.filter(ps => ps.stats.totalSessions > 0);
    let teamAvgPct = 0;
    if (activePlayersWithSessions.length > 0) {
      const sum = activePlayersWithSessions.reduce((acc, curr) => acc + curr.stats.percentage, 0);
      teamAvgPct = Math.round(sum / activePlayersWithSessions.length);
    }

    // Acumular para métricas globales
    playerStatsList.forEach(ps => {
      if (ps.stats.totalSessions > 0) {
        totalEvaluatedPlayers++;
        totalAttPctSum += ps.stats.percentage;
        if (ps.stats.percentage >= 80) topPlayersCount++;
        else if (ps.stats.percentage < 60) lowPlayersCount++;
      }
    });
    totalSessionsSum += totalTeamSessions;

    // Crear tarjeta de acordeón
    const card = document.createElement('div');
    card.className = 'att-team-accordion is-collapsed';
    card.style.setProperty('--team-accent', team.color || '#10b981');

    const pctColor = teamAvgPct >= 80 ? '#34d399' : teamAvgPct >= 60 ? '#fbbf24' : teamAvgPct > 0 ? '#f87171' : 'var(--text-muted)';
    const isInitTeam = !!(team.isInitiation || team.id === 'team_jmk');
    const initBadge = isInitTeam ? `<span style="display:inline-block; font-size: 0.68rem; padding: 0.12rem 0.45rem; background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 9999px; margin-left: 0.35rem; font-weight: 700;">${tFn('teams.badgeInitiation', '🐣 Iniciación')}</span>` : '';

    card.innerHTML = `
      <div class="att-team-accordion-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${team.color || '#10b981'};"></div>
          <div>
            <div style="font-weight: 800; font-size: 1.05rem; color: #fff;">
              ${escapeHTML(team.name)} ${initBadge}
            </div>
            <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
              ${escapeHTML(team.category || 'Categoría no asignada')} • ${teamPlayers.length} jugadores
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
          <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: ${pctColor}; padding: 0.25rem 0.65rem; border-radius: 6px; font-weight: 800; font-size: 0.85rem;">
            ${teamAvgPct > 0 ? `⚡ ${teamAvgPct}% ${tFn('attendance.avgAttendance', 'asistencia global')}` : 'Sin sesiones en este periodo'}
          </span>
          <span style="background: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.3); color: var(--accent-cyan); padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">
            📅 ${totalTeamSessions} ${tFn('attendance.sessionsCount', 'sesiones')}
          </span>
          <button type="button" class="btn btn-secondary btn-xs btn-quick-att-team" data-team-id="${team.id}" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.35); color: #34d399; font-weight: 700; font-size: 0.75rem; padding: 0.3rem 0.6rem;">
            📋 Pasar lista
          </button>
          <button type="button" class="btn btn-secondary btn-xs btn-att-fold" style="font-size: 0.75rem; padding: 0.3rem 0.65rem; display: flex; align-items: center; gap: 0.3rem;">
            <span class="fold-chevron">▼</span> <span class="fold-text">${tFn('attendance.unfoldPlayers', 'Ver jugadores')} (${teamPlayers.length})</span>
          </button>
        </div>
      </div>

      <div class="att-team-accordion-body">
        ${teamPlayers.length === 0 ? `
          <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
            No hay jugadores en este equipo que coincidan con la búsqueda.
          </div>
        ` : ''}
      </div>
    `;

    const body = card.querySelector('.att-team-accordion-body');
    const header = card.querySelector('.att-team-accordion-header');
    const btnFold = card.querySelector('.btn-att-fold');
    const chevron = card.querySelector('.fold-chevron');
    const foldText = card.querySelector('.fold-text');
    const btnQuickAtt = card.querySelector('.btn-quick-att-team');

    const toggleFold = () => {
      const isCollapsed = card.classList.contains('is-collapsed');
      if (isCollapsed) {
        card.classList.remove('is-collapsed');
        if (chevron) chevron.textContent = '▲';
        if (foldText) foldText.textContent = `${tFn('attendance.foldPlayers', 'Ocultar jugadores')} (${teamPlayers.length})`;
      } else {
        card.classList.add('is-collapsed');
        if (chevron) chevron.textContent = '▼';
        if (foldText) foldText.textContent = `${tFn('attendance.unfoldPlayers', 'Ver jugadores')} (${teamPlayers.length})`;
      }
    };

    if (btnFold) {
      btnFold.onclick = (e) => {
        e.stopPropagation();
        toggleFold();
      };
    }

    if (header) {
      header.onclick = (e) => {
        if (e.target.closest('button')) return;
        toggleFold();
      };
    }

    if (btnQuickAtt) {
      btnQuickAtt.onclick = (e) => {
        e.stopPropagation();
        if (typeof openAttendanceModal === 'function') {
          openAttendanceModal(team.id);
        }
      };
    }

    // Renderizar filas de jugadores dentro del cuerpo del acordeón
    playerStatsList.forEach(({ player: p, stats }) => {
      const avatarUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name + '+' + p.lastName)}&background=18233c&color=fff`;
      const pColor = stats.totalSessions === 0 ? 'var(--text-muted)' : stats.percentage >= 80 ? '#34d399' : stats.percentage >= 60 ? '#fbbf24' : '#f87171';
      const pctDisplay = stats.totalSessions > 0 ? `${stats.percentage}%` : '--%';
      const ratioDisplay = stats.totalSessions > 0
        ? `${stats.presentCount} / ${stats.totalSessions} ${tFn('attendance.sessionsCount', 'sesiones')}`
        : '0 sesiones';

      // Mini historial visual (últimas hasta 5 sesiones)
      const recentDots = stats.sessions.slice(0, 5).map(s => {
        const isPres = s.status === 'present';
        const dColor = isPres ? '#10b981' : '#ef4444';
        const dIcon = isPres ? '✔' : '✖';
        return `<span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 0.65rem; background: ${isPres ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${dColor}; border: 1px solid ${isPres ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}; font-weight: 800;" title="${s.date}: ${isPres ? 'Presente' : 'Ausente'}">${dIcon}</span>`;
      }).join(' ');

      const row = document.createElement('div');
      row.className = 'att-player-row';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 220px;">
          <img src="${avatarUrl}" alt="${p.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=18233c&color=fff'">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
              <span style="color: var(--accent-cyan); font-weight: 800; margin-right: 0.35rem;">#${p.mainDorsal || '-'}</span>
              ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              ${p.mainPosition || 'Jugador'} ${p.secondaryPosition ? `/ ${p.secondaryPosition}` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            ${recentDots}
          </div>

          <div style="min-width: 140px; text-align: right;">
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; margin-bottom: 3px;">
              <span style="font-size: 0.72rem; color: var(--text-muted);">${ratioDisplay}</span>
              <strong style="color: ${pColor}; font-size: 1rem;">${pctDisplay}</strong>
            </div>
            <div style="background: rgba(255, 255, 255, 0.08); border-radius: 9999px; height: 6px; overflow: hidden; width: 100%;">
              <div style="background: ${pColor}; height: 100%; width: ${stats.percentage}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      `;
      body.appendChild(row);
    });

    container.appendChild(card);
  });

  // Actualizar métricas globales
  const globalAvg = totalEvaluatedPlayers > 0 ? Math.round(totalAttPctSum / totalEvaluatedPlayers) : 0;
  const statGlobal = document.getElementById('stat-att-global-pct');
  const statSessions = document.getElementById('stat-att-total-sessions');
  const statTop = document.getElementById('stat-att-top-players');
  const statLow = document.getElementById('stat-att-low-players');

  if (statGlobal) statGlobal.textContent = globalAvg > 0 ? `${globalAvg}%` : '--%';
  if (statSessions) statSessions.textContent = totalSessionsSum;
  if (statTop) statTop.textContent = topPlayersCount;
  if (statLow) statLow.textContent = lowPlayersCount;
}

// Auto-inicializar en asistencia.html
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('attendance-teams-accordion-container')) {
    initAttendanceDashboardPage();
  }
});

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
window.initAttendanceDashboardPage = initAttendanceDashboardPage;
window.renderAttendanceDashboard = renderAttendanceDashboard;
window.openTodayTrainingsAttendanceModal = openTodayTrainingsAttendanceModal;
window.renderPastPendingBanner = renderPastPendingBanner;
window.isSessionAttendanceTaken = isSessionAttendanceTaken;
window.getPastPendingAttendanceSessions = getPastPendingAttendanceSessions;

