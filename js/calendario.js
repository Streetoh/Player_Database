/**
 * JK NOOVA - Lógica de Calendario, Partidos y Convocatorias
 * Adaptado a gestión económica (precio de torneo y transporte con cálculo por jugador),
 * eliminación de partidos con confirmación y ortografía en español estándar
 */

let playersList = [];
let teamsList = [];
let eventsList = [];
let selectedEventId = null;

document.addEventListener('DOMContentLoaded', () => {
  initSharedNavbar('calendar');
  loadData();
  initCalendarModals();
  if (typeof initTacticalBoardLogic === 'function') {
    initTacticalBoardLogic();
  }
  renderEventsList();
  renderConvocatoriaPanel();
  initTrainingCalendarLogic();
  initAttendanceStatsLogic();
  if (typeof initAttendanceModal === 'function') {
    initAttendanceModal();
  }

  // Comprobar parámetro ?tab=trainings o ?tab=stats
  const urlParams = new URLSearchParams(window.location.search);
  const activeTabParam = urlParams.get('tab');
  if (activeTabParam === 'trainings' || activeTabParam === 'entrenamientos') {
    switchCalendarMainTab('trainings');
  } else if (activeTabParam === 'stats' || activeTabParam === 'asistencia' || activeTabParam === 'attendance') {
    switchCalendarMainTab('attendance-stats');
  } else {
    switchCalendarMainTab('matches');
  }

  window.addEventListener('languageChanged', () => {
    renderEventsList();
    renderConvocatoriaPanel();
    if (activeCalendarMainTab === 'trainings') renderTrainingSessions();
    if (activeCalendarMainTab === 'attendance-stats') renderAttendanceStats();
  });
});

function loadData() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  playersList = storage.getPlayers();
  teamsList = storage.getTeams();
  eventsList = storage.getEvents();

  // Comprobar parámetro URL ?event=...
  const urlParams = new URLSearchParams(window.location.search);
  const paramEvent = urlParams.get('event');
  if (paramEvent && eventsList.some(e => e.id === paramEvent)) {
    selectedEventId = paramEvent;
  } else if (eventsList.length > 0) {
    selectedEventId = eventsList[0].id;
  }
}

function renderEventsList() {
  const container = document.getElementById('events-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (eventsList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-subtle);">
        No hay partidos programados. Pulsa en "+ Programar partido".
      </div>
    `;
    return;
  }

  eventsList.forEach(event => {
    const team = teamsList.find(t => t.id === event.teamId) || { name: 'Equipo', color: '#3b82f6' };
    const isSelected = event.id === selectedEventId;
    const card = document.createElement('div');
    card.className = `event-card ${isSelected ? 'selected' : ''}`;

    const totalCallUp = event.callUp ? event.callUp.length : 0;
    const minibusCount = event.callUp ? event.callUp.filter(c => c.transport === 'minibus').length : 0;
    const carCount = event.callUp ? event.callUp.filter(c => c.transport === 'car').length : 0;

    const totalCost = (event.tournamentPrice || 0) + (event.transportPrice || 0);
    const pricePerPlayer = totalCallUp > 0 ? (totalCost / totalCallUp).toFixed(2) : '0.00';

    let badgeClass = 'badge-liga';
    if (event.eventType === 'Torneo') badgeClass = 'badge-torneo';
    if (event.eventType === 'Amistoso') badgeClass = 'badge-amistoso';

    card.innerHTML = `
      <div class="event-card-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="event-type-badge ${badgeClass}">${event.eventType || 'Liga'}</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: ${team.color};">${escapeHTML(team.name)}</span>
        </div>
        <button type="button" class="btn-card-delete-event" data-event-id="${event.id}" title="Eliminar este partido / torneo" style="background: none; border: none; font-size: 1rem; cursor: pointer; color: #f87171; padding: 2px 6px; border-radius: 4px; line-height: 1;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='none'">
          🗑️
        </button>
      </div>
      <div class="event-title">${escapeHTML(event.title || event.rival)}</div>
      <div class="event-meta-grid">
        <div class="event-meta-item">📅 ${formatDate(event.date)}</div>
        <div class="event-meta-item">⏰ ${event.time || '--:--'} h</div>
        <div class="event-meta-item">📍 ${event.isHome ? 'En casa' : 'Fuera'}</div>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.75rem; flex-wrap: wrap;">
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

    // Botón borrar directo en la tarjeta
    const delBtn = card.querySelector('.btn-card-delete-event');
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteEvent(event.id);
      };
    }

    card.onclick = () => {
      selectedEventId = event.id;
      renderEventsList();
      renderConvocatoriaPanel();
    };

    container.appendChild(card);
  });
}

