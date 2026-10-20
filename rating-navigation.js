(() => {
  let highlighted, timer;
  window.RatingNavigation = {
    popup(rows) {
      const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const addresses = [...new Set(rows.map(row => row.address).filter(Boolean))];
      return '<div class="popup-ratings">' +
        (addresses.length ? '<div class="popup-location" data-i18n-skip>' + esc(addresses.join(' · ')) + '</div>' : '') +
        rows.map(row => '<button type="button" class="popup-rating-row" data-rating="' + esc(row.id) + '">' +
          '<span class="popup-rating-name" data-i18n-skip>' + esc(row.name) + '</span>' +
          '<span class="popup-rating-score" data-i18n-skip>' + esc(row.score) + '/5 <span aria-hidden="true">›</span></span>' +
          '<span class="popup-rating-meta" data-i18n-skip>' + esc(row.author) + ' · ' + esc(row.date) + '</span>' +
          '</button>').join('') + '</div>';
    },
    groupLocations(rows, coordinates) {
      const restaurants = new Map(), locations = new Map();
      rows.forEach(row => {
        if (!restaurants.has(row.restaurant_id)) restaurants.set(row.restaurant_id, []);
        restaurants.get(row.restaurant_id).push(row);
      });
      restaurants.forEach(ratings => {
        const [lat, lng] = coordinates(ratings[0]);
        const key = Number(lat) + ',' + Number(lng);
        if (!locations.has(key)) locations.set(key, []);
        locations.get(key).push(...ratings);
      });
      return locations;
    },
    bind(popup, map, reveal) {
      popup.onclick = event => {
        const button = event.target.closest('[data-rating]');
        if (!button) return;
        const id = 'rating-' + button.dataset.rating;
        map.closePopup();
        if (!document.getElementById(id)) reveal?.();
        const card = document.getElementById(id);
        if (!card) return;
        clearTimeout(timer);
        highlighted?.classList.remove('rating-highlight');
        highlighted = card;
        card.classList.add('rating-highlight');
        card.focus({ preventScroll: true });
        card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        timer = setTimeout(() => {
          card.classList.remove('rating-highlight');
          highlighted = null;
        }, 2500);
      };
    }
  };
})();
