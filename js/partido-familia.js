/**
 * JK NOOVA - Lógica del Portal Público de Consulta para Familias (partido.html)
 * Vista optimizada para teléfonos móviles de padres, sin opciones de edición,
 * con soporte multilingüe automático (Español, English, Eesti keel, Русский)
 * según el idioma configurado en el teléfono del usuario o selección manual.
 * Con cuenta atrás en tiempo real, enlace de Google Maps y asiento asignado en furgoneta.
 * Soporta carga autónoma desde URL (?d=...) para visualizar partidos generados desde la APK
 * sin necesidad de base de datos externa ni sincronización en la nube.
 */

let countdownInterval = null;
let currentPayloadData = null;

// Helper de traducción dinámico
function t(key, params, fallback) {
  if (window.i18n && typeof window.i18n.t === 'function') {
    return window.i18n.t(key, params, fallback);
  }
  return fallback || key;
}

// Cambio manual de idioma desde los botones superiores
window.switchFamilyLang = function(lang) {
  if (window.i18n && typeof window.i18n.setLanguage === 'function') {
    window.i18n.setLanguage(lang);
  }
};

function updateLangButtons(activeLang) {
  const lang = activeLang || (window.i18n && window.i18n.getLanguage ? window.i18n.getLanguage() : 'es');
  document.querySelectorAll('.family-lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateLangButtons();
  loadFamilyMatchView();

  window.addEventListener('languageChanged', (e) => {
    updateLangButtons(e.detail && e.detail.lang);
    loadFamilyMatchView();
  });
});

function decodeCompactMatchPayload(b64url) {
  if (!b64url) return null;
  try {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Error al decodificar datos del partido desde URL:', err);
    return null;
  }
}

function loadFamilyMatchView() {
  const urlParams = new URLSearchParams(window.location.search);
  const dParam = urlParams.get('d');

  // 1. Prioridad: Datos autónomos compactados en la URL
  if (dParam) {
    if (!currentPayloadData) {
      currentPayloadData = decodeCompactMatchPayload(dParam);
    }
    if (currentPayloadData) {
      renderFromPayload(currentPayloadData);
      return;
    }
  }

  // 2. Fallback: Base de datos local (StorageService)
  if (!window.JKNoovaData || !window.JKNoovaData.StorageService) {
    showEmptyState(
      t('family.emptyTitle', null, 'JK Noova Academy'),
      t('family.emptySubtitle', null, 'Consulta con el cuerpo técnico el enlace del partido')
    );
    return;
  }

  const storage = window.JKNoovaData.StorageService;
  const events = storage.getEvents() || [];
  const teams = storage.getTeams() || [];
  const players = storage.getPlayers() || [];
  const transportData = storage.getTransport() || {};
  const vans = storage.getVans() || [];

  const eventId = urlParams.get('event');
  let event = events.find(e => e.id === eventId);
  if (!event && events.length > 0) {
    event = events[0];
  }

  if (!event) {
    showEmptyState(
      t('family.emptyTitle', null, 'No hay encuentros disponibles'),
      t('family.emptySubtitle', null, 'Consulta con el cuerpo técnico de JK Noova')
    );
    return;
  }

  const team = teams.find(t => t.id === event.teamId) || { name: 'Equipo JK Noova', category: t('family.officialCategory', null, 'Fútbol Base') };

  // Título y categoría
  document.getElementById('pub-match-title').textContent = event.title || `JK Noova vs ${event.rival}`;
  document.getElementById('pub-match-team').textContent = `${team.name} • ${team.category || t('family.officialCategory', null, 'Competición oficial')}`;

  // Fecha y hora
  const formattedDate = formatMatchDate(event.date);
  const timeText = event.time ? ` • ${t('family.atTime', { time: event.time }, `a las ${event.time} h`)}` : '';
  document.getElementById('pub-match-datetime').textContent = `${formattedDate}${timeText}`;

  // Iniciar cuenta atrás
  startCountdown(event.date, event.time);

  // Ubicación y enlace a Google Maps
  const loc = event.location || t('family.fieldDefault', null, 'Campo de fútbol');
  document.getElementById('pub-match-location').textContent = loc;
  const mapsBtn = document.getElementById('pub-maps-button');
  if (mapsBtn) {
    mapsBtn.style.display = 'flex';
    mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  }

  // Precios y cálculo de cuotas (Fórmula JK Noova)
  const callUp = event.callUp || [];
  const tournamentPrice = Number(event.tournamentPrice) || 0;
  const transportPrice = Number(event.transportPrice) || 0;
  const minibusCount = callUp.filter(c => c.transport === 'minibus').length;
  const totalCallUp = callUp.length;

  const priceTournamentPerPlayer = totalCallUp > 0 ? (tournamentPrice / totalCallUp) : 0;
  const priceTransportPerBus = minibusCount > 0 ? (transportPrice / minibusCount) : 0;
  const totalBusPlayer = priceTournamentPerPlayer + priceTransportPerBus;
  const totalCarPlayer = priceTournamentPerPlayer;

  // Renderizar transporte y furgoneta
  renderTransportInfo(event, transportData, vans, players);

  // Renderizar lista de convocados
  renderCallUpList(callUp, players, totalBusPlayer, totalCarPlayer);
}

