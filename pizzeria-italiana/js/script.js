(function () {
  // Si una foto externa no llega a cargar, se sustituye por un marcador
  // elegante en vez de mostrar el icono de imagen rota.
  var placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#ecdcc0"/>' +
    '<g fill="none" stroke="#a13a1f" stroke-width="2" opacity="0.6">' +
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

  // ===== Navegación entre ventanas =====
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
    refreshReveal();
  }

  windowButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showWindow(btn.dataset.target);
    });
  });

  // ===== Animaciones de aparición al hacer scroll =====
  var revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px 120px 0px' })
    : null;

  function refreshReveal() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
      if (revealObserver) {
        revealObserver.observe(el);
      } else {
        el.classList.add('is-visible');
      }
    });
  }
  refreshReveal();

  // Red de seguridad: por si un salto de scroll muy rápido (o un navegador
  // sin buen soporte de IntersectionObserver) deja algo sin revelar.
  var revealFallbackTicking = false;
  function revealFallbackCheck() {
    revealFallbackTicking = false;
    var vh = window.innerHeight;
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < vh + 150 && rect.bottom > -150) {
        el.classList.add('is-visible');
      }
    });
  }
  window.addEventListener('scroll', function () {
    if (!revealFallbackTicking) {
      revealFallbackTicking = true;
      requestAnimationFrame(revealFallbackCheck);
    }
  }, { passive: true });
  window.addEventListener('load', revealFallbackCheck);
  setTimeout(revealFallbackCheck, 800);

  // ===== Contadores animados =====
  var countObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: .4 })
    : null;

  function animateCount(el) {
    var target = parseFloat(el.dataset.countTo || '0');
    var suffix = el.dataset.suffix || '';
    var duration = 1300;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('[data-count-to]').forEach(function (el) {
    if (countObserver) {
      countObserver.observe(el);
    } else {
      animateCount(el);
    }
  });
})();