function renderConvocatoriaPanel() {
  const container = document.getElementById('summoned-players-container');
  if (!container) return;
  container.innerHTML = '';

  const event = eventsList.find(e => e.id === selectedEventId);
  if (!event) {
    document.getElementById('detail-event-title').textContent = 'Selecciona un partido';
    document.getElementById('detail-event-subtitle').textContent = 'Elige un partido de la lista para ver su convocatoria filtrada';
    return;
  }

  const team = teamsList.find(t => t.id === event.teamId) || { name: 'Equipo', color: '#3b82f6' };

  document.getElementById('detail-event-title').textContent = event.title || `JK Noova vs ${event.rival}`;
  
  let subtitleText = `${team.name} • ${formatDate(event.date)} a las ${event.time || ''} • ${event.location || 'Campo'}`;
  if (event.eventType === 'Torneo' && event.tournamentSchedule) {
    subtitleText += ` • Partidos: ${event.tournamentSchedule}`;
  }
  document.getElementById('detail-event-subtitle').textContent = subtitleText;
  
  const badge = document.getElementById('detail-event-badge');
  if (badge) {
    badge.textContent = event.eventType;
    badge.className = `event-type-badge ${event.eventType === 'Torneo' ? 'badge-torneo' : event.eventType === 'Amistoso' ? 'badge-amistoso' : 'badge-liga'}`;
  }

  const callUp = event.callUp || [];
  const minibusCount = callUp.filter(c => c.transport === 'minibus').length;
  const carCount = callUp.filter(c => c.transport === 'car').length;
  const totalCallUp = callUp.length;

  // REQUISITO ESTRICTO: FÓRMULA DE CÁLCULO SOLICITADA POR EL USUARIO
  // 1. Inscripción al torneo: se divide entre TODOS los convocados
  // 2. Coste del transporte: se divide ÚNICAMENTE entre los que van en autobús
  // 3. Los que van en coche NO pagan nada de transporte (0 €)
  // 4. Se muestra desglose de lo que paga cada uno y debajo el total
  const tournamentPrice = event.tournamentPrice || 0;
  const transportPrice = event.transportPrice || 0;

  const priceTournamentPerPlayer = totalCallUp > 0 ? (tournamentPrice / totalCallUp) : 0;
  const priceTransportPerBus = minibusCount > 0 ? (transportPrice / minibusCount) : 0;

  const totalBusPlayer = priceTournamentPerPlayer + priceTransportPerBus;
  const totalCarPlayer = priceTournamentPerPlayer;

  // Actualizar DOM del resumen económico
  const elTourn = document.getElementById('detail-price-tournament');
  const elTournPerPlayer = document.getElementById('detail-price-tournament-per-player');
  const elTrans = document.getElementById('detail-price-transport');
  const elTransPerBus = document.getElementById('detail-price-transport-per-bus');
  const elSummoned = document.getElementById('detail-total-summoned');
  const elBreakdownCounts = document.getElementById('detail-total-breakdown-counts');
  const elPriceBus = document.getElementById('detail-price-per-player-bus');
  const elBusHint = document.getElementById('detail-bus-breakdown-hint');
  const elPriceCar = document.getElementById('detail-price-per-player-car');
  const elCarHint = document.getElementById('detail-car-breakdown-hint');

  if (elTourn) elTourn.textContent = `${tournamentPrice} €`;
  if (elTournPerPlayer) elTournPerPlayer.textContent = `${priceTournamentPerPlayer.toFixed(2).replace('.', ',')} € / convocado`;
  if (elTrans) elTrans.textContent = `${transportPrice} €`;
  if (elTransPerBus) elTransPerBus.textContent = `${priceTransportPerBus.toFixed(2).replace('.', ',')} € / plaza bus`;
  if (elSummoned) elSummoned.textContent = `${totalCallUp} jugadores`;
  if (elBreakdownCounts) elBreakdownCounts.textContent = `${minibusCount} en bus • ${carCount} en coche`;

  if (elPriceBus) elPriceBus.textContent = `${totalBusPlayer.toFixed(2).replace('.', ',')} €`;
  if (elBusHint) elBusHint.textContent = `Desglose: ${priceTournamentPerPlayer.toFixed(2).replace('.', ',')}€ torneo + ${priceTransportPerBus.toFixed(2).replace('.', ',')}€ transporte`;

  if (elPriceCar) elPriceCar.textContent = `${totalCarPlayer.toFixed(2).replace('.', ',')} €`;
  if (elCarHint) elCarHint.textContent = `Desglose: ${priceTournamentPerPlayer.toFixed(2).replace('.', ',')}€ torneo + 0,00€ transporte`;

  const chipMinibus = document.getElementById('chip-count-minibus');
  if (chipMinibus) {
    chipMinibus.innerHTML = `🚐 Furgoneta del club: <strong>${minibusCount} plazas</strong>`;
  }

  const chipCar = document.getElementById('chip-count-car');
  if (chipCar) {
    chipCar.innerHTML = `🚗 En coche particular: <strong>${carCount}</strong>`;
  }

  // Enlace a la pestaña transporte
  const btnJump = document.getElementById('btn-jump-to-transport');
  if (btnJump) {
    btnJump.onclick = () => {
      window.location.href = `transporte.html?event=${event.id}`;
    };
  }

  // Botón Pizarra táctica
  const btnTactical = document.getElementById('btn-tactical-board');
  if (btnTactical) {
    btnTactical.onclick = () => {
      if (typeof openTacticalModal === 'function') {
        openTacticalModal(event);
      } else {
        showToast('Abriendo pizarra táctica...', 'info');
      }
    };
  }

  // Botón Compartir con familias (QR)
  const btnShare = document.getElementById('btn-share-family');
  if (btnShare) {
    btnShare.onclick = () => {
      try {
        if (typeof openShareFamilyModal === 'function') {
          openShareFamilyModal(event);
        } else {
          const modal = document.getElementById('modal-share-family');
          if (modal) {
            if (typeof openModal === 'function') openModal(modal);
            else modal.classList.add('active');
          }
        }
      } catch (err) {
        console.error('Error al abrir modal de familias:', err);
        const modal = document.getElementById('modal-share-family');
        if (modal) {
          if (typeof openModal === 'function') openModal(modal);
          else modal.classList.add('active');
        }
      }
    };
  }

  // Botón Copiar resumen de caja a WhatsApp
  const btnCopyCashbox = document.getElementById('btn-copy-cashbox-summary');
  if (btnCopyCashbox) {
    btnCopyCashbox.onclick = () => copyCashboxSummary(event);
  }

  // Botón eliminar partido
  const btnDelete = document.getElementById('btn-delete-event');
  if (btnDelete) {
    btnDelete.onclick = () => deleteEvent(event.id);
  }

  // Inicializar acumuladores de caja
  let totalBudget = 0;
  let totalCollected = 0;
  let countPaid = 0;

  // Lista de jugadores convocados
  if (callUp.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: 8px;">
        No hay jugadores convocados para este partido. Pulsa en "Modificar convocatoria".
      </div>
    `;
    updateCashboxSummaryDOM(0, 0, 0, 0);
    return;
  }

  callUp.forEach(item => {
    const player = playersList.find(p => p.id === item.playerId);
    if (!player) return;

    const isBus = item.transport === 'minibus';
    const playerTotal = isBus ? totalBusPlayer : totalCarPlayer;
    totalBudget += playerTotal;

    const isPaid = item.paymentStatus === 'paid';
    if (isPaid) {
      totalCollected += playerTotal;
      countPaid++;
    }

    const currentMethod = item.paymentMethod || 'cash';
    const playerDesglose = isBus
      ? `${priceTournamentPerPlayer.toFixed(2).replace('.', ',')}€ torneo + ${priceTransportPerBus.toFixed(2).replace('.', ',')}€ bus`
      : `${priceTournamentPerPlayer.toFixed(2).replace('.', ',')}€ torneo + 0€ transporte`;

    // Asistencia mensual
    let attendanceTag = '';
    if (typeof getPlayerAttendanceStats === 'function') {
      const attStats = getPlayerAttendanceStats(player.id, 30);
      if (attStats.totalSessions > 0) {
        const attColor = attStats.percentage >= 80 ? '#34d399' : attStats.percentage >= 60 ? '#fbbf24' : '#f87171';
        attendanceTag = `<span style="font-size: 0.68rem; font-weight: 700; color: ${attColor}; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.35rem;" title="Asistencia a entrenamientos en los últimos 30 días">⚡ ${attStats.percentage}% asist.</span>`;
      }
    }

    const row = document.createElement('div');
    row.className = 'summoned-item';

    const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;
    const playerTeam = teamsList.find(t => t.id === player.teamId);

    row.innerHTML = `
      <div class="summoned-info">
        <img src="${avatarUrl}" alt="${player.name}" class="mini-avatar" style="border-radius: 50%; width: 44px; height: 44px; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
            #${player.mainDorsal || '-'} ${escapeHTML(player.name)} ${escapeHTML(player.lastName)}
            ${playerTeam ? `<span style="font-size: 0.68rem; color: ${playerTeam.color}; font-weight: 600; margin-left: 0.4rem; background: rgba(255,255,255,0.05); padding: 0.1rem 0.35rem; border-radius: 3px;">${escapeHTML(playerTeam.name)}</span>` : ''}
            ${attendanceTag}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
            ${player.nickname ? `"${escapeHTML(player.nickname)}" • ` : ''}<span style="color: var(--accent-cyan); font-weight: 700;">${player.mainPosition}</span>
          </div>
          <div style="font-size: 0.75rem; margin-top: 3px; font-weight: 700; color: ${isBus ? 'var(--accent-cyan)' : '#fbbf24'};">
            💶 Cuota a pagar: ${playerTotal.toFixed(2).replace('.', ',')} €
            <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 400; margin-left: 0.25rem;">(${playerDesglose})</span>
          </div>
        </div>
      </div>

      <div class="summoned-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.45rem;">
        <!-- Selector transporte -->
        <div class="summoned-transport-toggle">
          <button type="button" class="toggle-btn ${item.transport === 'minibus' ? 'active-minibus' : ''}" data-mode="minibus" title="Viaja en furgoneta del club">
            🚐 Furgoneta
          </button>
          <button type="button" class="toggle-btn ${item.transport === 'car' ? 'active-car' : ''}" data-mode="car" title="Viaja en coche particular">
            🚗 Coche
          </button>
        </div>

        <!-- Control de Pago interactivo -->
        <div style="display: flex; gap: 0.35rem; align-items: center;">
          <button type="button" class="payment-toggle-btn" data-pid="${player.id}" style="font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700; cursor: pointer; border: 1px solid; ${isPaid ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4);' : 'background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3);'}">
            ${isPaid ? '🟢 Pagado' : '🔴 Pendiente'}
          </button>
          ${isPaid ? `
            <select class="payment-method-select" data-pid="${player.id}" style="font-size: 0.72rem; background: var(--bg-primary); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.18rem 0.35rem; cursor: pointer;">
              <option value="cash" ${currentMethod === 'cash' ? 'selected' : ''}>💵 Efectivo</option>
              <option value="bizum" ${currentMethod === 'bizum' ? 'selected' : ''}>📱 Bizum</option>
              <option value="transfer" ${currentMethod === 'transfer' ? 'selected' : ''}>🏦 Transferencia</option>
            </select>
          ` : ''}
        </div>
      </div>
    `;

    // Conmutador transporte
    row.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.getAttribute('data-mode');
        item.transport = mode;
        window.JKNoovaData.StorageService.saveEvents(eventsList);
        renderEventsList();
        renderConvocatoriaPanel();
      };
    });

    // Conmutador de pago
    const btnPay = row.querySelector('.payment-toggle-btn');
    if (btnPay) {
      btnPay.onclick = () => {
        item.paymentStatus = item.paymentStatus === 'paid' ? 'pending' : 'paid';
        if (item.paymentStatus === 'paid' && !item.paymentMethod) {
          item.paymentMethod = 'cash';
        }
        window.JKNoovaData.StorageService.saveEvents(eventsList);
        renderConvocatoriaPanel();
      };
    }

    // Selector de método de pago
    const selMethod = row.querySelector('.payment-method-select');
    if (selMethod) {
      selMethod.onchange = (e) => {
        item.paymentMethod = e.target.value;
        window.JKNoovaData.StorageService.saveEvents(eventsList);
      };
    }

    container.appendChild(row);
  });

  updateCashboxSummaryDOM(totalBudget, totalCollected, countPaid, totalCallUp);
}

function updateCashboxSummaryDOM(budget, collected, countPaid, totalCallUp) {
  const pending = Math.max(0, budget - collected);
  const elBudget = document.getElementById('cashbox-total-budget');
  const elCollected = document.getElementById('cashbox-total-collected');
  const elPending = document.getElementById('cashbox-total-pending');
  const elBadge = document.getElementById('cashbox-paid-badge');

  if (elBudget) elBudget.textContent = `${budget.toFixed(2).replace('.', ',')} €`;
  if (elCollected) elCollected.textContent = `${collected.toFixed(2).replace('.', ',')} €`;
  if (elPending) elPending.textContent = `${pending.toFixed(2).replace('.', ',')} €`;
  if (elBadge) {
    elBadge.textContent = `${countPaid} / ${totalCallUp} pagados`;
    if (countPaid === totalCallUp && totalCallUp > 0) {
      elBadge.style.background = 'rgba(16, 185, 129, 0.25)';
      elBadge.style.color = '#34d399';
      elBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      elBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      elBadge.style.color = '#fbbf24';
      elBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    }
  }
}

function copyCashboxSummary(event) {
  if (!event) return;
  const team = teamsList.find(t => t.id === event.teamId) || { name: 'Equipo' };
  const callUp = event.callUp || [];
  const tournamentPrice = event.tournamentPrice || 0;
  const transportPrice = event.transportPrice || 0;
  const minibusCount = callUp.filter(c => c.transport === 'minibus').length;
  const totalCallUp = callUp.length;

  const priceTournamentPerPlayer = totalCallUp > 0 ? (tournamentPrice / totalCallUp) : 0;
  const priceTransportPerBus = minibusCount > 0 ? (transportPrice / minibusCount) : 0;
  const totalBusPlayer = priceTournamentPerPlayer + priceTransportPerBus;
  const totalCarPlayer = priceTournamentPerPlayer;

  let totalBudget = 0;
  let totalCollected = 0;
  const paidList = [];
  const pendingList = [];

  callUp.forEach(item => {
    const p = playersList.find(x => x.id === item.playerId);
    if (!p) return;
    const isBus = item.transport === 'minibus';
    const playerTotal = isBus ? totalBusPlayer : totalCarPlayer;
    totalBudget += playerTotal;

    const isPaid = item.paymentStatus === 'paid';
    const methodMap = { cash: '💵 Efectivo', bizum: '📱 Bizum', transfer: '🏦 Transferencia' };
    const methodStr = methodMap[item.paymentMethod || 'cash'] || '💵 Efectivo';

    if (isPaid) {
      totalCollected += playerTotal;
      paidList.push(`• ${p.name} ${p.lastName}: ${playerTotal.toFixed(2).replace('.', ',')} € (${methodStr})`);
    } else {
      pendingList.push(`• ${p.name} ${p.lastName}: ${playerTotal.toFixed(2).replace('.', ',')} € (${isBus ? 'Furgoneta' : 'Coche'})`);
    }
  });

  const totalPending = Math.max(0, totalBudget - totalCollected);

  let msg = `💰 *CONTROL DE CAJA - JK NOOVA ACADEMY*\n`;
  msg += `⚽ *${event.title || ('JK Noova vs ' + event.rival)}*\n`;
  msg += `🛡️ ${team.name} • 📅 ${formatDate(event.date)}\n\n`;
  msg += `📊 *ESTADO GENERAL:*\n`;
  msg += `• Presupuesto total: ${totalBudget.toFixed(2).replace('.', ',')} €\n`;
  msg += `• Total recaudado: ${totalCollected.toFixed(2).replace('.', ',')} € (🟢 ${paidList.length} pagados)\n`;
  msg += `• Pendiente de cobro: ${totalPending.toFixed(2).replace('.', ',')} € (🔴 ${pendingList.length} pendientes)\n\n`;

  if (pendingList.length > 0) {
    msg += `🔴 *PENDIENTES DE PAGO:*\n${pendingList.join('\n')}\n\n`;
  }
  if (paidList.length > 0) {
    msg += `🟢 *PAGADOS:*\n${paidList.join('\n')}\n`;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      showToast('Balance de caja copiado para WhatsApp', 'success');
    }).catch(() => {
      showToast('No se pudo copiar automáticamente', 'error');
    });
  } else {
    showToast('Balance listo para copiar', 'info');
  }
}

function handleEventTypeChange() {
  const type = document.getElementById('event-type')?.value;
  const rivalGroup = document.getElementById('group-event-rival');
  const tourGroup = document.getElementById('group-tournament-fields');
  const rivalInput = document.getElementById('event-rival');
  const titleInput = document.getElementById('event-title-custom');

  if (type === 'Torneo') {
    if (rivalGroup) rivalGroup.style.display = 'none';
    if (tourGroup) tourGroup.style.display = 'grid';
    if (rivalInput) rivalInput.required = false;
    if (titleInput && !titleInput.value) {
      titleInput.placeholder = 'Ej. Torneo Internacional Costa de la Luz';
    }
  } else {
    if (rivalGroup) rivalGroup.style.display = 'block';
    if (tourGroup) tourGroup.style.display = 'none';
    if (rivalInput) rivalInput.required = true;
    if (titleInput) {
      titleInput.placeholder = 'Ej. Jornada 18: CD La Salle vs JK Noova';
    }
  }
}

let tempModalCallUp = [];

function initCalendarModals() {
  const btnAdd = document.getElementById('btn-add-event');
  if (btnAdd) {
    btnAdd.onclick = () => openEventModal(null);
  }

  const btnSave = document.getElementById('btn-save-event');
  if (btnSave) {
    btnSave.onclick = saveEvent;
  }

  // REQUISITO ESTRICTO: Al hacer clic en "Modificar convocatoria", se abre la MISMA ventana que al crearla, permitiendo ajustar precios
  const btnEditCallup = document.getElementById('btn-edit-squad-callup');
  if (btnEditCallup) {
    btnEditCallup.onclick = () => openEventModal(selectedEventId);
  }

  // Cambio de tipo de evento (Torneo vs Partido)
  const eventTypeSelect = document.getElementById('event-type');
  if (eventTypeSelect) {
    eventTypeSelect.onchange = handleEventTypeChange;
  }

  // Cambio de equipo en el modal del partido: actualiza la lista de jugadores disponibles
  const eventTeamSelect = document.getElementById('event-team');
  if (eventTeamSelect) {
    eventTeamSelect.onchange = () => {
      const isNew = !document.getElementById('event-id-field').value;
      if (isNew) {
        const teamId = eventTeamSelect.value;
        const teamPlayers = playersList.filter(p => p.teamId === teamId);
        tempModalCallUp = teamPlayers.slice(0, 10).map((p, idx) => ({
          playerId: p.id,
          transport: idx < 8 ? 'minibus' : 'car'
        }));
      }
      renderModalCallUpRoster();
      updateModalPriceCalculation();
    };
  }

  // Filtro de convocatoria dentro del modal (Segmented Pills)
  let activeModalCallUpFilter = 'team';
  const btnFilterTeam = document.getElementById('filter-btn-team');
  const btnFilterAll = document.getElementById('filter-btn-all');
  if (btnFilterTeam && btnFilterAll) {
    btnFilterTeam.onclick = () => {
      activeModalCallUpFilter = 'team';
      btnFilterTeam.style.background = 'var(--accent-blue)';
      btnFilterTeam.style.color = '#fff';
      btnFilterTeam.style.fontWeight = '700';
      btnFilterAll.style.background = 'transparent';
      btnFilterAll.style.color = 'var(--text-secondary)';
      btnFilterAll.style.fontWeight = '600';
      renderModalCallUpRoster('team');
    };
    btnFilterAll.onclick = () => {
      activeModalCallUpFilter = 'all';
      btnFilterAll.style.background = 'var(--accent-blue)';
      btnFilterAll.style.color = '#fff';
      btnFilterAll.style.fontWeight = '700';
      btnFilterTeam.style.background = 'transparent';
      btnFilterTeam.style.color = 'var(--text-secondary)';
      btnFilterTeam.style.fontWeight = '600';
      renderModalCallUpRoster('all');
    };
  }

  // Desplegar / contraer todos los grupos
  const btnToggleAll = document.getElementById('btn-modal-toggle-all-groups');
  let groupsAllExpanded = false;
  if (btnToggleAll) {
    btnToggleAll.onclick = () => {
      groupsAllExpanded = !groupsAllExpanded;
      document.querySelectorAll('.callup-group-card-pro').forEach(c => {
        c.classList.toggle('is-open', groupsAllExpanded);
      });
    };
  }

  // Marcar todos los jugadores visibles
  const btnSelectAll = document.getElementById('btn-modal-select-all');
  if (btnSelectAll) {
    btnSelectAll.onclick = () => {
      const rows = document.querySelectorAll('.callup-player-row');
      rows.forEach(row => {
        const pId = row.getAttribute('data-player-id');
        if (!pId) return;
        row.classList.add('is-summoned');
        const cb = row.querySelector('.callup-custom-checkbox');
        if (cb) cb.textContent = '✓';
        const existing = tempModalCallUp.find(c => c.playerId === pId);
        if (!existing) {
          tempModalCallUp.push({ playerId: pId, transport: 'minibus' });
        }
      });
      updateModalPriceCalculation();
    };
  }

  // Desmarcar todos los jugadores visibles
  const btnUnselectAll = document.getElementById('btn-modal-unselect-all');
  if (btnUnselectAll) {
    btnUnselectAll.onclick = () => {
      const rows = document.querySelectorAll('.callup-player-row');
      rows.forEach(row => {
        const pId = row.getAttribute('data-player-id');
        if (!pId) return;
        row.classList.remove('is-summoned');
        const cb = row.querySelector('.callup-custom-checkbox');
        if (cb) cb.textContent = '';
        tempModalCallUp = tempModalCallUp.filter(c => c.playerId !== pId);
      });
      updateModalPriceCalculation();
    };
  }

  // Escuchadores de precio para auto-cálculo en el modal
  const inputTourn = document.getElementById('event-price-tournament');
  const inputTrans = document.getElementById('event-price-transport');
  if (inputTourn) inputTourn.oninput = updateModalPriceCalculation;
  if (inputTrans) inputTrans.oninput = updateModalPriceCalculation;
}

function updateModalPriceCalculation() {
  const tourn = parseFloat(document.getElementById('event-price-tournament')?.value) || 0;
  const trans = parseFloat(document.getElementById('event-price-transport')?.value) || 0;

  const callUpCount = tempModalCallUp.length;
  const busCount = tempModalCallUp.filter(c => c.transport === 'minibus').length;
  const carCount = tempModalCallUp.filter(c => c.transport === 'car').length;

  // 1. Inscripción al torneo: se divide entre TODOS los convocados
  // 2. Coste del transporte: se divide ÚNICAMENTE entre los que van en autobús
  // 3. Los de coche pagan 0€ de transporte
  const tournPerPlayer = callUpCount > 0 ? (tourn / callUpCount) : 0;
  const transPerBus = busCount > 0 ? (trans / (busCount || 1)) : 0;
  const busTotal = tournPerPlayer + transPerBus;
  const carTotal = tournPerPlayer;

  const display = document.getElementById('modal-price-per-player-display');
  const hint = document.getElementById('modal-price-hint');
  const countBadge = document.getElementById('modal-event-callup-count');

  if (display) {
    display.textContent = `Bus: ${busTotal.toFixed(2).replace('.', ',')} € | Coche: ${carTotal.toFixed(2).replace('.', ',')} €`;
  }
  if (hint) {
    hint.textContent = `${callUpCount} convocados (${busCount} en bus, ${carCount} en coche) • Torneo: ${tournPerPlayer.toFixed(2).replace('.', ',')}€/jug • Bus: +${transPerBus.toFixed(2).replace('.', ',')}€`;
  }
  if (countBadge) {
    countBadge.textContent = `${callUpCount} convocados (${busCount} bus • ${carCount} coche)`;
    countBadge.classList.toggle('has-players', callUpCount > 0);
  }

  // Actualizar contadores de cada grupo en el acordeón
  teamsList.forEach(t => {
    const badge = document.getElementById(`counter-team-${t.id}`);
    const cardGroup = document.querySelector(`.callup-group-card-pro[data-team-id="${t.id}"]`);
    if (badge) {
      const teamPlayers = playersList.filter(p => p.teamId === t.id);
      const cnt = teamPlayers.filter(p => tempModalCallUp.some(c => c.playerId === p.id)).length;
      badge.textContent = `${cnt} / ${teamPlayers.length} convocados`;
      badge.classList.toggle('has-players', cnt > 0);
      if (cardGroup) {
        cardGroup.classList.toggle('has-summoned', cnt > 0);
      }
    }
  });
}

function renderModalCallUpRoster(filterMode = 'team') {
  const container = document.getElementById('modal-event-callup-roster');
  if (!container) return;
  container.innerHTML = '';

  const activeTeamId = document.getElementById('event-team')?.value || teamsList[0]?.id;

  // Equipos a mostrar según filtro
  const teamsToShow = filterMode === 'all' 
    ? [...teamsList] 
    : teamsList.filter(t => t.id === activeTeamId || tempModalCallUp.some(c => {
        const p = playersList.find(pl => pl.id === c.playerId);
        return p && p.teamId === t.id;
      }));

  if (teamsToShow.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 1.5rem;">No hay equipos disponibles.</div>`;
    return;
  }

  teamsToShow.forEach(team => {
    const teamPlayers = playersList.filter(p => p.teamId === team.id);
    if (teamPlayers.length === 0) return;

    // Conteo de convocados de este equipo
    const getTeamSummonedCount = () => teamPlayers.filter(p => tempModalCallUp.some(c => c.playerId === p.id)).length;
    const initialCount = getTeamSummonedCount();

    const isPrimaryTeam = team.id === activeTeamId;
    const shouldOpen = isPrimaryTeam || initialCount > 0;

    const group = document.createElement('div');
    group.className = `callup-group-card-pro ${shouldOpen ? 'is-open' : ''} ${initialCount > 0 ? 'has-summoned' : ''}`;
    group.setAttribute('data-team-id', team.id);

    group.innerHTML = `
      <div class="callup-group-header-pro">
        <div class="callup-group-title-pro">
          <span class="callup-chevron-icon">▶</span>
          <div class="callup-team-pill">
            <span class="callup-team-dot" style="background: ${team.color || '#3b82f6'}; box-shadow: 0 0 8px ${team.color || '#3b82f6'};"></span>
            <span>${escapeHTML(team.name)}</span>
          </div>
          <span class="callup-category-badge">${escapeHTML(team.category || 'Categoría')}</span>
          <span class="callup-counter-pill ${initialCount > 0 ? 'has-players' : ''}" id="counter-team-${team.id}">
            ${initialCount} / ${teamPlayers.length} convocados
          </span>
        </div>
        <div class="callup-group-actions-pro">
          <button type="button" class="callup-micro-btn btn-all btn-team-all" title="Convocar a toda la plantilla de este equipo">
            ➕ Todos
          </button>
          <button type="button" class="callup-micro-btn btn-none btn-team-none" title="Desconvocar a todos de este equipo">
            ➖ Ninguno
          </button>
        </div>
      </div>
      <div class="callup-group-content-pro"></div>
    `;

    const header = group.querySelector('.callup-group-header-pro');
    const content = group.querySelector('.callup-group-content-pro');
    const btnAll = group.querySelector('.btn-team-all');
    const btnNone = group.querySelector('.btn-team-none');
    const counterBadge = group.querySelector(`#counter-team-${team.id}`);

    // Click en la cabecera abre/cierra el acordeón
    header.onclick = (e) => {
      if (e.target.closest('.callup-group-actions-pro')) return;
      group.classList.toggle('is-open');
    };

    const updateGroupBadge = () => {
      const cnt = getTeamSummonedCount();
      if (counterBadge) {
        counterBadge.textContent = `${cnt} / ${teamPlayers.length} convocados`;
        counterBadge.classList.toggle('has-players', cnt > 0);
      }
      group.classList.toggle('has-summoned', cnt > 0);
    };

    // Botones rápidos por grupo
    btnAll.onclick = (e) => {
      e.stopPropagation();
      teamPlayers.forEach(p => {
        if (!tempModalCallUp.some(c => c.playerId === p.id)) {
          tempModalCallUp.push({ playerId: p.id, transport: 'minibus' });
        }
      });
      content.querySelectorAll('.callup-player-row').forEach(row => {
        row.classList.add('is-summoned');
        const cb = row.querySelector('.callup-custom-checkbox');
        if (cb) cb.textContent = '✓';
      });
      updateGroupBadge();
      updateModalPriceCalculation();
    };

    btnNone.onclick = (e) => {
      e.stopPropagation();
      const pIds = new Set(teamPlayers.map(p => p.id));
      tempModalCallUp = tempModalCallUp.filter(c => !pIds.has(c.playerId));
      content.querySelectorAll('.callup-player-row').forEach(row => {
        row.classList.remove('is-summoned');
        const cb = row.querySelector('.callup-custom-checkbox');
        if (cb) cb.textContent = '';
      });
      updateGroupBadge();
      updateModalPriceCalculation();
    };

    // Renderizar tarjetas elegantes de jugadores dentro del grupo
    teamPlayers.forEach(player => {
      const callItem = tempModalCallUp.find(c => c.playerId === player.id);
      const isSummoned = !!callItem;
      const initialTransport = callItem ? callItem.transport : 'minibus';

      const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;

      const card = document.createElement('div');
      card.className = `callup-player-row ${isSummoned ? 'is-summoned' : ''}`;
      card.setAttribute('data-player-id', player.id);

      card.innerHTML = `
        <div class="callup-player-info-wrap">
          <div class="callup-custom-checkbox">${isSummoned ? '✓' : ''}</div>
          <img src="${avatarUrl}" alt="${player.name}" class="callup-player-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
          <div class="callup-player-texts">
            <span class="callup-dorsal-pill">#${player.mainDorsal || '-'}</span>
            <span class="callup-player-name">${escapeHTML(player.name)} ${escapeHTML(player.lastName)}</span>
            ${player.nickname ? `<span class="callup-player-nick">("${escapeHTML(player.nickname)}")</span>` : ''}
            <span class="callup-pos-tag">${player.mainPosition || 'JUG'}</span>
          </div>
        </div>
        <div class="transport-segmented-pill">
          <button type="button" class="transport-segment-btn btn-segment-minibus ${initialTransport === 'minibus' ? 'active-minibus' : ''}" title="Desplazamiento en furgoneta o autobús del club">
            🚐 Bus
          </button>
          <button type="button" class="transport-segment-btn btn-segment-car ${initialTransport === 'car' ? 'active-car' : ''}" title="Desplazamiento en coche particular con familia">
            🚗 Coche
          </button>
        </div>
      `;

      const infoWrap = card.querySelector('.callup-player-info-wrap');
      const cb = card.querySelector('.callup-custom-checkbox');
      const btnBus = card.querySelector('.btn-segment-minibus');
      const btnCar = card.querySelector('.btn-segment-car');

      const toggleSummoned = (forceState = null) => {
        const idx = tempModalCallUp.findIndex(c => c.playerId === player.id);
        const shouldBeSummoned = forceState !== null ? forceState : (idx === -1);

        if (shouldBeSummoned) {
          if (idx === -1) {
            const currentSelectedTransport = btnCar.classList.contains('active-car') ? 'car' : 'minibus';
            tempModalCallUp.push({ playerId: player.id, transport: currentSelectedTransport });
          }
          card.classList.add('is-summoned');
          cb.textContent = '✓';
        } else {
          if (idx >= 0) {
            tempModalCallUp.splice(idx, 1);
          }
          card.classList.remove('is-summoned');
          cb.textContent = '';
        }
        updateGroupBadge();
        updateModalPriceCalculation();
      };

      // Click en la info del jugador alterna convocado/no convocado
      infoWrap.onclick = () => toggleSummoned();

      // Botón Bus
      btnBus.onclick = (e) => {
        e.stopPropagation();
        btnBus.classList.add('active-minibus');
        btnCar.classList.remove('active-car');
        const idx = tempModalCallUp.findIndex(c => c.playerId === player.id);
        if (idx >= 0) {
          tempModalCallUp[idx].transport = 'minibus';
        } else {
          toggleSummoned(true);
        }
        updateModalPriceCalculation();
      };

      // Botón Coche
      btnCar.onclick = (e) => {
        e.stopPropagation();
        btnCar.classList.add('active-car');
        btnBus.classList.remove('active-minibus');
        const idx = tempModalCallUp.findIndex(c => c.playerId === player.id);
        if (idx >= 0) {
          tempModalCallUp[idx].transport = 'car';
        } else {
          toggleSummoned(true);
        }
        updateModalPriceCalculation();
      };

      content.appendChild(card);
    });

    container.appendChild(group);
  });
}

