/**
 * JK NOOVA - Lógica de Base de Datos de Jugadores
 * Adaptado a ortografía en español estándar, tarjeta interactiva,
 * colores de pie hábil diferenciados, alerta médica condicional y reasignación en 1 clic
 */

let playersList = [];
let teamsList = [];
let activeTeamFilter = 'all';
let currentSearch = '';
let currentPositionFilter = 'all';
let currentSort = 'dorsal-asc';
let currentMedicalFilter = false;
let currentKitFilter = false;
let currentDorsalFilter = false;
let tempCoachNotes = [];

document.addEventListener('DOMContentLoaded', () => {
  initSharedNavbar('database');
  loadData();
  initPlayerFilters();
  initPlayerModalLogic();
  renderCategoryPills();
  renderPlayersList();

  window.addEventListener('languageChanged', () => {
    renderCategoryPills();
    renderPlayersList();
    updateTopStats();
  });
});

function loadData() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  playersList = storage.getPlayers();
  teamsList = storage.getTeams();
  updateTopStats();
}

function updateTopStats() {
  const statTotal = document.getElementById('stat-total-count');
  const statTeams = document.getElementById('stat-teams-count');

  if (statTotal) statTotal.textContent = playersList.length;
  if (statTeams) statTeams.textContent = teamsList.length;
}

