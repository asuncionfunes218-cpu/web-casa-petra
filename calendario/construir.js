#!/usr/bin/env node
/**
 * Genera calendario/index.html a partir de plantilla.html + datos.json.
 * El artefacto publicado es la fuente de verdad; datos.json es la copia
 * que Claude lee y reescribe antes de volver a publicar.
 *
 *   node calendario/construir.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const CATEGORIAS = ['trabajo', 'ocio', 'obligaciones', 'otros'];
const MARCA = '__DATOS_CALENDARIO__';

function nuevoId() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function normalizar(bruto) {
  const datos = bruto && typeof bruto === 'object' ? bruto : {};
  const tareas = Array.isArray(datos.tareas) ? datos.tareas : [];
  const vistas = new Set();
  const limpias = [];

  for (const t of tareas) {
    if (!t || typeof t !== 'object') continue;
    const titulo = String(t.titulo || '').trim();
    const fecha = String(t.fecha || '').trim();
    if (!titulo) throw new Error('Hay una tarea sin título: ' + JSON.stringify(t));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error(`Fecha inválida en "${titulo}": ${fecha || '(vacía)'} — usa AAAA-MM-DD`);
    }
    if (Number.isNaN(Date.parse(fecha + 'T00:00:00'))) {
      throw new Error(`Fecha inexistente en "${titulo}": ${fecha}`);
    }
    const hora = String(t.hora || '').trim();
    if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
      throw new Error(`Hora inválida en "${titulo}": ${hora} — usa HH:MM en 24h`);
    }
    const categoria = CATEGORIAS.includes(t.categoria) ? t.categoria : 'otros';
    let id = String(t.id || '').trim() || nuevoId();
    while (vistas.has(id)) id = nuevoId();
    vistas.add(id);
    limpias.push({
      id,
      fecha,
      hora,
      titulo,
      categoria,
      notas: String(t.notas || '').trim(),
      hecha: t.hecha === true,
      creada: t.creada || new Date().toISOString()
    });
  }

  limpias.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    const ha = a.hora || '99:99';
    const hb = b.hora || '99:99';
    if (ha !== hb) return ha < hb ? -1 : 1;
    return (a.creada || '') < (b.creada || '') ? -1 : 1;
  });

  return {
    version: 1,
    zonaHoraria: datos.zonaHoraria || 'Europe/Madrid',
    actualizado: new Date().toISOString(),
    tareas: limpias
  };
}

function construir({ escribirDatos = true } = {}) {
  const plantilla = fs.readFileSync(path.join(dir, 'plantilla.html'), 'utf8');
  if (!plantilla.includes(MARCA)) throw new Error('plantilla.html no contiene ' + MARCA);
  const datos = normalizar(JSON.parse(fs.readFileSync(path.join(dir, 'datos.json'), 'utf8')));
  // < evita que un "</script>" dentro de un texto rompa la página.
  const json = JSON.stringify(datos, null, 2).replace(/</g, '\\u003c');
  const html = plantilla.replace(MARCA, () => json);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  if (escribirDatos) fs.writeFileSync(path.join(dir, 'datos.json'), JSON.stringify(datos, null, 2) + '\n');
  return datos;
}

if (require.main === module) {
  try {
    const datos = construir();
    const pendientes = datos.tareas.filter((t) => !t.hecha).length;
    console.log(`index.html generado · ${datos.tareas.length} tareas (${pendientes} pendientes)`);
  } catch (err) {
    console.error('Error: ' + err.message);
    process.exit(1);
  }
}

module.exports = { construir, normalizar, CATEGORIAS };
