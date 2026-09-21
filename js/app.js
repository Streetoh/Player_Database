/**
 * JK NOOVA - Application Controller
 * Gestión deportiva integral, tableros Kanban, convocatorias y Renault Trafic 8 Plazas (9 plazas)
 */

const { StorageService, DEFAULT_TEAMS, DEFAULT_PLAYERS } = window.JKNoovaData || {};

// Application State
const AppState = {
  activeTab: 'tab-database',
  players: [],
  teams: [],
  events: [],
  transport: {},
  
  // Filters for database
  filterTeam: 'all',
  searchQuery: '',
  filterPosition: 'all',
  sortMode: 'dorsal-asc',
  filterMedicalOnly: false,

  // Selected event for detail view & transport
  selectedEventId: null,
  transportEventId: null,

  // Temporary state for seat assignment modal
  currentAssigningSeatId: null,

  // Currently dragged player ID
  draggedPlayerId: null
};

// DOM Elements Cache
const DOM = {};

/**
 * Initialize Application
 */
function initApp() {
  try {
    initDOMCache();
    loadDataFromStorage();
    initNavigation();
    initGlobalClickDelegation();
    initFiltersAndSearch();
    initPlayerModal();
    initEventModal();
    initSquadCallupModal();
    initSeatAssignModal();
    initCustomTeamModal();
    initSettingsModal();
    initVanInteractions();

    // Initial renders
    renderHeaderStats();
    renderCategoryPills();
    renderPlayers();
    renderTeamsBoard();
    renderEventsList();
    renderConvocatoriaDetails();
    renderTransportModule();

    showToast('Sistema JK Noova cargado correctamente', 'success');
  } catch (err) {
    console.error('Error al inicializar la aplicación JK Noova:', err);
  }
}

// Ejecutar inmediatamente si el DOM ya está listo, o esperar al evento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


/**
 * Cache common DOM elements
 */
function initDOMCache() {
  DOM.navTabs = document.querySelectorAll('.nav-tab-btn');
  DOM.tabPanes = document.querySelectorAll('.tab-pane');
  
  // Stats
  DOM.statTotalCount = document.getElementById('stat-total-count');
  DOM.statTeamsCount = document.getElementById('stat-teams-count');
  DOM.statMedicalCount = document.getElementById('stat-medical-count');
  DOM.badgeTotalPlayers = document.getElementById('badge-total-players');
  DOM.badgeTotalTeams = document.getElementById('badge-total-teams');
  DOM.badgeTotalEvents = document.getElementById('badge-total-events');

  // Database Tab
  DOM.playersGrid = document.getElementById('players-grid-container');
  DOM.categoryPills = document.getElementById('category-pills-container');
  DOM.searchInput = document.getElementById('player-search-input');
  DOM.filterPosition = document.getElementById('filter-position-select');
  DOM.sortPlayers = document.getElementById('sort-players-select');
  DOM.toggleMedical = document.getElementById('toggle-medical-filter');

  // Teams Tab
  DOM.teamsBoard = document.getElementById('teams-board-container');

  // Events Tab
  DOM.eventsList = document.getElementById('events-list-container');
  DOM.summonedPlayers = document.getElementById('summoned-players-container');
  DOM.detailEventBadge = document.getElementById('detail-event-badge');
  DOM.detailEventTitle = document.getElementById('detail-event-title');
  DOM.detailEventSubtitle = document.getElementById('detail-event-subtitle');
  DOM.chipCountMinibus = document.getElementById('chip-count-minibus');
  DOM.chipCountCar = document.getElementById('chip-count-car');

  // Transport Tab
  DOM.transportEventSelect = document.getElementById('transport-event-select');
  DOM.minibusPool = document.getElementById('minibus-pool-container');
  DOM.vanCounterText = document.getElementById('van-counter-text');
  DOM.vanProgressBar = document.getElementById('van-progress-bar');
  DOM.vanStatusBadge = document.getElementById('van-status-badge');
  DOM.vanSeats = document.querySelectorAll('.van-seat');

  // Modals
  DOM.modalPlayer = document.getElementById('modal-player');
  DOM.modalEvent = document.getElementById('modal-event');
  DOM.modalSquadCallup = document.getElementById('modal-squad-callup');
  DOM.modalSeatAssign = document.getElementById('modal-seat-assign');
  DOM.modalCustomTeam = document.getElementById('modal-custom-team');
  DOM.modalSettings = document.getElementById('modal-settings');
  DOM.toastContainer = document.getElementById('toast-container');
}

/**
 * Load initial data from StorageService
 */
function loadDataFromStorage() {
  AppState.players = StorageService.getPlayers();
  AppState.teams = StorageService.getTeams();
  AppState.events = StorageService.getEvents();
  AppState.transport = StorageService.getTransport();

  if (AppState.events.length > 0) {
    AppState.selectedEventId = AppState.events[0].id;
    AppState.transportEventId = AppState.events[0].id;
  }
}

/**
 * Navigation between Tabs
 */
function initNavigation() {
  DOM.navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Direct button to jump to Transport module
  const btnJumpTransport = document.getElementById('btn-jump-to-transport');
  if (btnJumpTransport) {
    btnJumpTransport.addEventListener('click', () => {
      if (AppState.selectedEventId) {
        AppState.transportEventId = AppState.selectedEventId;
      }
      switchTab('tab-transport');
    });
  }

  // Quick new player in header
  const btnQuickNewPlayer = document.getElementById('btn-quick-new-player');
  if (btnQuickNewPlayer) {
    btnQuickNewPlayer.addEventListener('click', () => openPlayerModal(null));
  }

  const btnAddPlayerMain = document.getElementById('btn-add-player-main');
  if (btnAddPlayerMain) {
    btnAddPlayerMain.addEventListener('click', () => openPlayerModal(null));
  }
}

