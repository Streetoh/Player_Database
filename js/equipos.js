/**
 * JK NOOVA - Lógica de Gestión de Equipos y Tableros
 * Adaptado a ortografía en español estándar y visualización de nombres completos
 */

let playersList = [];
let teamsList = [];
let draggedPlayerId = null;
let tempCoachNotes = [];

document.addEventListener('DOMContentLoaded', () => {
  initSharedNavbar('teams');
  loadData();
  initCustomTeamModalLogic();
  initPlayerModalLogic();
  if (typeof initAttendanceModal === 'function') {
    initAttendanceModal();
  }
  renderTeamsBoard();

  window.addEventListener('languageChanged', () => {
    renderTeamsBoard();
  });
});

function loadData() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  playersList = storage.getPlayers();
  teamsList = storage.getTeams();
}

function renderTeamsBoard() {
  const container = document.getElementById('teams-board-container');
  if (!container) return;
  container.innerHTML = '';

  teamsList.forEach(team => {
    const teamPlayers = playersList.filter(p => p.teamId === team.id);
    const col = document.createElement('div');
    col.className = 'team-column team-accordion-card is-collapsed';
    col.style.setProperty('--team-accent', team.color);
    col.setAttribute('data-team-id', team.id);

    // Conteo por posiciones
    const porCount = teamPlayers.filter(p => p.mainPosition === 'POR').length;
    const defCount = teamPlayers.filter(p => ['DFC', 'LD', 'LI'].includes(p.mainPosition)).length;
    const medCount = teamPlayers.filter(p => ['MCD', 'MC', 'MCO'].includes(p.mainPosition)).length;
    const delCount = teamPlayers.filter(p => ['ED', 'EI', 'DC'].includes(p.mainPosition)).length;

    // Detección de conflicto de dorsales repetidos en el equipo
    const dorsalMap = {};
    teamPlayers.forEach(p => {
      const d = parseInt(p.mainDorsal, 10);
      if (!isNaN(d) && d > 0) {
        if (!dorsalMap[d]) dorsalMap[d] = [];
        dorsalMap[d].push(`${p.name} ${p.lastName}`);
      }
    });
    const conflictDorsals = Object.keys(dorsalMap).filter(d => dorsalMap[d].length > 1);
    const tFn = window.t || ((k, def) => def);
    const conflictBannerHtml = conflictDorsals.length > 0 ? `
      <div class="team-dorsal-conflict-banner" style="background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 8px; padding: 0.45rem 0.65rem; margin: 0.5rem 0.5rem 0.25rem 0.5rem; font-size: 0.72rem; color: #fca5a5; display: flex; align-items: flex-start; gap: 0.4rem;">
        <span style="font-size: 1rem; line-height: 1;">⚠️</span>
        <div>
          <strong style="color: #f87171;">${tFn('dorsal.conflictWarning', 'Conflicto de dorsales')}</strong>:
          ${conflictDorsals.map(d => `Dorsal #${d} (${dorsalMap[d].join(', ')})`).join('; ')}
        </div>
      </div>
    ` : '';

    col.innerHTML = `
      <div class="team-column-header" style="cursor: pointer;">
        <div class="team-header-main">
          <span class="team-header-title">${escapeHTML(team.name)}</span>
          <span class="team-header-badge">${teamPlayers.length}</span>
        </div>
        <div class="team-header-cat">${escapeHTML(team.category || '')}</div>
        <div class="team-stats-mini">
          <span>🧤 POR: ${porCount}</span>
          <span>🛡️ DEF: ${defCount}</span>
          <span>⚡ MED: ${medCount}</span>
          <span>🎯 DEL: ${delCount}</span>
        </div>
        <div style="margin-top: 0.5rem; display: flex; gap: 0.35rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary btn-xs btn-toggle-team-fold" data-team-id="${team.id}" style="flex: 1.3; font-size: 0.72rem; padding: 0.28rem 0.45rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem; background: rgba(6, 182, 212, 0.12); color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.35); font-weight: 700;">
            <span class="fold-chevron">▼</span> <span class="fold-text">Ver jugadores (${teamPlayers.length})</span>
          </button>
          <button type="button" class="btn btn-secondary btn-xs btn-view-full-team" data-team-id="${team.id}" style="flex: 1; font-size: 0.72rem; padding: 0.28rem 0.4rem; display: flex; align-items: center; justify-content: center; gap: 0.25rem; background: rgba(255,255,255,0.06);" title="Ver ficha y detalles del equipo">
            <span>👁️ Plantilla</span>
          </button>
          <button type="button" class="btn btn-secondary btn-xs btn-att-team" data-team-id="${team.id}" style="font-size: 0.72rem; padding: 0.28rem 0.45rem; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.35);" title="Pasar lista para ${escapeHTML(team.name)}">
            <span>📋 Lista</span>
          </button>
        </div>
      </div>
      ${conflictBannerHtml}
      <div class="team-column-body" data-team-id="${team.id}" style="display: none;">
        ${teamPlayers.length === 0 ? `
          <div class="team-empty-state">
            Arrastra jugadores aquí para asignarlos a este equipo
          </div>
        ` : ''}
      </div>
    `;

    // Función para alternar el plegado/desplegado del equipo
    const toggleFold = () => {
      const isCollapsed = col.classList.contains('is-collapsed');
      const body = col.querySelector('.team-column-body');
      const chevron = col.querySelector('.fold-chevron');
      const text = col.querySelector('.fold-text');

      if (isCollapsed) {
        col.classList.remove('is-collapsed');
        col.classList.add('is-expanded');
        if (body) body.style.display = 'flex';
        if (chevron) chevron.textContent = '▲';
        if (text) text.textContent = `Ocultar jugadores (${teamPlayers.length})`;
      } else {
        col.classList.remove('is-expanded');
        col.classList.add('is-collapsed');
        if (body) body.style.display = 'none';
        if (chevron) chevron.textContent = '▼';
        if (text) text.textContent = `Ver jugadores (${teamPlayers.length})`;
      }
    };

    // Clic en el botón de desplegar/plegar
    const btnFold = col.querySelector('.btn-toggle-team-fold');
    if (btnFold) {
      btnFold.onclick = (e) => {
        e.stopPropagation();
        toggleFold();
      };
    }

    // Clic en la cabecera para desplegar/plegar (sin interferir con botones)
    const header = col.querySelector('.team-column-header');
    if (header) {
      header.onclick = (e) => {
        if (e.target.closest('button')) return;
        toggleFold();
      };
    }

    // Botón para ver plantilla en modal
    const btnView = col.querySelector('.btn-view-full-team');
    if (btnView) {
      btnView.onclick = (e) => {
        e.stopPropagation();
        openTeamViewModal(team.id);
      };
    }

    // Botón para pasar lista de este equipo
    const btnAtt = col.querySelector('.btn-att-team');
    if (btnAtt) {
      btnAtt.onclick = (e) => {
        e.stopPropagation();
        if (typeof openAttendanceModal === 'function') {
          openAttendanceModal(team.id);
        }
      };
    }

    const body = col.querySelector('.team-column-body');

    teamPlayers.forEach(player => {
      const miniCard = document.createElement('div');
      miniCard.className = 'mini-player-card draggable-player';
      miniCard.setAttribute('draggable', 'true');
      miniCard.setAttribute('data-player-id', player.id);
      miniCard.style.cursor = 'pointer';
      miniCard.title = `Pulsa para ver la ficha de ${player.name} ${player.lastName}`;

      const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;

      const eqStatus = (window.JKNoovaData && window.JKNoovaData.checkPlayerOfficialEquipment)
        ? window.JKNoovaData.checkPlayerOfficialEquipment(player)
        : { complete: true };
      const isConflict = conflictDorsals.includes(String(player.mainDorsal));

      miniCard.innerHTML = `
        <img src="${avatarUrl}" alt="${player.name}" class="mini-avatar" style="border-radius: 50%;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
        <div class="mini-details">
          <div class="mini-nickname">#${player.mainDorsal || '-'} ${escapeHTML(player.name)} ${escapeHTML(player.lastName)}</div>
          <div class="mini-sub">
            ${player.mainPosition} • ${player.nickname ? `"${player.nickname}" • ` : ''}${window.getFootLabel ? window.getFootLabel(player.foot) : (player.foot || 'Diestro')}
            ${!eqStatus.complete ? ` • <span style="color: #fbbf24;" title="${tFn('kit.badgeMissing', 'Falta equipación oficial')}">⚠️ Equip. pdte</span>` : ''}
          </div>
          ${isConflict ? `
            <div style="font-size: 0.68rem; color: #f87171; font-weight: 700; margin-top: 2px;">
              ${tFn('dorsal.duplicateBadge', '⚠️ Mismo dorsal')} #${player.mainDorsal}
            </div>
          ` : ''}
        </div>
        ${player.hasMedicalAlert ? `<span title="Alerta médica activa" style="color: #ef4444; font-size: 0.9rem;">⚠️</span>` : ''}
      `;

      // Distinguir arrastre de clic
      let isDragging = false;
      miniCard.ondragstart = (e) => {
        isDragging = true;
        draggedPlayerId = player.id;
        miniCard.classList.add('dragging');
        e.dataTransfer.setData('text/plain', player.id);
        e.dataTransfer.effectAllowed = 'move';
      };

      miniCard.ondragend = () => {
        miniCard.classList.remove('dragging');
        setTimeout(() => { isDragging = false; draggedPlayerId = null; }, 50);
      };

      // REQUISITO ESTRICTO: En la pestaña equipo, poder pulsar sobre los jugadores para abrir su ficha
      miniCard.onclick = () => {
        if (!isDragging) {
          openPlayerModal(player.id);
        }
      };

      body.appendChild(miniCard);
    });

    // Zona de recepción para la columna
    col.ondragover = (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
      e.dataTransfer.dropEffect = 'move';
    };

    col.ondragleave = () => {
      col.classList.remove('drag-over');
    };

    col.ondrop = (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const playerId = e.dataTransfer.getData('text/plain') || draggedPlayerId;
      if (playerId) {
        movePlayerToTeam(playerId, team.id);
      }
    };

    container.appendChild(col);
  });
}

function movePlayerToTeam(playerId, newTeamId) {
  const p = playersList.find(x => x.id === playerId);
  if (!p || p.teamId === newTeamId) return;

  const targetTeam = teamsList.find(t => t.id === newTeamId);
  p.teamId = newTeamId;
  window.JKNoovaData.StorageService.savePlayers(playersList);

  const conflict = playersList.some(other => 
    other.id !== p.id && 
    other.teamId === newTeamId && 
    parseInt(other.mainDorsal, 10) === parseInt(p.mainDorsal, 10) && 
    p.mainDorsal > 0
  );

  if (conflict) {
    showToast(`⚠️ ${p.name} transferido a ${targetTeam.name}. ¡Atención: Conflicto con dorsal #${p.mainDorsal}!`, 'warning');
  } else {
    showToast(`${p.name} ${p.lastName} transferido a ${targetTeam.name}`, 'success');
  }
  renderTeamsBoard();
}

function initCustomTeamModalLogic() {
  const btnAdd = document.getElementById('btn-add-custom-team');
  const modal = document.getElementById('modal-custom-team');

  if (btnAdd && modal) {
    btnAdd.onclick = () => openModal(modal);
  }

  const btnSave = document.getElementById('btn-save-custom-team');
  if (btnSave) {
    btnSave.onclick = saveCustomTeam;
  }
}

function saveCustomTeam() {
  const name = document.getElementById('new-team-name').value.trim();
  const category = document.getElementById('new-team-category').value.trim();
  const color = document.getElementById('new-team-color').value;
  const description = document.getElementById('new-team-desc').value.trim();

  if (!name) {
    showToast('Ingresa el nombre del nuevo equipo', 'error');
    return;
  }

  const newTeam = {
    id: `team_custom_${Date.now()}`,
    name,
    shortName: name.substring(0, 4).toUpperCase(),
    category,
    color,
    description
  };

  teamsList.push(newTeam);
  window.JKNoovaData.StorageService.saveTeams(teamsList);

  closeModal(document.getElementById('modal-custom-team'));
  renderTeamsBoard();
  initSharedNavbar('teams');
  showToast(`Equipo "${name}" creado con éxito`, 'success');
}

function openTeamViewModal(teamId) {
  const team = teamsList.find(t => t.id === teamId);
  if (!team) return;

  const teamPlayers = playersList.filter(p => p.teamId === team.id);

  // Cabecera del modal
  const title = document.getElementById('team-view-title');
  const badgeColor = document.getElementById('team-view-badge-color');
  const countBadge = document.getElementById('team-view-player-count-badge');
  if (title) title.textContent = `${team.name} • ${team.category || 'Categoría no asignada'}`;
  if (badgeColor) badgeColor.style.background = team.color || '#06b6d4';
  if (countBadge) countBadge.textContent = `${teamPlayers.length} jugadores inscritos`;

  // Desglose por posiciones
  const porPlayers = teamPlayers.filter(p => p.mainPosition === 'POR');
  const defPlayers = teamPlayers.filter(p => ['DFC', 'LD', 'LI'].includes(p.mainPosition));
  const medPlayers = teamPlayers.filter(p => ['MCD', 'MC', 'MCO'].includes(p.mainPosition));
  const delPlayers = teamPlayers.filter(p => ['ED', 'EI', 'DC'].includes(p.mainPosition));
  const medAlerts = teamPlayers.filter(p => p.hasMedicalAlert).length;

  const summaryBox = document.getElementById('team-view-summary');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div style="text-align: center; padding: 0.6rem; background: rgba(255,255,255,0.04); border-radius: 8px;">
        <div style="font-size: 0.72rem; color: var(--text-muted);">Total Plantilla</div>
        <strong style="font-size: 1.3rem; color: #fff;">${teamPlayers.length}</strong>
      </div>
      <div style="text-align: center; padding: 0.6rem; background: rgba(59, 130, 246, 0.08); border-radius: 8px;">
        <div style="font-size: 0.72rem; color: #93c5fd;">🧤 Porteros</div>
        <strong style="font-size: 1.3rem; color: #60a5fa;">${porPlayers.length}</strong>
      </div>
      <div style="text-align: center; padding: 0.6rem; background: rgba(16, 185, 129, 0.08); border-radius: 8px;">
        <div style="font-size: 0.72rem; color: #6ee7b7;">🛡️ Defensas</div>
        <strong style="font-size: 1.3rem; color: #34d399;">${defPlayers.length}</strong>
      </div>
      <div style="text-align: center; padding: 0.6rem; background: rgba(245, 158, 11, 0.08); border-radius: 8px;">
        <div style="font-size: 0.72rem; color: #fcd34d;">⚡ Medios</div>
        <strong style="font-size: 1.3rem; color: #fbbf24;">${medPlayers.length}</strong>
      </div>
      <div style="text-align: center; padding: 0.6rem; background: rgba(239, 68, 68, 0.08); border-radius: 8px;">
        <div style="font-size: 0.72rem; color: #fca5a5;">🎯 Delanteros</div>
        <strong style="font-size: 1.3rem; color: #f87171;">${delPlayers.length}</strong>
      </div>
      <div style="text-align: center; padding: 0.6rem; background: rgba(239, 68, 68, 0.12); border-radius: 8px;">
        <div style="font-size: 0.72rem; color: #fca5a5;">⚠️ Alertas médicas</div>
        <strong style="font-size: 1.3rem; color: ${medAlerts > 0 ? '#ef4444' : 'var(--text-muted)'};">${medAlerts}</strong>
      </div>
    `;
  }

  // Lista de jugadores de la plantilla
  const rosterContainer = document.getElementById('team-view-roster-container');
  if (rosterContainer) {
    rosterContainer.innerHTML = '';

    const dorsalMap = {};
    teamPlayers.forEach(p => {
      const d = parseInt(p.mainDorsal, 10);
      if (!isNaN(d) && d > 0) {
        if (!dorsalMap[d]) dorsalMap[d] = [];
        dorsalMap[d].push(`${p.name} ${p.lastName}`);
      }
    });
    const conflictDorsals = Object.keys(dorsalMap).filter(d => dorsalMap[d].length > 1);
    const tFn = window.t || ((k, def) => def);

    if (conflictDorsals.length > 0) {
      const conflictBanner = document.createElement('div');
      conflictBanner.className = 'team-dorsal-conflict-banner';
      conflictBanner.style.background = 'rgba(239, 68, 68, 0.18)';
      conflictBanner.style.border = '1px solid rgba(239, 68, 68, 0.6)';
      conflictBanner.style.borderRadius = '8px';
      conflictBanner.style.padding = '0.75rem 1rem';
      conflictBanner.style.marginBottom = '0.85rem';
      conflictBanner.style.fontSize = '0.82rem';
      conflictBanner.style.color = '#fca5a5';
      conflictBanner.style.display = 'flex';
      conflictBanner.style.alignItems = 'center';
      conflictBanner.style.gap = '0.6rem';
      conflictBanner.innerHTML = `
        <span style="font-size: 1.25rem;">⚠️</span>
        <div>
          <strong style="color: #f87171;">${tFn('dorsal.conflictWarning', 'Aviso: Conflicto de dorsales en este equipo')}</strong>:
          <span>${conflictDorsals.map(d => `Dorsal #${d} asignado a <strong>${escapeHTML(dorsalMap[d].join(' y '))}</strong>`).join('. ')}</span>
        </div>
      `;
      rosterContainer.appendChild(conflictBanner);
    }

    if (teamPlayers.length === 0) {
      rosterContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: 8px;">
          Actualmente no hay jugadores asignados a este equipo. Arrastra jugadores en el tablero para incorporarlos a la plantilla.
        </div>
      `;
    } else {
      const sorted = [...teamPlayers].sort((a, b) => (a.mainDorsal || 99) - (b.mainDorsal || 99));

      sorted.forEach(p => {
        const row = document.createElement('div');
        row.style.background = 'var(--bg-secondary)';
        row.style.padding = '0.75rem 1rem';
        row.style.borderRadius = '8px';
        row.style.border = '1px solid var(--border-subtle)';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '1rem';
        row.style.flexWrap = 'wrap';

        const avatarUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name + '+' + p.lastName)}&background=18233c&color=fff`;
        const age = calculateAge(p.birthDate);

        row.style.cursor = 'pointer';
        row.title = `Pulsa para abrir la ficha de ${p.name} ${p.lastName}`;
        row.onclick = () => openPlayerModal(p.id);

        const attStats = (typeof getPlayerAttendanceStats === 'function')
          ? getPlayerAttendanceStats(p.id, 30)
          : { percentage: 100, totalSessions: 0 };
        const attColor = attStats.percentage >= 80 ? '#34d399' : attStats.percentage >= 60 ? '#fbbf24' : '#f87171';

        const eqStatus = (window.JKNoovaData && window.JKNoovaData.checkPlayerOfficialEquipment)
          ? window.JKNoovaData.checkPlayerOfficialEquipment(p)
          : { complete: false, missing: [] };
        const kitBadgeHtml = eqStatus.complete
          ? `<span class="equipment-badge-complete" style="padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;" title="${tFn('kit.statusComplete', 'Equipación oficial completa')}">${tFn('kit.badgeComplete', '🛡️ Equipación oficial')}</span>`
          : `<span class="equipment-badge-alert" style="padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;" title="${tFn('kit.alertMissingOfficial', 'Falta equipamiento oficial')}">${tFn('kit.badgeMissing', '⚠️ Falta equipación')}</span>`;
        const isConflict = conflictDorsals.includes(String(p.mainDorsal));

        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.85rem; min-width: 230px;">
            <img src="${avatarUrl}" alt="${p.name}" class="mini-avatar" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=18233c&color=fff'">
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">
                <span style="color: var(--accent-cyan); font-weight: 800; margin-right: 0.35rem;">#${p.mainDorsal || '-'}</span>
                ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
                ${p.nickname ? `<span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted); margin-left: 0.35rem;">("${escapeHTML(p.nickname)}")</span>` : ''}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                ${p.birthDate ? `${window.formatAgeWithMonths ? window.formatAgeWithMonths(p.birthDate) : `${age} años`} • ` : ''}Nac: ${formatDate(p.birthDate)}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            ${isConflict ? `
              <span style="background: rgba(239, 68, 68, 0.25); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">
                ${tFn('dorsal.duplicateBadge', '⚠️ Mismo dorsal')} #${p.mainDorsal}
              </span>
            ` : ''}
            <span style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">
              ${p.mainPosition} ${p.secondaryPosition ? `/ ${p.secondaryPosition}` : ''}
            </span>
            <span style="background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.75rem;">
              🦶 ${window.getFootLabel ? window.getFootLabel(p.foot) : (p.foot || 'Diestro')}
            </span>
            ${attStats.totalSessions > 0 ? `
              <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: ${attColor}; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;" title="Asistencia a entrenamientos (últimos 30 días)">
                ⚡ ${attStats.percentage}% asist.
              </span>
            ` : ''}
            ${kitBadgeHtml}
            ${(() => {
              const contacts = (p.familyContacts && p.familyContacts.length > 0)
                ? p.familyContacts
                : (p.parentContact?.phone ? [{ relation: 'Tutor', name: p.parentContact.name, phone: p.parentContact.phone }] : []);
              if (contacts.length === 0) return '';
              return contacts.map(c => `
                <span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 0.15rem 0.45rem; border-radius: 4px;">
                  📞 <strong>${escapeHTML(c.relation || 'Tutor')}:</strong> ${escapeHTML(c.name ? c.name + ' (' + c.phone + ')' : c.phone)}
                </span>
              `).join('');
            })()}
            ${p.hasMedicalAlert ? `
              <span title="${escapeHTML(p.medicalNotes || 'Alerta médica activa')}" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                ⚠️ Médica
              </span>
            ` : ''}
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; color: var(--accent-cyan);">
              Ver ficha 👁️
            </button>
          </div>
        `;
        rosterContainer.appendChild(row);
      });
    }
  }

  const btnTeamAtt = document.getElementById('btn-team-view-attendance');
  if (btnTeamAtt) {
    btnTeamAtt.onclick = () => {
      closeModal(document.getElementById('modal-team-view'));
      if (typeof openAttendanceModal === 'function') {
        openAttendanceModal(teamId);
      }
    };
  }

  openModal(document.getElementById('modal-team-view'));
}

