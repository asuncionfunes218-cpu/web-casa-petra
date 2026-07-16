(function () {
  // Si una foto externa no llega a cargar, se sustituye por un marcador
  // elegante en vez de mostrar el icono de imagen rota.
  var placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#f5e9d8"/>' +
    '<g fill="none" stroke="#b3241c" stroke-width="2" opacity="0.6">' +
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
  }

  windowButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showWindow(btn.dataset.target);
    });
  });

  // ===== Configurador "Hazte tu Pizza" =====
  var fmt = function (n) {
    return n.toFixed(2).replace('.', ',') + ' €';
  };

  var selection = { masa: null, tamano: null, base: null, toppings: [] };

  var singleGroups = document.querySelectorAll('.option-group[data-type="single"]');
  singleGroups.forEach(function (group) {
    var groupName = group.dataset.group;
    var chips = group.querySelectorAll('.option-chip');
    chips.forEach(function (chip) {
      if (chip.classList.contains('is-active')) {
        selection[groupName] = { label: chip.dataset.value, price: parseFloat(chip.dataset.price) };
      }
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        selection[groupName] = { label: chip.dataset.value, price: parseFloat(chip.dataset.price) };
        renderSummary();
      });
    });
  });

  var multiGroups = document.querySelectorAll('.option-group[data-type="multi"]');
  multiGroups.forEach(function (group) {
    var chips = group.querySelectorAll('.option-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var value = chip.dataset.value;
        var price = parseFloat(chip.dataset.price);
        var idx = selection.toppings.findIndex(function (t) { return t.label === value; });
        if (idx > -1) {
          selection.toppings.splice(idx, 1);
          chip.classList.remove('is-active');
        } else {
          selection.toppings.push({ label: value, price: price });
          chip.classList.add('is-active');
        }
        renderSummary();
      });
    });
  });

  var listEl = document.getElementById('builder-summary-list');
  var priceEl = document.getElementById('builder-summary-price');
  var submitBtn = document.getElementById('builder-submit');

  function renderSummary() {
    if (!listEl) return;

    var items = [];
    if (selection.tamano) items.push(selection.tamano);
    if (selection.masa && selection.masa.price > 0) items.push(selection.masa);
    if (selection.base && selection.base.price > 0) items.push(selection.base);
    selection.toppings.forEach(function (t) { items.push(t); });

    listEl.innerHTML = '';
    if (items.length === 0) {
      listEl.innerHTML = '<li class="builder__summary-empty">Empieza a elegir arriba…</li>';
    } else {
      items.forEach(function (item) {
        var li = document.createElement('li');
        var priceLabel = item.price > 0 ? '+' + fmt(item.price) : 'Incluido';
        li.innerHTML = '<span>' + item.label + '</span><span>' + priceLabel + '</span>';
        listEl.appendChild(li);
      });
    }

    var total = (selection.tamano ? selection.tamano.price : 0)
      + (selection.masa ? selection.masa.price : 0)
      + (selection.base ? selection.base.price : 0)
      + selection.toppings.reduce(function (sum, t) { return sum + t.price; }, 0);

    priceEl.textContent = fmt(total);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var originalText = submitBtn.textContent;
      submitBtn.textContent = '¡Añadida al pedido! 🍕';
      submitBtn.disabled = true;
      setTimeout(function () {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 2200);
    });
  }

  renderSummary();
})();