function switchTab(targetTabId) {
  if (!targetTabId) return;
  AppState.activeTab = targetTabId;

  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navTabs.forEach(btn => {
    const isActive = btn.getAttribute('data-tab') === targetTabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  tabPanes.forEach(pane => {
    const isActive = pane.id === targetTabId;
    pane.classList.toggle('active', isActive);
  });

  if (targetTabId === 'tab-database') {
    renderPlayers();
  } else if (targetTabId === 'tab-teams') {
    renderTeamsBoard();
  } else if (targetTabId === 'tab-calendar') {
    renderEventsList();
    renderConvocatoriaDetails();
  } else if (targetTabId === 'tab-transport') {
    renderTransportModule();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Exponer switchTab globalmente
window.switchTab = switchTab;

/**
 * Delegación global de eventos de clic: garantiza respuesta instantánea en cualquier botón
 */
function initGlobalClickDelegation() {
  document.addEventListener('click', (e) => {
    // 1. Pestañas de navegación
    const tabBtn = e.target.closest('.nav-tab-btn, [data-tab]');
    if (tabBtn) {
      e.preventDefault();
      const tabId = tabBtn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
      return;
    }

    // 2. Botón de cerrar modal
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      e.preventDefault();
      const modalId = closeBtn.getAttribute('data-close-modal');
      if (modalId) {
        const m = document.getElementById(modalId);
        if (m) closeModal(m);
      }
      return;
    }

    // 3. Clic en fondo de modal (backdrop)
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      closeModal(e.target);
      return;
    }

    // 4. Cabecera: Configuración y Nuevo Jugador
    if (e.target.closest('#btn-open-settings')) {
      e.preventDefault();
      openModal(document.getElementById('modal-settings'));
      return;
    }

    if (e.target.closest('#btn-quick-new-player, #btn-add-player-main')) {
      e.preventDefault();
      openPlayerModal(null);
      return;
    }

    // 5. Equipos: Añadir nuevo equipo
    if (e.target.closest('#btn-add-custom-team')) {
      e.preventDefault();
      openModal(document.getElementById('modal-custom-team'));
      return;
    }

    // 6. Calendario: Añadir evento, Convocatoria, Salto a Transporte
    if (e.target.closest('#btn-add-event')) {
      e.preventDefault();
      openCreateEventModal();
      return;
    }

    if (e.target.closest('#btn-edit-squad-callup')) {
      e.preventDefault();
      openSquadCallupModal();
      return;
    }

    if (e.target.closest('#btn-jump-to-transport')) {
      e.preventDefault();
      if (AppState.selectedEventId) {
        AppState.transportEventId = AppState.selectedEventId;
      }
      switchTab('tab-transport');
      return;
    }

    // 7. Transporte: Asignar auto, vaciar, imprimir
    if (e.target.closest('#btn-auto-assign-seats')) {
      e.preventDefault();
      autoAssignMinibusSeats();
      return;
    }

    if (e.target.closest('#btn-clear-all-seats')) {
      e.preventDefault();
      clearAllVanSeats();
      return;
    }

    if (e.target.closest('#btn-print-transport')) {
      e.preventDefault();
      window.print();
      return;
    }

    // 8. Botón liberar asiento de la furgoneta
    const unseatBtn = e.target.closest('.btn-unseat');
    if (unseatBtn) {
      e.preventDefault();
      e.stopPropagation();
      const seatId = unseatBtn.getAttribute('data-seat-id');
      if (seatId) unseatPlayer(seatId);
      return;
    }

    // 9. Clic en asiento para asignar
    const seatElem = e.target.closest('.van-seat');
    if (seatElem && !e.target.closest('.btn-unseat')) {
      e.preventDefault();
      const seatId = seatElem.getAttribute('data-seat-id');
      if (seatId) openSeatAssignModal(seatId);
      return;
    }

    // 10. Filtro de alerta médica
    if (e.target.closest('#toggle-medical-filter')) {
      e.preventDefault();
      AppState.filterMedicalOnly = !AppState.filterMedicalOnly;
      const el = document.getElementById('toggle-medical-filter');
      if (el) el.classList.toggle('active', AppState.filterMedicalOnly);
      renderPlayers();
      return;
    }
  });
}


/**
 * Update Header and Global Statistics
 */
function renderHeaderStats() {
  const totalPlayers = AppState.players.length;
  const totalTeams = AppState.teams.length;
  const totalEvents = AppState.events.length;
  const medicalCount = AppState.players.filter(p => p.hasMedicalAlert || (p.medicalNotes && p.medicalNotes.trim().length > 0 && !p.medicalNotes.toLowerCase().includes('ninguna'))).length;

  if (DOM.statTotalCount) DOM.statTotalCount.textContent = totalPlayers;
  if (DOM.statTeamsCount) DOM.statTeamsCount.textContent = totalTeams;
  if (DOM.statMedicalCount) DOM.statMedicalCount.textContent = medicalCount;
  if (DOM.badgeTotalPlayers) DOM.badgeTotalPlayers.textContent = totalPlayers;
  if (DOM.badgeTotalTeams) DOM.badgeTotalTeams.textContent = totalTeams;
  if (DOM.badgeTotalEvents) DOM.badgeTotalEvents.textContent = totalEvents;
}

/**
 * TAB 1: Base de Datos de Jugadores
 */
function initFiltersAndSearch() {
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.toLowerCase().trim();
      renderPlayers();
    });
  }

  if (DOM.filterPosition) {
    DOM.filterPosition.addEventListener('change', (e) => {
      AppState.filterPosition = e.target.value;
      renderPlayers();
    });
  }

  if (DOM.sortPlayers) {
    DOM.sortPlayers.addEventListener('change', (e) => {
      AppState.sortMode = e.target.value;
      renderPlayers();
    });
  }

  if (DOM.toggleMedical) {
    DOM.toggleMedical.addEventListener('click', () => {
      AppState.filterMedicalOnly = !AppState.filterMedicalOnly;
      DOM.toggleMedical.classList.toggle('active', AppState.filterMedicalOnly);
      renderPlayers();
    });
  }
}

