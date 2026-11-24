const form = document.querySelector('#search-form');
const filterToggle = document.querySelector('.filter-toggle');
const mobileLayout = window.matchMedia('(max-width: 650px)');
const resultsList = document.querySelector('#results-list');
const resultsCount = document.querySelector('#results-count');
const resultsPeriod = document.querySelector('#results-period');
const resultsTitle = document.querySelector('#results-title');
const emptyResults = document.querySelector('#empty-results');
const timeError = document.querySelector('#time-error');
const detailsView = document.querySelector('#details-view');
const reservationsList = document.querySelector('#reservations-list');
const bookingNotice = document.querySelector('#booking-notice');
const views = {
  rooms: document.querySelector('#rooms-view'),
  details: detailsView,
  reservations: document.querySelector('#reservations-view'),
};

const dateFormat = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw',
});

const reservations = [];
let criteria = { date: demoDate, start: '10:00', end: '11:30', capacity: 6, equipment: [] };
let mobileFiltersOpen = false;
let justBooked = null;

function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function formatDate(date) {
  return dateFormat.format(new Date(`${date}T12:00:00Z`));
}

function formatTime({ start, end }) {
  return `${start}–${end}`;
}

function formatPeriod(period) {
  return `${formatDate(period.date)} · ${formatTime(period)}`;
}

function busyPeriods(room, date) {
  return [...room.schedule, ...reservations.filter((item) => item.roomId === room.id)]
    .filter((period) => period.date === date);
}

function overlaps(first, second) {
  return first.start < second.end && second.start < first.end;
}

function isAvailable(room, period) {
  return !busyPeriods(room, period.date).some((busy) => overlaps(busy, period));
}

function renderEquipment(items) {
  return items.map((key) => {
    const item = equipment[key];
    return `<li class="inline-icon">${icon(item.icon)}${item.label}</li>`;
  }).join('');
}

function availabilityBadge(available) {
  if (available) {
    return '<span class="status status-available">Wolna</span>';
  }
  return '<span class="status">Zajęta</span>';
}

function renderRoomRow({ room, available }) {
  return `
    <li class="room-row">
      <span class="room-icon">${icon('room')}</span>
      <div><h3>Sala ${room.number}</h3><p class="room-location">${room.location}</p></div>
      <ul class="room-features equipment-list" aria-label="Pojemność i wyposażenie">
        <li class="inline-icon">${icon('people')}${room.capacity} miejsc</li>
        ${renderEquipment(room.equipment)}
      </ul>
      ${availabilityBadge(available)}
      <a class="button button-secondary room-action" href="#sale/${room.id}" aria-label="Szczegóły sali ${room.number}">Szczegóły${icon('arrow-right')}</a>
    </li>`;
}

function renderResults() {
  const matches = rooms.filter((room) => room.capacity >= criteria.capacity &&
    criteria.equipment.every((item) => room.equipment.includes(item)));
  const results = matches.map((room) => ({ room, available: isAvailable(room, criteria) }));
  results.sort((first, second) => Number(second.available) - Number(first.available));
  const availableCount = results.filter((result) => result.available).length;

  resultsPeriod.textContent = formatPeriod(criteria);
  resultsCount.textContent = results.length ? `Wolne: ${availableCount} z ${results.length}` : 'Brak wyników';
  resultsList.innerHTML = results.map(renderRoomRow).join('');
  resultsList.hidden = results.length === 0;
  emptyResults.hidden = results.length > 0;
}

function updateFilterVisibility() {
  const open = !mobileLayout.matches || mobileFiltersOpen;
  filterToggle.setAttribute('aria-expanded', String(open));
  form.hidden = !open;
}

function initializeSearch() {
  const hours = [];
  const firstHour = Number(openingTime.slice(0, 2));
  const lastHour = Number(closingTime.slice(0, 2));

  for (let hour = firstHour; hour < lastHour; hour += 1) {
    const hourLabel = String(hour).padStart(2, '0');
    hours.push(`${hourLabel}:00`, `${hourLabel}:30`);
  }
  hours.push(closingTime);

  for (const name of ['start', 'end']) {
    const options = name === 'start' ? hours.slice(0, -1) : hours.slice(1);
    form.elements[name].replaceChildren(...options.map((time) => new Option(time, time)));
    form.elements[name].value = criteria[name];
  }
  form.elements.date.value = criteria.date;
  form.elements.capacity.value = criteria.capacity;

  document.querySelector('#equipment-options').innerHTML = Object.entries(equipment).map(([key, item]) => `
    <label class="chip">
      <input type="checkbox" name="equipment" value="${key}">
      <span>${icon(item.icon, 'equipment-icon')}${icon('check', 'chip-check')}${item.label}</span>
    </label>`).join('');

  filterToggle.addEventListener('click', () => {
    mobileFiltersOpen = !mobileFiltersOpen;
    updateFilterVisibility();
  });

  mobileLayout.addEventListener('change', updateFilterVisibility);
  updateFilterVisibility();
}

function setTimeError(invalid) {
  timeError.hidden = !invalid;
  if (invalid) {
    form.elements.end.setAttribute('aria-invalid', 'true');
  } else {
    form.elements.end.removeAttribute('aria-invalid');
  }
}

function readCriteria() {
  const values = new FormData(form);
  return {
    date: values.get('date'),
    start: values.get('start'),
    end: values.get('end'),
    capacity: Number(values.get('capacity')),
    equipment: values.getAll('equipment'),
  };
}

