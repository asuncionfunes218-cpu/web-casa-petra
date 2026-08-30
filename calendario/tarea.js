#!/usr/bin/env node
/**
 * CLI de la agenda. Trabaja sobre calendario/datos.json y regenera index.html.
 *
 *   node calendario/tarea.js di "cena con Javi el viernes a las nueve y media"
 *   node calendario/tarea.js ls [hoy|manana|semana|AAAA-MM-DD]
 *   node calendario/tarea.js add "Cena con Javi" --fecha viernes --hora 21:00 --cat ocio --notas "..."
 *   node calendario/tarea.js done "cena"
 *   node calendario/tarea.js undone "cena"
 *   node calendario/tarea.js mv "cena" --fecha sabado --hora 22:00
 *   node calendario/tarea.js edit "cena" --titulo "Cena con Javi y Ana" --cat ocio
 *   node calendario/tarea.js rm "cena"
 *
 * Las fechas se resuelven siempre en Europe/Madrid.
 */
const fs = require('fs');
const path = require('path');
const { construir, CATEGORIAS } = require('./construir.js');
const { interpretar } = require('./interpretar.js');

const RUTA = path.join(__dirname, 'datos.json');
const TZ = 'Europe/Madrid';
const SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/* ---------- fechas ---------- */
function hoyISO() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}
function sumar(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function diaSemana(iso) {
  return new Date(iso + 'T12:00:00Z').getUTCDay();
}
function sinTildes(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
/** Acepta AAAA-MM-DD, hoy/mañana/pasado/ayer, un día de la semana o +N / -N días. */
function resolverFecha(txt, base) {
  const hoy = base || hoyISO();
  const t = sinTildes(txt || '');
  if (!t) return hoy;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (t === 'hoy') return hoy;
  if (t === 'manana') return sumar(hoy, 1);
  if (t === 'pasado' || t === 'pasado manana') return sumar(hoy, 2);
  if (t === 'ayer') return sumar(hoy, -1);
  const rel = t.match(/^([+-])\s*(\d+)\s*d?$/);
  if (rel) return sumar(hoy, (rel[1] === '-' ? -1 : 1) * Number(rel[2]));
  const i = SEMANA.indexOf(t.replace(/^el\s+/, ''));
  if (i >= 0) {
    let delta = (i - diaSemana(hoy) + 7) % 7;
    if (delta === 0) delta = 7;            // "el viernes" dicho un viernes = el que viene
    return sumar(hoy, delta);
  }
  throw new Error(`No entiendo la fecha "${txt}". Usa AAAA-MM-DD, hoy, manana, o un dia de la semana.`);
}
function bonita(iso) {
  try {
    return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-ES',
      { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  } catch (e) { return iso; }
}

/* ---------- datos ---------- */
function leer() {
  return JSON.parse(fs.readFileSync(RUTA, 'utf8'));
}
function escribir(datos) {
  fs.writeFileSync(RUTA, JSON.stringify(datos, null, 2) + '\n');
  construir({ escribirDatos: true });
}
function nuevoId() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function ordenar(a, b) {
  if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
  const ha = a.hora || '99:99';
  const hb = b.hora || '99:99';
  return ha < hb ? -1 : ha > hb ? 1 : 0;
}
function linea(t) {
  const marca = t.hecha ? 'x' : ' ';
  const hora = t.hora ? t.hora : '--:--';
  return `[${marca}] ${t.fecha} ${hora}  ${t.titulo}  (${t.categoria})  #${t.id}`
       + (t.notas ? `\n            ${t.notas}` : '');
}

/** Busca por id exacto o por texto contenido en el título. */
function buscar(datos, aguja, opts = {}) {
  const a = sinTildes(aguja || '');
  if (!a) throw new Error('Dime qué tarea: su texto o su #id.');
  const porId = datos.tareas.filter((t) => t.id === aguja || '#' + t.id === aguja);
  if (porId.length === 1) return porId[0];

  let cand = datos.tareas.filter((t) => sinTildes(t.titulo).includes(a));
  if (opts.fecha) cand = cand.filter((t) => t.fecha === opts.fecha);
  if (!cand.length) throw new Error(`No encuentro ninguna tarea que contenga "${aguja}".`);
  if (cand.length > 1) {
    const pend = cand.filter((t) => !t.hecha);
    if (pend.length === 1) return pend[0];
    throw new Error(
      `"${aguja}" coincide con ${cand.length} tareas. Concreta con el #id:\n` +
      cand.sort(ordenar).map(linea).join('\n')
    );
  }
  return cand[0];
}

/* ---------- argumentos ---------- */
function opciones(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  return o;
}
function validarHora(h) {
  if (h === undefined || h === null || h === '') return '';
  const m = String(h).trim().replace('.', ':');
  if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(m)) throw new Error(`Hora inválida: "${h}". Usa HH:MM en 24h.`);
  const [hh, mm] = m.split(':');
  return hh.padStart(2, '0') + ':' + mm;
}
function validarCat(c) {
  if (!c) return 'otros';
  const n = sinTildes(c);
  const alias = { trabajo: 'trabajo', curro: 'trabajo', ocio: 'ocio', personal: 'ocio',
                  obligaciones: 'obligaciones', obligacion: 'obligaciones', recados: 'obligaciones',
                  otros: 'otros', otro: 'otros' };
  const r = alias[n];
  if (!r) throw new Error(`Categoría inválida: "${c}". Usa: ${CATEGORIAS.join(', ')}.`);
  return r;
}

/* ---------- órdenes ---------- */
const ordenes = {
  ls(args) {
    const datos = leer();
    const o = opciones(args);
    const que = sinTildes(o._[0] || '');
    let tareas = datos.tareas.slice();
    let rotulo = 'todo';
    if (que === 'semana') {
      const hoy = hoyISO();
      const fin = sumar(hoy, 7);
      tareas = tareas.filter((t) => t.fecha >= hoy && t.fecha < fin);
      rotulo = 'próximos 7 días';
    } else if (que === 'pendiente' || que === 'pendientes') {
      tareas = tareas.filter((t) => !t.hecha);
      rotulo = 'pendientes';
    } else if (que) {
      const f = resolverFecha(que);
      tareas = tareas.filter((t) => t.fecha === f);
      rotulo = bonita(f);
    }
    tareas.sort(ordenar);
    console.log(`— ${rotulo} — ${tareas.length} tarea(s)`);
    if (!tareas.length) console.log('  (nada apuntado)');
    tareas.forEach((t) => console.log(linea(t)));
  },

  add(args) {
    const o = opciones(args);
    const titulo = (o._.join(' ') || o.titulo || '').trim();
    if (!titulo) throw new Error('Falta el texto de la tarea.');
    const datos = leer();
    const t = {
      id: nuevoId(),
      fecha: resolverFecha(o.fecha || 'hoy'),
      hora: validarHora(o.hora),
      titulo,
      categoria: validarCat(o.cat || o.categoria),
      notas: (o.notas || '').trim(),
      hecha: false,
      creada: new Date().toISOString()
    };
    datos.tareas.push(t);
    escribir(datos);
    console.log('Añadida:\n' + linea(t));
  },

  /** Apunta una frase dicha en lenguaje normal. --seco solo enseña la lectura. */
  di(args) {
    const o = opciones(args);
    const seco = o.seco !== undefined || args.includes('--seco');
    const frase = o._.filter((x) => x !== '--seco').join(' ').trim();
    if (!frase) throw new Error('Dime la frase entre comillas.');
    const r = interpretar(frase, hoyISO());
    if (!r || !r.titulo) throw new Error('No he sacado ninguna tarea de: ' + frase);

    const t = {
      id: nuevoId(),
      fecha: o.fecha ? resolverFecha(o.fecha) : r.fecha,
      hora: o.hora !== undefined ? validarHora(o.hora) : r.hora,
      titulo: o.titulo || r.titulo,
      categoria: (o.cat || o.categoria) ? validarCat(o.cat || o.categoria) : r.categoria,
      notas: (o.notas || '').trim(),
      hecha: false,
      creada: new Date().toISOString()
    };
    if (seco) {
      console.log('Lectura (sin guardar):');
      console.log(linea(t));
      r.supuestos.forEach((x) => console.log('  · ' + x));
      return;
    }
    const datos = leer();
    datos.tareas.push(t);
    escribir(datos);
    console.log('Añadida:\n' + linea(t));
    r.supuestos.forEach((x) => console.log('  · ' + x));
  },

  done(args)   { marcar(args, true); },
  undone(args) { marcar(args, false); },

  mv(args) {
    const o = opciones(args);
    const datos = leer();
    const t = buscar(datos, o._.join(' '));
    if (o.fecha) t.fecha = resolverFecha(o.fecha);
    if (o.hora !== undefined) t.hora = validarHora(o.hora);
    escribir(datos);
    console.log('Movida:\n' + linea(t));
  },

  edit(args) {
    const o = opciones(args);
    const datos = leer();
    const t = buscar(datos, o._.join(' '));
    if (o.titulo) t.titulo = o.titulo.trim();
    if (o.fecha) t.fecha = resolverFecha(o.fecha);
    if (o.hora !== undefined) t.hora = validarHora(o.hora);
    if (o.cat || o.categoria) t.categoria = validarCat(o.cat || o.categoria);
    if (o.notas !== undefined) t.notas = o.notas.trim();
    escribir(datos);
    console.log('Actualizada:\n' + linea(t));
  },

  rm(args) {
    const o = opciones(args);
    const datos = leer();
    const t = buscar(datos, o._.join(' '));
    datos.tareas = datos.tareas.filter((x) => x.id !== t.id);
    escribir(datos);
    console.log('Borrada:\n' + linea(t));
  }
};

function marcar(args, valor) {
  const o = opciones(args);
  const datos = leer();
  const t = buscar(datos, o._.join(' '), { fecha: o.fecha ? resolverFecha(o.fecha) : null });
  t.hecha = valor;
  escribir(datos);
  console.log((valor ? 'Hecha:\n' : 'Reabierta:\n') + linea(t));
}

/* ---------- arranque ---------- */
const [, , orden, ...resto] = process.argv;
try {
  if (!orden || !ordenes[orden]) {
    console.log('Órdenes: di | ls | add | done | undone | mv | edit | rm');
    console.log('Hoy en Madrid: ' + hoyISO());
    process.exit(orden ? 1 : 0);
  }
  ordenes[orden](resto);
} catch (err) {
  console.error('Error: ' + err.message);
  process.exit(1);
}