function renderFromPayload(data) {
  // Título y categoría
  document.getElementById('pub-match-title').textContent = data.t || 'JK Noova Academy';
  document.getElementById('pub-match-team').textContent = data.m || t('family.officialCategory', null, 'Convocatoria Oficial');

  // Fecha y hora
  const formattedDate = formatMatchDate(data.d);
  const timeText = data.h ? ` • ${t('family.atTime', { time: data.h }, `a las ${data.h} h`)}` : '';
  document.getElementById('pub-match-datetime').textContent = `${formattedDate}${timeText}`;

  // Iniciar cuenta atrás
  startCountdown(data.d, data.h);

  // Ubicación y Google Maps
  const loc = data.l || t('family.fieldDefault', null, 'Instalación deportiva');
  document.getElementById('pub-match-location').textContent = loc;
  const mapsBtn = document.getElementById('pub-maps-button');
  if (mapsBtn) {
    mapsBtn.style.display = 'flex';
    mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  }

  // Precios y cuotas
  const callUp = data.c || [];
  const tournamentPrice = Number(data.tp) || 0;
  const transportPrice = Number(data.rp) || 0;
  const minibusCount = callUp.filter(c => c[2] === 1).length;
  const totalCallUp = callUp.length;

  const priceTournamentPerPlayer = totalCallUp > 0 ? (tournamentPrice / totalCallUp) : 0;
  const priceTransportPerBus = minibusCount > 0 ? (transportPrice / minibusCount) : 0;
  const totalBusPlayer = priceTournamentPerPlayer + priceTransportPerBus;
  const totalCarPlayer = priceTournamentPerPlayer;

  // Transporte autónomo
  renderPayloadTransport(data.v || [], callUp);

  // Lista de convocados autónoma
  renderPayloadCallUp(callUp, totalBusPlayer, totalCarPlayer);
}