/* ==========================================================================
   LÓGICA DE LA FICHA DEL JUGADOR EN LA PESTAÑA EQUIPOS
   ========================================================================== */
function updateHeroProfileCard() {
  const name = document.getElementById('player-name')?.value.trim() || 'Nuevo';
  const lastName = document.getElementById('player-lastname')?.value.trim() || 'Jugador';
  const nickname = document.getElementById('player-nickname')?.value.trim() || '';
  const dorsalMain = document.getElementById('player-dorsal-main')?.value || '--';
  const teamId = document.getElementById('player-team')?.value;
  const team = teamsList.find(t => t.id === teamId) || { name: 'Sin asignar', color: '#3b82f6' };
  const posMain = document.getElementById('player-pos-main')?.value || 'DC';
  const foot = document.getElementById('player-foot')?.value || 'Diestro';
  const birthDate = document.getElementById('player-birthdate')?.value;
  const age = birthDate ? calculateAge(birthDate) : '--';
  const photoBase64 = document.getElementById('player-photo-base64')?.value;
  const startDate = document.getElementById('player-start-date')?.value.trim() || '';

  const titleEl = document.getElementById('hero-name-display');
  const nickEl = document.getElementById('hero-nick-display');
  const dorsalEl = document.getElementById('hero-dorsal-display');
  const posEl = document.getElementById('hero-pos-badge');
  const teamEl = document.getElementById('hero-team-badge');
  const footEl = document.getElementById('hero-foot-badge');
  const ageEl = document.getElementById('hero-age-badge');
  const startBadge = document.getElementById('hero-start-badge');
  const ageDisplay = document.getElementById('player-calc-age-display');
  const expDisplay = document.getElementById('player-calc-experience-display');
  const previewImg = document.getElementById('player-photo-preview-img');
  const placeholder = document.getElementById('player-photo-placeholder');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  const btnAdjustPhoto = document.getElementById('btn-adjust-photo');

  if (titleEl) titleEl.textContent = `${name} ${lastName}`;
  if (nickEl) nickEl.textContent = nickname ? `"${nickname}"` : 'Sin apodo asignado';
  if (dorsalEl) dorsalEl.textContent = `#${dorsalMain}`;
  if (posEl) posEl.textContent = posMain;
  if (teamEl) {
    teamEl.textContent = team.name;
    teamEl.style.color = team.color;
    teamEl.style.borderColor = `${team.color}40`;
    teamEl.style.background = `${team.color}18`;
  }
  if (footEl) footEl.textContent = foot;
  if (ageEl) ageEl.textContent = `${age} años`;
  if (ageDisplay) ageDisplay.textContent = birthDate ? `${age} años (${formatDate(birthDate)})` : 'Indica la fecha de nacimiento';

  if (startBadge) {
    if (startDate) {
      startBadge.textContent = `⏱️ Inició: ${startDate}`;
      startBadge.style.display = 'inline-block';
    } else {
      startBadge.style.display = 'none';
    }
  }

  if (expDisplay) {
    if (startDate) {
      expDisplay.textContent = `Inició: ${startDate}`;
    } else {
      expDisplay.textContent = 'Sin fecha indicada';
    }
  }

  if (photoBase64) {
    if (previewImg) {
      previewImg.src = photoBase64;
      previewImg.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (btnRemovePhoto) btnRemovePhoto.style.display = 'inline-flex';
    if (btnAdjustPhoto) btnAdjustPhoto.style.display = 'inline-flex';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (btnRemovePhoto) btnRemovePhoto.style.display = 'none';
    if (btnAdjustPhoto) btnAdjustPhoto.style.display = 'none';
  }
}

function populateAdidasSizeSelects() {
  const dataObj = window.JKNoovaData || {};
  const clothingSizes = dataObj.ADIDAS_CLOTHING_SIZES || [
    '4-5Y / 110', '5-6Y / 116', '7-8Y / 128', '9-10Y / 140', '11-12Y / 152',
    '13-14Y / 164', '15-16Y / 176', 'XS Adulto', 'S Adulto', 'M Adulto', 'L Adulto', 'XL Adulto', '2XL Adulto'
  ];
  const socksSizes = dataObj.ADIDAS_SOCKS_SIZES || [
    '23-26', '27-30', '31-34', '35-38', '39-42', '43-46'
  ];
  const bootSizes = dataObj.BOOT_SIZES || [
    '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'
  ];
  const shinGuardSizes = dataObj.SHIN_GUARD_SIZES || ['XS', 'S', 'M', 'L', 'XL'];
  const beanieSizes = dataObj.BEANIE_SIZES || ['Talla única', 'Junior', 'Senior'];

  const clothingSelectIds = [
    'kit-size-training-shirt',
    'kit-size-match-shirt',
    'kit-size-shorts',
    'kit-size-jerseys',
    'kit-size-jacket',
    'kit-size-rainjacket'
  ];

  clothingSelectIds.forEach(id => {
    const sel = document.getElementById(id);
    if (sel && sel.options.length === 0) {
      sel.innerHTML = clothingSizes.map(s => `<option value="${s}">${s}</option>`).join('');
    }
  });

  const socksSel = document.getElementById('kit-size-socks');
  if (socksSel && socksSel.options.length === 0) {
    socksSel.innerHTML = socksSizes.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  const bootsSel = document.getElementById('kit-size-boots');
  if (bootsSel && bootsSel.options.length === 0) {
    bootsSel.innerHTML = bootSizes.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  const shinSel = document.getElementById('kit-size-shin-guards');
  if (shinSel && shinSel.options.length === 0) {
    shinSel.innerHTML = shinGuardSizes.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  const beanieSel = document.getElementById('kit-size-beanie');
  if (beanieSel && beanieSel.options.length === 0) {
    beanieSel.innerHTML = beanieSizes.map(s => `<option value="${s}">${s}</option>`).join('');
  }
}

function updateEquipmentStatusUI() {
  const training = document.getElementById('kit-owned-training-shirt')?.checked || false;
  const match = document.getElementById('kit-owned-match-shirt')?.checked || false;
  const shorts = document.getElementById('kit-owned-shorts')?.checked || false;
  const socks = document.getElementById('kit-owned-socks')?.checked || false;

  const isComplete = training && match && shorts && socks;
  const badge = document.getElementById('equipment-status-badge');
  const alertBox = document.getElementById('equipment-status-alert');
  const alertText = document.getElementById('equipment-status-alert-text');
  const t = window.t || ((k, def) => def);

  if (badge) {
    if (isComplete) {
      badge.className = 'equipment-badge-complete';
      badge.textContent = `🛡️ ${t('kit.badgeComplete', 'Equipación oficial completa')}`;
    } else {
      badge.className = 'equipment-badge-alert';
      badge.textContent = `⚠️ ${t('kit.badgeMissing', 'Falta equipación')}`;
    }
  }

  if (alertBox) {
    alertBox.style.display = isComplete ? 'none' : 'flex';
  }
  if (alertText) {
    alertText.textContent = isComplete 
      ? t('kit.statusComplete', '✅ Equipación oficial completa (Posee las 4 prendas oficiales requeridas).')
      : t('kit.alertMissingOfficial', 'Falta equipamiento oficial obligatorio: Las familias deben adquirir las prendas faltantes para las competiciones oficiales.');
  }
}

function checkPlayerModalDorsalConflict() {
  const alertEl = document.getElementById('player-modal-dorsal-alert');
  const textEl = document.getElementById('player-modal-dorsal-alert-text');
  if (!alertEl || !textEl) return;

  const currentId = document.getElementById('player-id-field')?.value || '';
  const currentTeamId = document.getElementById('player-team')?.value || '';
  const dorsalVal = parseInt(document.getElementById('player-dorsal-main')?.value, 10);

  if (!currentTeamId || isNaN(dorsalVal) || dorsalVal <= 0) {
    alertEl.style.display = 'none';
    return;
  }

  const conflictingPlayer = playersList.find(p => 
    p.id !== currentId && 
    p.teamId === currentTeamId && 
    parseInt(p.mainDorsal, 10) === dorsalVal
  );

  if (conflictingPlayer) {
    const t = window.t || ((k, def) => def);
    const template = t('dorsal.modalWarning', '⚠️ Aviso: El dorsal #{dorsal} ya está asignado a {player} en este equipo.');
    const msg = template
      .replace('{dorsal}', dorsalVal)
      .replace('{player}', `${conflictingPlayer.name} ${conflictingPlayer.lastName}`);
    textEl.textContent = msg;
    alertEl.style.display = 'flex';
  } else {
    alertEl.style.display = 'none';
  }
}

function setCheckboxVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

function setSelectVal(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

function initPlayerModalLogic() {
  const btnSave = document.getElementById('btn-save-player');
  if (btnSave) {
    btnSave.onclick = savePlayer;
  }

  const btnAddNote = document.getElementById('btn-add-coach-note');
  if (btnAddNote) {
    btnAddNote.onclick = addCoachNote;
  }

  const birthInput = document.getElementById('player-birthdate');
  if (birthInput) {
    birthInput.onchange = () => {
      const age = calculateAge(birthInput.value);
      suggestTeam(age);
      updateHeroProfileCard();
    };
  }

  ['player-name', 'player-lastname', 'player-nickname', 'player-dorsal-main', 'player-start-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateHeroProfileCard);
  });

  ['player-team', 'player-pos-main', 'player-foot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateHeroProfileCard);
  });

  // Control de conflicto de dorsales en tiempo real
  const dorsalInput = document.getElementById('player-dorsal-main');
  const teamSelectEl = document.getElementById('player-team');
  if (dorsalInput) {
    dorsalInput.addEventListener('input', checkPlayerModalDorsalConflict);
  }
  if (teamSelectEl) {
    teamSelectEl.addEventListener('change', checkPlayerModalDorsalConflict);
  }

  // Control de checkboxes de equipación oficial en tiempo real
  const officialKitCheckboxes = [
    'kit-owned-training-shirt',
    'kit-owned-match-shirt',
    'kit-owned-shorts',
    'kit-owned-socks'
  ];
  officialKitCheckboxes.forEach(id => {
    const cb = document.getElementById(id);
    if (cb) {
      cb.addEventListener('change', updateEquipmentStatusUI);
    }
  });

  const medCheckbox = document.getElementById('player-has-medical-alert');
  const medWrap = document.getElementById('player-medical-notes-wrap');
  if (medCheckbox && medWrap) {
    medCheckbox.onchange = () => {
      medWrap.classList.toggle('show', medCheckbox.checked);
    };
  }

  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  if (btnRemovePhoto) {
    btnRemovePhoto.onclick = () => {
      const hiddenInput = document.getElementById('player-photo-base64');
      const hiddenOriginal = document.getElementById('player-photo-original-base64');
      const hiddenSettings = document.getElementById('player-photo-crop-settings');
      const fileInput = document.getElementById('player-photo-file-input');
      if (hiddenInput) hiddenInput.value = '';
      if (hiddenOriginal) hiddenOriginal.value = '';
      if (hiddenSettings) hiddenSettings.value = '';
      if (fileInput) fileInput.value = '';
      updateHeroProfileCard();
      showToast('Foto eliminada', 'warning');
    };
  }

  const btnAdjustPhoto = document.getElementById('btn-adjust-photo');
  if (btnAdjustPhoto) {
    btnAdjustPhoto.onclick = () => {
      const originalPhoto = document.getElementById('player-photo-original-base64')?.value || document.getElementById('player-photo-base64')?.value;
      let existingSettings = null;
      try {
        const rawSettings = document.getElementById('player-photo-crop-settings')?.value;
        if (rawSettings) existingSettings = JSON.parse(rawSettings);
      } catch (err) {}

      if (originalPhoto && window.openPhotoCropper) {
        window.openPhotoCropper(originalPhoto, existingSettings, (croppedBase64, rawOriginal, cropSettings) => {
          const hiddenInput = document.getElementById('player-photo-base64');
          const hiddenOriginal = document.getElementById('player-photo-original-base64');
          const hiddenSettings = document.getElementById('player-photo-crop-settings');
          if (hiddenInput) hiddenInput.value = croppedBase64;
          if (hiddenOriginal) hiddenOriginal.value = rawOriginal;
          if (hiddenSettings) hiddenSettings.value = JSON.stringify(cropSettings);
          updateHeroProfileCard();
          showToast('Foto ajustada correctamente', 'success');
        });
      } else {
        document.getElementById('player-photo-file-input')?.click();
      }
    };
  }

  const fileInput = document.getElementById('player-photo-file-input');
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecciona un archivo de imagen válido', 'error');
        return;
      }

      if (window.openPhotoCropper) {
        window.openPhotoCropper(file, null, (croppedBase64, rawOriginal, cropSettings) => {
          const hiddenInput = document.getElementById('player-photo-base64');
          const hiddenOriginal = document.getElementById('player-photo-original-base64');
          const hiddenSettings = document.getElementById('player-photo-crop-settings');
          if (hiddenInput) hiddenInput.value = croppedBase64;
          if (hiddenOriginal) hiddenOriginal.value = rawOriginal;
          if (hiddenSettings) hiddenSettings.value = JSON.stringify(cropSettings);
          updateHeroProfileCard();
          showToast('Foto ajustada y cargada correctamente', 'success');
        });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          const hiddenInput = document.getElementById('player-photo-base64');
          const hiddenOriginal = document.getElementById('player-photo-original-base64');
          if (hiddenInput) hiddenInput.value = base64;
          if (hiddenOriginal) hiddenOriginal.value = base64;
          updateHeroProfileCard();
          showToast('Foto cargada desde el dispositivo', 'success');
        };
        reader.readAsDataURL(file);
      }
    };
  }

  const btnAddFamilyContact = document.getElementById('btn-add-family-contact');
  if (btnAddFamilyContact) {
    btnAddFamilyContact.onclick = addFamilyContactField;
  }

  // Escuchadores de checkboxes de equipación
  ['kit-delivered-match', 'kit-delivered-training', 'kit-delivered-tracksuit', 'kit-delivered-rainjacket'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = updateKitDeliveryBadge;
  });
}