// REQUISITO ESTRICTO: Unifica la ventana de creación y modificación de convocatorias permitiendo ajustar el precio
function openEventModal(eventId = null) {
  const teamSelect = document.getElementById('event-team');
  if (teamSelect) {
    teamSelect.innerHTML = '';
    teamsList.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      teamSelect.appendChild(opt);
    });
  }

  const modalTitle = document.getElementById('modal-event-title');
  const btnSave = document.getElementById('btn-save-event');

  if (eventId) {
    const ev = eventsList.find(e => e.id === eventId);
    if (!ev) return;

    if (modalTitle) modalTitle.textContent = `✏️ Modificar encuentro y convocatoria: ${ev.title || ev.rival}`;
    if (btnSave) btnSave.textContent = 'Guardar cambios y convocatoria';

    document.getElementById('event-id-field').value = ev.id;
    if (teamSelect) teamSelect.value = ev.teamId || teamsList[0].id;
    document.getElementById('event-type').value = ev.eventType || 'Liga';
    document.getElementById('event-rival').value = ev.rival || '';
    document.getElementById('event-title-custom').value = ev.title || '';
    if (document.getElementById('event-tournament-teams')) {
      document.getElementById('event-tournament-teams').value = ev.tournamentTeams || '';
    }
    if (document.getElementById('event-tournament-schedule')) {
      document.getElementById('event-tournament-schedule').value = ev.tournamentSchedule || '';
    }
    document.getElementById('event-date').value = ev.date || '';
    document.getElementById('event-time').value = ev.time || '10:00';
    document.getElementById('event-ishome').value = ev.isHome ? 'true' : 'false';
    document.getElementById('event-price-tournament').value = ev.tournamentPrice || 0;
    document.getElementById('event-price-transport').value = ev.transportPrice || 0;
    document.getElementById('event-location').value = ev.location || '';
    document.getElementById('event-meeting').value = ev.meetingPoint || '';
    document.getElementById('event-notes').value = ev.notes || '';

    tempModalCallUp = ev.callUp ? JSON.parse(JSON.stringify(ev.callUp)) : [];
  } else {
    if (modalTitle) modalTitle.textContent = 'Programar partido / competición';
    if (btnSave) btnSave.textContent = 'Guardar partido y convocatoria';

    document.getElementById('event-id-field').value = '';
    document.getElementById('event-type').value = 'Liga';
    document.getElementById('event-rival').value = '';
    document.getElementById('event-title-custom').value = '';
    if (document.getElementById('event-tournament-teams')) document.getElementById('event-tournament-teams').value = '';
    if (document.getElementById('event-tournament-schedule')) document.getElementById('event-tournament-schedule').value = '';
    document.getElementById('event-date').value = formatLocalDateToISO(new Date());
    document.getElementById('event-time').value = '10:00';
    document.getElementById('event-ishome').value = 'false';
    document.getElementById('event-price-tournament').value = 0;
    document.getElementById('event-price-transport').value = 0;
    document.getElementById('event-location').value = 'Sede JK Noova';
    document.getElementById('event-meeting').value = 'Punto de encuentro: 1 h antes';
    document.getElementById('event-notes').value = '';

    const firstTeamId = teamsList[0]?.id;
    const teamPlayers = playersList.filter(p => p.teamId === firstTeamId);
    tempModalCallUp = teamPlayers.slice(0, 10).map((p, idx) => ({
      playerId: p.id,
      transport: idx < 8 ? 'minibus' : 'car'
    }));
  }

  handleEventTypeChange();
  renderModalCallUpRoster();
  updateModalPriceCalculation();
  openModal(document.getElementById('modal-event'));
}

function saveEvent() {
  const existingId = document.getElementById('event-id-field').value;
  const teamId = document.getElementById('event-team').value;
  const eventType = document.getElementById('event-type').value;
  let rival = document.getElementById('event-rival')?.value.trim() || '';
  const title = document.getElementById('event-title-custom').value.trim();
  const tournamentTeams = document.getElementById('event-tournament-teams')?.value.trim() || '';
  const tournamentSchedule = document.getElementById('event-tournament-schedule')?.value.trim() || '';
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const isHome = document.getElementById('event-ishome').value === 'true';
  const tournamentPrice = parseFloat(document.getElementById('event-price-tournament').value) || 0;
  const transportPrice = parseFloat(document.getElementById('event-price-transport').value) || 0;
  const location = document.getElementById('event-location').value.trim();
  const meetingPoint = document.getElementById('event-meeting').value.trim();
  const notes = document.getElementById('event-notes').value.trim();

  if (eventType === 'Torneo') {
    if (!title || !date || !time) {
      showToast('Por favor, completa el título del torneo, fecha y hora', 'error');
      return;
    }
    if (!rival) {
      rival = tournamentTeams ? `Torneo: ${tournamentTeams.substring(0, 35)}` : 'Torneo multiequipo';
    }
  } else {
    if (!rival || !title || !date || !time) {
      showToast('Por favor, completa rival, título, fecha y hora', 'error');
      return;
    }
  }

  if (existingId) {
    const ev = eventsList.find(e => e.id === existingId);
    if (ev) {
      ev.teamId = teamId;
      ev.eventType = eventType;
      ev.rival = rival;
      ev.title = title;
      ev.tournamentTeams = tournamentTeams;
      ev.tournamentSchedule = tournamentSchedule;
      ev.date = date;
      ev.time = time;
      ev.isHome = isHome;
      ev.tournamentPrice = tournamentPrice;
      ev.transportPrice = transportPrice;
      ev.location = location;
      ev.meetingPoint = meetingPoint;
      ev.notes = notes;
      ev.callUp = tempModalCallUp;
      showToast(`Encuentro "${title}" y precios actualizados`, 'success');
    }
  } else {
    const newEvent = {
      id: `ev_${Date.now()}`,
      teamId,
      eventType,
      rival,
      title,
      tournamentTeams,
      tournamentSchedule,
      date,
      time,
      isHome,
      tournamentPrice,
      transportPrice,
      vanId: 'van_1',
      location,
      meetingPoint,
      notes,
      callUp: tempModalCallUp
    };
    eventsList.unshift(newEvent);
    selectedEventId = newEvent.id;
    showToast(`Encuentro "${title}" programado con éxito`, 'success');
  }

  window.JKNoovaData.StorageService.saveEvents(eventsList);
  closeModal(document.getElementById('modal-event'));
  renderEventsList();
  renderConvocatoriaPanel();
  initSharedNavbar('calendar');
}

function deleteEvent(eventId) {
  const ev = eventsList.find(e => e.id === eventId);
  if (!ev) return;

  if (confirm(`¿Eliminar definitivamente el encuentro "${ev.title || ev.rival}" y su convocatoria?`)) {
    eventsList = eventsList.filter(e => e.id !== eventId);
    window.JKNoovaData.StorageService.saveEvents(eventsList);

    if (eventsList.length > 0) {
      selectedEventId = eventsList[0].id;
    } else {
      selectedEventId = null;
    }

    renderEventsList();
    renderConvocatoriaPanel();
    initSharedNavbar('calendar');
    showToast('Encuentro eliminado correctamente', 'warning');
  }
}

let shareQrInstance = null;

