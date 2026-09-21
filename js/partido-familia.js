/**
 * JK NOOVA - Lógica del Portal Público de Consulta para Familias (partido.html)
 * Vista optimizada para teléfonos móviles de padres, sin opciones de edición,
 * con cuenta atrás en tiempo real, enlace de Google Maps y asiento asignado en furgoneta.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadFamilyMatchView();
});

let countdownInterval = null;

function loadFamilyMatchView() {
  if (!window.JKNoovaData || !window.JKNoovaData.StorageService) {
    document.getElementById('pub-match-title').textContent = 'Error al cargar datos del club';
    return;
  }

  const storage = window.JKNoovaData.StorageService;
  const events = storage.getEvents() || [];
  const teams = storage.getTeams() || [];
  const players = storage.getPlayers() || [];
  const transportData = storage.getTransport() || {};
  const vans = storage.getVans() || [];

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('event');

  let event = events.find(e => e.id === eventId);
  if (!event && events.length > 0) {
    event = events[0]; // Cargar el primero si no hay parámetro
  }

  if (!event) {
    document.getElementById('pub-match-title').textContent = 'No hay encuentros disponibles';
    document.getElementById('pub-match-team').textContent = 'Consulta con el cuerpo técnico de JK Noova';
    return;
  }

  const team = teams.find(t => t.id === event.teamId) || { name: 'Equipo JK Noova', category: 'Fútbol Base' };

  // Título y categoría
  document.getElementById('pub-match-title').textContent = event.title || `JK Noova vs ${event.rival}`;
  document.getElementById('pub-match-team').textContent = `${team.name} • ${team.category || 'Competición oficial'}`;

  // Fecha y hora
  const formattedDate = formatMatchDate(event.date);
  const timeText = event.time ? `a las ${event.time} h` : '';
  document.getElementById('pub-match-datetime').textContent = `${formattedDate} ${timeText}`;

  // Iniciar cuenta atrás
  startCountdown(event.date, event.time);

  // Ubicación y enlace a Google Maps
  const loc = event.location || 'Campo de fútbol';
  document.getElementById('pub-match-location').textContent = loc;
  const mapsBtn = document.getElementById('pub-maps-button');
  if (mapsBtn) {
    mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  }

  // Precios y cálculo de cuotas (Fórmula JK Noova)
  const callUp = event.callUp || [];
  const tournamentPrice = event.tournamentPrice || 0;
  const transportPrice = event.transportPrice || 0;
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
      display.textContent = 'Fecha por confirmar';
      return;
    }

    if (diff <= 0) {
      display.textContent = '¡En juego / Finalizado!';
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
    badgeEl.textContent = van.plate ? `Matrícula: ${van.plate}` : `${van.capacity} plazas`;
  }

  if (detailsEl) {
    let vanInfo = `<strong>Vehículo oficial:</strong> ${van.name} (${van.capacity} plazas)`;
    if (van.plate) vanInfo += ` • <strong>Matrícula:</strong> ${van.plate}`;
    if (evTransport.departureTime) {
      vanInfo += `<br>⏰ <strong>Hora de salida de la furgoneta:</strong> ${evTransport.departureTime}`;
    }
    if (evTransport.driver) {
      vanInfo += `<br>👤 <strong>Conductor responsable:</strong> ${evTransport.driver}`;
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
          Los asientos se asignarán antes de la salida.
        </div>
      `;
      return;
    }

    assignedSeats.forEach(([seatKey, playerId]) => {
      const p = players.find(x => x.id === playerId);
      if (!p) return;

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
          💺 Plaza ${formatSeatKey(seatKey)}
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
    countBadge.textContent = `${callUp.length} convocados`;
  }

  if (callUp.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
        La lista de convocados para este partido aún no ha sido publicada.
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
            <span>${isBus ? '🚐 Furgoneta del club' : '🚗 Coche particular'}</span>
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
              🟢 Pagado
            </span>
          ` : `
            <span style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700;">
              ⏳ Pendiente
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
  // E.g. seat_1 -> 1
  return key.replace('seat_', '').toUpperCase();
}

function formatMatchDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!d || !m || !y) return dateStr;
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${parseInt(d, 10)} de ${monthName} de ${y}`;
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
