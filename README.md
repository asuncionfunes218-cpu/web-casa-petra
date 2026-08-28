# web-casa-petra

Realizador de paginas web profesionales.

## Agenda de Bolsillo

Agenda personal publicada como artefacto, pensada para vivir en la pantalla de
inicio del móvil. Las tareas se diferencian por color según sean de **trabajo**,
**ocio**, **obligaciones** u **otros**, y se pueden ver por día, por semana o en
la rejilla del mes.

**Artefacto:** https://claude.ai/code/artifact/e7d3dcad-c904-4d91-83f9-e1158bc85993

### Cómo se apuntan las cosas

- **Hablando con Claude Code** sobre este repositorio (móvil, web o escritorio):
  «añade al calendario: dentista el martes a las 10». La skill `calendario`
  (`.claude/skills/calendario/`) hace el resto.
- **Desde el propio artefacto**, con el botón *Nueva tarea*. La página se
  republica sola, así que el cambio llega a todos los dispositivos y Claude lo ve
  la próxima vez que lea.

### Recordatorios

Dos Routines envían un aviso al móvil todos los días: a las **08:00** con todas
las tareas de la jornada y a las **15:30** con lo que quede por hacer.

### Ficheros

| Fichero | Para qué sirve |
|---|---|
| `calendario/plantilla.html` | Fuente de la página: estilos y lógica. Contiene el hueco `__DATOS_CALENDARIO__`. |
| `calendario/datos.json` | Copia de trabajo de las tareas. El artefacto manda; esto es el respaldo. |
| `calendario/construir.js` | Valida `datos.json` y genera `index.html`. |
| `calendario/tarea.js` | CLI para añadir, listar, mover, completar y borrar tareas. |
| `calendario/sincronizar.js` | Extrae los datos vivos del HTML del artefacto a `datos.json`. |
| `calendario/index.html` | Lo que se publica. Generado, no se edita a mano. |
| `calendario/artefacto.json` | URL del artefacto e ids de las Routines. |

### Uso directo del CLI

```bash
node calendario/tarea.js ls hoy
node calendario/tarea.js add "Cena con Javi" --fecha viernes --hora 21:00 --cat ocio
node calendario/tarea.js done "cena"
node calendario/construir.js
```

Las fechas se resuelven en `Europe/Madrid`.
