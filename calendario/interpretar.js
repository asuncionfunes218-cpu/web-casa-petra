/**
 * Intérprete de lenguaje natural en español para la agenda.
 *
 *   interpretar("cena con Javi el viernes a las nueve y media", "2026-08-28")
 *   → { titulo:"Cena con Javi", fecha:"2026-09-04", hora:"21:30", categoria:"ocio", supuestos:[…] }
 *
 * Funciona igual en Node y en el navegador (la página lo lleva incrustado).
 * La estrategia es enmascarar: se van reconociendo trozos (hora, fecha,
 * categoría) y borrándolos de una copia del texto; lo que sobra es el título.
 * Así "mañana por la mañana" se resuelve solo: la franja se consume primero.
 */
(function (raiz) {
  'use strict';

  var DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var ABREV = { ene:0, feb:1, mar:2, abr:3, may:4, jun:5, jul:6, ago:7, sep:8, sept:8, oct:9, nov:10, dic:11 };

  var NUMEROS = {
    un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8,
    nueve:9, diez:10, once:11, doce:12, trece:13, catorce:14, quince:15,
    dieciseis:16, diecisiete:17, dieciocho:18, diecinueve:19, veinte:20,
    veintiuna:21, veintiuno:21, veintidos:22, veintitres:23, veinticuatro:24,
    veinticinco:25, treinta:30, cuarenta:40, cincuenta:50
  };
  // alternativa de regex ordenada de más larga a más corta
  var PAL_NUM = 'veinticuatro|veintitres|veintidos|veintiuna|veintiuno|veinticinco|diecinueve|dieciocho|diecisiete|dieciseis|cincuenta|cuarenta|treinta|quince|catorce|trece|veinte|doce|once|diez|nueve|ocho|siete|seis|cinco|cuatro|tres|dos|una|uno|un';

  // Palabras que delatan el momento del día cuando no se dice "de la tarde/noche".
  var PISTAS_FRANJA = {
    noche: ["cena", "cenar", "cenamos", "copas", "birras", "concierto", "fiesta", "peli",
            "pelicula", "cine", "serie", "partido", "teatro", "monologo", "discoteca"],
    manana: ["desayuno", "desayunar", "madrugar", "misa", "analitica", "ayunas"],
    tarde: ["merienda", "merendar", "meriendo"]
  };

  var CLAVES = {
    trabajo: ['reunion', 'reunirme', 'cliente', 'clienta', 'entrega', 'entregar', 'proyecto',
      'curro', 'trabajo', 'oficina', 'jefe', 'equipo', 'presupuesto', 'factura', 'facturar',
      'briefing', 'presentacion', 'propuesta', 'contrato', 'maquetacion', 'diseno', 'web',
      'llamada de trabajo', 'videollamada', 'onboarding', 'kickoff', 'seguimiento', 'informe'],
    ocio: ['cena', 'cenar', 'comida', 'comer', 'almuerzo', 'almorzar', 'cine', 'peli', 'pelicula', 'concierto',
      'gimnasio', 'gym', 'padel', 'futbol', 'baloncesto', 'partido', 'quedada', 'quedar',
      'cumple', 'cumpleanos', 'fiesta', 'copas', 'birras', 'cana', 'canas', 'viaje', 'playa',
      'museo', 'teatro', 'concierto', 'boda', 'barbacoa', 'ruta', 'senderismo', 'correr',
      'entreno', 'entrenamiento', 'yoga', 'piscina', 'tomar algo', 'cafe con'],
    obligaciones: ['medico', 'medica', 'dentista', 'consulta', 'cita previa', 'analitica',
      'revision', 'fisio', 'fisioterapeuta', 'psicologo', 'psicologa', 'farmacia', 'receta',
      'dni', 'pasaporte', 'banco', 'gestoria', 'gestor', 'hacienda', 'notaria', 'seguro',
      'itv', 'taller', 'renovar', 'papeleo', 'tramite', 'impuestos', 'declaracion',
      'compra', 'supermercado', 'lavadora', 'limpiar', 'limpieza', 'basura', 'recoger',
      'colada', 'plancha', 'fregar', 'veterinario', 'vacuna', 'matricula', 'pagar', 'pago',
      'alquiler', 'luz', 'agua', 'multa', 'correos', 'paquete', 'devolver']
  };

  /* ---------- utilidades ---------- */

  var TILDES = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n','à':'a','è':'e',
                 'ì':'i','ò':'o','ù':'u','â':'a','ê':'e','î':'i','ô':'o','û':'u','ç':'c' };

  /** Minúsculas sin tildes CONSERVANDO la longitud, para que los índices cuadren. */
  function aplanar(s) {
    return s.toLowerCase().replace(/[áéíóúüñàèìòùâêîôûç]/g, function (c) { return TILDES[c] || c; });
  }
  function espacios(n) { return new Array(n + 1).join(' '); }
  function numero(txt) {
    if (txt == null) return null;
    var t = String(txt).trim();
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    return NUMEROS[t] != null ? NUMEROS[t] : null;
  }
  function dosD(n) { return (n < 10 ? '0' : '') + n; }

  function aFecha(iso) { return new Date(iso + 'T12:00:00Z'); }
  function aIso(d) { return d.getUTCFullYear() + '-' + dosD(d.getUTCMonth() + 1) + '-' + dosD(d.getUTCDate()); }
  function sumarDias(iso, n) { var d = aFecha(iso); d.setUTCDate(d.getUTCDate() + n); return aIso(d); }
  function diaSemana(iso) { return aFecha(iso).getUTCDay(); }

  /* ---------- núcleo ---------- */

  function interpretar(texto, hoyIso) {
    var original = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim();
    if (!original) return null;
    var hoy = /^\d{4}-\d{2}-\d{2}$/.test(hoyIso || '') ? hoyIso : aIso(new Date());

    var w = aplanar(original);          // texto de trabajo, se va vaciando
    var cortes = [];                    // tramos consumidos, para quitarlos del título
    var supuestos = [];

    function tapar(ini, fin) {
      cortes.push([ini, fin]);
      w = w.slice(0, ini) + espacios(fin - ini) + w.slice(fin);
    }
    /** Busca re en w; si acierta, tapa el tramo y devuelve el match. */
    function pillar(re) {
      re.lastIndex = 0;
      var m = re.exec(w);
      if (!m) return null;
      m.ini = m.index;
      m.fin = m.index + m[0].length;
      tapar(m.ini, m.fin);
      return m;
    }

    /* --- 1. categoría dicha a propósito --- */
    var categoria = null;
    var mCat = pillar(/\b(?:categoria|es|de)\s+(trabajo|ocio|obligacion(?:es)?|otros)\b/);
    if (mCat) categoria = mCat[1].indexOf('obligacion') === 0 ? 'obligaciones' : mCat[1];

    /* --- 2. franja del día y hora --- */
    var franja = null;
    var hora = '';

    // "a las nueve y media de la noche" / "a las 9:30" / "21h"
    var reALas = new RegExp('\\ba\\s+la(?:s)?\\s+(' + PAL_NUM + '|\\d{1,2})(?:\\s*[:.]\\s*(\\d{2}))?(?:\\s*(?:h|hs|horas)\\b)?');
    var reReloj = /\b(\d{1,2})\s*[:.]\s*(\d{2})\b(?:\s*(?:h|hs|horas)\b)?/;
    var reHoras = /\b(\d{1,2})\s*(?:h|hs|horas)\b/;

    var mH = pillar(reALas) || pillar(reReloj) || pillar(reHoras);
    if (mH) {
      var h = numero(mH[1]);
      var min = mH[2] ? parseInt(mH[2], 10) : 0;

      // modificadores pegados a la derecha: "y media", "y cuarto", "menos cuarto", "y veinte"
      var cola = w.slice(mH.fin, mH.fin + 26);
      var mMod = new RegExp('^\\s*(?:(y)\\s+(media|cuarto|' + PAL_NUM + '|\\d{1,2})|(menos)\\s+(cuarto|' + PAL_NUM + '|\\d{1,2}))\\b').exec(cola);
      if (mMod && !mH[2]) {
        if (mMod[1]) {
          min = mMod[2] === 'media' ? 30 : mMod[2] === 'cuarto' ? 15 : (numero(mMod[2]) || 0);
        } else {
          var resta = mMod[4] === 'cuarto' ? 15 : (numero(mMod[4]) || 0);
          min = 60 - resta;
          h = h - 1;
        }
        tapar(mH.fin, mH.fin + mMod[0].length);
      }

      // franja pegada a la derecha: "de la noche", "del mediodía"
      var cola2 = w.slice(mH.fin, mH.fin + 30);
      var mFr = /^\s*(?:de|por)\s+la\s+(manana|tarde|noche|madrugada)\b/.exec(cola2)
             || /^\s*del?\s+(mediodia)\b/.exec(cola2);
      if (mFr) { franja = mFr[1]; tapar(mH.fin, mH.fin + mFr[0].length); }

      if (h != null && h >= 0 && h <= 24) {
        if (franja === 'tarde' && h < 12) h += 12;
        else if (franja === 'noche') h = h === 12 ? 0 : (h < 12 ? h + 12 : h);
        else if (franja === 'mediodia' && h < 12) h += 12;
        else if (franja === 'manana' || franja === 'madrugada') { if (h === 24) h = 0; }
        else if (!franja) {
          var pista = pistaFranja(aplanar(original));
          if (h >= 1 && h <= 7 && pista !== "manana") {
            h += 12;
            supuestos.push("He entendido las " + dosD(h) + ":" + dosD(min) + " de la tarde.");
          } else if (h >= 8 && h <= 11 && pista === "noche") {
            h += 12;
            supuestos.push("He entendido las " + dosD(h) + ":" + dosD(min) + " de la noche.");
          }
        }
        if (h === 24) h = 0;
        if (h >= 0 && h <= 23 && min >= 0 && min <= 59) hora = dosD(h) + ':' + dosD(min);
      }
    }

    // franja suelta, sin hora: "por la tarde", "esta noche"
    var fechaPista = null;
    var mFr2 = pillar(/\b(?:esta|este)\s+(manana|tarde|noche)\b/);
    if (mFr2) { franja = franja || mFr2[1]; fechaPista = hoy; }
    if (!mFr2) {
      var mFr3 = pillar(/\b(?:por|de|a)\s+la\s+(manana|tarde|noche|madrugada)\b/) || pillar(/\bal\s+(mediodia)\b/);
      if (mFr3) franja = franja || mFr3[1];
    }

    /* --- 3. fecha --- */
    var fecha = null;
    var m;

    if ((m = pillar(/\bpasado\s+manana\b/))) fecha = sumarDias(hoy, 2);
    else if ((m = pillar(/\b(?:el\s+)?(?:proximo|proxima|siguiente)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/))
          || (m = pillar(/\b(?:este|esta)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/))
          || (m = pillar(/\b(?:el\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?:\s+que\s+viene)?\b/))) {
      var objetivo = DIAS.indexOf(m[1]);
      var delta = (objetivo - diaSemana(hoy) + 7) % 7;
      var esEste = /^(?:este|esta)\b/.test(m[0]);
      if (delta === 0 && !esEste) delta = 7;
      if (/que\s+viene|proximo|proxima|siguiente/.test(m[0]) && delta < 7) delta += 0;
      fecha = sumarDias(hoy, delta);
    }
    else if ((m = pillar(/\bhoy\b/))) fecha = hoy;
    else if ((m = pillar(/\bayer\b/))) fecha = sumarDias(hoy, -1);
    else if ((m = pillar(/\bmanana\b/))) fecha = sumarDias(hoy, 1);
    else if ((m = pillar(new RegExp('\\bdentro\\s+de\\s+(' + PAL_NUM + '|\\d{1,3})\\s+(dias?|semanas?|meses?)\\b')))) {
      var n = numero(m[1]) || 1;
      fecha = /semana/.test(m[2]) ? sumarDias(hoy, n * 7)
            : /mes/.test(m[2]) ? sumarDias(hoy, n * 30)
            : sumarDias(hoy, n);
    }
    else if ((m = pillar(/\b(?:la\s+)?semana\s+que\s+viene\b/))) fecha = sumarDias(hoy, 7);
    else if ((m = pillar(/\b(?:el|este)\s+finde\b|\bel\s+fin\s+de\s+semana\b/))) {
      var d6 = (6 - diaSemana(hoy) + 7) % 7;
      fecha = sumarDias(hoy, d6 === 0 ? 0 : d6);
    }
    else if ((m = pillar(new RegExp('\\b(?:el\\s+)?(?:dia\\s+)?(\\d{1,2}|' + PAL_NUM + ')\\s+de\\s+(' + MESES.join('|') + ')(?:\\s+(?:de\\s+)?(\\d{4}))?\\b')))) {
      fecha = componer(numero(m[1]), MESES.indexOf(m[2]), m[3] ? parseInt(m[3], 10) : null, hoy);
    }
    else if ((m = pillar(/\b(?:el\s+)?(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/))) {
      var anio = m[3] ? parseInt(m[3], 10) : null;
      if (anio != null && anio < 100) anio += 2000;
      fecha = componer(parseInt(m[1], 10), parseInt(m[2], 10) - 1, anio, hoy);
    }
    else if ((m = pillar(new RegExp('\\bel\\s+(?:dia\\s+)?(\\d{1,2}|' + PAL_NUM + ')\\b')))) {
      var dia = numero(m[1]);
      if (dia >= 1 && dia <= 31) fecha = componer(dia, null, null, hoy);
    }

    if (!fecha) fecha = fechaPista || hoy;
    if (!fecha) fecha = hoy;

    /* --- 4. título con lo que queda --- */
    var titulo = limpiar(recortar(original, cortes));

    /* --- 5. categoría deducida --- */
    if (!categoria) categoria = deducir(aplanar(titulo)) || 'otros';

    if (franja && !hora) {
      supuestos.push('Has dicho "' + franja + '" pero sin hora: la dejo sin hora fija.');
    }

    return {
      titulo: titulo,
      fecha: fecha,
      hora: hora,
      categoria: categoria,
      franja: franja,
      supuestos: supuestos,
      dictado: original
    };
  }

  /** Construye una fecha a partir de día / mes / año sueltos, mirando al futuro. */
  function componer(dia, mes, anio, hoy) {
    if (dia == null || dia < 1 || dia > 31) return null;
    var base = aFecha(hoy);
    var y = anio != null ? anio : base.getUTCFullYear();
    var mm = mes != null ? mes : base.getUTCMonth();
    var d = new Date(Date.UTC(y, mm, dia, 12));
    if (d.getUTCDate() !== dia || d.getUTCMonth() !== ((mm % 12) + 12) % 12) return null;  // 31 de febrero
    if (anio == null && aIso(d) < hoy) {
      // sin año, una fecha ya pasada se entiende del mes o del año que viene
      d = mes != null ? new Date(Date.UTC(y + 1, mm, dia, 12))
                      : new Date(Date.UTC(y, mm + 1, dia, 12));
      if (d.getUTCDate() !== dia) return null;
    }
    return aIso(d);
  }

  /** Quita del texto original los tramos ya consumidos. */
  function recortar(original, cortes) {
    if (!cortes.length) return original;
    var orden = cortes.slice().sort(function (a, b) { return b[0] - a[0]; });
    var s = original;
    for (var i = 0; i < orden.length; i++) {
      s = s.slice(0, orden[i][0]) + ' ' + s.slice(orden[i][1]);
    }
    return s;
  }

  var PREFIJOS = [
    /^\s*(?:oye|eh|hey)\s+/i,
    /^\s*claude[,:\s]+/i,
    /^\s*(?:por\s+favor|porfa)[,:\s]+/i,
    /^\s*(?:apunta|anota|anade|agrega|mete|pon|guarda|crea|agenda|programa|reserva)(?:me|le)?\b\s*/i,
    /^\s*(?:recuerda|acuerdate|avisa)(?:me|te)?\b\s*(?:de|que)?\s*/i,
    /^\s*(?:tengo|tenemos|hay)\s+que\s+/i,
    /^\s*(?:tengo|tenemos|hay)\s+/i,
    /^\s*(?:en|al|a|para)\s+(?:el\s+|la\s+|mi\s+)?(?:calendario|agenda)\b\s*/i,
    /^\s*(?:una|un|el|la|lo)\s+(?:tarea|cita|evento|recordatorio)\s+(?:de|para|que)?\s*/i,
    /^\s*(?:que|de|:|,|-)\s+/i
  ];

  function limpiar(s) {
    var t = String(s).replace(/\s+/g, ' ').trim();
    // Los prefijos se buscan sobre el texto sin tildes (misma longitud, así los
    // índices cuadran) pero se recortan del original, que conserva su acentuación.
    for (var vuelta = 0; vuelta < 8; vuelta++) {
      var antes = t;
      for (var i = 0; i < PREFIJOS.length; i++) {
        var m = PREFIJOS[i].exec(aplanar(t));
        if (m && m.index === 0 && m[0].length) t = t.slice(m[0].length);
      }
      t = t.replace(/^[\s,;.:¡!¿?-]+/, '').replace(/[\s,;:-]+$/, '');
      if (t === antes) break;
    }
    t = t.replace(/\s+/g, ' ').trim();
    if (!t) return '';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function pistaFranja(texto) {
    for (var f in PISTAS_FRANJA) {
      if (!Object.prototype.hasOwnProperty.call(PISTAS_FRANJA, f)) continue;
      for (var i = 0; i < PISTAS_FRANJA[f].length; i++) {
        if (new RegExp("\\b" + PISTAS_FRANJA[f][i] + "\\b").test(texto)) return f;
      }
    }
    return null;
  }

  function deducir(texto) {
    var mejor = null, mejorLargo = 0;
    for (var cat in CLAVES) {
      if (!Object.prototype.hasOwnProperty.call(CLAVES, cat)) continue;
      for (var i = 0; i < CLAVES[cat].length; i++) {
        var clave = CLAVES[cat][i];
        var re = new RegExp('\\b' + clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (clave.indexOf(' ') < 0 ? 's?' : '') + '\\b');
        if (re.test(texto) && clave.length > mejorLargo) { mejor = cat; mejorLargo = clave.length; }
      }
    }
    return mejor;
  }

  var api = { interpretar: interpretar, aplanar: aplanar, ABREV: ABREV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Interprete = api;
})(typeof self !== 'undefined' ? self : this);