function updateKitDeliveryBadge() {
  const badge = document.getElementById('player-kit-delivery-badge');
  if (!badge) return;
  const match = document.getElementById('kit-delivered-match')?.checked;
  const training = document.getElementById('kit-delivered-training')?.checked;
  const tracksuit = document.getElementById('kit-delivered-tracksuit')?.checked;
  const rain = document.getElementById('kit-delivered-rainjacket')?.checked;
  const count = [match, training, tracksuit, rain].filter(Boolean).length;

  if (count === 4) {
    badge.textContent = '✅ Pack completo entregado';
    badge.style.background = 'rgba(16, 185, 129, 0.2)';
    badge.style.color = '#34d399';
    badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  } else if (count > 0) {
    badge.textContent = `⚠️ Entrega parcial (${count}/4)`;
    badge.style.background = 'rgba(245, 158, 11, 0.2)';
    badge.style.color = '#fbbf24';
    badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
  } else {
    badge.textContent = '⏳ Pendiente de entrega (0/4)';
    badge.style.background = 'rgba(239, 68, 68, 0.15)';
    badge.style.color = '#f87171';
    badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
  }
}

let tempFamilyContacts = [];

function renderFamilyContactsList() {
  const container = document.getElementById('player-family-contacts-list');
  if (!container) return;
  container.innerHTML = '';

  if (tempFamilyContacts.length === 0) {
    tempFamilyContacts.push({ relation: 'Madre', name: '', phone: '', email: '', isEmergency: true });
  }

  tempFamilyContacts.forEach((contact, idx) => {
    const card = document.createElement('div');
    card.className = 'family-contact-card';
    card.setAttribute('data-index', idx);

    card.innerHTML = `
      <div class="family-contact-header">
        <span class="family-contact-tag">
          <span>👨‍👩‍👧</span> Contacto familiar #${idx + 1}
        </span>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <label style="font-size: 0.75rem; color: #fca5a5; display: flex; align-items: center; gap: 0.3rem; cursor: pointer; user-select: none;">
            <input type="checkbox" class="family-contact-emergency-cb" ${contact.isEmergency ? 'checked' : ''} style="accent-color: #ef4444; width: 15px; height: 15px; cursor: pointer;">
            Emergencias
          </label>
          ${tempFamilyContacts.length > 1 ? `
            <button type="button" class="btn btn-secondary btn-xs btn-remove-family-contact" title="Eliminar este contacto familiar" style="color: #f87171; padding: 0.15rem 0.45rem; font-size: 0.72rem;">
              🗑️ Quitar
            </button>
          ` : ''}
        </div>
      </div>
      <div class="family-contact-grid">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem;">Parentesco</label>
          <select class="form-select family-contact-relation" style="font-size: 0.8rem; padding: 0.4rem 0.5rem;">
            <option value="Madre" ${contact.relation === 'Madre' ? 'selected' : ''}>Madre</option>
            <option value="Padre" ${contact.relation === 'Padre' ? 'selected' : ''}>Padre</option>
            <option value="Tutor legal" ${contact.relation === 'Tutor legal' ? 'selected' : ''}>Tutor/a legal</option>
            <option value="Abuelo/a" ${contact.relation === 'Abuelo/a' ? 'selected' : ''}>Abuelo/a</option>
            <option value="Hermano/a" ${contact.relation === 'Hermano/a' ? 'selected' : ''}>Hermano/a</option>
            <option value="Otro" ${contact.relation === 'Otro' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem;">Nombre y apellidos</label>
          <input type="text" class="form-input family-contact-name" value="${escapeHTML(contact.name || '')}" placeholder="Ej. Ana Silva" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem;">Teléfono</label>
          <input type="tel" class="form-input family-contact-phone" value="${escapeHTML(contact.phone || '')}" placeholder="+34 600 000 000" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.75rem;">Correo electrónico</label>
          <input type="email" class="form-input family-contact-email" value="${escapeHTML(contact.email || '')}" placeholder="correo@ejemplo.com" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">
        </div>
      </div>
    `;

    const btnRemove = card.querySelector('.btn-remove-family-contact');
    if (btnRemove) {
      btnRemove.onclick = () => {
        saveFamilyContactsFromDOM();
        tempFamilyContacts.splice(idx, 1);
        renderFamilyContactsList();
      };
    }

    container.appendChild(card);
  });
}

