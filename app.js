const STORAGE_KEY = 'beste-belgische-bolognaise-ratings';
const GEOCODER_KEY = 'beste-belgische-bolognaise-geoapify-key';
const ratingNames = { sauce: 'Sauce', texture: 'Texture', portion: 'Portion' };
const extras = [
  ['cheese', 'Enough cheese'],
  ['hotSauce', 'Hot sauce'],
  ['gratinated', 'Gratinated'],
  ['location', 'Great location'],
  ['hospitality', 'Warm hospitality']
];
let ratings = readRatings();
let selectedScores = { sauce: 0, texture: 0, portion: 0 };
let map;
let draftMarker;
let choosingLocation = false;
let editingId = null;
let searchTimer;
let searchController;
let placeSuggestions = [];
let showAllRatings = false;
const mapMarkers = new Map();

function readRatings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function makeScoreButtons() {
  document.querySelectorAll('.score-options').forEach(group => {
    const key = group.dataset.score;
    group.innerHTML = [1, 2, 3, 4, 5].map(score =>
      `<button class="score-button" type="button" role="radio" aria-checked="false" aria-label="${score} out of 5" data-value="${score}">${score}</button>`
    ).join('');
    group.addEventListener('click', event => {
      const button = event.target.closest('.score-button');
      if (!button) return;
      selectedScores[key] = Number(button.dataset.value);
      group.querySelectorAll('.score-button').forEach(item => item.setAttribute('aria-checked', String(item === button)));
    });
    group.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = Math.max(1, Math.min(5, (selectedScores[key] || 0) + (event.key === 'ArrowRight' ? 1 : -1)));
      group.querySelector(`[data-value="${next}"]`).click();
      group.querySelector(`[data-value="${next}"]`).focus();
    });
  });
}

function averageOf(rating) {
  return (rating.sauce + rating.texture + rating.portion) / 3;
}

