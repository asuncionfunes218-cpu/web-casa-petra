#!/usr/bin/env node
/**
 * Extrae los datos del artefacto publicado y los vuelca en datos.json.
 *
 *   node calendario/sincronizar.js <fichero.html>
 *   cat pagina.html | node calendario/sincronizar.js
 *
 * El artefacto es la fuente de verdad: el usuario puede marcar tareas desde
 * el móvil, así que hay que leerlo antes de tocar nada.
 */
const fs = require('fs');
const path = require('path');
const { normalizar } = require('./construir.js');

const BLOQUE = /<script type="application\/json" id="datos">([\s\S]*?)<\/script>/;

function extraer(html) {
  const m = html.match(BLOQUE);
  if (!m) throw new Error('No encuentro el bloque <script id="datos"> en el HTML del artefacto.');
  return normalizar(JSON.parse(m[1]));
}

function main() {
  const arg = process.argv[2];
  const html = arg ? fs.readFileSync(arg, 'utf8') : fs.readFileSync(0, 'utf8');
  const datos = extraer(html);
  fs.writeFileSync(path.join(__dirname, 'datos.json'), JSON.stringify(datos, null, 2) + '\n');
  console.log(`datos.json sincronizado · ${datos.tareas.length} tareas`);
}

if (require.main === module) {
  try { main(); } catch (err) { console.error('Error: ' + err.message); process.exit(1); }
}

module.exports = { extraer };
