---
name: calendario
description: Gestiona la agenda personal del usuario, publicada como el artefacto "Agenda de Bolsillo". Úsala siempre que quiera apuntar, consultar, mover, completar o borrar algo de su calendario o su agenda. Actívala con frases como "añádeme al calendario", "añade al calendario", "apúntame", "apunta que", "ponme el martes a las 10", "recuérdame el jueves", "tengo cita el día 5", "qué tengo hoy", "qué tengo mañana", "qué me queda por hacer", "marca como hecha", "ya he hecho lo del dentista", "cambia la cita del viernes", "muéveme la reunión", "quita del calendario", "borra la tarea". No esperes las palabras exactas: si el usuario menciona un plan, una cita, un recado o una tarea con fecha, usa esta skill.
---

# Agenda de Bolsillo

La agenda del usuario vive en un artefacto publicado que él tiene en la pantalla de
inicio del móvil. **El artefacto es la fuente de verdad**: el usuario marca tareas
desde el móvil, así que hay que leerlo antes de tocar nada y volver a publicarlo
después. `calendario/datos.json` es solo la copia de trabajo del repositorio.

La URL está en `calendario/artefacto.json`.

## Ciclo completo (los cinco pasos, siempre en este orden)

### 1. Leer el artefacto

```
Artifact  action: "read"  url: <la url de calendario/artefacto.json>
```

Devuelve el HTML de la página. Si te lo entrega en un fichero local, usa esa ruta;
si te lo devuelve en línea, guárdalo antes en un fichero temporal.

### 2. Sincronizar la copia local

```bash
node calendario/sincronizar.js <ruta-del-html>
```

Esto vuelca los datos vivos en `calendario/datos.json`. **No te saltes este paso**:
si lo haces, borrarás las tareas que el usuario haya añadido o marcado desde el móvil.

### 3. Aplicar el cambio con el CLI

La vía rápida es `di`: le pasas la frase tal cual la dijo el usuario y él saca
día, hora, categoría y título. Úsala siempre que la frase venga en lenguaje
normal; las demás órdenes son para retoques.

```bash
node calendario/tarea.js di "cena con Javi el viernes a las nueve y media"
node calendario/tarea.js di "dentista el martes a las 10" --seco   # solo enseña la lectura
```

Entiende `hoy`, `mañana`, `pasado mañana`, los días de la semana, `el 5 de
septiembre`, `12/09`, `dentro de tres días`, `la semana que viene`, horas en
letra (`a las nueve y media`, `las diez menos cuarto`) y franjas (`de la
noche`). Deduce la categoría por las palabras. Cualquier bandera (`--fecha`,
`--hora`, `--cat`, `--titulo`, `--notas`) manda sobre lo que él haya entendido.

Si al usuario le pasas una frase con varias tareas, llama a `di` una vez por tarea.

```bash
node calendario/tarea.js ls                       # todo
node calendario/tarea.js ls hoy                   # también: manana, semana, pendientes, 2026-09-04
node calendario/tarea.js add "Cena con Javi" --fecha viernes --hora 21:00 --cat ocio --notas "En la plaza"
node calendario/tarea.js done "cena"              # por texto del título o por #id
node calendario/tarea.js undone "cena"
node calendario/tarea.js mv "cena" --fecha sabado --hora 22:00
node calendario/tarea.js edit "cena" --titulo "Cena con Javi y Ana" --cat ocio
node calendario/tarea.js rm "cena"
```

- **Fechas**: `AAAA-MM-DD`, `hoy`, `manana`, `pasado`, `ayer`, un día de la semana
  (`viernes` = el próximo viernes) o `+3`. Se resuelven en Europe/Madrid.
- **Horas**: `HH:MM` en 24h. Sin `--hora` la tarea queda "sin hora fija".
- **Categorías**: `trabajo`, `ocio`, `obligaciones`, `otros`. Si el usuario no lo
  dice, deduce la más obvia (una cita médica o un trámite son `obligaciones`, una
  cena con amigos es `ocio`, una reunión o una entrega son `trabajo`); ante la duda,
  `otros`. No preguntes por la categoría: elige y dilo en la respuesta.
- Si el texto coincide con varias tareas, el CLI las lista y falla: repite la orden
  con el `#id` exacto.
- El CLI regenera `calendario/index.html` en cada cambio.

### 4. Publicar

```
Artifact  file_path: "calendario/index.html"  url: <la misma url>
```

No pases `favicon` ni `capabilities`: se conservan solos. Si te responde con un
conflicto, vuelve al paso 1 y repite (alguien publicó desde el móvil mientras tanto).

### 5. Guardar en git

Haz commit de `calendario/datos.json` y `calendario/index.html` en la rama
`claude/calendar-tasks-reminders-gxvlgj` y púshalos. Es la copia de seguridad y el
plan B de los recordatorios.

## Cómo responder

Confirma en una o dos líneas, en español y con la fecha en palabras:
«Apuntado: cena con Javi el viernes 4 a las 21:00 (ocio).»

Para consultas ("qué tengo mañana") basta con los pasos 1, 2 y `ls`: no publiques ni
hagas commit si no has cambiado nada.

Si el usuario dice varias cosas de golpe, añádelas todas y resume al final.

## Dictado desde la agenda

La página tiene un botón **Dictar**: el usuario habla, la propia página interpreta
la frase con `calendario/interpretar.js` (va incrustado en el HTML) y enseña la
lectura antes de guardar. Es el mismo intérprete que usa `tarea.js di`, así que
si mejoras uno, mejoras los dos: toca solo `interpretar.js` y reconstruye.

## Recordatorios diarios

Dos Routines mandan un aviso al móvil: a las 08:00 con todo el día y a las 15:30 con
lo que queda. Leen el artefacto directamente. Sus horas están en `artefacto.json`.

Los cron van en UTC, así que **en el cambio de hora hay que ajustarlos**: en horario
de invierno pasan a `0 7 * * *` y `30 14 * * *`; en verano vuelven a `0 6 * * *` y
`30 13 * * *`. Se cambian con `update_trigger` usando los ids de `artefacto.json`.