function renderCategoryPills() {
  if (!DOM.categoryPills) return;
  DOM.categoryPills.innerHTML = '';

  // "Todos" pill
  const allBtn = document.createElement('button');
  allBtn.className = `pill-btn ${AppState.filterTeam === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `<span class="pill-dot" style="color: #fff;"></span> Todos (${AppState.players.length})`;
  allBtn.addEventListener('click', () => {
    AppState.filterTeam = 'all';
    renderCategoryPills();
    renderPlayers();
  });
  DOM.categoryPills.appendChild(allBtn);

  // Per-team pills with official team colors
  AppState.teams.forEach(team => {
    const count = AppState.players.filter(p => p.teamId === team.id).length;
    const btn = document.createElement('button');
    const isActive = AppState.filterTeam === team.id;
    btn.className = `pill-btn ${isActive ? 'active' : ''}`;
    btn.style.setProperty('--pill-color', team.color);
    btn.style.setProperty('--pill-glow', `${team.color}40`);
    btn.innerHTML = `<span class="pill-dot" style="color: ${team.color};"></span> ${team.name} (${count})`;
    btn.addEventListener('click', () => {
      AppState.filterTeam = team.id;
      renderCategoryPills();
      renderPlayers();
    });
    DOM.categoryPills.appendChild(btn);
  });
}

function renderPlayers() {
  if (!DOM.playersGrid) return;
  DOM.playersGrid.innerHTML = '';

  let filtered = [...AppState.players];

  // Team filter
  if (AppState.filterTeam !== 'all') {
    filtered = filtered.filter(p => p.teamId === AppState.filterTeam);
  }

  // Position filter
  if (AppState.filterPosition !== 'all') {
    filtered = filtered.filter(p => p.mainPosition === AppState.filterPosition || p.secondaryPosition === AppState.filterPosition);
  }

  // Medical filter
  if (AppState.filterMedicalOnly) {
    filtered = filtered.filter(p => p.hasMedicalAlert || (p.medicalNotes && p.medicalNotes.trim().length > 0 && !p.medicalNotes.toLowerCase().includes('ninguna')));
  }

  // Search input filter
  if (AppState.searchQuery) {
    const q = AppState.searchQuery;
    filtered = filtered.filter(p => {
      const matchName = `${p.name} ${p.lastName}`.toLowerCase().includes(q);
      const matchNick = (p.nickname || '').toLowerCase().includes(q);
      const matchDorsal = String(p.mainDorsal) === q || String(p.secondaryDorsal) === q;
      const matchTutor = p.parentContact && p.parentContact.name.toLowerCase().includes(q);
      return matchName || matchNick || matchDorsal || matchTutor;
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    if (AppState.sortMode === 'dorsal-asc') return (a.mainDorsal || 99) - (b.mainDorsal || 99);
    if (AppState.sortMode === 'name-asc') return (a.name + a.lastName).localeCompare(b.name + b.lastName);
    if (AppState.sortMode === 'age-desc') return new Date(a.birthDate) - new Date(b.birthDate); // Older born earlier
    if (AppState.sortMode === 'age-asc') return new Date(b.birthDate) - new Date(a.birthDate);
    return 0;
  });

  if (filtered.length === 0) {
    DOM.playersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.2rem; font-weight: 700; color: #fff;">No se encontraron jugadores</p>
        <p style="font-size: 0.85rem; margin-top: 0.4rem;">Prueba a cambiar los filtros o registra un nuevo jugador en la plantilla.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(player => {
    const team = AppState.teams.find(t => t.id === player.teamId) || { name: 'Sin Asignar', color: '#64748b' };
    const age = calculateAge(player.birthDate);
    const hasMedAlert = player.hasMedicalAlert || (player.medicalNotes && player.medicalNotes.trim().length > 0 && !player.medicalNotes.toLowerCase().includes('ninguna'));
    const latestNote = player.coachNotes && player.coachNotes.length > 0 ? player.coachNotes[player.coachNotes.length - 1].text : 'Sin notas de evolución registradas.';

    const card = document.createElement('div');
    card.className = 'player-card';
    card.style.setProperty('--team-stripe-color', team.color);
    card.style.setProperty('--team-bg-tint', `${team.color}18`);
    card.style.setProperty('--team-border-tint', `${team.color}40`);

    const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff&size=120`;

    card.innerHTML = `
      <div class="player-card-stripe"></div>
      <div class="player-card-body">
        <div class="player-card-header">
          <div class="player-avatar-wrap">
            <img src="${avatarUrl}" alt="${player.name}" class="player-avatar" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
            <span class="player-dorsal-badge">#${player.mainDorsal || '-'}</span>
          </div>
          <div class="player-names">
            <div class="player-nickname">
              ${player.nickname || player.name}
              ${player.secondaryDorsal ? `<span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(#${player.secondaryDorsal})</span>` : ''}
            </div>
            <div class="player-fullname">${player.name} ${player.lastName}</div>
            <span class="player-team-tag">${team.name} • ${age} años</span>
          </div>
        </div>

        <div class="player-tags-row">
          <span class="tag-badge tag-pos-main">${player.mainPosition}</span>
          ${player.secondaryPosition ? `<span class="tag-badge">${player.secondaryPosition}</span>` : ''}
          <span class="tag-badge tag-foot">${player.foot || 'Diestro'}</span>
          <span class="tag-badge">${formatDate(player.birthDate)}</span>
        </div>

        ${hasMedAlert ? `
          <div class="medical-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <strong>Alerta Médica:</strong> ${escapeHTML(player.medicalNotes || 'Ficha con requerimientos médicos')}
            </div>
          </div>
        ` : ''}

        ${player.parentContact && player.parentContact.name ? `
          <div class="contact-quick">
            <div>
              <div class="contact-name">👤 ${escapeHTML(player.parentContact.name)}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${player.parentContact.phone || 'Sin teléfono'}</div>
            </div>
            <div class="contact-links">
              ${player.parentContact.phone ? `
                <a href="tel:${player.parentContact.phone.replace(/\s+/g, '')}" class="contact-btn" title="Llamar">📞 Llamar</a>
                <a href="https://wa.me/${player.parentContact.phone.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="contact-btn" title="WhatsApp" style="color: #34d399;">💬 WhatsApp</a>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <div class="coach-notes-preview" title="${escapeHTML(latestNote)}">
          📝 "${escapeHTML(latestNote)}"
        </div>
      </div>

      <div class="player-card-footer">
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-secondary btn-sm btn-edit-player" data-player-id="${player.id}">
            ✏️ Editar
          </button>
          <button class="btn btn-secondary btn-sm btn-move-team" data-player-id="${player.id}">
            🔄 Equipo
          </button>
        </div>
        <button class="btn btn-danger btn-sm btn-delete-player" data-player-id="${player.id}" title="Eliminar ficha">
          🗑️
        </button>
      </div>
    `;

    // Event listeners on card buttons
    card.querySelector('.btn-edit-player').addEventListener('click', () => openPlayerModal(player.id));
    card.querySelector('.btn-move-team').addEventListener('click', () => openQuickMoveTeamPrompt(player.id));
    card.querySelector('.btn-delete-player').addEventListener('click', () => confirmDeletePlayer(player.id));

    DOM.playersGrid.appendChild(card);
  });
}

/**
 * TAB 2: Equipos & Tablero Kanban Drag & Drop
 */
function renderTeamsBoard() {
  if (!DOM.teamsBoard) return;
  DOM.teamsBoard.innerHTML = '';

  AppState.teams.forEach(team => {
    const teamPlayers = AppState.players.filter(p => p.teamId === team.id);
    const col = document.createElement('div');
    col.className = 'team-column';
    col.style.setProperty('--team-accent', team.color);
    col.setAttribute('data-team-id', team.id);

    // Position breakdown
    const porCount = teamPlayers.filter(p => p.mainPosition === 'POR').length;
    const defCount = teamPlayers.filter(p => ['DFC', 'LD', 'LI'].includes(p.mainPosition)).length;
    const medCount = teamPlayers.filter(p => ['MCD', 'MC', 'MCO'].includes(p.mainPosition)).length;
    const delCount = teamPlayers.filter(p => ['ED', 'EI', 'DC'].includes(p.mainPosition)).length;

    col.innerHTML = `
      <div class="team-column-header">
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
      </div>
      <div class="team-column-body" data-team-id="${team.id}">
        ${teamPlayers.length === 0 ? `
          <div class="team-empty-state">
            Arrastra jugadores aquí para asignarlos a ${escapeHTML(team.name)}
          </div>
        ` : ''}
      </div>
    `;

    const body = col.querySelector('.team-column-body');

    teamPlayers.forEach(player => {
      const miniCard = document.createElement('div');
      miniCard.className = 'mini-player-card draggable-player';
      miniCard.setAttribute('draggable', 'true');
      miniCard.setAttribute('data-player-id', player.id);

      const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff`;

      miniCard.innerHTML = `
        <img src="${avatarUrl}" alt="${player.name}" class="mini-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
        <div class="mini-details">
          <div class="mini-nickname">#${player.mainDorsal || '-'} ${escapeHTML(player.nickname || player.name)}</div>
          <div class="mini-sub">${player.mainPosition} • ${player.foot || 'Diestro'}</div>
        </div>
        ${player.hasMedicalAlert ? `<span title="Alerta Médica" style="color: #ef4444; font-size: 0.9rem;">⚠️</span>` : ''}
      `;

      // Drag start & end on player card
      miniCard.addEventListener('dragstart', (e) => {
        AppState.draggedPlayerId = player.id;
        miniCard.classList.add('dragging');
        e.dataTransfer.setData('text/plain', player.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      miniCard.addEventListener('dragend', () => {
        miniCard.classList.remove('dragging');
        AppState.draggedPlayerId = null;
      });

      // Click to edit
      miniCard.addEventListener('click', () => openPlayerModal(player.id));

      body.appendChild(miniCard);
    });

    // Drop zone handlers on team column
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
      e.dataTransfer.dropEffect = 'move';
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const playerId = e.dataTransfer.getData('text/plain') || AppState.draggedPlayerId;
      if (playerId) {
        movePlayerToTeam(playerId, team.id);
      }
    });

    DOM.teamsBoard.appendChild(col);
  });
}

function movePlayerToTeam(playerId, newTeamId) {
  const player = AppState.players.find(p => p.id === playerId);
  if (!player) return;
  if (player.teamId === newTeamId) return;

  const targetTeam = AppState.teams.find(t => t.id === newTeamId);
  player.teamId = newTeamId;
  StorageService.savePlayers(AppState.players);

  showToast(`${player.nickname || player.name} trasladado a ${targetTeam.name}`, 'success');
  renderCategoryPills();
  renderPlayers();
  renderTeamsBoard();
  renderHeaderStats();
}

function openQuickMoveTeamPrompt(playerId) {
  const player = AppState.players.find(p => p.id === playerId);
  if (!player) return;

  const teamOptions = AppState.teams
    .map(t => `${t.id === player.teamId ? '👉 ' : ''}${t.name}`)
    .join('\n');

  const chosenTeamName = prompt(
    `Cambiar equipo de ${player.nickname || player.name}:\nEscribe exactamente el nombre del equipo:\n\n${teamOptions}`,
    ''
  );

  if (chosenTeamName) {
    const cleanName = chosenTeamName.replace('👉 ', '').trim().toLowerCase();
    const foundTeam = AppState.teams.find(t => t.name.toLowerCase() === cleanName);
    if (foundTeam) {
      movePlayerToTeam(player.id, foundTeam.id);
    } else {
      showToast('Equipo no reconocido.', 'warning');
    }
  }
}

/**
 * TAB 3: Calendario, Eventos & Convocatorias
 */