function saveFamilyContactsFromDOM() {
  const container = document.getElementById('player-family-contacts-list');
  if (!container) return;
  const cards = container.querySelectorAll('.family-contact-card');
  const list = [];
  cards.forEach(card => {
    const relation = card.querySelector('.family-contact-relation')?.value || 'Tutor';
    const name = card.querySelector('.family-contact-name')?.value.trim() || '';
    const phone = card.querySelector('.family-contact-phone')?.value.trim() || '';
    const email = card.querySelector('.family-contact-email')?.value.trim() || '';
    const isEmergency = card.querySelector('.family-contact-emergency-cb')?.checked || false;
    list.push({ relation, name, phone, email, isEmergency });
  });
  tempFamilyContacts = list;
}

function addFamilyContactField() {
  saveFamilyContactsFromDOM();
  const nextRelation = tempFamilyContacts.some(c => c.relation === 'Madre') && !tempFamilyContacts.some(c => c.relation === 'Padre') ? 'Padre' : 'Familiar';
  tempFamilyContacts.push({ relation: nextRelation, name: '', phone: '', email: '', isEmergency: false });
  renderFamilyContactsList();
}

function openPlayerModal(playerId = null) {
  const form = document.getElementById('form-player');
  if (!form) return;
  form.reset();
  tempCoachNotes = [];

  populateAdidasSizeSelects();

  const teamSelect = document.getElementById('player-team');
  if (teamSelect) {
    teamSelect.innerHTML = '';
    teamsList.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.category || ''})`;
      teamSelect.appendChild(opt);
    });
  }

  const modalTitle = document.getElementById('modal-player-title');
  const medCheckbox = document.getElementById('player-has-medical-alert');
  const medWrap = document.getElementById('player-medical-notes-wrap');
  const hiddenPhoto = document.getElementById('player-photo-base64');
  const hiddenOriginalPhoto = document.getElementById('player-photo-original-base64');
  const hiddenCropSettings = document.getElementById('player-photo-crop-settings');
  const fileInput = document.getElementById('player-photo-file-input');
  if (fileInput) fileInput.value = '';

  if (playerId) {
    const p = playersList.find(x => x.id === playerId);
    if (!p) return;

    if (modalTitle) modalTitle.textContent = `Ficha de ${p.name} ${p.lastName}`;
    document.getElementById('player-id-field').value = p.id;
    document.getElementById('player-name').value = p.name || '';
    document.getElementById('player-lastname').value = p.lastName || '';
    document.getElementById('player-nickname').value = p.nickname || '';
    document.getElementById('player-birthdate').value = p.birthDate || '';
    document.getElementById('player-start-date').value = p.firstTrainingDate || '';
    document.getElementById('player-team').value = p.teamId || (teamsList[0] ? teamsList[0].id : '');
    
    // Foto
    if (hiddenPhoto) hiddenPhoto.value = p.photo || '';
    if (hiddenOriginalPhoto) hiddenOriginalPhoto.value = p.originalPhoto || p.photo || '';
    if (hiddenCropSettings) hiddenCropSettings.value = p.cropSettings ? JSON.stringify(p.cropSettings) : '';

    document.getElementById('player-dorsal-main').value = p.mainDorsal || '';
    document.getElementById('player-dorsal-sec').value = p.secondaryDorsal || '';
    document.getElementById('player-foot').value = p.foot || 'Diestro';
    document.getElementById('player-pos-main').value = p.mainPosition || 'DC';
    document.getElementById('player-pos-sec').value = p.secondaryPosition || '';

    // Contactos familiares
    if (p.familyContacts && p.familyContacts.length > 0) {
      tempFamilyContacts = JSON.parse(JSON.stringify(p.familyContacts));
    } else if (p.parentContact && p.parentContact.name) {
      tempFamilyContacts = [{
        relation: 'Tutor legal',
        name: p.parentContact.name || '',
        phone: p.parentContact.phone || '',
        email: p.parentContact.email || '',
        isEmergency: true
      }];
    } else {
      tempFamilyContacts = [{ relation: 'Madre', name: '', phone: '', email: '', isEmergency: true }];
    }

    if (document.getElementById('player-parent-name')) document.getElementById('player-parent-name').value = p.parentContact?.name || '';
    if (document.getElementById('player-parent-phone')) document.getElementById('player-parent-phone').value = p.parentContact?.phone || '';
    if (document.getElementById('player-parent-email')) document.getElementById('player-parent-email').value = p.parentContact?.email || '';

    document.getElementById('player-medical-notes').value = p.medicalNotes || '';
    
    if (medCheckbox) {
      medCheckbox.checked = !!p.hasMedicalAlert;
      if (medWrap) medWrap.classList.toggle('show', !!p.hasMedicalAlert);
    }

    tempCoachNotes = p.coachNotes ? [...p.coachNotes] : [];

    // Cargar equipación oficial Adidas y accesorios
    const eq = p.equipment || (window.JKNoovaData && window.JKNoovaData.createDefaultEquipment ? window.JKNoovaData.createDefaultEquipment() : null) || { official: {}, accessories: {} };
    const off = eq.official || {};
    const acc = eq.accessories || {};

    setCheckboxVal('kit-owned-training-shirt', off.trainingShirt?.owned);
    setSelectVal('kit-size-training-shirt', off.trainingShirt?.size || '9-10Y / 140');

    setCheckboxVal('kit-owned-match-shirt', off.matchShirt?.owned);
    setSelectVal('kit-size-match-shirt', off.matchShirt?.size || '9-10Y / 140');

    setCheckboxVal('kit-owned-shorts', off.shorts?.owned);
    setSelectVal('kit-size-shorts', off.shorts?.size || '9-10Y / 140');

    setCheckboxVal('kit-owned-socks', off.socks?.owned);
    setSelectVal('kit-size-socks', off.socks?.size || '31-34');

    setCheckboxVal('kit-owned-boots', acc.boots?.owned);
    setSelectVal('kit-size-boots', acc.boots?.size || '36');

    setCheckboxVal('kit-owned-shin-guards', acc.shinGuards?.owned);
    setSelectVal('kit-size-shin-guards', acc.shinGuards?.size || 'S');

    setCheckboxVal('kit-owned-jerseys', acc.jerseys?.owned);
    setSelectVal('kit-size-jerseys', acc.jerseys?.size || '9-10Y / 140');

    setCheckboxVal('kit-owned-jacket', acc.jacket?.owned);
    setSelectVal('kit-size-jacket', acc.jacket?.size || '9-10Y / 140');

    setCheckboxVal('kit-owned-rainjacket', acc.rainJacket?.owned);
    setSelectVal('kit-size-rainjacket', acc.rainJacket?.size || '9-10Y / 140');

    setCheckboxVal('kit-owned-beanie', acc.beanie?.owned);
    setSelectVal('kit-size-beanie', acc.beanie?.size || 'Talla única');

    if (document.getElementById('player-kit-notes')) {
      document.getElementById('player-kit-notes').value = eq.notes || '';
    }
  } else {
    const t = window.t || ((k, def) => def);
    if (modalTitle) modalTitle.textContent = t('playerModal.newTitle', 'Registrar nuevo jugador');
    document.getElementById('player-id-field').value = '';
    if (hiddenPhoto) hiddenPhoto.value = '';
    if (hiddenOriginalPhoto) hiddenOriginalPhoto.value = '';
    if (hiddenCropSettings) hiddenCropSettings.value = '';

    // Reset tallas y equipación
    [
      'kit-owned-training-shirt', 'kit-owned-match-shirt', 'kit-owned-shorts', 'kit-owned-socks',
      'kit-owned-boots', 'kit-owned-shin-guards', 'kit-owned-jerseys', 'kit-owned-jacket',
      'kit-owned-rainjacket', 'kit-owned-beanie'
    ].forEach(id => setCheckboxVal(id, false));

    setSelectVal('kit-size-training-shirt', '9-10Y / 140');
    setSelectVal('kit-size-match-shirt', '9-10Y / 140');
    setSelectVal('kit-size-shorts', '9-10Y / 140');
    setSelectVal('kit-size-socks', '31-34');
    setSelectVal('kit-size-boots', '36');
    setSelectVal('kit-size-shin-guards', 'S');
    setSelectVal('kit-size-jerseys', '9-10Y / 140');
    setSelectVal('kit-size-jacket', '9-10Y / 140');
    setSelectVal('kit-size-rainjacket', '9-10Y / 140');
    setSelectVal('kit-size-beanie', 'Talla única');

    if (document.getElementById('player-kit-notes')) {
      document.getElementById('player-kit-notes').value = '';
    }

    tempFamilyContacts = [{ relation: 'Madre', name: '', phone: '', email: '', isEmergency: true }];

    if (medCheckbox) {
      medCheckbox.checked = false;
      if (medWrap) medWrap.classList.remove('show');
    }
  }

  renderFamilyContactsList();
  updateHeroProfileCard();
  renderCoachNotes();
  updateEquipmentStatusUI();
  checkPlayerModalDorsalConflict();
  openModal(document.getElementById('modal-player'));
}

function renderCoachNotes() {
  const container = document.getElementById('player-coach-notes-history');
  if (!container) return;
  container.innerHTML = '';

  if (tempCoachNotes.length === 0) {
    container.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-muted);">Sin notas registradas.</span>`;
    return;
  }

  tempCoachNotes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-history-item';
    item.innerHTML = `
      <div class="note-history-date">${formatDate(note.date)}</div>
      <div>${escapeHTML(note.text)}</div>
    `;
    container.appendChild(item);
  });
}

