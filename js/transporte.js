/**
 * JK NOOVA - Lógica de Transporte y Asignación de Vehículos
 * Adaptado a silueta esquemática wireframe sobre fondo negro
 * Soporte de flota: Renault Trafic (8 plazas) y minibuses de alquiler (14 y 19 plazas)
 */

let playersList = [];
let teamsList = [];
let eventsList = [];
let vansList = [];
let transportConfig = {};
let currentEventId = null;
let currentVanId = 'van_1';
let currentAssigningSeatId = null;
let draggedPlayerId = null;

document.addEventListener('DOMContentLoaded', () => {
  initSharedNavbar('transport');
  loadData();
  initTransportControls();
  renderTransportStage();

  window.addEventListener('languageChanged', () => {
    renderTransportStage();
  });
});

function loadData() {
  if (!window.JKNoovaData) return;
  const storage = window.JKNoovaData.StorageService;
  playersList = storage.getPlayers();
  teamsList = storage.getTeams();
  eventsList = storage.getEvents();
  transportConfig = storage.getTransport();
  vansList = storage.getVans();

  // Leer parámetro URL ?event=...
  const urlParams = new URLSearchParams(window.location.search);
  const paramEvent = urlParams.get('event');
  if (paramEvent && eventsList.some(e => e.id === paramEvent)) {
    currentEventId = paramEvent;
  } else {
    currentEventId = null;
  }

  // Furgoneta asignada al evento o predeterminada
  const curEvent = eventsList.find(e => e.id === currentEventId);
  if (curEvent && curEvent.vanId && vansList.some(v => v.id === curEvent.vanId)) {
    currentVanId = curEvent.vanId;
  } else if (vansList.length > 0) {
    currentVanId = vansList[0].id;
  }
}

function initTransportControls() {
  // Selector de partido
  const eventSelect = document.getElementById('transport-event-select');
  if (eventSelect) {
    eventSelect.onchange = (e) => {
      currentEventId = e.target.value;
      const curEvent = eventsList.find(ev => ev.id === currentEventId);
      if (curEvent && curEvent.vanId) {
        currentVanId = curEvent.vanId;
      }
      renderTransportStage();
    };
  }

  // Selector de vehículo / furgoneta
  const vanSelect = document.getElementById('transport-van-select');
  if (vanSelect) {
    vanSelect.onchange = (e) => {
      const newVanId = e.target.value;
      if (newVanId !== currentVanId) {
        currentVanId = newVanId;
        const curEvent = eventsList.find(ev => ev.id === currentEventId);
        if (curEvent) {
          curEvent.vanId = currentVanId;
          window.JKNoovaData.StorageService.saveEvents(eventsList);
        }

        // Requisito usuario: al cambiar de bus, los jugadores se desasignan y aparecen sin asiento
        if (currentEventId && transportConfig[currentEventId]) {
          const preservedDriver = transportConfig[currentEventId].driver || 'Entrenador David';
          transportConfig[currentEventId] = { driver: preservedDriver };
          window.JKNoovaData.StorageService.saveTransport(transportConfig);
        }

        renderTransportStage();
        showToast('Vehículo cambiado: plazas liberadas y listas para asignar', 'info');
      }
    };
  }

  // Auto-asignación de plazas
  const btnAuto = document.getElementById('btn-auto-assign-seats');
  if (btnAuto) {
    btnAuto.onclick = autoAssignSeats;
  }

  // Vaciar plazas
  const btnClear = document.getElementById('btn-clear-all-seats');
  if (btnClear) {
    btnClear.onclick = clearAllSeats;
  }

  // Imprimir hoja de viaje
  const btnPrint = document.getElementById('btn-print-transport');
  if (btnPrint) {
    btnPrint.onclick = () => window.print();
  }

  // Botón desocupar plaza en modal
  const btnVacate = document.getElementById('btn-vacate-current-seat');
  if (btnVacate) {
    btnVacate.onclick = () => {
      if (currentAssigningSeatId) {
        unseatPlayer(currentAssigningSeatId);
        closeModal(document.getElementById('modal-seat-assign'));
      }
    };
  }

  initFleetControls();
}

function initFleetControls() {
  const btnManage = document.getElementById('btn-manage-fleet');
  if (btnManage) {
    btnManage.onclick = openFleetModal;
  }

  const btnSaveVan = document.getElementById('btn-save-fleet-van');
  if (btnSaveVan) {
    btnSaveVan.onclick = saveFleetVan;
  }

  const btnCancelEdit = document.getElementById('btn-cancel-fleet-edit');
  if (btnCancelEdit) {
    btnCancelEdit.onclick = resetFleetForm;
  }

  const btnAssignAcc = document.getElementById('btn-assign-accompanist');
  if (btnAssignAcc) {
    btnAssignAcc.onclick = () => {
      const nameInput = document.getElementById('seat-accompanist-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        showToast('Escribe el nombre del acompañante (padre, madre o staff)', 'error');
        return;
      }
      assignPlayerToSeat(currentAssigningSeatId, `acc_${Date.now()}__${encodeURIComponent(name)}`);
      closeModal(document.getElementById('modal-seat-assign'));
    };
  }
}

function openFleetModal() {
  resetFleetForm();
  renderFleetList();
  openModal(document.getElementById('modal-fleet-manage'));
}

