(() => {
  let highlighted, timer;
  window.RatingNavigation = {
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
