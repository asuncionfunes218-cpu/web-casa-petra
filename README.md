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

- **Cuatro secciones** en pestañas: Resumen, Gastos, Análisis y Asesor. En móvil
  son una barra inferior; en escritorio, pestañas en la cabecera fija.
- **Un solo formulario** para gastos fijos, gastos adicionales e ingresos, con
  **selector del mes al que se apunta**: se puede registrar un gasto en un mes
  distinto del que se está viendo. Se queda abierto tras guardar, manteniendo
  tipo, categoría y mes, para encadenar varios apuntes seguidos.
- **Nueve categorías** con rango de referencia sobre los ingresos.
- **Tabla de porcentajes**: importe, % del gasto, % de ingresos y estado.
- **Gráfico de barras** por categoría, con marca del máximo recomendado.
- **Gráfico circular** del reparto del gasto.
- **Evolución mensual** comparando ingresos y gastos de los últimos 12 meses.
- **Asesor de ahorro**: diagnóstico, consejos priorizados y un plan de recorte
  que reparte el ajuste necesario entre categorías.
- **Memoria**: los datos se guardan en el navegador y se navega por meses.
  Copia de seguridad en JSON y exportación del mes en CSV.
- **Borrado con deshacer** y avisos efímeros en lugar de diálogos del navegador.

### Notas de rendimiento

- Solo se renderiza la pestaña visible; las demás quedan marcadas como pendientes
  y se pintan al entrar en ellas.
- Los totales de cada mes se calculan una vez y se guardan en caché hasta el
  siguiente cambio de datos.
- Los repintados se agrupan en un `requestAnimationFrame`.
- La hoja de Google Fonts se inyecta desde JavaScript para que no bloquee el
  primer pintado: con 810 apuntes y el servidor de fuentes inaccesible, la
  primera pintura pasa de 13 s a 60 ms.
- Los tooltips solo se activan con ratón (`hover: hover`) y se limitan a un
  fotograma.

Los datos no salen del dispositivo: se guardan en el almacenamiento local del
navegador. Conviene descargar una copia de seguridad de vez en cuando desde el
menú **Datos**.