function renderPayloadTransport(vanArr, callUp) {
  const detailsEl = document.getElementById('pub-transport-details');
  const seatsListEl = document.getElementById('pub-seats-list');
  const badgeEl = document.getElementById('pub-transport-badge');

  const vanName = vanArr[0] || t('family.clubVan', null, 'Furgoneta del Club');
  const plate = vanArr[1] || '';
  const departureTime = vanArr[2] || '';
  const driver = vanArr[3] || '';

  if (badgeEl) {
    badgeEl.textContent = plate ? `${t('family.plate', null, 'Matrícula')}: ${plate}` : t('family.officialFleet', null, 'Vehículo Oficial');
  }

  if (detailsEl) {
    let vanInfo = `<strong>${t('family.officialVehicle', null, 'Vehículo oficial')}:</strong> ${escapeHTML(vanName)}`;
    if (plate) vanInfo += ` • <strong>${t('family.plate', null, 'Matrícula')}:</strong> ${escapeHTML(plate)}`;
    if (departureTime) vanInfo += `<br>⏰ <strong>${t('family.departureTime', null, 'Hora de salida de la furgoneta')}:</strong> ${escapeHTML(departureTime)}`;
    if (driver) vanInfo += `<br>👤 <strong>${t('family.driver', null, 'Conductor responsable')}:</strong> ${escapeHTML(driver)}`;
    detailsEl.innerHTML = vanInfo;
  }

  if (seatsListEl) {
    seatsListEl.innerHTML = '';
    const assigned = (callUp || []).filter(c => c[4] && String(c[4]).trim() !== '');

    if (assigned.length === 0) {
      seatsListEl.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-muted); padding: 0.4rem 0;">
          ${t('family.seatsPending', null, 'Los asientos se asignarán antes de la salida.')}
        </div>
      `;
      return;
    }

    assigned.forEach(c => {
      const dorsal = c[0] || '-';
      const name = c[1] || 'Jugador';
      const seatKey = c[4];
      const seatLabel = t('family.seatPlaza', { seat: escapeHTML(String(seatKey).toUpperCase()) }, `Plaza ${escapeHTML(String(seatKey).toUpperCase())}`);

      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.78rem;
        padding: 0.25rem 0;
        border-bottom: 1px dashed rgba(255,255,255,0.06);
      `;
      item.innerHTML = `
        <span style="color: #fff; font-weight: 600;">
          #${escapeHTML(dorsal)} ${escapeHTML(name)}
        </span>
        <span class="seat-badge">
          💺 ${seatLabel}
        </span>
      `;
      seatsListEl.appendChild(item);
    });
  }
}