function buildCompactMatchPayload(event) {
  if (!event) return null;
  const storage = (window.JKNoovaData && window.JKNoovaData.StorageService) || null;
  const team = (teamsList && teamsList.find(t => t.id === event.teamId)) ||
               (storage && storage.getTeams && storage.getTeams().find(t => t.id === event.teamId)) ||
               { name: 'Equipo', category: '' };
  const allTransport = (storage && storage.getTransport && storage.getTransport()) || {};
  const evTransport = allTransport[event.id] || {};
  const allVans = (storage && storage.getVans && storage.getVans()) || [];
  const van = allVans.find(v => v.id === evTransport.vanId) || (allVans.length > 0 ? allVans[0] : null);
  const allPlayers = (storage && storage.getPlayers && storage.getPlayers()) || playersList || [];

  const seatMap = evTransport.seats || {};

  // Convocatoria compacta: [dorsal, nombre_completo, esMinibus (1/0), pagado (1/0), plazaAsiento]
  const compactCall = (event.callUp || []).map(item => {
    const p = allPlayers.find(x => x.id === item.playerId);
    const dorsal = (p && p.mainDorsal) ? String(p.mainDorsal) : '';
    const fullName = p ? `${p.name} ${p.lastName || ''}`.trim() : (item.name || 'Jugador');
    const isBus = item.transport === 'minibus' ? 1 : 0;
    const isPaid = item.paymentStatus === 'paid' ? 1 : 0;

    let seatNumber = '';
    for (const [sKey, pId] of Object.entries(seatMap)) {
      if (pId === item.playerId) {
        seatNumber = sKey.replace('seat_', '');
        break;
      }
    }

    return [dorsal, fullName, isBus, isPaid, seatNumber];
  });

  const payload = {
    i: event.id || '',
    t: event.title || `JK Noova vs ${event.rival || 'Rival'}`,
    m: `${team.name || 'Equipo'}${team.category ? ' • ' + team.category : ''}`,
    d: event.date || '',
    h: event.time || '',
    l: event.location || '',
    tp: Number(event.tournamentPrice) || 0,
    rp: Number(event.transportPrice) || 0,
    v: van ? [van.name || '', van.plate || '', evTransport.departureTime || '', evTransport.driver || ''] : [],
    c: compactCall
  };

  try {
    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p));
    return btoa(utf8Bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Error generando payload de partido:', err);
    return null;
  }
}

function getPublicShareBaseUrl() {
  const savedUrl = localStorage.getItem('jknoova_custom_public_url');
  if (savedUrl && savedUrl.trim().length > 4) {
    let clean = savedUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    if (!clean.endsWith('/')) clean += '/';
    return clean;
  }

  const isFile = window.location.protocol === 'file:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isFile && !isLocalhost && window.location.origin) {
    const pathname = window.location.pathname;
    const basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return `${window.location.origin}${basePath}`;
  }

  return 'https://streetoh.github.io/Player_Database/';
}