function renderFleetList() {
  const container = document.getElementById('fleet-list-container');
  if (!container) return;
  container.innerHTML = '';

  vansList.forEach(van => {
    const card = document.createElement('div');
    card.style.background = 'var(--bg-secondary)';
    card.style.border = '1px solid var(--border-subtle)';
    card.style.borderRadius = '8px';
    card.style.padding = '0.75rem 1rem';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.justifyContent = 'space-between';
    card.style.gap = '0.75rem';

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.3rem;">${van.capacity === 8 ? '🚐' : '🚌'}</span>
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
            ${escapeHTML(van.name)}
            ${van.isOfficial ? `<span style="font-size: 0.65rem; background: rgba(6, 182, 212, 0.15); color: #06b6d4; padding: 0.15rem 0.45rem; border-radius: 4px; margin-left: 0.4rem; font-weight: 700;">OFICIAL CLUB</span>` : `<span style="font-size: 0.65rem; background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.15rem 0.45rem; border-radius: 4px; margin-left: 0.4rem; font-weight: 700;">ALQUILER</span>`}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
            Matrícula: <strong style="color: #fff; letter-spacing: 0.5px;">${escapeHTML(van.plate)}</strong> • Capacidad: <strong>${van.capacity} plazas</strong>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 0.4rem;">
        <button type="button" class="btn btn-secondary btn-xs btn-edit-van" title="Editar vehículo" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
          ✏️ Editar
        </button>
        <button type="button" class="btn btn-danger btn-xs btn-delete-van" title="Eliminar vehículo de la flota" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" ${vansList.length <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>
          🗑️ Eliminar
        </button>
      </div>
    `;

    card.querySelector('.btn-edit-van').onclick = () => {
      document.getElementById('fleet-van-id').value = van.id;
      document.getElementById('fleet-van-name').value = van.name;
      document.getElementById('fleet-van-plate').value = van.plate;
      document.getElementById('fleet-van-capacity').value = van.capacity;
      document.getElementById('fleet-form-title').textContent = `✏️ Editando: ${van.name}`;
      document.getElementById('btn-cancel-fleet-edit').style.display = 'inline-block';
      document.getElementById('btn-save-fleet-van').textContent = 'Guardar cambios';
    };

    card.querySelector('.btn-delete-van').onclick = () => {
      deleteFleetVan(van.id);
    };

    container.appendChild(card);
  });
}

function resetFleetForm() {
  document.getElementById('fleet-van-id').value = '';
  document.getElementById('fleet-van-name').value = '';
  document.getElementById('fleet-van-plate').value = '';
  document.getElementById('fleet-van-capacity').value = '8';
  document.getElementById('fleet-form-title').textContent = '➕ Añadir o editar vehículo';
  document.getElementById('btn-cancel-fleet-edit').style.display = 'none';
  document.getElementById('btn-save-fleet-van').textContent = 'Guardar vehículo';
}

function saveFleetVan() {
  const vanId = document.getElementById('fleet-van-id').value;
  const name = document.getElementById('fleet-van-name').value.trim();
  const plate = document.getElementById('fleet-van-plate').value.trim().toUpperCase();
  const capacity = parseInt(document.getElementById('fleet-van-capacity').value, 10) || 8;

  if (!name || !plate) {
    showToast('Por favor, completa el nombre y la matrícula', 'error');
    return;
  }

  if (vanId) {
    const v = vansList.find(x => x.id === vanId);
    if (v) {
      v.name = name;
      v.plate = plate;
      v.capacity = capacity;
      showToast(`Vehículo "${name}" actualizado`, 'success');
    }
  } else {
    const newVan = {
      id: `van_${Date.now()}`,
      name,
      plate,
      capacity,
      isOfficial: capacity === 8
    };
    vansList.push(newVan);
    showToast(`Vehículo "${name}" añadido a la flota`, 'success');
  }

  window.JKNoovaData.StorageService.saveVans(vansList);
  resetFleetForm();
  renderFleetList();
  renderTransportStage();
}

function deleteFleetVan(vanId) {
  if (vansList.length <= 1) {
    showToast('No puedes eliminar el único vehículo de la flota', 'error');
    return;
  }
  const van = vansList.find(v => v.id === vanId);
  if (!van) return;

  if (confirm(`¿Eliminar la furgoneta "${van.name}" (${van.plate}) de la flota?`)) {
    vansList = vansList.filter(v => v.id !== vanId);
    window.JKNoovaData.StorageService.saveVans(vansList);

    if (currentVanId === vanId) {
      currentVanId = vansList[0].id;
      if (currentEventId && transportConfig[currentEventId]) {
        const driver = transportConfig[currentEventId].driver || 'Entrenador David';
        transportConfig[currentEventId] = { driver };
        window.JKNoovaData.StorageService.saveTransport(transportConfig);
      }
    }

    renderFleetList();
    renderTransportStage();
    showToast(`Vehículo "${van.name}" eliminado de la flota`, 'warning');
  }
}

function getPassengerSeatsForCapacity(capacity) {
  if (capacity === 14) {
    return ['s_1', 's_2', 's_3', 's_4', 's_5', 's_6', 's_7', 's_8', 's_9', 's_10', 's_11', 's_12', 's_13', 's_14'];
  }
  if (capacity === 16) {
    return [
      's_1', 's_2', 's_3', 's_4', 's_5', 's_6', 's_7', 's_8',
      's_9', 's_10', 's_11', 's_12', 's_13', 's_14', 's_15', 's_16'
    ];
  }
  if (capacity === 19) {
    return [
      's_1', 's_2', 's_3', 's_4', 's_5', 's_6', 's_7', 's_8', 's_9', 's_10',
      's_11', 's_12', 's_13', 's_14', 's_15', 's_16', 's_17', 's_18', 's_19'
    ];
  }
  // Predeterminado 8 plazas (Renault Trafic SpaceClass: 2 plazas delanteras + 3 fila dos + 3 fila tres = 8 plazas de pasajeros)
  return ['front_1', 'front_2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
}

function renderTransportStage() {
  // 1. Cargar desplegables
  const eventSelect = document.getElementById('transport-event-select');
  if (eventSelect) {
    eventSelect.innerHTML = '';
    const tFn = window.t || ((k, def) => def);
    const optNone = document.createElement('option');
    optNone.value = '';
    optNone.textContent = tFn('transport.selectMatchPrompt', '-- Sin partido seleccionado --');
    if (!currentEventId) optNone.selected = true;
    eventSelect.appendChild(optNone);

    eventsList.forEach(evt => {
      const opt = document.createElement('option');
      opt.value = evt.id;
      opt.textContent = `${evt.rival || evt.title} (${formatDate(evt.date)})`;
      if (evt.id === currentEventId) opt.selected = true;
      eventSelect.appendChild(opt);
    });
  }

  const vanSelect = document.getElementById('transport-van-select');
  if (vanSelect) {
    vanSelect.innerHTML = '';

    const clubVans = vansList.filter(v => !v.isRental && v.capacity === 8);
    const rentalVans = vansList.filter(v => v.isRental || v.capacity > 8);

    const clubGroup = document.createElement('optgroup');
    clubGroup.label = '🚐 Flota Oficial del Club (Renault Trafic - 8 plazas)';
    clubVans.forEach(van => {
      const opt = document.createElement('option');
      opt.value = van.id;
      opt.textContent = `${van.name} (${van.plate}) - 8 plazas`;
      if (van.id === currentVanId) opt.selected = true;
      clubGroup.appendChild(opt);
    });
    vanSelect.appendChild(clubGroup);

    const rentalGroup = document.createElement('optgroup');
    rentalGroup.label = '🏢 Furgonetas y Minibuses de Alquiler (14, 16 y 19 plazas)';
    rentalVans.forEach(van => {
      const opt = document.createElement('option');
      opt.value = van.id;
      opt.textContent = `${van.name} (${van.plate}) - ${van.capacity} plazas`;
      if (van.id === currentVanId) opt.selected = true;
      rentalGroup.appendChild(opt);
    });
    vanSelect.appendChild(rentalGroup);
  }

  const currentEvent = eventsList.find(e => e.id === currentEventId) || null;
  const currentVan = vansList.find(v => v.id === currentVanId) || vansList[0] || {
    id: 'van_1', name: 'Renault Trafic 1 (Club)', plate: '4821 - KLP', capacity: 8
  };

  // Actualizar matrícula en la parte inferior del gráfico
  const plateDisplay = document.getElementById('van-plate-display');
  if (plateDisplay) plateDisplay.textContent = currentVan.plate;

  // Actualizar etiqueta del modelo en el capó (REQUISITO ESTRICTO: indica exactamente 8 plazas, nunca 9 plazas)
  const modelLabel = document.getElementById('van-model-label');
  if (modelLabel) {
    modelLabel.textContent = `${currentVan.name} • ${currentVan.capacity} plazas`;
  }

  // Ajustar clase de chasis según capacidad
  const chassisStage = document.getElementById('van-chassis-stage');
  if (chassisStage) {
    chassisStage.classList.remove('capacity-14', 'capacity-16', 'capacity-19');
    if (currentVan.capacity === 14) chassisStage.classList.add('capacity-14');
    if (currentVan.capacity === 16) chassisStage.classList.add('capacity-16');
    if (currentVan.capacity === 19) chassisStage.classList.add('capacity-19');
  }

  const eventCallUp = currentEvent ? (currentEvent.callUp || []) : [];
  const minibusConvocados = eventCallUp
    .filter(c => c.transport === 'minibus')
    .map(c => playersList.find(p => p.id === c.playerId))
    .filter(Boolean);

  let seatMap = {};
  if (currentEvent) {
    if (!transportConfig[currentEvent.id]) {
      transportConfig[currentEvent.id] = { driver: 'Entrenador David' };
    }
    seatMap = transportConfig[currentEvent.id];
  } else {
    seatMap = { driver: 'Entrenador David' };
  }

  // 2. Columna izquierda: Lista de convocados en viaje
  const poolContainer = document.getElementById('minibus-pool-container');
  if (poolContainer) {
    poolContainer.innerHTML = '';

    if (!currentEvent) {
      poolContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-subtle); border-radius: 8px;">
          ${(window.t ? window.t('transport.selectMatchPrompt', 'Selecciona un partido arriba para ver los convocados y asignarlos a las plazas de este vehículo.') : 'Selecciona un partido arriba para ver los convocados y asignarlos a las plazas de este vehículo.')}
        </div>
      `;
    } else if (minibusConvocados.length === 0) {
      poolContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-subtle); border-radius: 8px;">
          No hay jugadores con transporte asignado en la convocatoria de este partido. Modifícalo en la pestaña Calendario.
        </div>
      `;
    } else {
      minibusConvocados.forEach(player => {
        let assignedSeat = null;
        for (const [seatId, pId] of Object.entries(seatMap)) {
          if (pId === player.id) {
            assignedSeat = seatId;
            break;
          }
        }

        const card = document.createElement('div');
        card.className = `pool-player-card ${assignedSeat ? 'is-seated' : ''}`;
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-player-id', player.id);

        const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;

        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.6rem; min-width: 0;">
            <img src="${avatarUrl}" alt="${player.name}" class="mini-avatar" style="border-radius: 50%;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
            <div style="min-width: 0;">
              <div style="font-size: 0.85rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                #${player.mainDorsal || '-'} ${escapeHTML(player.name)} ${escapeHTML(player.lastName)}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${player.mainPosition} • ${player.nickname || ''}</div>
            </div>
          </div>
          <div style="flex-shrink: 0;">
            ${assignedSeat ? `
              <span class="seat-assigned-pill">Plaza ${formatSeatCode(assignedSeat)}</span>
            ` : `
              <span style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 700;">Sin asignar</span>
            `}
          </div>
        `;

        card.ondragstart = (e) => {
          draggedPlayerId = player.id;
          e.dataTransfer.setData('text/plain', player.id);
          e.dataTransfer.effectAllowed = 'move';
        };

        card.onclick = () => {
          if (!assignedSeat) {
            assignToFirstEmptySeat(player.id, currentVan.capacity);
          }
        };

        poolContainer.appendChild(card);
      });
    }
  }

  // 3. Generar la estructura de asientos en el habitáculo dinámicamente
  const cabinContainer = document.getElementById('van-cabin-container');
  if (!cabinContainer) return;
  cabinContainer.innerHTML = '';

  const seatStructure = buildSeatStructure(currentVan.capacity);
  cabinContainer.innerHTML = seatStructure;

  // 4. Renderizar contenido dentro de cada asiento
  let occupiedCount = 0;
  const seats = cabinContainer.querySelectorAll('.van-seat');

  seats.forEach(seatElem => {
    const seatId = seatElem.getAttribute('data-seat-id');
    const assignedPlayerId = seatMap[seatId];

    // Drag over & drop
    seatElem.ondragover = (e) => {
      e.preventDefault();
      seatElem.classList.add('seat-drag-over');
      e.dataTransfer.dropEffect = 'move';
    };

    seatElem.ondragleave = () => {
      seatElem.classList.remove('seat-drag-over');
    };

    seatElem.ondrop = (e) => {
      e.preventDefault();
      seatElem.classList.remove('seat-drag-over');
      const pId = e.dataTransfer.getData('text/plain') || draggedPlayerId;
      if (pId && seatId && seatId !== 'driver') {
        assignPlayerToSeat(seatId, pId);
      }
    };

    // Clic para asignar o cambiar conductor
    seatElem.onclick = (e) => {
      if (e.target.closest('.btn-unseat-wireframe')) return;
      openSeatAssignModal(seatId);
    };

    // Renderizar conductor
    if (seatId === 'driver') {
      const driverName = seatMap.driver || 'Entrenador David';
      seatElem.innerHTML = `
        <div class="seat-occupied-wireframe">
          <div class="seat-avatar-circle" style="display:flex;align-items:center;justify-content:center;background:#1d4ed8;font-size:1.2rem;border-color:#60a5fa;">👨‍💼</div>
          <div class="seat-player-firstname" style="font-size:0.75rem;">${escapeHTML(driverName)}</div>
          <div class="seat-player-lastname" style="color: #60a5fa; font-weight: 700;">CONDUCTOR</div>
        </div>
      `;
      return;
    }

    // Renderizar pasajero o acompañante
    if (assignedPlayerId) {
      occupiedCount++;
      const isAccompanist = typeof assignedPlayerId === 'string' && assignedPlayerId.startsWith('acc_');

      if (isAccompanist) {
        const rawName = assignedPlayerId.split('__')[1] || 'Acompañante';
        const displayName = decodeURIComponent(rawName);

        seatElem.innerHTML = `
          <div class="seat-occupied-wireframe">
            <div class="seat-avatar-circle" style="display:flex;align-items:center;justify-content:center;background:#374151;font-size:1.25rem;border-color:#9ca3af;">
              👥
            </div>
            <div class="seat-player-firstname" title="${escapeHTML(displayName)}">${escapeHTML(displayName)}</div>
            <div class="seat-player-lastname" style="color: var(--accent-cyan); font-weight: 600;">(Acompañante)</div>
            <button type="button" class="btn-unseat-wireframe" title="Eliminar acompañante del asiento">✕</button>
          </div>
        `;

        const btnUnseat = seatElem.querySelector('.btn-unseat-wireframe');
        if (btnUnseat) {
          btnUnseat.onclick = (e) => {
            e.stopPropagation();
            unseatPlayer(seatId);
          };
        }
      } else {
        const player = playersList.find(p => p.id === assignedPlayerId);

        if (player) {
          const avatarUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name + '+' + player.lastName)}&background=18233c&color=fff`;

          // REQUISITO ESTRICTO: Solo foto del jugador en un círculo, nombre en una fila y debajo sus dos apellidos. Debajo una 'x' para eliminar.
          seatElem.innerHTML = `
            <div class="seat-occupied-wireframe">
              <img src="${avatarUrl}" alt="${player.name}" class="seat-avatar-circle" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18233c&color=fff'">
              <div class="seat-player-firstname" title="${player.name}">${escapeHTML(player.name)}</div>
              <div class="seat-player-lastname" title="${player.lastName}">${escapeHTML(player.lastName)}</div>
              <button type="button" class="btn-unseat-wireframe" title="Eliminar del asiento">✕</button>
            </div>
          `;

          const btnUnseat = seatElem.querySelector('.btn-unseat-wireframe');
          if (btnUnseat) {
            btnUnseat.onclick = (e) => {
              e.stopPropagation();
              unseatPlayer(seatId);
            };
          }
        } else {
          renderEmptySeatWireframe(seatElem, seatId);
        }
      }
    } else {
      renderEmptySeatWireframe(seatElem, seatId);
    }
  });

  // 5. Actualizar barra de progreso y contador
  const maxSeats = currentVan.capacity;
  const counterText = document.getElementById('van-counter-text');
  if (counterText) {
    counterText.textContent = `${occupiedCount} / ${maxSeats}`;
  }

  const progressBar = document.getElementById('van-progress-bar');
  if (progressBar) {
    const pct = Math.min(100, (occupiedCount / maxSeats) * 100);
    progressBar.style.width = `${pct}%`;
    progressBar.classList.toggle('overbooked', occupiedCount > maxSeats);
  }

  const statusBadge = document.getElementById('van-status-badge');
  if (statusBadge) {
    if (occupiedCount > maxSeats) {
      statusBadge.className = 'van-alert-badge alert-danger';
      statusBadge.textContent = `⚠️ ¡Sobrecupo! (${occupiedCount} ocupados para ${maxSeats} plazas)`;
    } else if (occupiedCount === maxSeats) {
      statusBadge.className = 'van-alert-badge alert-full';
      statusBadge.textContent = `✅ Vehículo completo (${maxSeats} / ${maxSeats})`;
    } else {
      const free = maxSeats - occupiedCount;
      statusBadge.className = 'van-alert-badge alert-ok';
      statusBadge.textContent = `${free} ${free === 1 ? 'plaza libre' : 'plazas libres'}`;
    }
  }
}

function buildSeatStructure(capacity) {
  if (capacity === 14) {
    // REQUISITO ESTRICTO: En autobuses de alquiler NO hay pasajeros al lado del conductor.
    // Fila 1: Solo Conductor en la izquierda + Puerta de acceso a la derecha.
    // Filas 2 a 4 (3 filas de 2+1 = 9 plazas): [s_1, s_2 | Pasillo | s_3] hasta [s_7, s_8 | Pasillo | s_9]
    // Fila 5 Trasera corrida: 5 plazas [s_10, s_11, s_12, s_13, s_14] (Total = 9 + 5 = 14 plazas)
    return `
      <!-- FILA 1: Solo Conductor a la izquierda y Puerta de acceso a la derecha -->
      <div class="van-row bus-row-driver-front">
        <div class="van-seat driver-seat" data-seat-id="driver"></div>
        <div class="bus-entrance-door">🚪 Entrada / Puerta de acceso</div>
      </div>
      <!-- FILA 2 (Pareja izq: s_1, s_2 | Pasillo | Individual dcha: s_3) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_1"></div>
        <div class="van-seat" data-seat-id="s_2"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_3"></div>
      </div>
      <!-- FILA 3 (Pareja izq: s_4, s_5 | Pasillo | Individual dcha: s_6) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_4"></div>
        <div class="van-seat" data-seat-id="s_5"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_6"></div>
      </div>
      <!-- FILA 4 (Pareja izq: s_7, s_8 | Pasillo | Individual dcha: s_9) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_7"></div>
        <div class="van-seat" data-seat-id="s_8"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_9"></div>
      </div>
      <!-- FILA 5 Trasera corrida (5 plazas: s_10, s_11, s_12, s_13, s_14) -->
      <div class="van-row bus-row-bench-5">
        <div class="van-seat" data-seat-id="s_10"></div>
        <div class="van-seat" data-seat-id="s_11"></div>
        <div class="van-seat" data-seat-id="s_12"></div>
        <div class="van-seat" data-seat-id="s_13"></div>
        <div class="van-seat" data-seat-id="s_14"></div>
      </div>
    `;
  }

  if (capacity === 16) {
    // REQUISITO ESTRICTO: En furgonetas/autobuses de alquiler NO hay pasajeros al lado del conductor.
    // Fila 1: Solo Conductor en la izquierda + Puerta de acceso a la derecha.
    // Filas 2 a 5 (4 filas de 2+1 = 12 plazas): [s_1..s_12]
    // Fila 6 Trasera corrida: 4 plazas [s_13, s_14, s_15, s_16] (Total = 12 + 4 = 16 plazas)
    return `
      <!-- FILA 1: Solo Conductor a la izquierda y Puerta de acceso a la derecha -->
      <div class="van-row bus-row-driver-front">
        <div class="van-seat driver-seat" data-seat-id="driver"></div>
        <div class="bus-entrance-door">🚪 Entrada / Puerta de acceso</div>
      </div>
      <!-- FILA 2 (Pareja izq: s_1, s_2 | Pasillo | Individual dcha: s_3) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_1"></div>
        <div class="van-seat" data-seat-id="s_2"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_3"></div>
      </div>
      <!-- FILA 3 (Pareja izq: s_4, s_5 | Pasillo | Individual dcha: s_6) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_4"></div>
        <div class="van-seat" data-seat-id="s_5"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_6"></div>
      </div>
      <!-- FILA 4 (Pareja izq: s_7, s_8 | Pasillo | Individual dcha: s_9) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_7"></div>
        <div class="van-seat" data-seat-id="s_8"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_9"></div>
      </div>
      <!-- FILA 5 (Pareja izq: s_10, s_11 | Pasillo | Individual dcha: s_12) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_10"></div>
        <div class="van-seat" data-seat-id="s_11"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_12"></div>
      </div>
      <!-- FILA 6 Trasera corrida (4 plazas: s_13, s_14, s_15, s_16) -->
      <div class="van-row bus-row-back-bench">
        <div class="van-seat" data-seat-id="s_13"></div>
        <div class="van-seat" data-seat-id="s_14"></div>
        <div class="van-seat" data-seat-id="s_15"></div>
        <div class="van-seat" data-seat-id="s_16"></div>
      </div>
    `;
  }

  if (capacity === 19) {
    // REQUISITO ESTRICTO: En autobuses de alquiler NO hay pasajeros al lado del conductor.
    // Fila 1: Solo Conductor en la izquierda + Puerta de acceso a la derecha.
    // Filas 2 a 6 (5 filas de 2+1 = 15 plazas): [s_1..s_15]
    // Fila 7 Trasera corrida: 4 plazas [s_16, s_17, s_18, s_19] (Total = 15 + 4 = 19 plazas)
    return `
      <!-- FILA 1: Solo Conductor a la izquierda y Puerta de acceso a la derecha -->
      <div class="van-row bus-row-driver-front">
        <div class="van-seat driver-seat" data-seat-id="driver"></div>
        <div class="bus-entrance-door">🚪 Entrada / Puerta de acceso</div>
      </div>
      <!-- FILA 2 (Pareja izq: s_1, s_2 | Pasillo | Individual dcha: s_3) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_1"></div>
        <div class="van-seat" data-seat-id="s_2"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_3"></div>
      </div>
      <!-- FILA 3 (Pareja izq: s_4, s_5 | Pasillo | Individual dcha: s_6) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_4"></div>
        <div class="van-seat" data-seat-id="s_5"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_6"></div>
      </div>
      <!-- FILA 4 (Pareja izq: s_7, s_8 | Pasillo | Individual dcha: s_9) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_7"></div>
        <div class="van-seat" data-seat-id="s_8"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_9"></div>
      </div>
      <!-- FILA 5 (Pareja izq: s_10, s_11 | Pasillo | Individual dcha: s_12) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_10"></div>
        <div class="van-seat" data-seat-id="s_11"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_12"></div>
      </div>
      <!-- FILA 6 (Pareja izq: s_13, s_14 | Pasillo | Individual dcha: s_15) -->
      <div class="van-row bus-row-2-1">
        <div class="van-seat" data-seat-id="s_13"></div>
        <div class="van-seat" data-seat-id="s_14"></div>
        <div class="bus-aisle-space"></div>
        <div class="van-seat" data-seat-id="s_15"></div>
      </div>
      <!-- FILA 7 Trasera corrida (4 plazas: s_16, s_17, s_18, s_19) -->
      <div class="van-row bus-row-back-bench">
        <div class="van-seat" data-seat-id="s_16"></div>
        <div class="van-seat" data-seat-id="s_17"></div>
        <div class="van-seat" data-seat-id="s_18"></div>
        <div class="van-seat" data-seat-id="s_19"></div>
      </div>
    `;
  }

  // ESTRUCTURA ESTRICTA RENAULT TRAFIC SPACECLASS (8 PLAZAS):
  // Fila delantera: Conductor + 2 plazas a su derecha
  // Separación nítida con pasillo amplio
  // Detrás: 2 filas de 3 pasajeros cada una
  return `
    <!-- FILA 1: Conductor + 2 plazas a su derecha -->
    <div class="van-row van-row-front">
      <div class="van-seat driver-seat" id="seat-driver" data-seat-id="driver"></div>
      <div class="van-seat" id="seat-front_1" data-seat-id="front_1"></div>
      <div class="van-seat" id="seat-front_2" data-seat-id="front_2"></div>
    </div>

    <!-- SEPARACIÓN GENEROSA: Conductor y delanteros arriba, filas traseras separadas abajo -->
    <div style="margin: 32px 0 20px 0; border-bottom: 2px dashed rgba(255,255,255,0.25); text-align: center; position: relative;">
      <span style="position: relative; top: 9px; background: #000; padding: 0 14px; font-size: 0.65rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 1px;">Pasillo interior</span>
    </div>

    <!-- FILA 2 (3 plazas de pasajeros) -->
    <div class="van-row van-row-rear1">
      <div class="van-seat" id="seat-p1" data-seat-id="p1"></div>
      <div class="van-seat" id="seat-p2" data-seat-id="p2"></div>
      <div class="van-seat" id="seat-p3" data-seat-id="p3"></div>
    </div>

    <!-- FILA 3 (3 plazas de pasajeros) -->
    <div class="van-row van-row-rear2" style="margin-top: 14px;">
      <div class="van-seat" id="seat-p4" data-seat-id="p4"></div>
      <div class="van-seat" id="seat-p5" data-seat-id="p5"></div>
      <div class="van-seat" id="seat-p6" data-seat-id="p6"></div>
    </div>
  `;
}

function renderEmptySeatWireframe(seatElem, seatId) {
  const label = formatSeatCode(seatId);
  seatElem.innerHTML = `
    <div class="seat-empty-wireframe">
      <span class="seat-empty-num">${label}</span>
      <span class="seat-empty-label">Libre</span>
    </div>
  `;
}

function formatSeatCode(seatId) {
  const map = {
    driver: 'COND',
    front_1: '1',
    front_2: '2',
    p1: '3',
    p2: '4',
    p3: '5',
    p4: '6',
    p5: '7',
    p6: '8'
  };
  if (seatId.startsWith('s_')) {
    return seatId.replace('s_', '');
  }
  return map[seatId] || seatId.toUpperCase();
}

function assignPlayerToSeat(seatId, playerId) {
  if (!currentEventId) return;
  if (!transportConfig[currentEventId]) transportConfig[currentEventId] = {};
  const seatMap = transportConfig[currentEventId];

  // Desasignar al jugador/acompañante de cualquier otro asiento previo
  for (const [sId, pId] of Object.entries(seatMap)) {
    if (pId === playerId) {
      delete seatMap[sId];
    }
  }

  seatMap[seatId] = playerId;
  window.JKNoovaData.StorageService.saveTransport(transportConfig);

  renderTransportStage();

  if (typeof playerId === 'string' && playerId.startsWith('acc_')) {
    const rawName = playerId.split('__')[1] || 'Acompañante';
    showToast(`${decodeURIComponent(rawName)} asignado/a a la plaza ${formatSeatCode(seatId)}`, 'success');
  } else {
    const player = playersList.find(p => p.id === playerId);
    if (player) {
      showToast(`${player.name} ${player.lastName} asignado/a a la plaza ${formatSeatCode(seatId)}`, 'success');
    }
  }
}

function unseatPlayer(seatId) {
  if (!currentEventId || !transportConfig[currentEventId]) return;
  delete transportConfig[currentEventId][seatId];
  window.JKNoovaData.StorageService.saveTransport(transportConfig);
  renderTransportStage();
  showToast(`Plaza ${formatSeatCode(seatId)} liberada`, 'warning');
}

function assignToFirstEmptySeat(playerId, capacity) {
  if (!currentEventId) return;
  const passengerSeatIds = getPassengerSeatsForCapacity(capacity);
  const seatMap = transportConfig[currentEventId] || {};

  const emptySeat = passengerSeatIds.find(seatId => !seatMap[seatId]);
  if (emptySeat) {
    assignPlayerToSeat(emptySeat, playerId);
  } else {
    showToast(`No quedan plazas libres en este vehículo (${capacity}/${capacity})`, 'warning');
  }
}

function autoAssignSeats() {
  const currentEvent = eventsList.find(e => e.id === currentEventId);
  const currentVan = vansList.find(v => v.id === currentVanId) || { capacity: 8 };
  if (!currentEvent) return;

  const eventCallUp = currentEvent.callUp || [];
  const minibusPlayers = eventCallUp
    .filter(c => c.transport === 'minibus')
    .map(c => playersList.find(p => p.id === c.playerId))
    .filter(Boolean);

  if (minibusPlayers.length === 0) {
    showToast('No hay jugadores con transporte asignado en este partido', 'warning');
    return;
  }

  if (!transportConfig[currentEvent.id]) {
    transportConfig[currentEvent.id] = { driver: 'Entrenador David' };
  }
  const seatMap = transportConfig[currentEvent.id];
  const passengerSeatIds = getPassengerSeatsForCapacity(currentVan.capacity);

  // Limpiar plazas previas
  passengerSeatIds.forEach(sId => delete seatMap[sId]);

  minibusPlayers.slice(0, passengerSeatIds.length).forEach((player, idx) => {
    seatMap[passengerSeatIds[idx]] = player.id;
  });

  window.JKNoovaData.StorageService.saveTransport(transportConfig);
  renderTransportStage();
  showToast(`Asignación completada (${Math.min(minibusPlayers.length, currentVan.capacity)} plazas)`, 'success');
}

function clearAllSeats() {
  if (!currentEventId) return;
  if (confirm('¿Deseas desocupar todos los asientos de pasajeros?')) {
    const driver = transportConfig[currentEventId]?.driver || 'Entrenador David';
    transportConfig[currentEventId] = { driver };
    window.JKNoovaData.StorageService.saveTransport(transportConfig);
    renderTransportStage();
    showToast('Asientos de pasajeros vaciados', 'warning');
  }
}

function openSeatAssignModal(seatId) {
  currentAssigningSeatId = seatId;
  const currentEvent = eventsList.find(e => e.id === currentEventId);

  if (seatId === 'driver') {
    const defaultDriver = (currentEvent && transportConfig[currentEvent.id]?.driver) || 'Entrenador David';
    const driverInput = prompt('Nombre del conductor o miembro del cuerpo técnico:', defaultDriver);
    if (driverInput !== null && driverInput.trim() !== '') {
      if (currentEvent) {
        if (!transportConfig[currentEvent.id]) transportConfig[currentEvent.id] = {};
        transportConfig[currentEvent.id].driver = driverInput.trim();
        window.JKNoovaData.StorageService.saveTransport(transportConfig);
      }
      renderTransportStage();
      showToast(`Conductor actualizado: ${driverInput}`, 'success');
    }
    return;
  }

  if (!currentEvent) {
    const tFn = window.t || ((k, def) => def);
    showToast(tFn('transport.selectMatchPrompt', 'Selecciona un partido arriba para poder asignar jugadores a esta plaza.'), 'info');
    return;
  }

  const title = document.getElementById('modal-seat-assign-title');
  if (title) title.textContent = `Asignar plaza: ${formatSeatCode(seatId)}`;

  const accInput = document.getElementById('seat-accompanist-name');
  if (accInput) accInput.value = '';

  const listContainer = document.getElementById('seat-assign-options-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const eventCallUp = currentEvent?.callUp || [];
  const minibusPlayers = eventCallUp
    .filter(c => c.transport === 'minibus')
    .map(c => playersList.find(p => p.id === c.playerId))
    .filter(Boolean);

  const seatMap = transportConfig[currentEvent?.id] || {};

  if (minibusPlayers.length === 0) {
    listContainer.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.75rem; text-align: center;">
        No hay jugadores de este equipo convocados para viajar en furgoneta. Puedes elegir un jugador de otro equipo abajo o asignar un acompañante.
      </div>
    `;
  } else {
    minibusPlayers.forEach(player => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary';
      btn.style.width = '100%';
      btn.style.justifyContent = 'space-between';

      let currentSeatLabel = '';
      for (const [sId, pId] of Object.entries(seatMap)) {
        if (pId === player.id) {
          currentSeatLabel = ` (En plaza ${formatSeatCode(sId)})`;
          break;
        }
      }

      btn.innerHTML = `
        <span style="font-weight: 700;">#${player.mainDorsal || '-'} ${escapeHTML(player.name)} ${escapeHTML(player.lastName)}</span>
        <span style="font-size: 0.75rem; color: var(--accent-cyan);">${player.mainPosition} ${currentSeatLabel}</span>
      `;

      btn.onclick = () => {
        assignPlayerToSeat(seatId, player.id);
        closeModal(document.getElementById('modal-seat-assign'));
      };

      listContainer.appendChild(btn);
    });
  }

  // REQUISITO ESTRICTO: Desplegable interactivo para seleccionar jugadores de otros equipos del club
  const otherTeamsContainer = document.getElementById('seat-other-teams-container');
  if (otherTeamsContainer) otherTeamsContainer.style.display = 'none';

  const btnToggleOtherTeams = document.getElementById('btn-toggle-other-teams');
  if (btnToggleOtherTeams) {
    btnToggleOtherTeams.onclick = () => {
      if (!otherTeamsContainer) return;
      const isVisible = otherTeamsContainer.style.display !== 'none';
      otherTeamsContainer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        renderOtherTeamsSelector(seatId);
      }
    };
  }

  // Botón desocupar asiento actual
  const btnVacate = document.getElementById('btn-vacate-current-seat');
  if (btnVacate) {
    btnVacate.onclick = () => {
      unseatPlayer(seatId);
      closeModal(document.getElementById('modal-seat-assign'));
    };
  }

  // Botón asignar acompañante
  const btnAssignAcc = document.getElementById('btn-assign-accompanist');
  if (btnAssignAcc) {
    btnAssignAcc.onclick = () => {
      const name = accInput?.value.trim();
      if (!name) {
        showToast('Ingresa el nombre del acompañante', 'error');
        return;
      }
      const accId = `acc_${Date.now()}__${encodeURIComponent(name)}`;
      assignPlayerToSeat(seatId, accId);
      closeModal(document.getElementById('modal-seat-assign'));
    };
  }

  openModal(document.getElementById('modal-seat-assign'));
}