function addCoachNote() {
  const input = document.getElementById('new-coach-note-input');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const today = new Date().toISOString().split('T')[0];
  tempCoachNotes.push({ date: today, text });
  input.value = '';
  renderCoachNotes();
}

function suggestTeam(age) {
  const select = document.getElementById('player-team');
  if (!select) return;
  if (age <= 5 && teamsList.some(t => t.id === 'team_jmk')) select.value = 'team_jmk';
  else if (age <= 7 && teamsList.some(t => t.id === 'team_u8')) select.value = 'team_u8';
  else if (age <= 9 && teamsList.some(t => t.id === 'team_u10')) select.value = 'team_u10';
  else if (age <= 11 && teamsList.some(t => t.id === 'team_u12')) select.value = 'team_u12';
  else if (age <= 13 && teamsList.some(t => t.id === 'team_u14')) select.value = 'team_u14';
}

function savePlayer() {
  saveFamilyContactsFromDOM();
  const validFamilyContacts = tempFamilyContacts.filter(c => c.name || c.phone || c.email);
  const primaryContact = validFamilyContacts.find(c => c.isEmergency) || validFamilyContacts[0] || { name: '', phone: '', email: '' };

  const name = document.getElementById('player-name').value.trim();
  const lastName = document.getElementById('player-lastname').value.trim();
  const nickname = document.getElementById('player-nickname').value.trim();
  const birthDate = document.getElementById('player-birthdate').value;
  const teamId = document.getElementById('player-team').value;
  const mainDorsal = parseInt(document.getElementById('player-dorsal-main').value, 10);
  const secondaryDorsal = parseInt(document.getElementById('player-dorsal-sec').value, 10) || null;
  const foot = document.getElementById('player-foot').value;
  const mainPosition = document.getElementById('player-pos-main').value;
  const secondaryPosition = document.getElementById('player-pos-sec').value;
  
  const photo = document.getElementById('player-photo-base64')?.value || '';
  const originalPhoto = document.getElementById('player-photo-original-base64')?.value || photo;
  let cropSettings = null;
  try {
    const rawCS = document.getElementById('player-photo-crop-settings')?.value;
    if (rawCS) cropSettings = JSON.parse(rawCS);
  } catch (err) {}

  const parentName = primaryContact.name || '';
  const parentPhone = primaryContact.phone || '';
  const parentEmail = primaryContact.email || '';
  const firstTrainingDate = document.getElementById('player-start-date')?.value.trim() || '';
  const hasMedicalAlert = document.getElementById('player-has-medical-alert').checked;
  const medicalNotes = hasMedicalAlert ? document.getElementById('player-medical-notes').value.trim() : '';

  const equipment = {
    official: {
      trainingShirt: {
        owned: document.getElementById('kit-owned-training-shirt')?.checked || false,
        size: document.getElementById('kit-size-training-shirt')?.value || '9-10Y / 140'
      },
      matchShirt: {
        owned: document.getElementById('kit-owned-match-shirt')?.checked || false,
        size: document.getElementById('kit-size-match-shirt')?.value || '9-10Y / 140'
      },
      shorts: {
        owned: document.getElementById('kit-owned-shorts')?.checked || false,
        size: document.getElementById('kit-size-shorts')?.value || '9-10Y / 140'
      },
      socks: {
        owned: document.getElementById('kit-owned-socks')?.checked || false,
        size: document.getElementById('kit-size-socks')?.value || '31-34'
      }
    },
    accessories: {
      boots: {
        owned: document.getElementById('kit-owned-boots')?.checked || false,
        size: document.getElementById('kit-size-boots')?.value || '36'
      },
      shinGuards: {
        owned: document.getElementById('kit-owned-shin-guards')?.checked || false,
        size: document.getElementById('kit-size-shin-guards')?.value || 'S'
      },
      jerseys: {
        owned: document.getElementById('kit-owned-jerseys')?.checked || false,
        size: document.getElementById('kit-size-jerseys')?.value || '9-10Y / 140'
      },
      jacket: {
        owned: document.getElementById('kit-owned-jacket')?.checked || false,
        size: document.getElementById('kit-size-jacket')?.value || '9-10Y / 140'
      },
      rainJacket: {
        owned: document.getElementById('kit-owned-rainjacket')?.checked || false,
        size: document.getElementById('kit-size-rainjacket')?.value || '9-10Y / 140'
      },
      beanie: {
        owned: document.getElementById('kit-owned-beanie')?.checked || false,
        size: document.getElementById('kit-size-beanie')?.value || 'Talla única'
      }
    },
    notes: document.getElementById('player-kit-notes')?.value.trim() || ''
  };

  const kitSizes = {
    shirt: equipment.official.matchShirt.size,
    shorts: equipment.official.shorts.size,
    socks: equipment.official.socks.size,
    tracksuit: equipment.accessories.jerseys.size,
    rainjacket: equipment.accessories.rainJacket.size
  };
  const kitDelivery = {
    matchKit: equipment.official.matchShirt.owned,
    trainingKit: equipment.official.trainingShirt.owned,
    tracksuit: equipment.accessories.jerseys.owned,
    rainjacket: equipment.accessories.rainJacket.owned,
    deliveryDate: '',
    notes: equipment.notes
  };

  if (!name || !lastName || !birthDate || isNaN(mainDorsal)) {
    showToast('Por favor, completa los campos requeridos (*)', 'error');
    return;
  }

  const existingId = document.getElementById('player-id-field').value;

  if (existingId) {
    const p = playersList.find(x => x.id === existingId);
    if (p) {
      p.name = name;
      p.lastName = lastName;
      p.nickname = nickname;
      p.birthDate = birthDate;
      p.firstTrainingDate = firstTrainingDate;
      p.teamId = teamId;
      p.mainDorsal = mainDorsal;
      p.secondaryDorsal = secondaryDorsal;
      p.foot = foot;
      p.mainPosition = mainPosition;
      p.secondaryPosition = secondaryPosition;
      p.photo = photo;
      p.originalPhoto = originalPhoto;
      p.cropSettings = cropSettings;
      p.familyContacts = validFamilyContacts.length > 0 ? validFamilyContacts : tempFamilyContacts;
      p.parentContact = { name: parentName, phone: parentPhone, email: parentEmail };
      p.medicalNotes = medicalNotes;
      p.hasMedicalAlert = hasMedicalAlert;
      p.coachNotes = tempCoachNotes;
      p.equipment = equipment;
      p.kitSizes = kitSizes;
      p.kitDelivery = kitDelivery;
      showToast('Ficha del jugador actualizada', 'success');
    }
  } else {
    const newP = {
      id: `p_custom_${Date.now()}`,
      name,
      lastName,
      nickname,
      birthDate,
      firstTrainingDate,
      teamId,
      mainDorsal,
      secondaryDorsal,
      foot,
      mainPosition,
      secondaryPosition,
      photo,
      originalPhoto,
      cropSettings,
      familyContacts: validFamilyContacts.length > 0 ? validFamilyContacts : tempFamilyContacts,
      parentContact: { name: parentName, phone: parentPhone, email: parentEmail },
      medicalNotes,
      hasMedicalAlert,
      coachNotes: tempCoachNotes,
      equipment,
      kitSizes,
      kitDelivery
    };
    playersList.push(newP);
    showToast(`Jugador ${name} registrado con éxito`, 'success');
  }

  window.JKNoovaData.StorageService.savePlayers(playersList);
  closeModal(document.getElementById('modal-player'));
  renderTeamsBoard();
  const teamViewModal = document.getElementById('modal-team-view');
  if (teamViewModal && teamViewModal.classList.contains('active')) {
    openTeamViewModal(teamId);
  }
}