function openShareFamilyModal(event) {
  if (!event) return;
  const modal = document.getElementById('modal-share-family');
  if (!modal) return;

  const team = teamsList.find(t => t.id === event.teamId) || { name: 'Equipo' };
  const labelEl = document.getElementById('share-qr-match-label');
  if (labelEl) {
    labelEl.textContent = `${event.title || ('JK Noova vs ' + event.rival)} (${team.name})`;
  }

  const isFile = window.location.protocol === 'file:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isAppOffline = isFile || isLocalhost;

  const baseUrl = getPublicShareBaseUrl();
  const hasUrl = !!baseUrl;

  // Manejo de tarjetas de configuración de URL
  const alertBox = document.getElementById('share-url-alert-box');
  const activeBox = document.getElementById('share-url-active-box');
  const activeText = document.getElementById('share-active-url-text');
  const inputTop = document.getElementById('share-custom-base-url-top');
  const btnSaveTop = document.getElementById('btn-save-custom-base-url-top');
  const btnEditActive = document.getElementById('btn-edit-active-url');
  const configInputs = document.getElementById('share-url-config-inputs');
  const customUrlInput = document.getElementById('share-custom-base-url');
  const btnSaveCustomUrl = document.getElementById('btn-save-custom-base-url');

  if (isAppOffline && !hasUrl) {
    if (alertBox) alertBox.style.display = 'block';
    if (activeBox) activeBox.style.display = 'none';
  } else if (hasUrl) {
    if (alertBox) alertBox.style.display = 'none';
    if (activeBox) {
      activeBox.style.display = 'block';
      if (activeText) activeText.textContent = baseUrl;
    }
  } else {
    if (alertBox) alertBox.style.display = 'none';
    if (activeBox) activeBox.style.display = 'none';
  }

  function handleSaveUrl(val) {
    let clean = (val || '').trim();
    if (clean) {
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      if (!clean.endsWith('/')) clean += '/';
      localStorage.setItem('jknoova_custom_public_url', clean);
      showToast('Dirección web guardada. ¡Código QR y WhatsApp listos!', 'success');
    } else {
      localStorage.removeItem('jknoova_custom_public_url');
      showToast('Dirección web restablecida', 'info');
    }
    if (configInputs) configInputs.style.display = 'none';
    openShareFamilyModal(event);
  }

  if (btnSaveTop && inputTop) {
    btnSaveTop.onclick = () => handleSaveUrl(inputTop.value);
  }

  if (btnEditActive) {
    btnEditActive.onclick = () => {
      if (configInputs) {
        configInputs.style.display = configInputs.style.display === 'none' ? 'block' : 'none';
        if (customUrlInput) customUrlInput.value = localStorage.getItem('jknoova_custom_public_url') || '';
      }
    };
  }

  if (btnSaveCustomUrl && customUrlInput) {
    btnSaveCustomUrl.onclick = () => handleSaveUrl(customUrlInput.value);
  }

  // Construir payload autónomo
  let payloadData = null;
  try {
    payloadData = buildCompactMatchPayload(event);
  } catch (err) {
    console.warn('No se pudo empaquetar payload del partido:', err);
  }
  const effectiveBase = hasUrl ? baseUrl : 'https://streetoh.github.io/Player_Database/';
  const shareUrl = `${effectiveBase}partido.html?event=${event.id}${payloadData ? '&d=' + payloadData : ''}`;

  const inputUrl = document.getElementById('share-direct-url-input');
  if (inputUrl) {
    inputUrl.value = shareUrl;
  }

  const hintEl = document.getElementById('share-url-origin-hint');
  if (hintEl) {
    if (hasUrl) {
      hintEl.textContent = '🟢 Web en línea';
      hintEl.style.color = '#34d399';
    } else if (isAppOffline) {
      hintEl.textContent = '⚠️ Web pendiente';
      hintEl.style.color = '#fbbf24';
    } else {
      hintEl.textContent = '🟢 Web activa';
      hintEl.style.color = '#34d399';
    }
  }

  // Generar QR de alta resolución con estándar ISO/IEC 18004
  const qrContainer = document.getElementById('share-qr-canvas-container');
  if (qrContainer && typeof QRCode !== 'undefined') {
    qrContainer.innerHTML = '';
    try {
      shareQrInstance = new QRCode(qrContainer, {
        text: shareUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: 'M',
        margin: 4
      });
    } catch (qrErr) {
      console.error('Error generando QR:', qrErr);
    }
  }

  // Botón Descargar QR en PNG
  const btnDownloadQr = document.getElementById('btn-download-qr');
  if (btnDownloadQr) {
    btnDownloadQr.onclick = () => {
      const dataUrl = shareQrInstance?.getDataURL();
      if (!dataUrl) {
        showToast('Generando código QR...', 'info');
        return;
      }
      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanName = (event.title || event.rival || 'partido').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `QR_Convocatoria_${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Imagen del código QR descargada en alta resolución', 'success');
    };
  }

  // Botón Copiar URL
  const btnCopyUrl = document.getElementById('btn-copy-family-url');
  if (btnCopyUrl) {
    btnCopyUrl.onclick = () => {
      if (isAppOffline && !hasUrl) {
        showToast('⚠️ Introduce arriba la dirección web de tu academia antes de copiar', 'warning');
        if (inputTop) inputTop.focus();
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('Enlace de consulta copiado al portapapeles', 'success');
        }).catch(() => {
          inputUrl?.select();
          document.execCommand('copy');
          showToast('Enlace copiado al portapapeles', 'success');
        });
      } else {
        inputUrl?.select();
        document.execCommand('copy');
        showToast('Enlace copiado', 'success');
      }
    };
  }

  // Botón WhatsApp
  const btnWa = document.getElementById('btn-open-whatsapp-share');
  if (btnWa) {
    btnWa.onclick = () => {
      if (isAppOffline && !hasUrl) {
        showToast('⚠️ Introduce arriba la dirección web de tu academia antes de compartir por WhatsApp', 'warning');
        if (inputTop) inputTop.focus();
        return;
      }

      let waText = `⚽ *CONVOCATORIA Y DETALLES DEL ENCUENTRO*\n`;
      waText += `🏆 *${event.title || ('JK Noova vs ' + event.rival)}*\n`;
      waText += `🛡️ ${team.name} • 📅 ${formatDate(event.date)} a las ${event.time || ''}\n`;
      waText += `📍 Campo: ${event.location || ''}\n\n`;
      waText += `📲 Consulta la convocatoria, horario, ubicación y plaza asignada en furgoneta aquí:\n${shareUrl}`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    };
  }

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }
}

/* ==========================================================================
   GESTIÓN DE PESTAÑAS Y SESIONES DE ENTRENAMIENTO
   ========================================================================== */
let activeCalendarMainTab = 'matches';
let trainingSessionsList = [];
let filterTrainingTeamId = 'all';
let filterTrainingDate = '';

function switchCalendarMainTab(tab) {
  activeCalendarMainTab = tab;
  const btnMatches = document.getElementById('tab-btn-matches');
  const btnTrainings = document.getElementById('tab-btn-trainings');
  const btnStats = document.getElementById('tab-btn-attendance-stats');

  const secMatches = document.getElementById('section-matches');
  const secTrainings = document.getElementById('section-trainings');
  const secStats = document.getElementById('section-attendance-stats');

  if (btnMatches) {
    btnMatches.classList.toggle('active', tab === 'matches');
  }
  if (btnTrainings) {
    btnTrainings.classList.toggle('active', tab === 'trainings');
    btnTrainings.classList.toggle('tab-trainings-active', tab === 'trainings');
  }
  if (btnStats) {
    btnStats.classList.toggle('active', tab === 'attendance-stats');
    btnStats.classList.toggle('tab-stats-active', tab === 'attendance-stats');
  }

  if (secMatches) secMatches.style.display = (tab === 'matches') ? 'block' : 'none';
  if (secTrainings) secTrainings.style.display = (tab === 'trainings') ? 'block' : 'none';
  if (secStats) secStats.style.display = (tab === 'attendance-stats') ? 'block' : 'none';

  if (tab === 'trainings') {
    if (trainingActiveView === 'week') {
      renderWeeklyCalendarStrip();
      renderSelectedDayTrainings();
    } else if (trainingActiveView === 'month') {
      renderMonthlyCalendar();
    } else {
      renderTrainingSessions();
    }
  } else if (tab === 'attendance-stats') {
    renderAttendanceStats();
  }
}

/* ==========================================================================
   CALENDARIO VISUAL INTERACTIVO Y GESTIÓN DE ENTRENAMIENTOS
   ========================================================================== */
let trainingActiveView = 'week'; // 'week' | 'month' | 'list'
let calendarCurrentYear = 2026;
let calendarCurrentMonth = 8; // Septiembre (0-indexed)
let calendarSelectedDate = '';
let currentWeekMonday = null;
let searchTrainingQuery = '';
let trainingCreationMode = 'single'; // 'single' | 'recurring'
let selectedWeekdays = new Set([1, 3, 5]); // Lun, Mié, Vie por defecto
let selectedDurationMinutes = 90;

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
};

function formatLocalDateToISO(date) {
  if (!date) return '';
  const d = (date instanceof Date) ? date : parseLocalDate(date);
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return new Date(dateInput.getTime());
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

function getMonday(d) {
  const date = parseLocalDate(d);
  const day = date.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff, 12, 0, 0);
}

if (!currentWeekMonday) {
  currentWeekMonday = getMonday(new Date());
}

function switchTrainingView(view) {
  trainingActiveView = view;
  const weekView = document.getElementById('training-week-view');
  const calView = document.getElementById('training-calendar-view');
  const listView = document.getElementById('training-list-view');
  const btnWeek = document.getElementById('btn-view-week');
  const btnMonth = document.getElementById('btn-view-month');
  const btnList = document.getElementById('btn-view-list');

  if (weekView) weekView.style.display = (view === 'week') ? 'block' : 'none';
  if (calView) calView.style.display = (view === 'month') ? 'block' : 'none';
  if (listView) listView.style.display = (view === 'list') ? 'block' : 'none';

  btnWeek?.classList.toggle('active', view === 'week');
  btnMonth?.classList.toggle('active', view === 'month');
  btnList?.classList.toggle('active', view === 'list');

  updateTrainingNavTitle();

  if (view === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (view === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
}

function updateTrainingNavTitle() {
  const titleEl = document.getElementById('training-nav-title');
  if (!titleEl) return;

  if (trainingActiveView === 'month') {
    titleEl.textContent = `${SPANISH_MONTHS[calendarCurrentMonth]} ${calendarCurrentYear}`;
    return;
  }

  if (!currentWeekMonday) {
    currentWeekMonday = getMonday(new Date());
  }

  const mon = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), currentWeekMonday.getDate(), 12, 0, 0);
  const sun = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), currentWeekMonday.getDate() + 6, 12, 0, 0);

  const monDay = mon.getDate();
  const sunDay = sun.getDate();
  const monMonth = SPANISH_MONTHS[mon.getMonth()];
  const sunMonth = SPANISH_MONTHS[sun.getMonth()];

  if (mon.getMonth() === sun.getMonth()) {
    titleEl.textContent = `${monDay}. - ${sunDay}. ${monMonth}`;
  } else {
    titleEl.textContent = `${monDay}. ${monMonth.substring(0, 3)} - ${sunDay}. ${sunMonth.substring(0, 3)}`;
  }
}

function navTrainingNav(delta) {
  if (trainingActiveView === 'month') {
    navCalendarMonth(delta);
  } else {
    if (!currentWeekMonday) currentWeekMonday = getMonday(new Date());
    currentWeekMonday = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), currentWeekMonday.getDate() + delta * 7, 12, 0, 0);
    // Preservar el mismo día de la semana seleccionado
    const prevDate = parseLocalDate(calendarSelectedDate);
    const dayOfWeek = (prevDate.getDay() === 0 ? 6 : prevDate.getDay() - 1);
    const newSelected = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), currentWeekMonday.getDate() + dayOfWeek, 12, 0, 0);
    calendarSelectedDate = formatLocalDateToISO(newSelected);
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  }
  updateTrainingNavTitle();
}

function navCalendarMonth(delta) {
  calendarCurrentMonth += delta;
  if (calendarCurrentMonth < 0) {
    calendarCurrentMonth = 11;
    calendarCurrentYear--;
  } else if (calendarCurrentMonth > 11) {
    calendarCurrentMonth = 0;
    calendarCurrentYear++;
  }
  renderMonthlyCalendar();
  updateTrainingNavTitle();
}

function navTrainingToday() {
  const now = new Date();
  calendarCurrentYear = now.getFullYear();
  calendarCurrentMonth = now.getMonth();
  calendarSelectedDate = formatLocalDateToISO(now);
  currentWeekMonday = getMonday(now);

  if (trainingActiveView === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (trainingActiveView === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
  updateTrainingNavTitle();
}

function onTrainingSearchInput(val) {
  searchTrainingQuery = (val || '').trim().toLowerCase();
  if (trainingActiveView === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (trainingActiveView === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
}

function onCalendarTeamFilterChange(teamId) {
  filterTrainingTeamId = teamId;
  const listSelect = document.getElementById('filter-training-team');
  if (listSelect) listSelect.value = teamId;
  const calSelect = document.getElementById('cal-filter-team');
  if (calSelect && calSelect.value !== teamId) calSelect.value = teamId;

  if (trainingActiveView === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (trainingActiveView === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
}

function renderWeeklyCalendarStrip() {
  const strip = document.getElementById('week-calendar-days');
  if (!strip) return;

  const storage = window.JKNoovaData?.StorageService;
  trainingSessionsList = storage ? storage.getTrainingSessions() : [];
  const teams = storage ? storage.getTeams() : [];

  // Rellenar selector de equipo superior si está vacío
  const calFilterTeam = document.getElementById('cal-filter-team');
  if (calFilterTeam && calFilterTeam.options.length === 0) {
    calFilterTeam.innerHTML = '<option value="all">🌟 Todos los equipos</option>';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      calFilterTeam.appendChild(opt);
    });
    calFilterTeam.value = filterTrainingTeamId;
  }

  const todayStr = formatLocalDateToISO(new Date());
  if (!calendarSelectedDate) {
    calendarSelectedDate = todayStr;
  }

  if (!currentWeekMonday) {
    currentWeekMonday = getMonday(calendarSelectedDate);
  }

  const WEEK_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  strip.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), currentWeekMonday.getDate() + i, 12, 0, 0);
    const dateStr = formatLocalDateToISO(dayDate);
    const dayNum = dayDate.getDate();
    const letter = WEEK_LETTERS[i];

    // Comprobar si hay entrenamientos este día
    let sessions = trainingSessionsList.filter(s => s.date === dateStr);
    if (filterTrainingTeamId !== 'all') {
      sessions = sessions.filter(s => s.teamId === filterTrainingTeamId || s.teamId === 'all');
    }
    if (searchTrainingQuery) {
      sessions = sessions.filter(s => {
        const titleMatch = (s.title || '').toLowerCase().includes(searchTrainingQuery);
        const locMatch = (s.location || '').toLowerCase().includes(searchTrainingQuery);
        const addrMatch = (s.address || '').toLowerCase().includes(searchTrainingQuery);
        return titleMatch || locMatch || addrMatch;
      });
    }

    const hasSessions = sessions.length > 0;
    const pill = document.createElement('div');
    pill.className = 'week-day-pill';
    if (dateStr === calendarSelectedDate) pill.classList.add('is-selected');
    if (dateStr === todayStr) pill.classList.add('is-today');

    pill.innerHTML = `
      <span class="week-day-letter">${letter}</span>
      <span class="week-day-num">${dayNum}</span>
      <span class="week-day-dot ${hasSessions ? '' : 'empty'}"></span>
    `;

    pill.onclick = () => {
      calendarSelectedDate = dateStr;
      document.querySelectorAll('.week-day-pill').forEach(p => p.classList.remove('is-selected'));
      pill.classList.add('is-selected');
      renderSelectedDayTrainings();
    };

    strip.appendChild(pill);
  }

  updateTrainingNavTitle();
}

function getAttendanceForSession(session, allAttendance) {
  if (!session || !session.date || !allAttendance) return null;
  if (session.teamId && allAttendance[session.teamId] && allAttendance[session.teamId][session.date]) {
    return allAttendance[session.teamId][session.date];
  }
  if (allAttendance['all'] && allAttendance['all'][session.date]) {
    return allAttendance['all'][session.date];
  }
  for (const tId in allAttendance) {
    if (allAttendance[tId] && allAttendance[tId][session.date]) {
      return allAttendance[tId][session.date];
    }
  }
  return null;
}

function renderSelectedDayTrainings() {
  const headingEl = document.getElementById('training-selected-day-heading');
  const container = document.getElementById('training-selected-day-list');
  if (!container) return;

  const storage = window.JKNoovaData?.StorageService;
  trainingSessionsList = storage ? storage.getTrainingSessions() : [];
  const teams = storage ? storage.getTeams() : [];
  const allAttendance = storage ? (storage.getAttendance() || {}) : {};

  const todayStr = formatLocalDateToISO(new Date());
  if (!calendarSelectedDate) {
    calendarSelectedDate = todayStr;
  }

  // Título con formato idéntico a la imagen (ej: "Lunes, 21 Sept 2026")
  if (headingEl) {
    const dateObj = parseLocalDate(calendarSelectedDate);
    const dayName = WEEKDAY_NAMES[dateObj.getDay()] || 'Día';
    const d = dateObj.getDate();
    const m = dateObj.getMonth();
    const y = dateObj.getFullYear();
    const monthShort = SPANISH_MONTHS[m] ? SPANISH_MONTHS[m].substring(0, 4) : '';
    headingEl.textContent = `${dayName}, ${d} ${monthShort} ${y}`;
  }

  let sessions = trainingSessionsList.filter(s => s.date === calendarSelectedDate);
  if (filterTrainingTeamId !== 'all') {
    sessions = sessions.filter(s => s.teamId === filterTrainingTeamId || s.teamId === 'all');
  }
  if (searchTrainingQuery) {
    sessions = sessions.filter(s => {
      const titleMatch = (s.title || '').toLowerCase().includes(searchTrainingQuery);
      const locMatch = (s.location || '').toLowerCase().includes(searchTrainingQuery);
      const addrMatch = (s.address || '').toLowerCase().includes(searchTrainingQuery);
      return titleMatch || locMatch || addrMatch;
    });
  }

  sessions.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  container.innerHTML = '';
  if (sessions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.2rem 1rem; color: var(--text-muted); background: var(--bg-card); border-radius: 14px; border: 1px dashed var(--border-subtle);">
        <p style="margin: 0; font-size: 0.95rem; color: #fff; font-weight: 700;">No hay entrenamientos para este día</p>
        <p style="margin: 0.35rem 0 1rem; font-size: 0.8rem;">Programa una sesión única o configura entrenamientos recurrentes.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openEditTrainingModal(null, '${calendarSelectedDate}')" style="background: #3b82f6; border-color: #2563eb; font-weight: 700;">
          ➕ Programar en este día
        </button>
      </div>
    `;
    return;
  }

  sessions.forEach(session => {
    const team = teams.find(t => t.id === session.teamId) || { name: 'Todos los equipos', color: '#3b82f6' };
    const teamColor = team.color || '#3b82f6';

    const dateAtt = getAttendanceForSession(session, allAttendance);
    let attBadgeHtml = '';

    if (dateAtt) {
      const pids = Object.keys(dateAtt);
      const presCount = pids.filter(id => dateAtt[id] === 'present').length;
      const totalCount = pids.length;
      const pct = totalCount > 0 ? Math.round((presCount / totalCount) * 100) : 0;
      attBadgeHtml = `
        <span style="font-size: 0.72rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">
          ✔ ${presCount}/${totalCount} (${pct}%)
        </span>
      `;
    } else {
      attBadgeHtml = `
        <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">
          ⏳ Sin lista
        </span>
      `;
    }

    const isIndoor = session.venueType === 'indoor_hall';
    const venueBadgeHtml = isIndoor
      ? `<span class="venue-type-badge badge-venue-indoor">🏟️ Polideportivo interior</span>`
      : `<span class="venue-type-badge badge-venue-outdoor">🌿 Césped aire libre</span>`;

    const mapQuery = session.address || session.location || '';
    const mapsBtnHtml = mapQuery
      ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}" target="_blank" class="btn-google-maps" title="Abrir en Google Maps">
          📍 Maps
        </a>`
      : '';

    const card = document.createElement('div');
    card.className = 'training-card-modern';
    card.innerHTML = `
      <div class="training-card-color-stripe" style="background: ${teamColor};"></div>
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHTML(team.name)}
          </h4>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHTML(session.title)}
          </div>
        </div>
        ${attBadgeHtml}
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.45rem; flex-wrap: wrap; font-size: 0.85rem;">
        <div style="color: #60a5fa; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem;">
          <span>⏰</span> <span>${escapeHTML(session.time || '17:30 - 19:00')}</span>
        </div>
        ${venueBadgeHtml}
      </div>

      ${(session.location || session.address) ? `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.4rem; padding: 0.35rem 0.55rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            📍 ${escapeHTML(session.address || session.location)}
          </div>
          ${mapsBtnHtml}
        </div>
      ` : ''}

      ${session.notes ? `
        <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 0.35rem 0.55rem; border-radius: 6px; margin-top: 0.4rem;">
          ${escapeHTML(session.notes)}
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-top: 0.55rem; padding-top: 0.55rem; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap;">
        <button type="button" class="btn btn-primary btn-sm btn-session-attendance" data-sid="${session.id}" style="background: #10b981; border-color: #059669; font-size: 0.78rem; padding: 0.35rem 0.75rem; font-weight: 700;">
          📋 Pasar lista
        </button>
        <div style="display: flex; gap: 0.3rem;">
          <button type="button" class="btn btn-secondary btn-sm btn-session-edit" data-sid="${session.id}" style="font-size: 0.75rem; padding: 0.35rem 0.55rem;" title="Editar entrenamiento">
            ✏️
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-session-delete" data-sid="${session.id}" style="font-size: 0.75rem; padding: 0.35rem 0.55rem;" title="Eliminar entrenamiento">
            🗑️
          </button>
        </div>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.closest('button, a, input, select')) return;
      openEditTrainingModal(session.id);
    };

    const btnAtt = card.querySelector('.btn-session-attendance');
    if (btnAtt) {
      btnAtt.onclick = (e) => {
        e.stopPropagation();
        if (typeof openAttendanceModal === 'function') {
          openAttendanceModal(session.teamId, session.date);
        }
      };
    }

    const btnEdit = card.querySelector('.btn-session-edit');
    if (btnEdit) {
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        openEditTrainingModal(session.id);
      };
    }

    const btnDel = card.querySelector('.btn-session-delete');
    if (btnDel) {
      btnDel.onclick = (e) => {
        e.stopPropagation();
        deleteTrainingSession(session.id);
      };
    }

    container.appendChild(card);
  });
}

function renderMonthlyCalendar() {
  const grid = document.getElementById('cal-days-grid');
  const monthTitle = document.getElementById('cal-month-title');
  const calFilterTeam = document.getElementById('cal-filter-team');
  if (!grid) return;

  const storage = window.JKNoovaData.StorageService;
  trainingSessionsList = storage.getTrainingSessions();
  const teams = storage.getTeams();
  const allAttendance = storage.getAttendance() || {};

  // Rellenar selector de equipo en el calendario si está vacío
  if (calFilterTeam && calFilterTeam.options.length === 0) {
    calFilterTeam.innerHTML = '<option value="all">🌟 Todos los equipos</option>';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      calFilterTeam.appendChild(opt);
    });
    calFilterTeam.value = filterTrainingTeamId;
  }

  if (monthTitle) {
    monthTitle.textContent = `${SPANISH_MONTHS[calendarCurrentMonth]} ${calendarCurrentYear}`;
  }

  const today = new Date();
  const todayStr = formatLocalDateToISO(today);
  if (!calendarSelectedDate) {
    calendarSelectedDate = todayStr;
  }

  // Primer día del mes
  const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1, 12, 0, 0);
  // Total días del mes actual
  const daysInMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0, 12, 0, 0).getDate();
  // Total días del mes anterior
  const daysInPrevMonth = new Date(calendarCurrentYear, calendarCurrentMonth, 0, 12, 0, 0).getDate();

  // Día de la semana del día 1 (0 = Dom, 1 = Lun ... 6 = Sáb)
  let firstDayIndex = firstDay.getDay();
  // Ajuste para que la semana empiece en Lunes (0 = Lun ... 6 = Dom)
  let startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  grid.innerHTML = '';

  // 1. Días del mes anterior
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = calendarCurrentMonth === 0 ? 11 : calendarCurrentMonth - 1;
    const prevY = calendarCurrentMonth === 0 ? calendarCurrentYear - 1 : calendarCurrentYear;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    const cell = createCalendarDayCell(dayNum, dateStr, true, teams, allAttendance);
    grid.appendChild(cell);
  }

  // 2. Días del mes actual
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${calendarCurrentYear}-${String(calendarCurrentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const cell = createCalendarDayCell(dayNum, dateStr, false, teams, allAttendance);
    grid.appendChild(cell);
  }

  // 3. Días del mes siguiente para completar múltiplos de 7 (35 o 42 celdas)
  const totalRendered = startOffset + daysInMonth;
  const remainingCells = (totalRendered <= 35 ? 35 : 42) - totalRendered;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextM = calendarCurrentMonth === 11 ? 0 : calendarCurrentMonth + 1;
    const nextY = calendarCurrentMonth === 11 ? calendarCurrentYear + 1 : calendarCurrentYear;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    const cell = createCalendarDayCell(dayNum, dateStr, true, teams, allAttendance);
    grid.appendChild(cell);
  }

  renderSelectedDayDetails(calendarSelectedDate);
}

function createCalendarDayCell(dayNum, dateStr, isOtherMonth, teams, allAttendance) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day-cell';
  if (isOtherMonth) cell.classList.add('is-other-month');

  const todayStr = formatLocalDateToISO(new Date());
  if (dateStr === todayStr) cell.classList.add('is-today');
  if (dateStr === calendarSelectedDate) cell.classList.add('is-selected');

  // Obtener sesiones para este día y equipo
  let daySessions = trainingSessionsList.filter(s => s.date === dateStr);
  if (filterTrainingTeamId !== 'all') {
    daySessions = daySessions.filter(s => s.teamId === filterTrainingTeamId || s.teamId === 'all');
  }

  let badgesHtml = '';
  if (daySessions.length > 0) {
    badgesHtml = '<div class="day-cell-trainings-container">';
    daySessions.slice(0, 2).forEach(s => {
      const tm = teams.find(t => t.id === s.teamId) || { name: 'Equipo', color: '#06b6d4' };
      const teamColor = tm.color || '#06b6d4';
      const timeShort = s.time ? s.time.split('-')[0].trim() : '17:30';
      badgesHtml += `
        <div class="day-cell-training-badge" style="background: rgba(255,255,255,0.06); color: #fff; border-left: 3px solid ${teamColor};">
          <span style="font-size: 0.62rem; color: ${teamColor}; font-weight: 800;">${timeShort}</span>
          <span style="overflow: hidden; text-overflow: ellipsis; max-width: 55px;">${escapeHTML(tm.name)}</span>
        </div>
      `;
    });
    if (daySessions.length > 2) {
      badgesHtml += `
        <div style="font-size: 0.62rem; color: var(--accent-cyan); font-weight: 700; margin-top: 1px;">
          +${daySessions.length - 2} más
        </div>
      `;
    }
    badgesHtml += '</div>';
  }

  cell.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <span class="day-cell-num">${dayNum}</span>
      ${daySessions.length > 0 ? `<span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>` : ''}
    </div>
    ${badgesHtml}
  `;

  cell.onclick = () => {
    calendarSelectedDate = dateStr;
    currentWeekMonday = getMonday(calendarSelectedDate);
    document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('is-selected'));
    cell.classList.add('is-selected');
    renderSelectedDayDetails(dateStr);
  };

  return cell;
}

