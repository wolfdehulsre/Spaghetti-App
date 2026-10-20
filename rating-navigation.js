(() => {
  let highlighted, timer;
  window.RatingNavigation = {
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