function renderEventsList() {
  if (!DOM.eventsList) return;
  DOM.eventsList.innerHTML = '';

  if (AppState.events.length === 0) {
    DOM.eventsList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-subtle);">
        No hay partidos programados. Pulsa en "+ Programar Partido".
      </div>
    `;
    return;
  }

  AppState.events.forEach(event => {
    const team = AppState.teams.find(t => t.id === event.teamId) || { name: 'Equipo', color: '#3b82f6' };
    const isSelected = event.id === AppState.selectedEventId;
    const card = document.createElement('div');
    card.className = `event-card ${isSelected ? 'selected' : ''}`;

    const totalCallUp = event.callUp ? event.callUp.length : 0;
    const minibusCount = event.callUp ? event.callUp.filter(c => c.transport === 'minibus').length : 0;
    const carCount = event.callUp ? event.callUp.filter(c => c.transport === 'car').length : 0;

    let badgeClass = 'badge-liga';
    if (event.eventType === 'Torneo') badgeClass = 'badge-torneo';
    if (event.eventType === 'Amistoso') badgeClass = 'badge-amistoso';

    card.innerHTML = `
      <div class="event-card-header">
        <span class="event-type-badge ${badgeClass}">${event.eventType || 'Liga'}</span>
        <span style="font-size: 0.75rem; font-weight: 700; color: ${team.color};">${team.name}</span>
      </div>
      <div class="event-title">${escapeHTML(event.title || event.rival)}</div>
      <div class="event-meta-grid">
        <div class="event-meta-item">📅 ${formatDate(event.date)}</div>
        <div class="event-meta-item">⏰ ${event.time || '--:--'} h</div>
        <div class="event-meta-item">📍 ${event.isHome ? 'Casa' : 'Fuera'}</div>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.75rem;">
        <span style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">
          🚐 Bus: ${minibusCount}
        </span>
        <span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">
          🚗 Coche: ${carCount}
        </span>
        <span style="background: var(--bg-secondary); color: var(--text-secondary); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">
          Total: ${totalCallUp}
        </span>
      </div>
    `;

    card.addEventListener('click', () => {
      AppState.selectedEventId = event.id;
      renderEventsList();
      renderConvocatoriaDetails();
    });

    DOM.eventsList.appendChild(card);
  });
}

/**
 * Strict Convocatoria view for selected event
 */
function renderConvocatoriaDetails() {
  if (!DOM.summonedPlayers) return;
  DOM.summonedPlayers.innerHTML = '';

  const event = AppState.events.find(e => e.id === AppState.selectedEventId);
  if (!event) {
    DOM.detailEventTitle.textContent = 'Selecciona un partido';
    DOM.detailEventSubtitle.textContent = 'Elige un evento para ver su convocatoria filtrada';
    return;
  }

  const team = AppState.teams.find(t => t.id === event.teamId) || { name: 'Equipo', color: '#3b82f6' };

  DOM.detailEventTitle.textContent = event.title || `JK Noova vs ${event.rival}`;
  DOM.detailEventSubtitle.textContent = `${team.name} • ${formatDate(event.date)} a las ${event.time || ''} • ${event.location || 'Campo de fútbol'}`;
  
  if (DOM.detailEventBadge) {
    DOM.detailEventBadge.textContent = event.eventType;
    DOM.detailEventBadge.className = `event-type-badge ${event.eventType === 'Torneo' ? 'badge-torneo' : event.eventType === 'Amistoso' ? 'badge-amistoso' : 'badge-liga'}`;
  }

  const callUpList = event.callUp || [];
  const minibusCount = callUpList.filter(c => c.transport === 'minibus').length;
  const carCount = callUpList.filter(c => c.transport === 'car').length;

  if (DOM.chipCountMinibus) {
    DOM.chipCountMinibus.innerHTML = `🚐 Minibús del Club: <strong>${minibusCount} / 8 plazas</strong>`;
    if (minibusCount > 8) {
      DOM.chipCountMinibus.style.borderColor = '#ef4444';
      DOM.chipCountMinibus.style.color = '#f87171';
    } else {
      DOM.chipCountMinibus.style.borderColor = 'rgba(6, 182, 212, 0.3)';
      DOM.chipCountMinibus.style.color = 'var(--accent-cyan)';
    }
  }

  if (DOM.chipCountCar) {
    DOM.chipCountCar.innerHTML = `🚗 En Coche Particular: <strong>${carCount}</strong>`;
  }

  // Filtered strictly to show ONLY summoned players
  if (callUpList.length === 0) {
    DOM.summonedPlayers.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: 8px;">
        No hay jugadores convocados para este partido. Pulsa en "Modificar Convocatoria" para seleccionar la lista de jugadores.
      </div>
    `;
    return;
  }

  callUpList.forEach(item => {
    const player = AppState.players.find(p => p.id === item.playerId);
    if (!player) return;

    const row = document.createElement('div');
    row.className = 'summoned-item';

    const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff`;

    row.innerHTML = `
      <div class="summoned-info">
        <img src="${avatarUrl}" alt="${player.name}" class="mini-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
            #${player.mainDorsal || '-'} ${escapeHTML(player.nickname || player.name)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">
            ${player.name} ${player.lastName} • <span style="color: var(--accent-cyan);">${player.mainPosition}</span>
          </div>
        </div>
      </div>

      <div class="summoned-transport-toggle">
        <button class="toggle-btn ${item.transport === 'minibus' ? 'active-minibus' : ''}" data-player-id="${player.id}" data-mode="minibus" title="Viaja en Renault 8 Plazas">
          🚐 Minibús
        </button>
        <button class="toggle-btn ${item.transport === 'car' ? 'active-car' : ''}" data-player-id="${player.id}" data-mode="car" title="Viaja en coche con sus padres">
          🚗 Coche
        </button>
      </div>
    `;

    // Transport toggle buttons
    row.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        setPlayerTransportMode(event.id, player.id, mode);
      });
    });

    DOM.summonedPlayers.appendChild(row);
  });
}

function setPlayerTransportMode(eventId, playerId, newMode) {
  const event = AppState.events.find(e => e.id === eventId);
  if (!event || !event.callUp) return;

  const item = event.callUp.find(c => c.playerId === playerId);
  if (item) {
    item.transport = newMode;
    StorageService.saveEvents(AppState.events);

    // If switched from minibus to car, vacate seat if they were seated
    if (newMode === 'car' && AppState.transport[eventId]) {
      for (const seatKey of Object.keys(AppState.transport[eventId])) {
        if (AppState.transport[eventId][seatKey] === playerId) {
          delete AppState.transport[eventId][seatKey];
          StorageService.saveTransport(AppState.transport);
          break;
        }
      }
    }

    renderEventsList();
    renderConvocatoriaDetails();
    if (AppState.transportEventId === eventId) {
      renderTransportModule();
    }
  }
}

/**
 * TAB 4: Módulo de Transporte (Renault Trafic 8 Plazas 9-Plazas)
 */
function initVanInteractions() {
  // Event selector in Transport Tab
  if (DOM.transportEventSelect) {
    DOM.transportEventSelect.addEventListener('change', (e) => {
      AppState.transportEventId = e.target.value;
      renderTransportModule();
    });
  }

  // Auto assign seats button
  const btnAutoAssign = document.getElementById('btn-auto-assign-seats');
  if (btnAutoAssign) {
    btnAutoAssign.addEventListener('click', autoAssignMinibusSeats);
  }

  // Clear seats button
  const btnClearAll = document.getElementById('btn-clear-all-seats');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', clearAllVanSeats);
  }

  // Print button
  const btnPrint = document.getElementById('btn-print-transport');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  // Drag & drop drop-targets on seats
  DOM.vanSeats.forEach(seatElem => {
    const seatId = seatElem.getAttribute('data-seat-id');

    seatElem.addEventListener('dragover', (e) => {
      e.preventDefault();
      seatElem.classList.add('seat-drag-over');
      e.dataTransfer.dropEffect = 'move';
    });

    seatElem.addEventListener('dragleave', () => {
      seatElem.classList.remove('seat-drag-over');
    });

    seatElem.addEventListener('drop', (e) => {
      e.preventDefault();
      seatElem.classList.remove('seat-drag-over');
      const playerId = e.dataTransfer.getData('text/plain') || AppState.draggedPlayerId;
      if (playerId && seatId) {
        assignPlayerToSeat(seatId, playerId);
      }
    });

    // Click on seat to open quick assign modal (especially for mobile!)
    seatElem.addEventListener('click', (e) => {
      // Don't trigger if clicked on unseat button
      if (e.target.closest('.btn-unseat')) return;
      openSeatAssignModal(seatId);
    });
  });
}

function renderTransportModule() {
  // Populate event select
  if (DOM.transportEventSelect) {
    DOM.transportEventSelect.innerHTML = '';
    AppState.events.forEach(evt => {
      const opt = document.createElement('option');
      opt.value = evt.id;
      opt.textContent = `${evt.rival} (${formatDate(evt.date)})`;
      if (evt.id === AppState.transportEventId) opt.selected = true;
      DOM.transportEventSelect.appendChild(opt);
    });
  }

  const currentEvent = AppState.events.find(e => e.id === AppState.transportEventId) || AppState.events[0];
  if (!currentEvent) return;

  const eventCallUp = currentEvent.callUp || [];
  // Strict filter: players summoned with transport = 'minibus'
  const minibusConvocados = eventCallUp
    .filter(c => c.transport === 'minibus')
    .map(c => AppState.players.find(p => p.id === c.playerId))
    .filter(Boolean);

  // Transport seat map for this event
  if (!AppState.transport[currentEvent.id]) {
    AppState.transport[currentEvent.id] = { driver: 'Entrenador JK Noova' };
  }
  const seatMap = AppState.transport[currentEvent.id];

  // Render Left Sidebar: Convocados Pool
  if (DOM.minibusPool) {
    DOM.minibusPool.innerHTML = '';

    if (minibusConvocados.length === 0) {
      DOM.minibusPool.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-subtle); border-radius: 8px;">
          No hay jugadores con transporte "Minibús" convocados para este partido. Modifícalo en la pestaña Calendario.
        </div>
      `;
    } else {
      minibusConvocados.forEach(player => {
        // Find if seated
        let assignedSeat = null;
        for (const [seatId, pId] of Object.entries(seatMap)) {
          if (pId === player.id) {
            assignedSeat = seatId;
            break;
          }
        }

        const poolCard = document.createElement('div');
        poolCard.className = `pool-player-card ${assignedSeat ? 'is-seated' : ''}`;
        poolCard.setAttribute('draggable', 'true');
        poolCard.setAttribute('data-player-id', player.id);

        const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff`;

        poolCard.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="${avatarUrl}" alt="${player.name}" class="mini-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #fff;">
                #${player.mainDorsal || '-'} ${escapeHTML(player.nickname || player.name)}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${player.mainPosition}</div>
            </div>
          </div>
          <div>
            ${assignedSeat ? `
              <span class="seat-assigned-pill" title="Asignado a este asiento">${formatSeatCode(assignedSeat)}</span>
            ` : `
              <span style="font-size: 0.7rem; color: var(--accent-cyan); font-weight: 600;">Sin Asignar</span>
            `}
          </div>
        `;

        // Drag handlers
        poolCard.addEventListener('dragstart', (e) => {
          AppState.draggedPlayerId = player.id;
          e.dataTransfer.setData('text/plain', player.id);
          e.dataTransfer.effectAllowed = 'move';
        });

        // Click to auto-assign into first open seat
        poolCard.addEventListener('click', () => {
          if (!assignedSeat) {
            assignToFirstEmptySeat(player.id);
          }
        });

        DOM.minibusPool.appendChild(poolCard);
      });
    }
  }

  // Render the Seats inside the Renault 8 Plazas
  let occupiedPassengerCount = 0;
  const passengerSeatIds = ['front_1', 'front_2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

  DOM.vanSeats.forEach(seatElem => {
    const seatId = seatElem.getAttribute('data-seat-id');
    const assignedPlayerId = seatMap[seatId];

    if (seatId === 'driver') {
      // Driver seat
      const driverName = assignedPlayerId || 'Entrenador David';
      seatElem.innerHTML = `
        <div class="seat-occupied" style="padding: 4px;">
          <div class="seat-occupied-card">
            <div class="seat-avatar" style="background: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
              👨‍💼
            </div>
            <div class="seat-player-info">
              <div class="seat-player-nick">${escapeHTML(driverName)}</div>
              <div class="seat-player-dorsal" style="color: #60a5fa;">CONDUCTOR STAFF</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Passenger seats
    if (assignedPlayerId) {
      occupiedPassengerCount++;
      const player = AppState.players.find(p => p.id === assignedPlayerId);
      const team = player ? AppState.teams.find(t => t.id === player.teamId) : null;
      const teamColor = team ? team.color : '#06b6d4';

      if (player) {
        const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff`;

        seatElem.innerHTML = `
          <div class="seat-occupied" style="--seat-player-color: ${teamColor};">
            <button class="btn-unseat" title="Quitar jugador del asiento" data-seat-id="${seatId}">&times;</button>
            <div class="seat-occupied-card">
              <img src="${avatarUrl}" alt="${player.name}" class="seat-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
              <div class="seat-player-info">
                <div class="seat-player-nick">#${player.mainDorsal || '-'} ${escapeHTML(player.nickname || player.name)}</div>
                <div class="seat-player-dorsal">${formatSeatCode(seatId)} • ${player.mainPosition}</div>
              </div>
            </div>
          </div>
        `;

        // Unseat button handler
        const btnUnseat = seatElem.querySelector('.btn-unseat');
        if (btnUnseat) {
          btnUnseat.addEventListener('click', (e) => {
            e.stopPropagation();
            unseatPlayer(seatId);
          });
        }
      } else {
        renderEmptySeat(seatElem, seatId);
      }
    } else {
      renderEmptySeat(seatElem, seatId);
    }
  });

  // Update Live Van Counters
  const maxSeats = 8;
  const minibusSummonedTotal = minibusConvocados.length;

  if (DOM.vanCounterText) {
    DOM.vanCounterText.textContent = `${occupiedPassengerCount} / ${maxSeats}`;
  }

  if (DOM.vanProgressBar) {
    const percentage = Math.min(100, (occupiedPassengerCount / maxSeats) * 100);
    DOM.vanProgressBar.style.width = `${percentage}%`;
    DOM.vanProgressBar.classList.toggle('overbooked', minibusSummonedTotal > maxSeats);
  }

  if (DOM.vanStatusBadge) {
    if (minibusSummonedTotal > maxSeats) {
      DOM.vanStatusBadge.className = 'van-alert-badge alert-danger';
      DOM.vanStatusBadge.textContent = `⚠️ ¡Sobrecupo! (${minibusSummonedTotal} convocados para 8 plazas)`;
    } else if (occupiedPassengerCount === maxSeats) {
      DOM.vanStatusBadge.className = 'van-alert-badge alert-full';
      DOM.vanStatusBadge.textContent = `✅ Furgoneta Completa (8 / 8)`;
    } else {
      const free = maxSeats - occupiedPassengerCount;
      DOM.vanStatusBadge.className = 'van-alert-badge alert-ok';
      DOM.vanStatusBadge.textContent = `${free} ${free === 1 ? 'plaza libre' : 'plazas libres'}`;
    }
  }
}