function render() {
  const count = ratings.length;
  document.querySelector('#stat-count').textContent = count;
  document.querySelector('#nav-count').textContent = count;
  document.querySelector('#list-count').textContent = `${count} ${count === 1 ? 'plate' : 'plates'}`;
  document.querySelector('#stat-average').textContent = count ? (ratings.reduce((sum, rating) => sum + averageOf(rating), 0) / count).toFixed(1) : '—';
  const mappedCount = ratings.filter(rating => Number.isFinite(rating.lat) && Number.isFinite(rating.lng)).length;
  document.querySelector('#map-count').textContent = `${mappedCount} ${mappedCount === 1 ? 'place' : 'places'}`;
  const list = document.querySelector('#ratings-list');
  if (!count) {
    list.innerHTML = '<div class="empty-state"><span class="empty-plate" aria-hidden="true">🍝</span><strong>Your first plate awaits.</strong><p>Save a rating and your personal bolognaise guide will start taking shape.</p></div>';
  } else {
    const sortedRatings = [...ratings].sort((a, b) => b.date.localeCompare(a.date));
    const visibleRatings = showAllRatings ? sortedRatings : sortedRatings.slice(0, 3);
    list.innerHTML = visibleRatings.map(rating => {
    const tags = extras.filter(([key]) => rating[key]).map(([, label]) => `<span class="tag">${escapeHtml(label)}</span>`).join('');
    const scores = Object.entries(ratingNames).map(([key, label]) => `<span>${label} <b>${rating[key]}/5</b></span>`).join('');
    const date = new Date(`${rating.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const address = rating.address ? `<div class="card-location">${escapeHtml(rating.address)}</div>` : '';
    const mapLink = Number.isFinite(rating.lat) && Number.isFinite(rating.lng) ? `<button class="card-action-button" type="button" data-show-map="${escapeHtml(rating.id)}">Show on map</button>` : '';
    return `<article class="rating-card" id="rating-${escapeHtml(rating.id)}"><div class="card-top"><div><div class="card-name">${escapeHtml(rating.restaurant)}</div><div class="card-date">${escapeHtml(date)}</div>${address}</div><div class="card-score">${averageOf(rating).toFixed(1)}<small> / 5</small></div></div><div class="score-summary">${scores}</div>${tags ? `<div class="tag-list">${tags}</div>` : ''}<div class="card-actions">${mapLink}<button class="card-action-button" type="button" data-edit="${escapeHtml(rating.id)}">Edit</button></div><button class="delete-button" type="button" data-delete="${escapeHtml(rating.id)}" aria-label="Delete rating for ${escapeHtml(rating.restaurant)}">Remove</button></article>`;
    }).join('');
    if (sortedRatings.length > 3) {
      list.insertAdjacentHTML('beforeend', `<button class="show-more-button" type="button" data-show-more aria-expanded="${showAllRatings}">${showAllRatings ? 'Show less' : `Show more (${sortedRatings.length - 3})`}</button>`);
    }
  }
  renderMarkers();
}

function initializeMap() {
  if (!window.L) {
    document.querySelector('#map-help').textContent = 'The map library could not load. Check your internet connection and refresh to view the map.';
    return;
  }
  map = L.map('belgium-map', { scrollWheelZoom: false }).setView([50.65, 4.65], 8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);
  map.on('click', event => {
    if (!choosingLocation) return;
    const { lat, lng } = event.latlng;
    document.querySelector('[name="lat"]').value = lat.toFixed(6);
    document.querySelector('[name="lng"]').value = lng.toFixed(6);
    if (draftMarker) draftMarker.remove();
    draftMarker = L.marker([lat, lng]).addTo(map).bindPopup('New restaurant location').openPopup();
    choosingLocation = false;
    document.querySelector('#choose-location').textContent = 'Change map pin';
    document.querySelector('#pin-status').textContent = 'Pin selected';
    document.querySelector('#map-help').textContent = 'Pin selected. Save this rating to add it to your map.';
  });
  renderMarkers();
  setTimeout(() => map.invalidateSize(), 0);
}

function renderMarkers() {
  if (!map) return;
  mapMarkers.forEach(marker => marker.remove());
  mapMarkers.clear();
  const mappedRatings = ratings.filter(rating => Number.isFinite(rating.lat) && Number.isFinite(rating.lng));
  mappedRatings.forEach(rating => {
    const marker = L.marker([rating.lat, rating.lng]).addTo(map);
    const date = new Date(`${rating.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    marker.bindPopup(`<strong>${escapeHtml(rating.restaurant)}</strong><br>${escapeHtml(rating.address || 'Belgium')}<br>${averageOf(rating).toFixed(1)} / 5 · ${escapeHtml(date)}<br><a href="#rating-${encodeURIComponent(rating.id)}">View rating</a>`);
    mapMarkers.set(rating.id, marker);
  });
  if (mappedRatings.length > 1) map.fitBounds(L.featureGroup([...mapMarkers.values()]).getBounds().pad(0.14), { maxZoom: 11 });
  else if (mappedRatings.length === 1) map.setView([mappedRatings[0].lat, mappedRatings[0].lng], 13);
}

document.querySelector('[name="date"]').value = new Date().toLocaleDateString('en-CA');
document.querySelector('#geoapify-key').value = localStorage.getItem(GEOCODER_KEY) || '';
document.querySelector('#api-key-status').textContent = localStorage.getItem(GEOCODER_KEY) ? 'Key saved in this browser.' : 'No key saved yet.';
makeScoreButtons();
initializeMap();
render();

function hideSuggestions() {
  const box = document.querySelector('#place-suggestions');
  box.hidden = true;
  box.innerHTML = '';
  placeSuggestions = [];
  document.querySelector('#address-input').setAttribute('aria-expanded', 'false');
}

function choosePlace(place) {
  const addressInput = document.querySelector('#address-input');
  const address = place.formatted || place.address_line1 || place.name || '';
  addressInput.value = address;
  document.querySelector('[name="lat"]').value = Number(place.lat).toFixed(6);
  document.querySelector('[name="lng"]').value = Number(place.lon).toFixed(6);
  hideSuggestions();
  document.querySelector('#place-search-status').textContent = `Location selected: ${address}`;
  document.querySelector('#pin-status').textContent = 'Pin selected from search';
  document.querySelector('#choose-location').textContent = 'Change map pin';
  if (map && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon))) {
    if (draftMarker) draftMarker.remove();
    draftMarker = L.marker([Number(place.lat), Number(place.lon)]).addTo(map).bindPopup(escapeHtml(place.name || address));
    map.setView([Number(place.lat), Number(place.lon)], 15);
  }
}

document.querySelector('#address-input').addEventListener('input', event => {
  const query = event.currentTarget.value.trim();
  document.querySelector('[name="lat"]').value = '';
  document.querySelector('[name="lng"]').value = '';
  if (draftMarker) { draftMarker.remove(); draftMarker = null; }
  document.querySelector('#pin-status').textContent = 'No map pin selected';
  document.querySelector('#choose-location').textContent = 'Choose spot on map';
  if (searchTimer) clearTimeout(searchTimer);
  if (searchController) searchController.abort();
  hideSuggestions();
  if (query.length < 3) {
    document.querySelector('#place-search-status').textContent = query ? 'Type at least 3 characters to search.' : 'Choose a suggestion to set the map pin automatically.';
    return;
  }
  const apiKey = localStorage.getItem(GEOCODER_KEY);
  if (!apiKey) {
    document.querySelector('#place-search-status').textContent = 'Add a Geoapify key under “Set up place search” to search places.';
    return;
  }
  document.querySelector('#place-search-status').textContent = 'Searching places in Belgium…';
  searchTimer = setTimeout(async () => {
    searchController = new AbortController();
    const params = new URLSearchParams({ text: query, filter: 'countrycode:be', format: 'json', limit: '6', apiKey });
    try {
      const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal: searchController.signal });
      if (!response.ok) throw new Error(`Search failed (${response.status})`);
      const data = await response.json();
      placeSuggestions = (data.results || []).filter(item => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)));
      const box = document.querySelector('#place-suggestions');
      if (!placeSuggestions.length) {
        document.querySelector('#place-search-status').textContent = 'No matching places found. You can enter a town or choose a map pin instead.';
        return;
      }
      box.innerHTML = placeSuggestions.map((item, index) => `<button type="button" role="option" aria-selected="false" class="place-suggestion" data-place-index="${index}"><strong>${escapeHtml(item.name || item.address_line1 || item.formatted)}</strong><span>${escapeHtml(item.address_line2 || item.city || item.formatted)}</span></button>`).join('');
      box.hidden = false;
      document.querySelector('#address-input').setAttribute('aria-expanded', 'true');
      document.querySelector('#place-search-status').textContent = 'Choose the matching place from the list.';
    } catch (error) {
      if (error.name === 'AbortError') return;
      document.querySelector('#place-search-status').textContent = 'Place search could not connect. Check your API key and internet connection.';
    }
  }, 450);
});