function renderOtherTeamsSelector(seatId) {
  const pillsContainer = document.getElementById('seat-other-teams-pills');
  const rosterContainer = document.getElementById('seat-other-teams-roster');
  if (!pillsContainer || !rosterContainer) return;

  pillsContainer.innerHTML = '';
  rosterContainer.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);text-align:center;padding:0.5rem;">Elige un equipo arriba para ver sus jugadores</div>';

  teamsList.forEach(team => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill-btn';
    pill.style.setProperty('--pill-color', team.color);
    pill.innerHTML = `<span class="pill-dot" style="background:${team.color}"></span> ${escapeHTML(team.name)}`;

    pill.onclick = () => {
      pillsContainer.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const teamPlayers = playersList.filter(p => p.teamId === team.id);
      rosterContainer.innerHTML = '';

      if (teamPlayers.length === 0) {
        rosterContainer.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);padding:0.5rem;text-align:center;">No hay jugadores en este equipo</div>';
        return;
      }

      teamPlayers.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secondary btn-sm';
        btn.style.width = '100%';
        btn.style.justifyContent = 'space-between';
        btn.style.padding = '0.45rem 0.75rem';

        btn.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; text-align: left;">
            <span style="font-weight: 700; color: #fff;">#${p.mainDorsal || '-'} ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}</span>
            ${p.nickname ? `<span style="font-size: 0.72rem; color: var(--text-muted);">("${escapeHTML(p.nickname)}")</span>` : ''}
          </div>
          <span style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 700;">${p.mainPosition}</span>
        `;

        btn.onclick = () => {
          assignPlayerToSeat(seatId, p.id);
          closeModal(document.getElementById('modal-seat-assign'));
        };

        rosterContainer.appendChild(btn);
      });
    };

    pillsContainer.appendChild(pill);
  });
}