function renderEmptySeat(seatElem, seatId) {
  let label = formatSeatCode(seatId);
  let hint = 'Asiento Libre';
  if (seatId === 'front_1' || seatId === 'front_2') hint = 'Delantero';
  if (seatId === 'p3') hint = 'Puerta Corredera';

  seatElem.innerHTML = `
    <div class="seat-empty">
      <span class="seat-code">${label}</span>
      <span class="seat-hint">${hint}</span>
    </div>
  `;
}

function formatSeatCode(seatId) {
  const map = {
    driver: 'CONDUCTOR',
    front_1: 'Pasajero 1',
    front_2: 'Pasajero 2',
    p1: 'P1',
    p2: 'P2',
    p3: 'P3',
    p4: 'P4',
    p5: 'P5',
    p6: 'P6'
  };
  return map[seatId] || seatId.toUpperCase();
}

function assignPlayerToSeat(seatId, playerId) {
  const currentEventId = AppState.transportEventId;
  if (!currentEventId) return;

  if (!AppState.transport[currentEventId]) {
    AppState.transport[currentEventId] = {};
  }

  const seatMap = AppState.transport[currentEventId];

  // Remove player from any previous seat in this event
  for (const [sId, pId] of Object.entries(seatMap)) {
    if (pId === playerId) {
      delete seatMap[sId];
    }
  }

  // Assign to this seat
  seatMap[seatId] = playerId;
  StorageService.saveTransport(AppState.transport);

  renderTransportModule();
  const player = AppState.players.find(p => p.id === playerId);
  if (player) {
    showToast(`${player.nickname || player.name} asignado a ${formatSeatCode(seatId)}`, 'success');
  }
}