document.querySelector('#place-suggestions').addEventListener('click', event => {
  const option = event.target.closest('[data-place-index]');
  if (option) choosePlace(placeSuggestions[Number(option.dataset.placeIndex)]);
});

document.querySelector('#save-api-key').addEventListener('click', () => {
  const key = document.querySelector('#geoapify-key').value.trim();
  if (key) {
    localStorage.setItem(GEOCODER_KEY, key);
    document.querySelector('#api-key-status').textContent = 'Key saved in this browser.';
    document.querySelector('#place-search-status').textContent = 'Place search is ready. Type a restaurant or address above.';
    if (document.querySelector('#address-input').value.trim().length >= 3) {
      document.querySelector('#address-input').dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    localStorage.removeItem(GEOCODER_KEY);
    document.querySelector('#api-key-status').textContent = 'Saved key removed.';
    hideSuggestions();
  }
});

document.querySelector('#choose-location').addEventListener('click', () => {
  if (!map) return;
  choosingLocation = true;
  document.querySelector('#pin-status').textContent = 'Tap the map to drop a pin';
  document.querySelector('#map-help').textContent = 'Tap or click the map to place this restaurant’s pin. Zoom and drag first if you need a closer view.';
  document.querySelector('#belgium-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

function resetEditor() {
  const form = document.querySelector('#rating-form');
  editingId = null;
  form.reset();
  form.elements.date.value = new Date().toLocaleDateString('en-CA');
  form.elements.lat.value = '';
  form.elements.lng.value = '';
  selectedScores = { sauce: 0, texture: 0, portion: 0 };
  document.querySelectorAll('.score-button').forEach(button => button.setAttribute('aria-checked', 'false'));
  document.querySelector('#form-title').textContent = 'Rate a plate';
  document.querySelector('.submit-button').firstChild.textContent = 'Save this plate ';
  document.querySelector('#cancel-edit').hidden = true;
  document.querySelector('#pin-status').textContent = 'No map pin selected';
  document.querySelector('#choose-location').textContent = 'Choose spot on map';
  document.querySelector('#place-search-status').textContent = 'Choose a suggestion to set the map pin automatically.';
  if (draftMarker) { draftMarker.remove(); draftMarker = null; }
  choosingLocation = false;
  hideSuggestions();
}

function beginEdit(id) {
  const rating = ratings.find(item => item.id === id);
  if (!rating) return;
  editingId = id;
  const form = document.querySelector('#rating-form');
  form.elements.restaurant.value = rating.restaurant;
  form.elements.date.value = rating.date;
  form.elements.address.value = rating.address || '';
  form.elements.lat.value = Number.isFinite(rating.lat) ? rating.lat : '';
  form.elements.lng.value = Number.isFinite(rating.lng) ? rating.lng : '';
  selectedScores = { sauce: rating.sauce, texture: rating.texture, portion: rating.portion };
  Object.entries(selectedScores).forEach(([key, score]) => {
    document.querySelectorAll(`[data-score="${key}"] .score-button`).forEach(button => button.setAttribute('aria-checked', String(Number(button.dataset.value) === score)));
  });
  extras.forEach(([key]) => { form.elements[key].checked = Boolean(rating[key]); });
  document.querySelector('#form-title').textContent = 'Edit your rating';
  document.querySelector('.submit-button').firstChild.textContent = 'Save changes ';
  document.querySelector('#cancel-edit').hidden = false;
  document.querySelector('#pin-status').textContent = Number.isFinite(rating.lat) ? 'Saved map pin selected' : 'No map pin selected';
  document.querySelector('#choose-location').textContent = Number.isFinite(rating.lat) ? 'Change map pin' : 'Choose spot on map';
  document.querySelector('#place-search-status').textContent = Number.isFinite(rating.lat) ? 'Search for a new place or change the map pin.' : 'Search for a place to set a map pin.';
  if (draftMarker) { draftMarker.remove(); draftMarker = null; }
  if (map && Number.isFinite(rating.lat) && Number.isFinite(rating.lng)) {
    draftMarker = L.marker([rating.lat, rating.lng]).addTo(map).bindPopup(escapeHtml(rating.restaurant));
    map.setView([rating.lat, rating.lng], 14);
  }
  hideSuggestions();
  document.querySelector('#form-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.elements.restaurant.focus({ preventScroll: true });
}

document.querySelector('#cancel-edit').addEventListener('click', resetEditor);

document.querySelector('#rating-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (Object.values(selectedScores).some(score => score < 1 || score > 5)) {
    document.querySelector('.rating-fields').scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('.rating-fields').setAttribute('aria-label', 'Please choose a score for sauce, pasta texture, and portion');
    return;
  }
  const values = new FormData(form);
  const rating = {
    id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    restaurant: String(values.get('restaurant')).trim(),
    date: String(values.get('date')),
    address: String(values.get('address') || '').trim(),
    lat: values.get('lat') ? Number(values.get('lat')) : null,
    lng: values.get('lng') ? Number(values.get('lng')) : null,
    ...selectedScores,
    ...Object.fromEntries(extras.map(([key]) => [key, form.elements[key].checked]))
  };
  if (editingId) ratings = ratings.map(item => item.id === editingId ? rating : item);
  else ratings.push(rating);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  document.querySelector('#map-help').textContent = 'Choose “Choose spot on map” while adding a rating, then tap the map to place its pin. You can zoom and drag to find the restaurant.';
  resetEditor();
  render();
  document.querySelector('#ratings').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#ratings-list').addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    beginEdit(editButton.dataset.edit);
    return;
  }
  const mapButton = event.target.closest('[data-show-map]');
  if (mapButton && mapMarkers.has(mapButton.dataset.showMap)) {
    const marker = mapMarkers.get(mapButton.dataset.showMap);
    const mapElement = document.querySelector('#belgium-map');
    mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mapElement.focus({ preventScroll: true });
    map.setView(marker.getLatLng(), 14);
    marker.openPopup();
    return;
  }
  const moreButton = event.target.closest('[data-show-more]');
  if (moreButton) {
    showAllRatings = !showAllRatings;
    render();
    return;
  }
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  ratings = ratings.filter(rating => rating.id !== button.dataset.delete);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  if (editingId === button.dataset.delete) resetEditor();
  render();
});
