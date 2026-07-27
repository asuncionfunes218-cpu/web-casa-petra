(function () {
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