function unseatPlayer(seatId) {
  const currentEventId = AppState.transportEventId;
  if (!currentEventId || !AppState.transport[currentEventId]) return;

  delete AppState.transport[currentEventId][seatId];
  StorageService.saveTransport(AppState.transport);
  renderTransportModule();
  showToast(`Asiento ${formatSeatCode(seatId)} liberado`, 'warning');
}

function assignToFirstEmptySeat(playerId) {
  const currentEventId = AppState.transportEventId;
  if (!currentEventId) return;

  const passengerSeatIds = ['front_1', 'front_2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const seatMap = AppState.transport[currentEventId] || {};

  const emptySeat = passengerSeatIds.find(seatId => !seatMap[seatId]);
  if (emptySeat) {
    assignPlayerToSeat(emptySeat, playerId);
  } else {
    showToast('No quedan plazas libres en la furgoneta (8/8)', 'warning');
  }
}

function autoAssignMinibusSeats() {
  const currentEvent = AppState.events.find(e => e.id === AppState.transportEventId);
  if (!currentEvent) return;

  const eventCallUp = currentEvent.callUp || [];
  const minibusPlayers = eventCallUp
    .filter(c => c.transport === 'minibus')
    .map(c => AppState.players.find(p => p.id === c.playerId))
    .filter(Boolean);

  if (minibusPlayers.length === 0) {
    showToast('No hay jugadores convocados con transporte Minibús', 'warning');
    return;
  }

  if (!AppState.transport[currentEvent.id]) {
    AppState.transport[currentEvent.id] = { driver: 'Entrenador JK Noova' };
  }
  const seatMap = AppState.transport[currentEvent.id];

  const passengerSeatIds = ['front_1', 'front_2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

  // Clear existing assignments first to organize nicely
  passengerSeatIds.forEach(sId => delete seatMap[sId]);

  minibusPlayers.slice(0, passengerSeatIds.length).forEach((player, idx) => {
    seatMap[passengerSeatIds[idx]] = player.id;
  });

  StorageService.saveTransport(AppState.transport);
  renderTransportModule();
  showToast(`Asignación automática completada (${Math.min(minibusPlayers.length, 8)} plazas)`, 'success');
}

function clearAllVanSeats() {
  const currentEventId = AppState.transportEventId;
  if (!currentEventId) return;

  if (confirm('¿Deseas desocupar todos los asientos de pasajeros de la furgoneta?')) {
    const driver = AppState.transport[currentEventId]?.driver || 'Entrenador JK Noova';
    AppState.transport[currentEventId] = { driver };
    StorageService.saveTransport(AppState.transport);
    renderTransportModule();
    showToast('Asientos de pasajeros vaciados', 'warning');
  }
}

/**
 * MODAL: Quick Seat Assignment (Click on Seat)
 */
function initSeatAssignModal() {
  const btnVacate = document.getElementById('btn-vacate-current-seat');
  if (btnVacate) {
    btnVacate.addEventListener('click', () => {
      if (AppState.currentAssigningSeatId) {
        unseatPlayer(AppState.currentAssigningSeatId);
        closeModal(DOM.modalSeatAssign);
      }
    });
  }
}

function openSeatAssignModal(seatId) {
  AppState.currentAssigningSeatId = seatId;
  const modalTitle = document.getElementById('modal-seat-assign-title');
  if (modalTitle) {
    modalTitle.textContent = `Asignar Plaza: ${formatSeatCode(seatId)}`;
  }

  const currentEvent = AppState.events.find(e => e.id === AppState.transportEventId);
  const listContainer = document.getElementById('seat-assign-options-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (seatId === 'driver') {
    const driverInput = prompt('Escribe el nombre del Conductor / Entrenador:', AppState.transport[currentEvent.id]?.driver || 'Entrenador David');
    if (driverInput !== null && driverInput.trim() !== '') {
      if (!AppState.transport[currentEvent.id]) AppState.transport[currentEvent.id] = {};
      AppState.transport[currentEvent.id].driver = driverInput.trim();
      StorageService.saveTransport(AppState.transport);
      renderTransportModule();
      showToast(`Conductor actualizado: ${driverInput}`, 'success');
    }
    return;
  }

  const eventCallUp = currentEvent?.callUp || [];
  const minibusPlayers = eventCallUp
    .filter(c => c.transport === 'minibus')
    .map(c => AppState.players.find(p => p.id === c.playerId))
    .filter(Boolean);

  if (minibusPlayers.length === 0) {
    listContainer.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem; text-align: center;">
        No hay jugadores con transporte "Minibús" en la convocatoria de este partido.
      </div>
    `;
    openModal(DOM.modalSeatAssign);
    return;
  }

  const seatMap = AppState.transport[currentEvent.id] || {};

  minibusPlayers.forEach(player => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.width = '100%';
    btn.style.justifyContent = 'space-between';

    let currentSeatLabel = '';
    for (const [sId, pId] of Object.entries(seatMap)) {
      if (pId === player.id) {
        currentSeatLabel = ` (Actualmente en ${formatSeatCode(sId)})`;
        break;
      }
    }

    btn.innerHTML = `
      <span style="font-weight: 700;">#${player.mainDorsal || '-'} ${escapeHTML(player.nickname || player.name)}</span>
      <span style="font-size: 0.75rem; color: var(--accent-cyan);">${player.mainPosition} ${currentSeatLabel}</span>
    `;

    btn.addEventListener('click', () => {
      assignPlayerToSeat(seatId, player.id);
      closeModal(DOM.modalSeatAssign);
    });

    listContainer.appendChild(btn);
  });

  openModal(DOM.modalSeatAssign);
}

/**
 * MODAL: Player Creation & Editing
 */
let tempCoachNotes = [];

function initPlayerModal() {
  const btnSave = document.getElementById('btn-save-player');
  if (btnSave) {
    btnSave.addEventListener('click', savePlayerForm);
  }

  const btnAddCoachNote = document.getElementById('btn-add-coach-note');
  if (btnAddCoachNote) {
    btnAddCoachNote.addEventListener('click', addTempCoachNote);
  }

  // Birthdate auto category hint
  const birthdateInput = document.getElementById('player-birthdate');
  if (birthdateInput) {
    birthdateInput.addEventListener('change', () => {
      const age = calculateAge(birthdateInput.value);
      suggestTeamByAge(age);
    });
  }
}

function openPlayerModal(playerId = null) {
  const form = document.getElementById('form-player');
  form.reset();
  tempCoachNotes = [];

  // Populate team selector in player modal
  const teamSelect = document.getElementById('player-team');
  teamSelect.innerHTML = '';
  AppState.teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.category || ''})`;
    teamSelect.appendChild(opt);
  });

  const modalTitle = document.getElementById('modal-player-title');

  if (playerId) {
    const player = AppState.players.find(p => p.id === playerId);
    if (!player) return;

    modalTitle.textContent = `Editar Ficha: ${player.nickname || player.name}`;
    document.getElementById('player-id-field').value = player.id;
    document.getElementById('player-name').value = player.name || '';
    document.getElementById('player-lastname').value = player.lastName || '';
    document.getElementById('player-nickname').value = player.nickname || '';
    document.getElementById('player-birthdate').value = player.birthDate || '';
    if (document.getElementById('player-photo')) document.getElementById('player-photo').value = player.photo || '';
    if (document.getElementById('player-photo-base64')) document.getElementById('player-photo-base64').value = player.photo || '';
    const previewImg = document.getElementById('player-photo-preview-img');
    const placeholder = document.getElementById('player-photo-placeholder');
    if (previewImg && placeholder) {
      if (player.photo) {
        previewImg.src = player.photo;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
      } else {
        previewImg.style.display = 'none';
        placeholder.style.display = 'block';
      }
    }
    document.getElementById('player-dorsal-main').value = player.mainDorsal || '';
    document.getElementById('player-dorsal-sec').value = player.secondaryDorsal || '';
    document.getElementById('player-foot').value = player.foot || 'Diestro';
    document.getElementById('player-pos-main').value = player.mainPosition || 'DC';
    document.getElementById('player-pos-sec').value = player.secondaryPosition || '';
    document.getElementById('player-parent-name').value = player.parentContact?.name || '';
    document.getElementById('player-parent-phone').value = player.parentContact?.phone || '';
    document.getElementById('player-parent-email').value = player.parentContact?.email || '';
    document.getElementById('player-medical-notes').value = player.medicalNotes || '';
    document.getElementById('player-has-medical-alert').checked = !!player.hasMedicalAlert;

    tempCoachNotes = player.coachNotes ? [...player.coachNotes] : [];
  } else {
    modalTitle.textContent = 'Registrar Nuevo Jugador';
    document.getElementById('player-id-field').value = '';
    // Set team default to current filtered team if valid
    if (AppState.filterTeam !== 'all') {
      document.getElementById('player-team').value = AppState.filterTeam;
    }
  }

  renderTempCoachNotes();
  openModal(DOM.modalPlayer);
}

function renderTempCoachNotes() {
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

function addTempCoachNote() {
  const input = document.getElementById('new-coach-note-input');
  const text = input.value.trim();
  if (!text) return;

  const today = new Date().toISOString().split('T')[0];
  tempCoachNotes.push({ date: today, text });
  input.value = '';
  renderTempCoachNotes();
}

function suggestTeamByAge(age) {
  if (age <= 5) setModalTeamIfExists('team_jmk');
  else if (age <= 7) setModalTeamIfExists('team_u8');
  else if (age <= 9) setModalTeamIfExists('team_u10');
  else if (age <= 11) setModalTeamIfExists('team_u12');
  else if (age <= 13) setModalTeamIfExists('team_u14');
}

function setModalTeamIfExists(teamId) {
  const teamSelect = document.getElementById('player-team');
  if (teamSelect && AppState.teams.some(t => t.id === teamId)) {
    teamSelect.value = teamId;
  }
}

function savePlayerForm() {
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
  const photo = document.getElementById('player-photo-base64')?.value || document.getElementById('player-photo')?.value?.trim() || '';
  const parentName = document.getElementById('player-parent-name').value.trim();
  const parentPhone = document.getElementById('player-parent-phone').value.trim();
  const parentEmail = document.getElementById('player-parent-email').value.trim();
  const medicalNotes = document.getElementById('player-medical-notes').value.trim();
  const hasMedicalAlert = document.getElementById('player-has-medical-alert').checked;

  if (!name || !lastName || !nickname || !birthDate || isNaN(mainDorsal)) {
    showToast('Por favor, completa los campos requeridos (*)', 'error');
    return;
  }

  const existingId = document.getElementById('player-id-field').value;

  if (existingId) {
    // Update player
    const player = AppState.players.find(p => p.id === existingId);
    if (player) {
      player.name = name;
      player.lastName = lastName;
      player.nickname = nickname;
      player.birthDate = birthDate;
      player.teamId = teamId;
      player.mainDorsal = mainDorsal;
      player.secondaryDorsal = secondaryDorsal;
      player.foot = foot;
      player.mainPosition = mainPosition;
      player.secondaryPosition = secondaryPosition;
      player.photo = photo;
      player.originalPhoto = document.getElementById('player-photo-original-base64')?.value || photo;
      try {
        const rawCS = document.getElementById('player-photo-crop-settings')?.value;
        if (rawCS) player.cropSettings = JSON.parse(rawCS);
      } catch (err) {}
      player.parentContact = { name: parentName, phone: parentPhone, email: parentEmail };
      player.medicalNotes = medicalNotes;
      player.hasMedicalAlert = hasMedicalAlert;
      player.coachNotes = tempCoachNotes;
      showToast('Ficha del jugador actualizada', 'success');
    }
  } else {
    // Create new player
    const newPlayer = {
      id: `p_custom_${Date.now()}`,
      name,
      lastName,
      nickname,
      birthDate,
      teamId,
      mainDorsal,
      secondaryDorsal,
      foot,
      mainPosition,
      secondaryPosition,
      photo,
      originalPhoto: document.getElementById('player-photo-original-base64')?.value || photo,
      parentContact: { name: parentName, phone: parentPhone, email: parentEmail },
      medicalNotes,
      hasMedicalAlert,
      coachNotes: tempCoachNotes
    };
    try {
      const rawCS = document.getElementById('player-photo-crop-settings')?.value;
      if (rawCS) newPlayer.cropSettings = JSON.parse(rawCS);
    } catch (err) {}
    AppState.players.push(newPlayer);
    showToast(`Jugador ${nickname} registrado con éxito`, 'success');
  }

  StorageService.savePlayers(AppState.players);
  closeModal(DOM.modalPlayer);
  renderCategoryPills();
  renderPlayers();
  renderTeamsBoard();
  renderHeaderStats();
}

function confirmDeletePlayer(playerId) {
  const player = AppState.players.find(p => p.id === playerId);
  if (!player) return;

  if (confirm(`¿Estás seguro de eliminar permanentemente la ficha de ${player.nickname || player.name}?`)) {
    AppState.players = AppState.players.filter(p => p.id !== playerId);
    StorageService.savePlayers(AppState.players);

    // Remove from any callUp or transport
    AppState.events.forEach(evt => {
      if (evt.callUp) evt.callUp = evt.callUp.filter(c => c.playerId !== playerId);
    });
    StorageService.saveEvents(AppState.events);

    for (const evtId of Object.keys(AppState.transport)) {
      for (const seatKey of Object.keys(AppState.transport[evtId])) {
        if (AppState.transport[evtId][seatKey] === playerId) {
          delete AppState.transport[evtId][seatKey];
        }
      }
    }
    StorageService.saveTransport(AppState.transport);

    showToast('Ficha de jugador eliminada', 'warning');
    renderCategoryPills();
    renderPlayers();
    renderTeamsBoard();
    renderHeaderStats();
    renderConvocatoriaDetails();
    renderTransportModule();
  }
}

/**
 * MODAL: Event Creation & Editing
 */
function initEventModal() {
  const btnAddEvent = document.getElementById('btn-add-event');
  if (btnAddEvent) {
    btnAddEvent.addEventListener('click', openCreateEventModal);
  }

  const btnSaveEvent = document.getElementById('btn-save-event');
  if (btnSaveEvent) {
    btnSaveEvent.addEventListener('click', saveEventForm);
  }
}

function openCreateEventModal() {
  const teamSelect = document.getElementById('event-team');
  teamSelect.innerHTML = '';
  AppState.teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    teamSelect.appendChild(opt);
  });

  document.getElementById('event-id-field').value = '';
  document.getElementById('event-rival').value = '';
  document.getElementById('event-title-custom').value = '';
  document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('event-time').value = '10:00';
  document.getElementById('event-location').value = 'Sede JK Noova';
  document.getElementById('event-meeting').value = 'Punto de encuentro: 1 h antes';
  document.getElementById('event-notes').value = '';

  openModal(DOM.modalEvent);
}