function applySearch(event) {
  event.preventDefault();
  const nextCriteria = readCriteria();
  const invalidTime = nextCriteria.end <= nextCriteria.start;
  setTimeError(invalidTime);

  if (invalidTime) {
    form.elements.end.focus();
    return;
  }

  criteria = nextCriteria;
  renderResults();
  if (mobileLayout.matches) {
    mobileFiltersOpen = false;
    updateFilterVisibility();
    resultsTitle.focus();
  }
}

function renderDay(room, available) {
  const busy = busyPeriods(room, criteria.date);
  const boundaries = new Set([openingTime, closingTime]);

  for (const period of busy) {
    boundaries.add(period.start);
    boundaries.add(period.end);
  }
  if (available) {
    boundaries.add(criteria.start);
    boundaries.add(criteria.end);
  }

  const times = [...boundaries].sort();
  return times.slice(0, -1).map((start, index) => {
    const slot = { start, end: times[index + 1] };
    const selected = available && slot.start === criteria.start && slot.end === criteria.end;
    const status = selected
      ? '<span class="status status-selected">Wybrany termin</span>'
      : availabilityBadge(!busy.some((period) => overlaps(period, slot)));

    return `<li class="slot${selected ? ' slot-selected' : ''}"><span>${formatTime(slot)}</span>${status}</li>`;
  }).join('');
}

function renderDetails(room) {
  const available = isAvailable(room, criteria);
  detailsView.innerHTML = `
    <div class="page-heading">
      <a class="inline-icon back-link" href="#sale">${icon('arrow-left')}Wróć do wyników</a>
      <h1 id="details-title" tabindex="-1">Sala ${room.number}</h1>
      <div class="meta">
        <span class="inline-icon">${icon('building')}${room.location}</span>
        <span class="inline-icon">${icon('people')}${room.capacity} miejsc</span>
      </div>
    </div>
    <div class="detail-grid">
      <div>
        <section class="panel detail-panel">
          <h2>Dostępność w ciągu dnia</h2>
          <p class="muted">${formatDate(criteria.date)}</p>
          <ul class="slot-list">${renderDay(room, available)}</ul>
        </section>
        <section class="panel detail-panel">
          <h2>Wyposażenie</h2>
          <ul class="equipment-list">${renderEquipment(room.equipment)}</ul>
        </section>
      </div>
      <section class="panel detail-panel summary-panel">
        <h2>Twój termin</h2>
        <dl>
          <div><dt>Data</dt><dd>${formatDate(criteria.date)}</dd></div>
          <div><dt>Godziny</dt><dd>${formatTime(criteria)}</dd></div>
          <div><dt>Liczba osób</dt><dd>${criteria.capacity}</dd></div>
        </dl>
        ${availabilityBadge(available)}
        <button id="reserve" class="button button-primary" type="button"${available ? '' : ' disabled'}>
          Zarezerwuj${icon('arrow-right')}
        </button>
        ${available ? '' : '<p class="muted">Wybierz inny termin, aby zarezerwować tę salę.</p>'}
      </section>
    </div>`;

  document.querySelector('#reserve').addEventListener('click', () => bookRoom(room));
}

function bookRoom(room) {
  if (!isAvailable(room, criteria)) {
    renderDetails(room);
    return;
  }

  justBooked = {
    roomId: room.id, number: room.number, location: room.location,
    date: criteria.date, start: criteria.start, end: criteria.end,
  };
  reservations.unshift(justBooked);
  window.location.hash = 'rezerwacje';
}

function renderReservations() {
  reservationsList.innerHTML = reservations.map((item) => `
    <li class="room-row reservation-row">
      <span class="room-icon">${icon('calendar')}</span>
      <div>
        <h3>Sala ${item.number}</h3>
        <p class="room-location">${item.location}</p>
        <p class="room-location">${formatPeriod(item)}</p>
      </div>
      <span class="status status-available">Potwierdzona</span>
    </li>`).join('');

  reservationsList.hidden = reservations.length === 0;
  document.querySelector('#empty-reservations').hidden = reservations.length > 0;
  bookingNotice.hidden = !justBooked;
  bookingNotice.innerHTML = justBooked
    ? `${icon('check')}<div><strong>Rezerwacja potwierdzona</strong><p>Sala ${justBooked.number} · ${formatPeriod(justBooked)}</p></div>`
    : '';
  justBooked = null;
}

function renderRoute(focusHeading = true) {
  const route = window.location.hash.slice(1);
  const room = rooms.find((item) => route === `sale/${item.id}`);
  let active = 'rooms';
  let title = 'Szukaj sali';

  if (room) {
    active = 'details';
    title = `Sala ${room.number}`;
  } else if (route === 'rezerwacje') {
    active = 'reservations';
    title = 'Moje rezerwacje';
  }

  for (const [name, view] of Object.entries(views)) {
    view.hidden = name !== active;
  }

  for (const link of document.querySelectorAll('[data-nav]')) {
    const current = active === 'details' ? 'rooms' : active;
    if (link.dataset.nav === current) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  if (room) renderDetails(room);
  if (active === 'rooms') renderResults();
  if (active === 'reservations') renderReservations();
  document.title = `${title} · RoomBook`;

  if (focusHeading) {
    views[active].querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

initializeSearch();
renderRoute(false);

form.addEventListener('submit', applySearch);
form.addEventListener('change', () => setTimeError(false));
window.addEventListener('hashchange', () => renderRoute());

document.querySelector('#clear-filters').addEventListener('click', () => {
  form.elements.date.value = criteria.date;
  form.elements.start.value = criteria.start;
  form.elements.end.value = criteria.end;
  form.elements.capacity.value = 1;
  for (const option of form.querySelectorAll('[name="equipment"]')) {
    option.checked = false;
  }
  criteria = readCriteria();
  setTimeError(false);
  renderResults();
  resultsTitle.focus();
});

document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('#content').focus();
});