function renderPayloadCallUp(callUp, totalBus, totalCar) {
  const container = document.getElementById('pub-callup-list');
  const countBadge = document.getElementById('pub-callup-count');
  if (!container) return;
  container.innerHTML = '';

  if (countBadge) {
    countBadge.textContent = t('family.callupCount', { n: callUp.length }, `${callUp.length} convocados`);
  }

  if (callUp.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
        ${t('family.callupEmpty', null, 'La lista de convocados para este partido aún no ha sido publicada.')}
      </div>
    `;
    return;
  }

  callUp.forEach(c => {
    const dorsal = c[0] || '-';
    const name = c[1] || 'Jugador';
    const isBus = c[2] === 1;
    const isPaid = c[3] === 1;
    const playerFee = isBus ? totalBus : totalCar;
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=18233c&color=fff`;

    const row = document.createElement('div');
    row.className = 'family-player-row';

    const transportLabel = isBus ? t('family.clubVan', null, '🚐 Furgoneta del club') : t('family.privateCar', null, '🚗 Coche particular');
    const calledUpLabel = t('family.calledUp', null, 'CONVOCADO');

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
        <img src="${avatarUrl}" alt="${escapeHTML(name)}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(255,255,255,0.15);">
        <div style="min-width: 0;">
          <div style="font-weight: 700; color: #fff; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            #${escapeHTML(dorsal)} ${escapeHTML(name)}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; gap: 0.4rem; align-items: center; margin-top: 1px;">
            <span style="color: var(--accent-cyan); font-weight: 600;">${calledUpLabel}</span>
            <span>•</span>
            <span>${transportLabel}</span>
          </div>
        </div>
      </div>

      <div style="text-align: right; flex-shrink: 0;">
        <div style="font-size: 0.88rem; font-weight: 800; color: ${isBus ? 'var(--accent-cyan)' : '#fbbf24'};">
          ${playerFee.toFixed(2).replace('.', ',')} €
        </div>
        <div style="margin-top: 2px;">
          ${isPaid ? `
            <span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">
              ${t('family.paid', null, '🟢 Pagado')}
            </span>
          ` : `
            <span style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">
              ${t('family.pending', null, '⏳ Pendiente')}
            </span>
          `}
        </div>
      </div>
    `;

    container.appendChild(row);
  });
}

function showEmptyState(title, subtitle) {
  const tEl = document.getElementById('pub-match-title');
  const sEl = document.getElementById('pub-match-team');
  const dtEl = document.getElementById('pub-match-datetime');
  const cdEl = document.getElementById('pub-countdown-display');
  const locEl = document.getElementById('pub-match-location');
  const mapsBtn = document.getElementById('pub-maps-button');

  if (tEl) tEl.textContent = title;
  if (sEl) sEl.textContent = subtitle;
  if (dtEl) dtEl.textContent = t('family.dateTbd', null, 'En espera de convocatoria');
  if (cdEl) cdEl.textContent = t('family.emptyTitle', null, 'Sin encuentro activo');
  if (locEl) locEl.textContent = t('family.emptySubtitle', null, 'Por favor, escanea el código QR facilitado por el club.');
  if (mapsBtn) mapsBtn.style.display = 'none';
}

function startCountdown(dateStr, timeStr) {
  if (countdownInterval) clearInterval(countdownInterval);
  const display = document.getElementById('pub-countdown-display');
  if (!display) return;

  const targetTime = timeStr ? timeStr : '10:00';
  const targetDate = new Date(`${dateStr}T${targetTime}:00`);

  function update() {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (isNaN(diff)) {
      display.textContent = t('family.dateTbd', null, 'Fecha por confirmar');
      return;
    }

    if (diff <= 0) {
      display.textContent = t('family.matchLiveFinished', null, '¡En juego / Finalizado!');
      display.style.color = '#34d399';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      display.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      display.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

function renderTransportInfo(event, transportData, vans, players) {
  const detailsEl = document.getElementById('pub-transport-details');
  const seatsListEl = document.getElementById('pub-seats-list');
  const badgeEl = document.getElementById('pub-transport-badge');

  const evTransport = transportData[event.id] || {};
  const vanId = evTransport.vanId || 'van_1';
  const van = vans.find(v => v.id === vanId) || vans[0] || { name: 'Renault Trafic (Club)', plate: '4821 - KLP', capacity: 8 };

  if (badgeEl) {
    badgeEl.textContent = van.plate ? `${t('family.plate', null, 'Matrícula')}: ${van.plate}` : `${van.capacity} plazas`;
  }

  if (detailsEl) {
    let vanInfo = `<strong>${t('family.officialVehicle', null, 'Vehículo oficial')}:</strong> ${van.name} (${van.capacity} plazas)`;
    if (van.plate) vanInfo += ` • <strong>${t('family.plate', null, 'Matrícula')}:</strong> ${van.plate}`;
    if (evTransport.departureTime) {
      vanInfo += `<br>⏰ <strong>${t('family.departureTime', null, 'Hora de salida de la furgoneta')}:</strong> ${evTransport.departureTime}`;
    }
    if (evTransport.driver) {
      vanInfo += `<br>👤 <strong>${t('family.driver', null, 'Conductor responsable')}:</strong> ${evTransport.driver}`;
    }
    detailsEl.innerHTML = vanInfo;
  }

  if (seatsListEl) {
    seatsListEl.innerHTML = '';
    const seatMap = evTransport.seats || {};
    const assignedSeats = Object.entries(seatMap).filter(([seatKey, pid]) => pid && pid !== 'empty');

    if (assignedSeats.length === 0) {
      seatsListEl.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-muted); padding: 0.4rem 0;">
          ${t('family.seatsPending', null, 'Los asientos se asignarán antes de la salida.')}
        </div>
      `;
      return;
    }

    assignedSeats.forEach(([seatKey, playerId]) => {
      const p = players.find(x => x.id === playerId);
      if (!p) return;

      const seatLabel = t('family.seatPlaza', { seat: formatSeatKey(seatKey) }, `Plaza ${formatSeatKey(seatKey)}`);

      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.78rem;
        padding: 0.25rem 0;
        border-bottom: 1px dashed rgba(255,255,255,0.06);
      `;

      item.innerHTML = `
        <span style="color: #fff; font-weight: 600;">
          #${p.mainDorsal || '-'} ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
        </span>
        <span class="seat-badge">
          💺 ${seatLabel}
        </span>
      `;
      seatsListEl.appendChild(item);
    });
  }
}

function renderCallUpList(callUp, players, totalBus, totalCar) {
  const container = document.getElementById('pub-callup-list');
  const countBadge = document.getElementById('pub-callup-count');
  if (!container) return;
  container.innerHTML = '';

  if (countBadge) {
    countBadge.textContent = t('family.callupCount', { n: callUp.length }, `${callUp.length} convocados`);
  }

  if (callUp.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
        ${t('family.callupEmpty', null, 'La lista de convocados para este partido aún no ha sido publicada.')}
      </div>
    `;
    return;
  }

  callUp.forEach(item => {
    const p = players.find(x => x.id === item.playerId);
    if (!p) return;

    const isBus = item.transport === 'minibus';
    const playerFee = isBus ? totalBus : totalCar;
    const isPaid = item.paymentStatus === 'paid';
    const avatarUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name + '+' + p.lastName)}&background=18233c&color=fff`;

    const transportLabel = isBus ? t('family.clubVan', null, '🚐 Furgoneta del club') : t('family.privateCar', null, '🚗 Coche particular');

    const row = document.createElement('div');
    row.className = 'family-player-row';

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
        <img src="${avatarUrl}" alt="${p.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(255,255,255,0.15);" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=18233c&color=fff'">
        <div style="min-width: 0;">
          <div style="font-weight: 700; color: #fff; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            #${p.mainDorsal || '-'} ${escapeHTML(p.name)} ${escapeHTML(p.lastName)}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; gap: 0.4rem; align-items: center; margin-top: 1px;">
            <span style="color: var(--accent-cyan); font-weight: 600;">${p.mainPosition || 'JUG'}</span>
            <span>•</span>
            <span>${transportLabel}</span>
          </div>
        </div>
      </div>

      <div style="text-align: right; flex-shrink: 0;">
        <div style="font-size: 0.88rem; font-weight: 800; color: ${isBus ? 'var(--accent-cyan)' : '#fbbf24'};">
          ${playerFee.toFixed(2).replace('.', ',')} €
        </div>
        <div style="margin-top: 2px;">
          ${isPaid ? `
            <span style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">
              ${t('family.paid', null, '🟢 Pagado')}
            </span>
          ` : `
            <span style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">
              ${t('family.pending', null, '⏳ Pendiente')}
            </span>
          `}
        </div>
      </div>
    `;

    container.appendChild(row);
  });
}

function formatSeatKey(key) {
  if (!key) return '-';
  return key.replace('seat_', '').toUpperCase();
}

function formatMatchDate(dateStr) {
  if (!dateStr) return '--/--/----';
  const parts = String(dateStr).trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD/MM/YYYY
      const y = parts[0];
      const m = String(parseInt(parts[1], 10)).padStart(2, '0');
      const d = String(parseInt(parts[2], 10)).padStart(2, '0');
      return `${d}/${m}/${y}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY o DD/MM/YYYY -> DD/MM/YYYY
      const d = String(parseInt(parts[0], 10)).padStart(2, '0');
      const m = String(parseInt(parts[1], 10)).padStart(2, '0');
      const y = parts[2];
      return `${d}/${m}/${y}`;
    }
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