function saveEventForm() {
  const teamId = document.getElementById('event-team').value;
  const eventType = document.getElementById('event-type').value;
  const rival = document.getElementById('event-rival').value.trim();
  const title = document.getElementById('event-title-custom').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const isHome = document.getElementById('event-ishome').value === 'true';
  const location = document.getElementById('event-location').value.trim();
  const meetingPoint = document.getElementById('event-meeting').value.trim();
  const notes = document.getElementById('event-notes').value.trim();

  if (!rival || !title || !date || !time) {
    showToast('Por favor, completa todos los campos del partido', 'error');
    return;
  }

  // Pre-populate call-up with players from this team
  const teamPlayers = AppState.players.filter(p => p.teamId === teamId);
  const initialCallUp = teamPlayers.slice(0, 10).map((p, idx) => ({
    playerId: p.id,
    transport: idx < 8 ? 'minibus' : 'car'
  }));

  const newEvent = {
    id: `ev_${Date.now()}`,
    teamId,
    eventType,
    rival,
    title,
    date,
    time,
    isHome,
    location,
    meetingPoint,
    notes,
    callUp: initialCallUp
  };

  AppState.events.unshift(newEvent);
  AppState.selectedEventId = newEvent.id;
  AppState.transportEventId = newEvent.id;
  StorageService.saveEvents(AppState.events);

  closeModal(DOM.modalEvent);
  renderEventsList();
  renderConvocatoriaDetails();
  renderTransportModule();
  renderHeaderStats();
  showToast(`Partido ${title} programado con éxito`, 'success');
}