function renderSelectedDayDetails(dateStr) {
  const titleEl = document.getElementById('cal-selected-day-title');
  const subEl = document.getElementById('cal-selected-day-subtitle');
  const container = document.getElementById('cal-selected-day-sessions-list');
  const btnAddOnDay = document.getElementById('btn-add-session-on-day');
  if (!container) return;

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const allAttendance = storage.getAttendance() || {};

  if (titleEl) {
    titleEl.textContent = `📅 Entrenamientos del ${formatDate(dateStr)}`;
  }

  if (btnAddOnDay) {
    btnAddOnDay.onclick = () => {
      openEditTrainingModal(null, dateStr);
    };
  }

  let daySessions = trainingSessionsList.filter(s => s.date === dateStr);
  if (filterTrainingTeamId !== 'all') {
    daySessions = daySessions.filter(s => s.teamId === filterTrainingTeamId || s.teamId === 'all');
  }

  if (subEl) {
    subEl.textContent = daySessions.length === 1
      ? '1 sesión programada para esta fecha'
      : `${daySessions.length} sesiones programadas para esta fecha`;
  }

  container.innerHTML = '';
  if (daySessions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--border-subtle);">
        <p style="margin: 0; font-size: 0.9rem; color: #fff; font-weight: 700;">No hay entrenamientos programados para este día.</p>
        <p style="margin: 0.35rem 0 1rem; font-size: 0.78rem;">Puedes programar una sesión única o configurar un ciclo de entrenamientos semanales.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openEditTrainingModal(null, '${dateStr}')" style="background: #10b981; border-color: #059669; font-weight: 700;">
          ➕ Programar en este día
        </button>
      </div>
    `;
    return;
  }

  const gridSessions = document.createElement('div');
  gridSessions.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 0.85rem; margin-top: 0.5rem;';

  daySessions.forEach(session => {
    const team = teams.find(t => t.id === session.teamId) || { name: 'Todos los equipos', color: '#10b981' };
    const teamColor = team.color || '#06b6d4';

    const dateAtt = getAttendanceForSession(session, allAttendance);
    let attBadgeHtml = '';

    if (dateAtt) {
      const pids = Object.keys(dateAtt);
      const presCount = pids.filter(id => dateAtt[id] === 'present').length;
      const totalCount = pids.length;
      const pct = totalCount > 0 ? Math.round((presCount / totalCount) * 100) : 0;
      attBadgeHtml = `
        <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">
          ✔ ${presCount}/${totalCount} (${pct}%)
        </span>
      `;
    } else {
      attBadgeHtml = `
        <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">
          ⏳ Sin pasar lista
        </span>
      `;
    }

    const isIndoor = session.venueType === 'indoor_hall';
    const venueBadgeHtml = isIndoor
      ? `<span class="venue-type-badge badge-venue-indoor">🏟️ Polideportivo interior</span>`
      : `<span class="venue-type-badge badge-venue-outdoor">🌿 Césped aire libre</span>`;

    const mapQuery = session.address || session.location || '';
    const mapsBtnHtml = mapQuery
      ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}" target="_blank" class="btn-google-maps" title="Abrir en Google Maps">
          📍 Maps
        </a>`
      : '';

    const card = document.createElement('div');
    card.className = 'training-card-modern';
    card.style.margin = '0';
    card.innerHTML = `
      <div class="training-card-color-stripe" style="background: ${teamColor};"></div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHTML(team.name)}
          </h4>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHTML(session.title)}
          </div>
        </div>
        ${attBadgeHtml}
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.45rem; flex-wrap: wrap; font-size: 0.85rem;">
        <div style="color: #60a5fa; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem;">
          <span>⏰</span> <span>${escapeHTML(session.time || 'Horario a confirmar')}</span>
        </div>
        ${venueBadgeHtml}
      </div>

      ${(session.location || session.address) ? `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.4rem; padding: 0.35rem 0.55rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            📍 ${escapeHTML(session.address || session.location)}
          </div>
          ${mapsBtnHtml}
        </div>
      ` : ''}

      ${session.notes ? `
        <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 0.35rem 0.55rem; border-radius: 6px; margin-top: 0.4rem;">
          ${escapeHTML(session.notes)}
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap;">
        <button type="button" class="btn btn-primary btn-sm btn-session-attendance" data-sid="${session.id}" style="background: #10b981; border-color: #059669; font-size: 0.78rem; padding: 0.35rem 0.75rem; font-weight: 700;">
          📋 Pasar lista
        </button>
        <div style="display: flex; gap: 0.3rem;">
          <button type="button" class="btn btn-secondary btn-sm btn-session-edit" data-sid="${session.id}" style="font-size: 0.75rem; padding: 0.35rem 0.55rem;" title="Editar entrenamiento">
            ✏️
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-session-delete" data-sid="${session.id}" style="font-size: 0.75rem; padding: 0.35rem 0.55rem;" title="Eliminar entrenamiento">
            🗑️
          </button>
        </div>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.closest('button, a, input, select')) return;
      openEditTrainingModal(session.id);
    };

    const btnAtt = card.querySelector('.btn-session-attendance');
    if (btnAtt) {
      btnAtt.onclick = (e) => {
        e.stopPropagation();
        if (typeof openAttendanceModal === 'function') {
          openAttendanceModal(session.teamId, session.date);
        }
      };
    }

    const btnEdit = card.querySelector('.btn-session-edit');
    if (btnEdit) {
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        openEditTrainingModal(session.id);
      };
    }

    const btnDel = card.querySelector('.btn-session-delete');
    if (btnDel) {
      btnDel.onclick = (e) => {
        e.stopPropagation();
        deleteTrainingSession(session.id);
      };
    }

    gridSessions.appendChild(card);
  });

  container.appendChild(gridSessions);
}

function initTrainingCalendarLogic() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  trainingSessionsList = storage.getTrainingSessions();

  const btnAdd = document.getElementById('btn-add-training-session');
  if (btnAdd) {
    btnAdd.onclick = () => openEditTrainingModal(null);
  }
  const btnQuickAdd = document.getElementById('btn-quick-add-training');
  if (btnQuickAdd) {
    btnQuickAdd.onclick = () => openEditTrainingModal(null);
  }

  const btnQuickAtt = document.getElementById('btn-quick-attendance');
  if (btnQuickAtt) {
    btnQuickAtt.onclick = () => {
      if (typeof openAttendanceModal === 'function') {
        openAttendanceModal();
      }
    };
  }

  const teamFilter = document.getElementById('filter-training-team');
  if (teamFilter) {
    teamFilter.onchange = (e) => {
      filterTrainingTeamId = e.target.value;
      const calSelect = document.getElementById('cal-filter-team');
      if (calSelect) calSelect.value = filterTrainingTeamId;
      renderMonthlyCalendar();
      renderTrainingSessions();
    };
  }

  const dateFilter = document.getElementById('filter-training-date');
  if (dateFilter) {
    dateFilter.onchange = (e) => {
      filterTrainingDate = e.target.value;
      renderTrainingSessions();
    };
  }

  const btnClear = document.getElementById('btn-clear-training-filters');
  if (btnClear) {
    btnClear.onclick = () => {
      filterTrainingTeamId = 'all';
      filterTrainingDate = '';
      if (teamFilter) teamFilter.value = 'all';
      if (dateFilter) dateFilter.value = '';
      const calSelect = document.getElementById('cal-filter-team');
      if (calSelect) calSelect.value = 'all';
      renderMonthlyCalendar();
      renderTrainingSessions();
    };
  }

  const btnSave = document.getElementById('btn-save-training-session');
  if (btnSave) {
    btnSave.onclick = saveTrainingSession;
  }

  if (trainingActiveView === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (trainingActiveView === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
}

function renderTrainingSessions() {
  const container = document.getElementById('trainings-list-container');
  const countIndicator = document.getElementById('training-count-indicator');
  const teamFilter = document.getElementById('filter-training-team');
  if (!container) return;

  const storage = window.JKNoovaData.StorageService;
  trainingSessionsList = storage.getTrainingSessions();
  const teams = storage.getTeams();
  const allAttendance = storage.getAttendance() || {};

  if (teamFilter && teamFilter.options.length === 0) {
    teamFilter.innerHTML = '<option value="all">🌟 Todos los equipos</option>';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      teamFilter.appendChild(opt);
    });
    teamFilter.value = filterTrainingTeamId;
  }

  let list = [...trainingSessionsList];
  if (filterTrainingTeamId !== 'all') {
    list = list.filter(s => s.teamId === filterTrainingTeamId || s.teamId === 'all');
  }
  if (filterTrainingDate) {
    list = list.filter(s => s.date === filterTrainingDate);
  }

  list.sort((a, b) => {
    const da = a.date + ' ' + (a.time || '');
    const db = b.date + ' ' + (b.time || '');
    return da.localeCompare(db);
  });

  if (countIndicator) {
    countIndicator.textContent = `${list.length} sesiones`;
  }

  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-subtle);">
        <p style="font-size: 1.1rem; color: #fff; font-weight: 700; margin-bottom: 0.5rem;">No hay entrenamientos en este filtro</p>
        <p style="font-size: 0.85rem; margin-bottom: 1.25rem;">Pulsa para programar una nueva sesión o cambiar los filtros.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openEditTrainingModal(null)">➕ Programar entrenamiento</button>
      </div>
    `;
    return;
  }

  list.forEach(session => {
    const team = teams.find(t => t.id === session.teamId) || { name: 'Todos los equipos', color: '#10b981' };
    const teamColor = team.color || '#06b6d4';

    const dateAtt = getAttendanceForSession(session, allAttendance);
    let attBadgeHtml = '';

    if (dateAtt) {
      const pids = Object.keys(dateAtt);
      const presCount = pids.filter(id => dateAtt[id] === 'present').length;
      const totalCount = pids.length;
      const pct = totalCount > 0 ? Math.round((presCount / totalCount) * 100) : 0;
      attBadgeHtml = `
        <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">
          ✔ ${presCount}/${totalCount} (${pct}%)
        </span>
      `;
    } else {
      attBadgeHtml = `
        <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">
          ⏳ Sin pasar lista
        </span>
      `;
    }

    const isIndoor = session.venueType === 'indoor_hall';
    const venueBadgeHtml = isIndoor
      ? `<span class="venue-type-badge badge-venue-indoor">🏟️ Polideportivo interior</span>`
      : `<span class="venue-type-badge badge-venue-outdoor">🌿 Césped aire libre</span>`;

    const mapQuery = session.address || session.location || '';
    const mapsBtnHtml = mapQuery
      ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}" target="_blank" class="btn-google-maps" title="Abrir en Google Maps">
          📍 Maps
        </a>`
      : '';

    const card = document.createElement('div');
    card.className = 'training-card-modern';
    card.innerHTML = `
      <div class="training-card-color-stripe" style="background: ${teamColor};"></div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
        <div style="flex: 1; min-width: 0;">
          <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHTML(team.name)}
          </h4>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHTML(session.title)}
          </div>
        </div>
        ${attBadgeHtml}
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.45rem; flex-wrap: wrap; font-size: 0.85rem;">
        <div style="color: #60a5fa; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem;">
          <span>📅</span> <strong>${formatDate(session.date)}</strong>
          <span>•</span>
          <span>⏰</span> <span>${escapeHTML(session.time || 'Horario por confirmar')}</span>
        </div>
        ${venueBadgeHtml}
      </div>

      ${(session.location || session.address) ? `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.4rem; padding: 0.35rem 0.55rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            📍 ${escapeHTML(session.address || session.location)}
          </div>
          ${mapsBtnHtml}
        </div>
      ` : ''}

      ${session.notes ? `
        <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 0.35rem 0.55rem; border-radius: 6px; margin-top: 0.4rem;">
          ${escapeHTML(session.notes)}
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap;">
        <button type="button" class="btn btn-primary btn-sm btn-session-attendance" data-sid="${session.id}" style="background: #10b981; border-color: #059669; font-size: 0.78rem; padding: 0.35rem 0.75rem; font-weight: 700;">
          📋 Pasar lista
        </button>
        <div style="display: flex; gap: 0.3rem;">
          <button type="button" class="btn btn-secondary btn-sm btn-session-edit" data-sid="${session.id}" style="font-size: 0.75rem; padding: 0.35rem 0.55rem;" title="Editar entrenamiento">
            ✏️
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-session-delete" data-sid="${session.id}" style="font-size: 0.75rem; padding: 0.35rem 0.55rem;" title="Eliminar entrenamiento">
            🗑️
          </button>
        </div>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.closest('button, a, input, select')) return;
      openEditTrainingModal(session.id);
    };

    const btnAtt = card.querySelector('.btn-session-attendance');
    if (btnAtt) {
      btnAtt.onclick = (e) => {
        e.stopPropagation();
        if (typeof openAttendanceModal === 'function') {
          openAttendanceModal(session.teamId, session.date);
        }
      };
    }

    const btnEdit = card.querySelector('.btn-session-edit');
    if (btnEdit) {
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        openEditTrainingModal(session.id);
      };
    }

    const btnDel = card.querySelector('.btn-session-delete');
    if (btnDel) {
      btnDel.onclick = (e) => {
        e.stopPropagation();
        deleteTrainingSession(session.id);
      };
    }

    container.appendChild(card);
  });
}

function setTrainingCreationMode(mode) {
  trainingCreationMode = mode;
  const btnSingle = document.getElementById('btn-mode-single');
  const btnRecur = document.getElementById('btn-mode-recurring');
  const blockSingle = document.getElementById('block-single-date');
  const blockRecur = document.getElementById('block-recurring-schedule');
  const previewBox = document.getElementById('training-recurring-preview-box');
  const btnSave = document.getElementById('btn-save-training-session');

  if (mode === 'single') {
    btnSingle?.classList.add('active');
    btnRecur?.classList.remove('active');
    if (blockSingle) blockSingle.style.display = 'block';
    if (blockRecur) blockRecur.style.display = 'none';
    if (previewBox) previewBox.style.display = 'none';
    if (btnSave) btnSave.textContent = '💾 Guardar sesión';
  } else {
    btnRecur?.classList.add('active');
    btnSingle?.classList.remove('active');
    if (blockSingle) blockSingle.style.display = 'none';
    if (blockRecur) blockRecur.style.display = 'block';
    if (previewBox) previewBox.style.display = 'block';
    if (btnSave) btnSave.textContent = '💾 Guardar sesiones recurrentes';
    updateRecurringPreview();
  }
}

