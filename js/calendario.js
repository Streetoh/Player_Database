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

  window.addEventListener('languageChanged', () => {
    renderEventsList();
    renderConvocatoriaPanel();
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
    document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
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