function initPlayerFilters() {
  const searchInput = document.getElementById('player-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderPlayersList();
    };
  }

  const posSelect = document.getElementById('filter-position-select');
  if (posSelect) {
    posSelect.onchange = (e) => {
      currentPositionFilter = e.target.value;
      renderPlayersList();
    };
  }

  const sortSelect = document.getElementById('sort-players-select');
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      currentSort = e.target.value;
      renderPlayersList();
    };
  }

  const medToggle = document.getElementById('toggle-medical-filter');
  if (medToggle) {
    medToggle.onclick = () => {
      currentMedicalFilter = !currentMedicalFilter;
      medToggle.classList.toggle('active', currentMedicalFilter);
      renderPlayersList();
    };
  }

  const kitToggle = document.getElementById('toggle-kit-filter');
  if (kitToggle) {
    kitToggle.onclick = () => {
      currentKitFilter = !currentKitFilter;
      kitToggle.classList.toggle('active', currentKitFilter);
      renderPlayersList();
    };
  }

  const dorsalToggle = document.getElementById('toggle-dorsal-filter');
  if (dorsalToggle) {
    dorsalToggle.onclick = () => {
      currentDorsalFilter = !currentDorsalFilter;
      dorsalToggle.classList.toggle('active', currentDorsalFilter);
      renderPlayersList();
    };
  }

  const btnNewPlayer = document.getElementById('btn-add-player-main');
  if (btnNewPlayer) {
    btnNewPlayer.onclick = () => openPlayerModal(null);
  }

  const btnQuickNew = document.getElementById('btn-quick-new-player');
  if (btnQuickNew) {
    btnQuickNew.onclick = () => openPlayerModal(null);
  }
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;
  container.innerHTML = '';

  // Píldora "Todos"
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `pill-btn ${activeTeamFilter === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `<span class="pill-dot" style="color: #fff;"></span> Todos (${playersList.length})`;
  allBtn.onclick = () => {
    activeTeamFilter = 'all';
    renderCategoryPills();
    renderPlayersList();
  };
  container.appendChild(allBtn);

  // Píldora por equipo
  teamsList.forEach(team => {
    const count = playersList.filter(p => p.teamId === team.id).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = activeTeamFilter === team.id;
    btn.className = `pill-btn ${isActive ? 'active' : ''}`;
    btn.style.setProperty('--pill-color', team.color);
    btn.style.setProperty('--pill-glow', `${team.color}40`);
    btn.innerHTML = `<span class="pill-dot" style="color: ${team.color};"></span> ${team.name} (${count})`;
    btn.onclick = () => {
      activeTeamFilter = team.id;
      renderCategoryPills();
      renderPlayersList();
    };
    container.appendChild(btn);
  });
}

function renderPlayersList() {
  const grid = document.getElementById('players-grid-container');
  if (!grid) return;
  grid.innerHTML = '';

  // Mapa global de dorsales por equipo para detectar conflictos
  const teamDorsalMap = {};
  playersList.forEach(p => {
    const d = parseInt(p.mainDorsal, 10);
    if (p.teamId && !isNaN(d) && d > 0) {
      const key = `${p.teamId}_${d}`;
      if (!teamDorsalMap[key]) teamDorsalMap[key] = [];
      teamDorsalMap[key].push(p);
    }
  });

  let filtered = [...playersList];

  // Filtro de categoría
  if (activeTeamFilter !== 'all') {
    filtered = filtered.filter(p => p.teamId === activeTeamFilter);
  }

  // Filtro de posición
  if (currentPositionFilter !== 'all') {
    filtered = filtered.filter(p => p.mainPosition === currentPositionFilter || p.secondaryPosition === currentPositionFilter);
  }

  // Filtro de alerta médica
  if (currentMedicalFilter) {
    filtered = filtered.filter(p => p.hasMedicalAlert === true && p.medicalNotes && p.medicalNotes.trim().length > 0);
  }

  // Filtro de falta de equipación oficial
  if (currentKitFilter) {
    filtered = filtered.filter(p => {
      const eq = (window.JKNoovaData && window.JKNoovaData.checkPlayerOfficialEquipment)
        ? window.JKNoovaData.checkPlayerOfficialEquipment(p)
        : { complete: true };
      return !eq.complete;
    });
  }

  // Filtro de conflicto de dorsales
  if (currentDorsalFilter) {
    filtered = filtered.filter(p => {
      const dNum = parseInt(p.mainDorsal, 10);
      if (!p.teamId || isNaN(dNum) || dNum <= 0) return false;
      const dKey = `${p.teamId}_${dNum}`;
      return teamDorsalMap[dKey] && teamDorsalMap[dKey].length > 1;
    });
  }

  // Búsqueda
  if (currentSearch) {
    const q = currentSearch;
    filtered = filtered.filter(p => {
      const matchName = `${p.name} ${p.lastName}`.toLowerCase().includes(q);
      const matchNick = (p.nickname || '').toLowerCase().includes(q);
      const matchDorsal = String(p.mainDorsal) === q || String(p.secondaryDorsal) === q;
      const matchTutor = (p.familyContacts && p.familyContacts.some(c => c.name && c.name.toLowerCase().includes(q))) ||
        (p.parentContact && p.parentContact.name && p.parentContact.name.toLowerCase().includes(q));
      return matchName || matchNick || matchDorsal || matchTutor;
    });
  }

  // Ordenación
  filtered.sort((a, b) => {
    if (currentSort === 'dorsal-asc') return (a.mainDorsal || 99) - (b.mainDorsal || 99);
    if (currentSort === 'name-asc') return (a.name + ' ' + a.lastName).localeCompare(b.name + ' ' + b.lastName);
    if (currentSort === 'age-desc') return new Date(a.birthDate) - new Date(b.birthDate);
    if (currentSort === 'age-asc') return new Date(b.birthDate) - new Date(a.birthDate);
    return 0;
  });

  // Aviso de conflicto de dorsales si se está filtrando por un equipo específico
  if (activeTeamFilter !== 'all') {
    const teamPlayers = playersList.filter(p => p.teamId === activeTeamFilter);
    const dorsalMap = {};
    teamPlayers.forEach(p => {
      const d = parseInt(p.mainDorsal, 10);
      if (!isNaN(d) && d > 0) {
        if (!dorsalMap[d]) dorsalMap[d] = [];
        dorsalMap[d].push(`${p.name} ${p.lastName}`);
      }
    });
    const conflictDorsals = Object.keys(dorsalMap).filter(d => dorsalMap[d].length > 1);
    if (conflictDorsals.length > 0) {
      const conflictDiv = document.createElement('div');
      conflictDiv.className = 'team-dorsal-conflict-banner';
      conflictDiv.style.gridColumn = '1 / -1';
      conflictDiv.style.background = 'rgba(239, 68, 68, 0.15)';
      conflictDiv.style.border = '1px solid rgba(239, 68, 68, 0.5)';
      conflictDiv.style.borderRadius = '8px';
      conflictDiv.style.padding = '0.75rem 1rem';
      conflictDiv.style.marginBottom = '0.5rem';
      conflictDiv.style.color = '#fca5a5';
      conflictDiv.style.fontSize = '0.85rem';
      conflictDiv.style.display = 'flex';
      conflictDiv.style.alignItems = 'center';
      conflictDiv.style.gap = '0.6rem';
      
      const t = window.t || ((k, def) => def);
      conflictDiv.innerHTML = `
        <span style="font-size: 1.2rem;">⚠️</span>
        <div>
          <strong style="color: #f87171;">${t('dorsal.conflictWarning', 'Aviso: Conflicto de dorsales en este equipo')}</strong>:
          ${conflictDorsals.map(d => `Dorsal #${d} asignado a <strong>${escapeHTML(dorsalMap[d].join(' y '))}</strong>`).join('. ')}
        </div>
      `;
      grid.appendChild(conflictDiv);
    }
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-subtle);">
        No se han encontrado jugadores con los filtros seleccionados.
      </div>
    `;
    return;
  }

  // Renderizar tarjetas de jugadores

  filtered.forEach(player => {
    const team = teamsList.find(t => t.id === player.teamId) || { name: 'Sin equipo', color: '#64748b' };
    const age = calculateAge(player.birthDate);
    const ageText = window.formatAgeWithMonths ? window.formatAgeWithMonths(player.birthDate) : `${age} años`;
    const showMedicalAlert = player.hasMedicalAlert === true && player.medicalNotes && player.medicalNotes.trim().length > 0;
    const latestNote = player.coachNotes && player.coachNotes.length > 0 ? player.coachNotes[player.coachNotes.length - 1].text : 'Sin observaciones registradas.';

    const eqStatus = (window.JKNoovaData && window.JKNoovaData.checkPlayerOfficialEquipment)
      ? window.JKNoovaData.checkPlayerOfficialEquipment(player)
      : { complete: false, missing: [] };
    const tFn = window.t || ((k, def) => def);
    const kitBadgeHtml = eqStatus.complete
      ? `<span class="equipment-badge-complete" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" title="${tFn('kit.statusComplete', 'Equipación oficial completa')}">${tFn('kit.badgeComplete', '🛡️ Equipación oficial')}</span>`
      : `<span class="equipment-badge-alert" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" title="${tFn('kit.alertMissingOfficial', 'Falta equipamiento oficial')}">${tFn('kit.badgeMissing', '⚠️ Falta equipación')}</span>`;

    // Conflicto de dorsales en el equipo del jugador
    const dNum = parseInt(player.mainDorsal, 10);
    const dKey = `${player.teamId}_${dNum}`;
    const conflictingPlayers = (player.teamId && !isNaN(dNum) && teamDorsalMap[dKey] && teamDorsalMap[dKey].length > 1)
      ? teamDorsalMap[dKey].filter(other => other.id !== player.id)
      : [];
    const hasDorsalConflict = conflictingPlayers.length > 0;
    const conflictNames = conflictingPlayers.map(cp => `${cp.name} ${cp.lastName}`).join(', ');
    const dorsalBadgeHtml = hasDorsalConflict
      ? `<span class="equipment-badge-alert tag-dorsal-conflict" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5;" title="${tFn('dorsal.conflictWith', 'Mismo dorsal que')}: ${escapeHTML(conflictNames)}">${tFn('dorsal.duplicateBadge', '⚠️ Mismo dorsal')} (#${player.mainDorsal})</span>`
      : '';

    let footClass = 'tag-foot-diestro';
    if (player.foot === 'Zurdo') footClass = 'tag-foot-zurdo';
    if (player.foot === 'Ambidiestro') footClass = 'tag-foot-ambidiestro';
    const footText = window.getFootLabel ? window.getFootLabel(player.foot) : (player.foot || 'Diestro');

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
            <img src="${avatarUrl}" alt="${player.name}" class="player-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
            <span class="player-dorsal-badge">#${player.mainDorsal || '-'}</span>
          </div>
          <div class="player-names">
            <div class="player-fullname">${escapeHTML(player.name)} ${escapeHTML(player.lastName)}</div>
            <div class="player-nickname">
              ${player.nickname ? `"${escapeHTML(player.nickname)}"` : ''}
              ${player.secondaryDorsal ? `<span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">(#${player.secondaryDorsal})</span>` : ''}
            </div>
            <span class="player-team-tag">${escapeHTML(team.name)} • ${ageText}</span>
          </div>
        </div>

        <div class="player-tags-row">
          <span class="tag-badge tag-pos-main">${player.mainPosition}</span>
          ${player.secondaryPosition ? `<span class="tag-badge">${player.secondaryPosition}</span>` : ''}
          <span class="tag-badge ${footClass}">${footText}</span>
          <span class="tag-badge">${formatDate(player.birthDate)}</span>
          ${kitBadgeHtml}
          ${dorsalBadgeHtml}
        </div>

        ${hasDorsalConflict ? `
          <div class="equipment-badge-alert" style="margin-top: 0.35rem; font-size: 0.72rem; padding: 0.35rem 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 0.4rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5;">
            <span>⚠️</span>
            <span>${tFn('dorsal.conflictWarning', 'Conflicto de dorsal')}: <strong>#${player.mainDorsal}</strong> ${tFn('dorsal.conflictWith', 'compartido con')} <strong>${escapeHTML(conflictNames)}</strong></span>
          </div>
        ` : ''}

        ${!eqStatus.complete ? `
          <div class="equipment-badge-alert" style="margin-top: 0.35rem; font-size: 0.72rem; padding: 0.35rem 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚠️</span>
            <span>${tFn('kit.badgeMissing', 'Falta equipación oficial')}: <strong>${eqStatus.missing.map(m => tFn('kit.' + m, m)).join(', ')}</strong></span>
          </div>
        ` : ''}

        ${player.firstTrainingDate ? `
          <div style="background: rgba(167, 139, 250, 0.08); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 6px; padding: 0.35rem 0.6rem; font-size: 0.73rem; color: #c4b5fd; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>⏱️</span>
            <span>Inició en el club: <strong>${escapeHTML(player.firstTrainingDate)}</strong></span>
          </div>
        ` : ''}

        ${showMedicalAlert ? `
          <div class="medical-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <strong>Alerta médica:</strong> ${escapeHTML(player.medicalNotes)}
            </div>
          </div>
        ` : ''}

        ${(() => {
          const contacts = (player.familyContacts && player.familyContacts.length > 0)
            ? player.familyContacts
            : (player.parentContact && player.parentContact.name ? [{ ...player.parentContact, relation: 'Tutor' }] : []);
          
          if (contacts.length === 0) return '';

          return `
            <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.2rem;">
              ${contacts.map(c => `
                <div class="contact-quick" style="margin-top: 0;">
                  <div>
                    <div class="contact-name">
                      👤 <span style="color: var(--accent-cyan); font-weight: 700;">[${escapeHTML(c.relation || 'Tutor')}]</span> ${escapeHTML(c.name || 'Sin nombre')}
                      ${c.isEmergency ? '<span style="font-size: 0.65rem; color: #f87171; margin-left: 0.25rem;">⚠️ Emergencias</span>' : ''}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${c.phone || 'Sin teléfono'}</div>
                  </div>
                  <div class="contact-links">
                    ${c.phone ? `
                      <a href="tel:${c.phone.replace(/\s+/g, '')}" class="contact-btn" title="Llamar">📞 Llamar</a>
                      <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="contact-btn" title="WhatsApp" style="color: #34d399;">💬 WhatsApp</a>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        })()}

        <div class="coach-notes-preview" title="${escapeHTML(latestNote)}">
          📝 "${escapeHTML(latestNote)}"
        </div>
      </div>

      <div class="player-card-footer">
        <div style="display: flex; gap: 0.4rem;">
          <button type="button" class="btn btn-secondary btn-sm btn-edit-p">
            ✏️ Editar
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-move-p">
            🔄 Equipo
          </button>
        </div>
        <button type="button" class="btn btn-danger btn-sm btn-del-p" title="Eliminar ficha">
          🗑️
        </button>
      </div>
    `;

    // REQUISITO ESTRICTO: Clic en cualquier parte de la tarjeta abre su ficha completa
    card.onclick = () => openPlayerModal(player.id);

    // Los botones de acción detienen la propagación para no abrir el modal doblemente
    card.querySelector('.btn-edit-p').onclick = (e) => {
      e.stopPropagation();
      openPlayerModal(player.id);
    };

    card.querySelector('.btn-move-p').onclick = (e) => {
      e.stopPropagation();
      openReassignTeamModal(player.id);
    };

    card.querySelector('.btn-del-p').onclick = (e) => {
      e.stopPropagation();
      deletePlayer(player.id);
    };

    const contactLinks = card.querySelectorAll('.contact-links a');
    contactLinks.forEach(link => {
      link.onclick = (e) => e.stopPropagation();
    });

    grid.appendChild(card);
  });
}

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
  if (footEl) footEl.textContent = window.getFootLabel ? window.getFootLabel(foot) : foot;
  const ageWithMonths = birthDate && window.formatAgeWithMonths ? window.formatAgeWithMonths(birthDate) : (birthDate ? `${age} años` : '--');
  if (ageEl) ageEl.textContent = ageWithMonths;
  if (ageDisplay) ageDisplay.textContent = birthDate ? `${ageWithMonths} (${formatDate(birthDate)})` : 'Indica la fecha de nacimiento';

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

  // Live input synchronization for hero profile card
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

  // Checkbox de alerta médica
  const medCheckbox = document.getElementById('player-has-medical-alert');
  const medWrap = document.getElementById('player-medical-notes-wrap');
  if (medCheckbox && medWrap) {
    medCheckbox.onchange = () => {
      medWrap.classList.toggle('show', medCheckbox.checked);
    };
  }

  // Botón quitar foto
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

  // Botón ajustar foto interactivo (No destructivo: zoom in / zoom out preserva toda la imagen original)
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

  // Subida de foto desde almacenamiento / móvil con ajuste y recorte previo
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

  // Botón para añadir más familiares / tutores
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
    
    // Foto (recortada + original intacta + ajustes para edición no destructiva)
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

    if (activeTeamFilter !== 'all') {
      document.getElementById('player-team').value = activeTeamFilter;
    }
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
  renderCategoryPills();
  renderPlayersList();
  updateTopStats();
}

// REQUISITO ESTRICTO: Reasignación de equipo sin prompt(), con modal y botón con color en 1 clic
function openReassignTeamModal(playerId) {
  const p = playersList.find(x => x.id === playerId);
  if (!p) return;

  const title = document.getElementById('modal-reassign-title');
  if (title) title.textContent = `Reasignar equipo: ${p.name} ${p.lastName}`;

  const container = document.getElementById('team-reassign-options');
  if (!container) return;
  container.innerHTML = '';

  teamsList.forEach(team => {
    const isCurrent = team.id === p.teamId;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'team-reassign-btn';
    btn.style.setProperty('--team-color', team.color);

    btn.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="team-reassign-dot" style="background: ${team.color};"></span>
        <span style="color: #fff; font-weight: 700;">${escapeHTML(team.name)}</span>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">(${escapeHTML(team.category || '')})</span>
      </div>
      <div>
        ${isCurrent ? `
          <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700;">Equipo actual</span>
        ` : `
          <span style="font-size: 0.8rem; color: var(--text-muted);">Asignar →</span>
        `}
      </div>
    `;

    btn.onclick = () => {
      p.teamId = team.id;
      window.JKNoovaData.StorageService.savePlayers(playersList);
      closeModal(document.getElementById('modal-reassign-team'));
      showToast(`${p.name} asignado a ${team.name}`, 'success');
      renderCategoryPills();
      renderPlayersList();
      updateTopStats();
    };

    container.appendChild(btn);
  });

  openModal(document.getElementById('modal-reassign-team'));
}

function deletePlayer(playerId) {
  const p = playersList.find(x => x.id === playerId);
  if (!p) return;

  if (confirm(`¿Eliminar la ficha de ${p.name} ${p.lastName}?`)) {
    playersList = playersList.filter(x => x.id !== playerId);
    window.JKNoovaData.StorageService.savePlayers(playersList);
    showToast('Ficha de jugador eliminada', 'warning');
    renderCategoryPills();
    renderPlayersList();
    updateTopStats();
  }
}