function toggleWeekdayChip(el) {
  const day = parseInt(el.getAttribute('data-day'), 10);
  if (selectedWeekdays.has(day)) {
    if (selectedWeekdays.size > 1) {
      selectedWeekdays.delete(day);
      el.classList.remove('active');
    } else {
      showToast('Selecciona al menos un día de la semana', 'info');
      return;
    }
  } else {
    selectedWeekdays.add(day);
    el.classList.add('active');
  }
  updateRecurringPreview();
}

function setTrainingDuration(min) {
  selectedDurationMinutes = parseInt(min, 10) || 90;
  document.querySelectorAll('.duration-chip').forEach(c => {
    if (parseInt(c.getAttribute('data-min'), 10) === selectedDurationMinutes) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  calcTrainingEndTime();
  updateRecurringPreview();
}

function calcTrainingEndTime() {
  const startInput = document.getElementById('training-time-start');
  const hint = document.getElementById('training-time-summary-hint');
  const startTime = startInput?.value || '17:30';

  const parts = startTime.split(':');
  let h = parseInt(parts[0], 10) || 17;
  let m = parseInt(parts[1], 10) || 30;

  let totalMinutes = h * 60 + m + selectedDurationMinutes;
  let endH = Math.floor(totalMinutes / 60) % 24;
  let endM = totalMinutes % 60;
  let endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const summaryStr = `${startTime} - ${endTime}`;
  if (hint) {
    hint.textContent = `Franja horaria: ${summaryStr} (${selectedDurationMinutes} minutos)`;
  }

  return { startTime, endTime, summaryStr };
}

function setRecurDuration(type) {
  const startInput = document.getElementById('training-recur-start');
  const endInput = document.getElementById('training-recur-end');
  const startDateStr = startInput?.value || formatLocalDateToISO(new Date());
  const startDate = parseLocalDate(startDateStr);

  let endDate = new Date(startDate);
  if (type === 1) {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (type === 3) {
    endDate.setMonth(endDate.getMonth() + 3);
  } else if (type === 'season') {
    const y = startDate.getMonth() >= 6 ? startDate.getFullYear() + 1 : startDate.getFullYear();
    endDate = new Date(y, 5, 30, 12, 0, 0); // 30 de Junio
  }

  if (endInput) {
    endInput.value = formatLocalDateToISO(endDate);
  }
  updateRecurringPreview();
}

function updateRecurringPreview() {
  const previewBox = document.getElementById('training-recurring-preview-box');
  if (!previewBox || trainingCreationMode !== 'recurring') return;

  const storage = window.JKNoovaData?.StorageService;
  const teams = storage?.getTeams() || [];

  const teamSelect = document.getElementById('training-team-id');
  const teamObj = teams.find(t => t.id === teamSelect?.value) || { name: 'el equipo' };

  const startInput = document.getElementById('training-recur-start');
  const endInput = document.getElementById('training-recur-end');
  const locInput = document.getElementById('training-location');

  const startDateStr = startInput?.value;
  const endDateStr = endInput?.value;
  const location = locInput?.value || 'Instalación deportiva';

  if (!startDateStr || !endDateStr) {
    previewBox.textContent = 'Selecciona el rango de fechas para calcular las sesiones.';
    return;
  }

  const dStart = new Date(startDateStr);
  const dEnd = new Date(endDateStr);

  if (dStart > dEnd) {
    previewBox.textContent = '⚠️ La fecha de inicio debe ser anterior a la fecha de fin.';
    return;
  }

  let count = 0;
  let cur = new Date(dStart);
  while (cur <= dEnd) {
    if (selectedWeekdays.has(cur.getDay())) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const daysArr = Array.from(selectedWeekdays).sort().map(d => WEEKDAY_NAMES[d]);
  const { summaryStr } = calcTrainingEndTime();

  previewBox.innerHTML = `
    <strong>📋 Previsualización:</strong><br>
    Se crearán <strong>${count} sesiones</strong> de entrenamiento para <strong>${escapeHTML(teamObj.name)}</strong>.<br>
    • <strong>Días:</strong> ${daysArr.join(', ')}<br>
    • <strong>Horario:</strong> ${summaryStr} (${selectedDurationMinutes} min)<br>
    • <strong>Lugar:</strong> ${escapeHTML(location)}<br>
    • <strong>Periodo:</strong> Del ${formatDate(startDateStr)} al ${formatDate(endDateStr)}
  `;
}

function openEditTrainingModal(sessionId = null, defaultDate = null, forceMode = null) {
  const modal = document.getElementById('modal-training-session');
  if (!modal) return;

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const selectTeam = document.getElementById('training-team-id');
  const titleHeader = document.getElementById('training-modal-title');
  const editIdInput = document.getElementById('edit-training-id');
  const toggleBar = document.getElementById('training-mode-toggle-bar');

  if (selectTeam) {
    selectTeam.innerHTML = '';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      selectTeam.appendChild(opt);
    });
    if (filterTrainingTeamId !== 'all') {
      selectTeam.value = filterTrainingTeamId;
    }
  }

  if (sessionId) {
    const session = trainingSessionsList.find(s => s.id === sessionId);
    if (!session) return;
    if (titleHeader) titleHeader.textContent = '✏️ Editar entrenamiento';
    if (editIdInput) editIdInput.value = session.id;
    if (toggleBar) toggleBar.style.display = 'none';
    setTrainingCreationMode('single');

    document.getElementById('training-title').value = session.title || '';
    if (selectTeam) selectTeam.value = session.teamId || '';
    document.getElementById('training-date').value = session.date || '';

    let sTime = '17:30';
    if (session.time) {
      sTime = session.time.split('-')[0].trim();
    }
    const startInput = document.getElementById('training-time-start');
    if (startInput) startInput.value = sTime;

    setVenueType(session.venueType || 'outdoor_grass');
    document.getElementById('training-location').value = session.location || '';
    document.getElementById('training-address').value = session.address || '';
    document.getElementById('training-coach').value = session.coach || '';
    document.getElementById('training-notes').value = session.notes || '';
    calcTrainingEndTime();
  } else {
    if (titleHeader) {
      titleHeader.textContent = forceMode === 'recurring' ? '🔁 Plan semanal recurrente' : '➕ Programar entrenamiento';
    }
    if (editIdInput) editIdInput.value = '';
    if (toggleBar) toggleBar.style.display = 'flex';

    const todayStr = defaultDate || formatLocalDateToISO(new Date());
    document.getElementById('training-date').value = todayStr;
    document.getElementById('training-recur-start').value = todayStr;

    // Fecha fin por defecto: +3 meses
    const defaultEnd = parseLocalDate(todayStr);
    defaultEnd.setMonth(defaultEnd.getMonth() + 3);
    document.getElementById('training-recur-end').value = formatLocalDateToISO(defaultEnd);

    document.getElementById('training-title').value = 'Entrenamiento habitual';
    document.getElementById('training-time-start').value = '17:30';
    setVenueType('outdoor_grass');
    document.getElementById('training-location').value = 'Campo 1';
    document.getElementById('training-address').value = '';
    document.getElementById('training-coach').value = '';
    document.getElementById('training-notes').value = '';

    setTrainingDuration(90);
    if (forceMode === 'recurring') {
      setTrainingCreationMode('recurring');
    } else {
      setTrainingCreationMode('single');
    }
  }

  const btnModalAtt = document.getElementById('btn-training-modal-attendance');
  if (btnModalAtt) {
    if (sessionId) {
      const session = trainingSessionsList.find(s => s.id === sessionId);
      if (session) {
        btnModalAtt.style.display = 'inline-flex';
        btnModalAtt.onclick = () => {
          if (typeof closeModal === 'function') {
            closeModal(modal);
          } else {
            modal.classList.remove('active');
          }
          if (typeof openAttendanceModal === 'function') {
            openAttendanceModal(session.teamId, session.date);
          }
        };
      } else {
        btnModalAtt.style.display = 'none';
      }
    } else {
      btnModalAtt.style.display = 'none';
    }
  }

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }
}

function setVenueType(type) {
  const hiddenInput = document.getElementById('training-venue-type');
  const btnOut = document.getElementById('btn-venue-outdoor');
  const btnIn = document.getElementById('btn-venue-indoor');

  const finalType = type === 'indoor_hall' ? 'indoor_hall' : 'outdoor_grass';
  if (hiddenInput) hiddenInput.value = finalType;

  if (finalType === 'indoor_hall') {
    btnIn?.classList.add('active');
    btnOut?.classList.remove('active');
  } else {
    btnOut?.classList.add('active');
    btnIn?.classList.remove('active');
  }
}

function testGoogleMapsAddress() {
  const addrInput = document.getElementById('training-address');
  const locInput = document.getElementById('training-location');
  const query = (addrInput?.value || locInput?.value || '').trim();

  if (!query) {
    showToast('Introduce una dirección o nombre de instalación para abrir en Maps', 'info');
    return;
  }

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
}

function saveTrainingSession() {
  const title = document.getElementById('training-title').value.trim();
  const teamId = document.getElementById('training-team-id').value;
  const venueType = document.getElementById('training-venue-type')?.value || 'outdoor_grass';
  const location = document.getElementById('training-location').value.trim();
  const address = document.getElementById('training-address').value.trim();
  const coach = document.getElementById('training-coach').value.trim();
  const notes = document.getElementById('training-notes').value.trim();
  const editId = document.getElementById('edit-training-id').value;
  const { summaryStr } = calcTrainingEndTime();

  if (!title || !teamId) {
    showToast('Por favor introduce un título y selecciona un equipo', 'error');
    return;
  }

  const storage = window.JKNoovaData.StorageService;
  trainingSessionsList = storage.getTrainingSessions();

  if (editId) {
    const existing = trainingSessionsList.find(s => s.id === editId);
    if (existing) {
      existing.title = title;
      existing.teamId = teamId;
      existing.venueType = venueType;
      existing.date = document.getElementById('training-date').value;
      existing.time = summaryStr;
      existing.location = location;
      existing.address = address;
      existing.coach = coach;
      existing.notes = notes;
      showToast('Entrenamiento actualizado correctamente', 'success');
    }
  } else if (trainingCreationMode === 'single') {
    const date = document.getElementById('training-date').value;
    if (!date) {
      showToast('Por favor selecciona una fecha', 'error');
      return;
    }
    const newSession = {
      id: `tr_${Date.now()}`,
      title,
      teamId,
      venueType,
      date,
      time: summaryStr,
      location,
      address,
      coach,
      notes
    };
    trainingSessionsList.push(newSession);
    calendarSelectedDate = date;
    showToast('Entrenamiento programado con éxito', 'success');
  } else {
    // Modo recurrente
    const startStr = document.getElementById('training-recur-start').value;
    const endStr = document.getElementById('training-recur-end').value;

    if (!startStr || !endStr) {
      showToast('Por favor indica fecha de inicio y fecha de fin', 'error');
      return;
    }
    if (selectedWeekdays.size === 0) {
      showToast('Por favor selecciona al menos un día de la semana', 'error');
      return;
    }

    const dStart = new Date(startStr);
    const dEnd = new Date(endStr);
    if (dStart > dEnd) {
      showToast('La fecha de inicio debe ser anterior a la de fin', 'error');
      return;
    }

    let cur = parseLocalDate(dStart);
    let createdCount = 0;
    const tsBase = Date.now();

    while (cur <= dEnd) {
      if (selectedWeekdays.has(cur.getDay())) {
        const dIso = formatLocalDateToISO(cur);
        const newSession = {
          id: `tr_${tsBase}_${createdCount}`,
          title,
          teamId,
          venueType,
          date: dIso,
          time: summaryStr,
          location,
          address,
          coach,
          notes
        };
        trainingSessionsList.push(newSession);
        createdCount++;
      }
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1, 12, 0, 0);
    }

    calendarSelectedDate = startStr;
    showToast(`¡Se han programado ${createdCount} sesiones de entrenamiento con éxito!`, 'success');
  }

  storage.saveTrainingSessions(trainingSessionsList);

  const modal = document.getElementById('modal-training-session');
  if (modal) {
    if (typeof closeModal === 'function') closeModal(modal);
    else modal.classList.remove('active');
  }

  if (trainingActiveView === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (trainingActiveView === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
}

function deleteTrainingSession(sessionId) {
  const session = trainingSessionsList.find(s => s.id === sessionId);
  if (!session) return;

  if (!confirm(`¿Eliminar la sesión "${session.title}" del ${formatDate(session.date)}?`)) {
    return;
  }

  const storage = window.JKNoovaData.StorageService;
  trainingSessionsList = trainingSessionsList.filter(s => s.id !== sessionId);
  storage.saveTrainingSessions(trainingSessionsList);
  showToast('Sesión de entrenamiento eliminada', 'info');

  if (trainingActiveView === 'week') {
    renderWeeklyCalendarStrip();
    renderSelectedDayTrainings();
  } else if (trainingActiveView === 'month') {
    renderMonthlyCalendar();
  } else {
    renderTrainingSessions();
  }
}

// Exponer funciones en window para invocación desde eventos HTML
window.switchTrainingView = switchTrainingView;
window.navTrainingNav = navTrainingNav;
window.navTrainingToday = navTrainingToday;
window.navCalendarMonth = navCalendarMonth;
window.navCalendarToday = navCalendarToday;
window.onTrainingSearchInput = onTrainingSearchInput;
window.onCalendarTeamFilterChange = onCalendarTeamFilterChange;
window.setTrainingCreationMode = setTrainingCreationMode;
window.toggleWeekdayChip = toggleWeekdayChip;
window.setTrainingDuration = setTrainingDuration;
window.calcTrainingEndTime = calcTrainingEndTime;
window.setRecurDuration = setRecurDuration;
window.updateRecurringPreview = updateRecurringPreview;
window.openEditTrainingModal = openEditTrainingModal;
window.setVenueType = setVenueType;
window.testGoogleMapsAddress = testGoogleMapsAddress;

/* ==========================================================================
   REGISTRO Y ESTADÍSTICAS DE ASISTENCIA A ENTRENAMIENTOS
   ========================================================================== */
let statsTeamId = 'all';
let statsDateFrom = '';
let statsDateTo = '';
let statsSearchQuery = '';

function initAttendanceStatsLogic() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const teamSelect = document.getElementById('stats-team-select');
  const inputFrom = document.getElementById('stats-date-from');
  const inputTo = document.getElementById('stats-date-to');
  const inputSearch = document.getElementById('stats-player-search');

  if (teamSelect) {
    teamSelect.innerHTML = '<option value="all">🌟 Todos los equipos</option>';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      teamSelect.appendChild(opt);
    });
    teamSelect.onchange = (e) => {
      statsTeamId = e.target.value;
      renderAttendanceStats();
    };
  }

  const now = new Date();
  const past30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 12, 0, 0);
  statsDateTo = formatLocalDateToISO(now);
  statsDateFrom = formatLocalDateToISO(past30);

  if (inputFrom) {
    inputFrom.value = statsDateFrom;
    inputFrom.onchange = (e) => {
      statsDateFrom = e.target.value;
      renderAttendanceStats();
    };
  }
  if (inputTo) {
    inputTo.value = statsDateTo;
    inputTo.onchange = (e) => {
      statsDateTo = e.target.value;
      renderAttendanceStats();
    };
  }
  if (inputSearch) {
    inputSearch.oninput = (e) => {
      statsSearchQuery = e.target.value.toLowerCase().trim();
      renderAttendanceStats();
    };
  }

  document.querySelectorAll('.btn-preset-date').forEach(btn => {
    btn.onclick = () => {
      const preset = btn.getAttribute('data-preset');
      setStatsDatePreset(preset);
    };
  });

  const btnShareQr = document.getElementById('btn-share-attendance-stats-qr');
  if (btnShareQr) {
    btnShareQr.onclick = openAttendanceQrModal;
  }

  const btnPrint = document.getElementById('btn-print-attendance-stats');
  if (btnPrint) {
    btnPrint.onclick = () => window.print();
  }
}

