#!/usr/bin/env node
/**
 * Genera la página autónoma a partir de la fuente compartida.
 *
 *   src/app.html  →  gastos-mensuales.html
 *
 * src/app.html se publica tal cual como artefacto (sin doctype ni <html>);
 * este script lo envuelve en un documento completo para poder abrirlo como
 * archivo local o subirlo a cualquier hosting estático.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src", "app.html");
const OUT = path.join(__dirname, "gastos-mensuales.html");
const MARCA = "<!--/head-->";

const fuente = fs.readFileSync(SRC, "utf8");
const corte = fuente.indexOf(MARCA);
if (corte === -1) {
  console.error(`Falta la marca ${MARCA} en src/app.html`);
  process.exit(1);
}

const cabecera = fuente.slice(0, corte).trim();
const cuerpo = fuente.slice(corte + MARCA.length).trim();

const salida = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
${cabecera}
</head>
<body>
${cuerpo}
</body>
</html>
`;

fs.writeFileSync(OUT, salida);
console.log(`gastos-mensuales.html generado (${(salida.length / 1024).toFixed(1)} kB)`);