/**
 * MODAL: Squad CallUp Selector (Convocatoria)
 */
function initSquadCallupModal() {
  const btnEditCallup = document.getElementById('btn-edit-squad-callup');
  if (btnEditCallup) {
    btnEditCallup.addEventListener('click', openSquadCallupModal);
  }

  const btnConfirmCallup = document.getElementById('btn-confirm-callup');
  if (btnConfirmCallup) {
    btnConfirmCallup.addEventListener('click', saveSquadCallupModal);
  }
}

function openSquadCallupModal() {
  const event = AppState.events.find(e => e.id === AppState.selectedEventId);
  if (!event) return;

  const rosterContainer = document.getElementById('callup-selection-roster');
  if (!rosterContainer) return;
  rosterContainer.innerHTML = '';

  const teamPlayers = AppState.players.filter(p => p.teamId === event.teamId);

  if (teamPlayers.length === 0) {
    rosterContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No hay jugadores asignados a este equipo.</div>`;
    openModal(DOM.modalSquadCallup);
    return;
  }

  teamPlayers.forEach(player => {
    const existingCall = (event.callUp || []).find(c => c.playerId === player.id);
    const isSummoned = !!existingCall;
    const initialTransport = existingCall ? existingCall.transport : 'minibus';

    const item = document.createElement('div');
    item.className = 'summoned-item';
    item.style.padding = '0.6rem 0.85rem';

    item.innerHTML = `
      <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; flex: 1;">
        <input type="checkbox" class="callup-checkbox" data-player-id="${player.id}" ${isSummoned ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-blue);">
        <div>
          <strong style="color: #fff; font-size: 0.88rem;">#${player.mainDorsal || '-'} ${escapeHTML(player.nickname || player.name)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.5rem;">${player.mainPosition}</span>
        </div>
      </label>
      <div>
        <select class="custom-select callup-transport-select" data-player-id="${player.id}" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;">
          <option value="minibus" ${initialTransport === 'minibus' ? 'selected' : ''}>🚐 Minibús</option>
          <option value="car" ${initialTransport === 'car' ? 'selected' : ''}>🚗 Coche</option>
        </select>
      </div>
    `;

    rosterContainer.appendChild(item);
  });

  openModal(DOM.modalSquadCallup);
}

function saveSquadCallupModal() {
  const event = AppState.events.find(e => e.id === AppState.selectedEventId);
  if (!event) return;

  const checkboxes = document.querySelectorAll('.callup-checkbox');
  const newCallUp = [];

  checkboxes.forEach(cb => {
    if (cb.checked) {
      const pId = cb.getAttribute('data-player-id');
      const transportSelect = document.querySelector(`.callup-transport-select[data-player-id="${pId}"]`);
      const transport = transportSelect ? transportSelect.value : 'minibus';
      newCallUp.push({ playerId: pId, transport });
    }
  });

  event.callUp = newCallUp;
  StorageService.saveEvents(AppState.events);

  closeModal(DOM.modalSquadCallup);
  renderEventsList();
  renderConvocatoriaDetails();
  if (AppState.transportEventId === event.id) {
    renderTransportModule();
  }
  showToast(`Convocatoria actualizada (${newCallUp.length} jugadores)`, 'success');
}

/**
 * MODAL: Custom Team
 */
function initCustomTeamModal() {
  const btnAdd = document.getElementById('btn-add-custom-team');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openModal(DOM.modalCustomTeam));
  }

  const btnSave = document.getElementById('btn-save-custom-team');
  if (btnSave) {
    btnSave.addEventListener('click', saveCustomTeamForm);
  }
}

function saveCustomTeamForm() {
  const name = document.getElementById('new-team-name').value.trim();
  const category = document.getElementById('new-team-category').value.trim();
  const color = document.getElementById('new-team-color').value;
  const description = document.getElementById('new-team-desc').value.trim();

  if (!name) {
    showToast('Ingresa el nombre del nuevo equipo', 'error');
    return;
  }

  const newTeam = {
    id: `team_${Date.now()}`,
    name,
    shortName: name.split(' ')[0],
    category: category || 'Categoría Base',
    color: color || '#06b6d4',
    description
  };

  AppState.teams.push(newTeam);
  StorageService.saveTeams(AppState.teams);

  closeModal(DOM.modalCustomTeam);
  document.getElementById('form-custom-team').reset();

  renderCategoryPills();
  renderTeamsBoard();
  renderHeaderStats();
  showToast(`Nuevo equipo "${name}" añadido correctamente`, 'success');
}

/**
 * MODAL: Settings, Backups & Reset
 */
function initSettingsModal() {
  const btnOpen = document.getElementById('btn-open-settings');
  if (btnOpen) {
    btnOpen.addEventListener('click', () => openModal(DOM.modalSettings));
  }

  // Export
  const btnExport = document.getElementById('btn-export-backup');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = StorageService.exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JK_Noova_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Copia de seguridad descargada', 'success');
    });
  }

  // Import
  const fileImport = document.getElementById('file-import-input');
  if (fileImport) {
    fileImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = StorageService.importData(event.target.result);
        if (res.success) {
          loadDataFromStorage();
          renderCategoryPills();
          renderPlayers();
          renderTeamsBoard();
          renderEventsList();
          renderConvocatoriaDetails();
          renderTransportModule();
          renderHeaderStats();
          closeModal(DOM.modalSettings);
          showToast('Datos restaurados correctamente', 'success');
        } else {
          showToast('Error al importar archivo JSON', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset
  const btnReset = document.getElementById('btn-reset-demo-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('¿Restablecer todos los datos del club a los valores originales de fábrica? Se perderán los cambios no exportados.')) {
        StorageService.resetAllToDefault();
        loadDataFromStorage();
        renderCategoryPills();
        renderPlayers();
        renderTeamsBoard();
        renderEventsList();
        renderConvocatoriaDetails();
        renderTransportModule();
        renderHeaderStats();
        closeModal(DOM.modalSettings);
        showToast('Plantilla de demostración JK Noova restablecida', 'warning');
      }
    });
  }
}

/**
 * Modal Generic Helpers
 */
document.querySelectorAll('[data-close-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-close-modal');
    const modal = document.getElementById(modalId);
    if (modal) closeModal(modal);
  });
});

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

// Close on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  if (!DOM.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * General Utilities
 */
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