function setStatsDatePreset(preset) {
  const now = new Date();
  statsDateTo = formatLocalDateToISO(now);

  if (preset === '7' || preset === 7) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 12, 0, 0);
    statsDateFrom = formatLocalDateToISO(d);
  } else if (preset === '30' || preset === 30) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 12, 0, 0);
    statsDateFrom = formatLocalDateToISO(d);
  } else if (preset === 'month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    statsDateFrom = `${y}-${m}-01`;
  } else if (preset === 'season') {
    statsDateFrom = '2025-09-01';
  }

  const inputFrom = document.getElementById('stats-date-from');
  const inputTo = document.getElementById('stats-date-to');
  if (inputFrom) inputFrom.value = statsDateFrom;
  if (inputTo) inputTo.value = statsDateTo;

  renderAttendanceStats();
}

function renderAttendanceStats() {
  const kpiContainer = document.getElementById('stats-kpi-container');
  const playersListContainer = document.getElementById('stats-players-list');
  const badgeCount = document.getElementById('stats-player-count-badge');
  if (!kpiContainer || !playersListContainer) return;

  const storage = window.JKNoovaData.StorageService;
  const allPlayers = storage.getPlayers();
  const teams = storage.getTeams();
  const attendance = storage.getAttendance() || {};

  const filteredPlayers = (statsTeamId === 'all')
    ? allPlayers
    : allPlayers.filter(p => p.teamId === statsTeamId);

  const dFrom = statsDateFrom ? new Date(statsDateFrom) : new Date('2000-01-01');
  const dTo = statsDateTo ? new Date(statsDateTo + 'T23:59:59') : new Date('2099-12-31');

  const sessionDatesSet = new Set();
  const playerStatsMap = {};

  filteredPlayers.forEach(p => {
    playerStatsMap[p.id] = {
      player: p,
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      history: []
    };
  });

  for (const tId in attendance) {
    if (statsTeamId !== 'all' && tId !== statsTeamId) continue;
    const teamDates = attendance[tId] || {};

    for (const dStr in teamDates) {
      const d = new Date(dStr);
      if (d >= dFrom && d <= dTo) {
        sessionDatesSet.add(dStr);
        const dayAttendance = teamDates[dStr] || {};

        filteredPlayers.forEach(p => {
          if (dayAttendance[p.id]) {
            const st = dayAttendance[p.id];
            playerStatsMap[p.id].totalSessions++;
            if (st === 'present') {
              playerStatsMap[p.id].presentCount++;
            } else {
              playerStatsMap[p.id].absentCount++;
            }
            playerStatsMap[p.id].history.push({ date: dStr, status: st });
          }
        });
      }
    }
  }

  let playersStatsList = Object.values(playerStatsMap);

  if (statsSearchQuery) {
    playersStatsList = playersStatsList.filter(item => {
      const fullName = `${item.player.name} ${item.player.lastName}`.toLowerCase();
      const dorsal = String(item.player.mainDorsal || '');
      return fullName.includes(statsSearchQuery) || dorsal.includes(statsSearchQuery);
    });
  }

  playersStatsList.forEach(item => {
    item.percentage = item.totalSessions > 0 ? Math.round((item.presentCount / item.totalSessions) * 100) : 100;
  });

  const totalSessionsRecorded = sessionDatesSet.size;
  let globalSumPct = 0;
  let evaluatedCount = 0;
  let perfectCount = 0;
  let alertCount = 0;

  playersStatsList.forEach(item => {
    if (item.totalSessions > 0) {
      globalSumPct += item.percentage;
      evaluatedCount++;
      if (item.percentage === 100) perfectCount++;
      if (item.percentage < 75) alertCount++;
    }
  });

  const avgGlobalPct = evaluatedCount > 0 ? Math.round(globalSumPct / evaluatedCount) : 100;

  kpiContainer.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem 1rem;">
      <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">📅 Sesiones en periodo</div>
      <strong style="font-size: 1.35rem; color: #fff; margin-top: 2px; display: block;">${totalSessionsRecorded}</strong>
      <span style="font-size: 0.7rem; color: var(--accent-cyan);">${formatDate(statsDateFrom)} - ${formatDate(statsDateTo)}</span>
    </div>
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem 1rem;">
      <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">📊 Asistencia media grupal</div>
      <strong style="font-size: 1.35rem; color: ${avgGlobalPct >= 80 ? '#34d399' : '#fbbf24'}; margin-top: 2px; display: block;">${avgGlobalPct}%</strong>
      <span style="font-size: 0.7rem; color: var(--text-secondary);">${evaluatedCount} jugadores evaluados</span>
    </div>
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem 1rem;">
      <div style="font-size: 0.72rem; color: #34d399; font-weight: 700;">🏆 Asistencia 100%</div>
      <strong style="font-size: 1.35rem; color: #34d399; margin-top: 2px; display: block;">${perfectCount} jug.</strong>
      <span style="font-size: 0.7rem; color: var(--text-secondary);">Asistencia impecable</span>
    </div>
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem 1rem;">
      <div style="font-size: 0.72rem; color: #f87171; font-weight: 700;">⚠️ Alerta de ausencias</div>
      <strong style="font-size: 1.35rem; color: #f87171; margin-top: 2px; display: block;">${alertCount} jug.</strong>
      <span style="font-size: 0.7rem; color: var(--text-secondary);">&lt; 75% de asistencia</span>
    </div>
  `;

  if (badgeCount) {
    badgeCount.textContent = `${playersStatsList.length} jugadores`;
  }

  playersStatsList.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    const da = parseInt(a.player.mainDorsal, 10) || 999;
    const db = parseInt(b.player.mainDorsal, 10) || 999;
    return da - db;
  });

  playersListContainer.innerHTML = '';
  if (playersStatsList.length === 0) {
    playersListContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
        No hay registros de jugadores para los filtros seleccionados.
      </div>
    `;
    return;
  }

  playersStatsList.forEach(item => {
    const p = item.player;
    const team = teams.find(t => t.id === p.teamId);
    const avatarUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name + '+' + p.lastName)}&background=18233c&color=fff`;

    let barColor = '#10b981';
    let badgeBg = 'rgba(16, 185, 129, 0.15)';
    let badgeColorText = '#34d399';

    if (item.percentage < 70) {
      barColor = '#ef4444';
      badgeBg = 'rgba(239, 68, 68, 0.15)';
      badgeColorText = '#f87171';
    } else if (item.percentage < 85) {
      barColor = '#f59e0b';
      badgeBg = 'rgba(245, 158, 11, 0.15)';
      badgeColorText = '#fbbf24';
    }

    const row = document.createElement('div');
    row.style.cssText = `
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      transition: all 0.2s;
    `;

    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1.5;">
          <img src="${avatarUrl}" alt="${p.name}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid ${team?.color || 'rgba(255,255,255,0.15)'}; flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=18233c&color=fff'">
          <div style="min-width: 0;">
            <div style="font-weight: 800; color: #fff; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              #${p.mainDorsal || '-'} ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; gap: 0.4rem; align-items: center; margin-top: 2px;">
              <span style="color: var(--accent-cyan); font-weight: 700;">${p.mainPosition || 'JUG'}</span>
              ${team ? `<span>•</span><span style="color: ${team.color}; font-weight: 600;">${escapeHTML(team.name)}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1.25rem; flex-shrink: 0; flex-wrap: wrap;">
          <div style="text-align: center; min-width: 90px;">
            <div style="font-size: 0.72rem; color: var(--text-muted);">Asistencias</div>
            <div style="font-size: 0.88rem; font-weight: 700; margin-top: 1px;">
              <span style="color: #34d399;">✔ ${item.presentCount}</span>
              <span style="color: var(--text-muted); margin: 0 3px;">/</span>
              <span style="color: #f87171;">✖ ${item.absentCount}</span>
            </div>
          </div>

          <div style="min-width: 130px; text-align: right;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-size: 0.7rem; color: var(--text-muted);">${item.totalSessions} sesiones</span>
              <span style="font-size: 0.85rem; font-weight: 800; padding: 0.1rem 0.45rem; border-radius: 4px; background: ${badgeBg}; color: ${badgeColorText};">
                ${item.percentage}%
              </span>
            </div>
            <div class="attendance-stat-bar-track">
              <div class="attendance-stat-bar-fill" style="width: ${item.percentage}%; background: ${barColor};"></div>
            </div>
          </div>

          <button type="button" class="btn btn-secondary btn-xs btn-toggle-dates-history" style="font-size: 0.72rem; padding: 0.3rem 0.55rem;">
            📅 Fechas (${item.history.length})
          </button>
        </div>
      </div>

      <!-- Detalle desplegable de fechas -->
      <div class="dates-history-panel" style="display: none; margin-top: 0.75rem; padding-top: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.08);">
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.4rem;">Registro por día:</div>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${item.history.length === 0 ? '<span style="font-size: 0.75rem; color: var(--text-muted);">Sin sesiones en este periodo</span>' : ''}
          ${item.history.map(h => `
            <span style="font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; ${h.status === 'present' ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);' : 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);'}">
              ${h.status === 'present' ? '✔' : '✖'} ${formatDate(h.date)}
            </span>
          `).join('')}
        </div>
      </div>
    `;

    const btnHistory = row.querySelector('.btn-toggle-dates-history');
    const panelHistory = row.querySelector('.dates-history-panel');
    if (btnHistory && panelHistory) {
      btnHistory.onclick = () => {
        const isHidden = panelHistory.style.display === 'none';
        panelHistory.style.display = isHidden ? 'block' : 'none';
        btnHistory.textContent = isHidden ? '▲ Ocultar fechas' : `📅 Fechas (${item.history.length})`;
      };
    }

    playersListContainer.appendChild(row);
  });
}

let attendanceQrInstance = null;

function openAttendanceQrModal() {
  const modal = document.getElementById('modal-share-attendance-qr');
  if (!modal) return;

  const storage = window.JKNoovaData.StorageService;
  const teams = storage.getTeams();
  const allPlayers = storage.getPlayers();
  const attendance = storage.getAttendance() || {};

  const teamObj = teams.find(t => t.id === statsTeamId) || { name: 'Todos los equipos' };

  const filteredPlayers = (statsTeamId === 'all')
    ? allPlayers
    : allPlayers.filter(p => p.teamId === statsTeamId);

  const dFrom = statsDateFrom ? new Date(statsDateFrom) : new Date('2000-01-01');
  const dTo = statsDateTo ? new Date(statsDateTo + 'T23:59:59') : new Date('2099-12-31');

  const datesSet = new Set();
  const playersSummary = [];

  for (const tId in attendance) {
    if (statsTeamId !== 'all' && tId !== statsTeamId) continue;
    const teamDates = attendance[tId] || {};
    for (const dStr in teamDates) {
      const d = new Date(dStr);
      if (d >= dFrom && d <= dTo) {
        datesSet.add(dStr);
      }
    }
  }

  const totalSessions = datesSet.size;

  filteredPlayers.forEach(p => {
    let pres = 0;
    let total = 0;
    for (const tId in attendance) {
      if (statsTeamId !== 'all' && tId !== statsTeamId) continue;
      const teamDates = attendance[tId] || {};
      for (const dStr in teamDates) {
        const d = new Date(dStr);
        if (d >= dFrom && d <= dTo && teamDates[dStr][p.id]) {
          total++;
          if (teamDates[dStr][p.id] === 'present') pres++;
        }
      }
    }
    const pct = total > 0 ? Math.round((pres / total) * 100) : 100;
    playersSummary.push([
      p.mainDorsal || '-',
      `${p.name} ${p.lastName}`.substring(0, 24),
      pres,
      total,
      pct
    ]);
  });

  const payload = {
    t: teamObj.name,
    df: statsDateFrom,
    dt: statsDateTo,
    ts: totalSessions,
    p: playersSummary.slice(0, 35)
  };

  const jsonStr = JSON.stringify(payload);
  let base64url = '';
  try {
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let bin = '';
    for (let i = 0; i < utf8Bytes.length; i++) bin += String.fromCharCode(utf8Bytes[i]);
    base64url = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    base64url = btoa(unescape(encodeURIComponent(jsonStr))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  let baseUrl = window.location.href.split('?')[0].replace('calendario.html', 'asistencia-stats.html');
  const shareUrl = `${baseUrl}?d=${base64url}`;

  const inputUrl = document.getElementById('share-att-url-input');
  if (inputUrl) inputUrl.value = shareUrl;

  const linkReport = document.getElementById('btn-open-att-report-link');
  if (linkReport) linkReport.href = shareUrl;

  const qrContainer = document.getElementById('attendance-qr-canvas-container');
  if (qrContainer && typeof QRCode !== 'undefined') {
    qrContainer.innerHTML = '';
    try {
      attendanceQrInstance = new QRCode(qrContainer, {
        text: shareUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: 'M'
      });
    } catch (err) {
      console.error('Error generando QR de asistencia:', err);
    }
  }

  const btnCopy = document.getElementById('btn-copy-att-url');
  if (btnCopy) {
    btnCopy.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('Enlace copiado al portapapeles', 'success');
        });
      } else {
        inputUrl?.select();
        document.execCommand('copy');
        showToast('Enlace copiado', 'success');
      }
    };
  }

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.classList.add('active');
  }
}

// Exponer globalmente
window.switchCalendarMainTab = switchCalendarMainTab;
window.openEditTrainingModal = openEditTrainingModal;
window.setStatsDatePreset = setStatsDatePreset;
window.renderTrainingSessions = renderTrainingSessions;
window.renderAttendanceStats = renderAttendanceStats;
window.loadData = loadData;
window.loadCalendarData = loadData;
window.initTrainingCalendarLogic = initTrainingCalendarLogic;
window.initTrainingSessionsLogic = initTrainingCalendarLogic;
window.renderWeeklyCalendarStrip = renderWeeklyCalendarStrip;
window.renderSelectedDayTrainings = renderSelectedDayTrainings;
window.renderMonthlyCalendar = renderMonthlyCalendar;
window.renderTrainingCalendarView = renderTrainingCalendarView;
window.getAttendanceForSession = getAttendanceForSession;
window.formatLocalDateToISO = formatLocalDateToISO;
window.parseLocalDate = parseLocalDate;
window.getMonday = getMonday;
