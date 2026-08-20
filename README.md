# web-casa-petra

Realizador de páginas web profesionales.

## Cuentas Claras — sistema de gastos mensuales

Aplicación de una sola página para llevar la economía doméstica mes a mes:
ingresos, gastos fijos, gastos adicionales, porcentajes por categoría,
gráficos y un asesor que dice dónde recortar con cifras concretas.

| Archivo | Para qué sirve |
| --- | --- |
| `src/app.html` | Fuente única. Se publica tal cual como artefacto (sin `<!doctype>` ni `<html>`). |
| `build.js` | Envuelve la fuente en un documento completo. |
| `gastos-mensuales.html` | Página autónoma generada. Se abre con doble clic o se sube a cualquier hosting estático. |

### Regenerar la página autónoma

```bash
node build.js
```

No hay dependencias ni paso de compilación: todo el CSS y el JavaScript viven
dentro del propio archivo. Lo único externo son las tipografías de Google Fonts,
que degradan a fuentes del sistema si no hay conexión.

### Qué incluye

- **Ingresos, gastos fijos y gastos adicionales** con alta, edición y borrado.
- **Nueve categorías** con rango de referencia sobre los ingresos.
- **Tabla de porcentajes**: importe, % del gasto, % de ingresos y estado.
- **Gráfico de barras** por categoría, con marca del máximo recomendado.
- **Gráfico circular** del reparto del gasto.
- **Evolución mensual** comparando ingresos y gastos de los últimos 12 meses.
- **Asesor de ahorro**: diagnóstico, consejos priorizados y un plan de recorte
  que reparte el ajuste necesario entre categorías.
- **Memoria**: los datos se guardan en el navegador y se navega por meses.
  Copia de seguridad en JSON y exportación del mes en CSV.

Los datos no salen del dispositivo: se guardan en el almacenamiento local del
navegador. Conviene descargar una copia de seguridad de vez en cuando desde el
menú **Datos**.
