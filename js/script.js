(function () {
  // Si una foto externa no llega a cargar, se sustituye por un marcador
  // elegante en vez de mostrar el icono de imagen rota.
  var placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#f1e8dc"/>' +
    '<g fill="none" stroke="#a8492f" stroke-width="2" opacity="0.6">' +
    '<circle cx="200" cy="150" r="34"/>' +
    '<path d="M170 165 L190 140 L215 160 L235 130 L260 165" />' +
    '</g></svg>'
  );

  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = 'true';
      img.src = placeholder;
      img.classList.add('img-fallback');
    });
  });

  var windowButtons = document.querySelectorAll('[data-target]');
  var windows = document.querySelectorAll('.window');
  var navButtons = document.querySelectorAll('.window-nav__btn');

  function showWindow(name) {
    windows.forEach(function (win) {
      win.classList.toggle('is-active', win.dataset.window === name);
    });
    navButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.target === name);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  windowButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showWindow(btn.dataset.target);
    });
  });

  // Filtro de categorías dentro de La Carta
  var categoryButtons = document.querySelectorAll('.category-nav__btn');
  var categories = document.querySelectorAll('.menu-category');

  categoryButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.dataset.category;

      categoryButtons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      categories.forEach(function (cat) {
        cat.style.display = (target === 'all' || cat.dataset.category === target) ? '' : 'none';
      });
    });
  });
})();
