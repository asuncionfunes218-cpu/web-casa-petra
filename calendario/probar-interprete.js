const { interpretar } = require('./interpretar.js');
const HOY = '2026-08-28';               // viernes
// [frase, fecha esperada, hora esperada, categoría esperada, título esperado]
const casos = [
  ['cena con Javi el viernes a las nueve y media',      '2026-09-04', '21:30', 'ocio',        'Cena con Javi'],
  ['apúntame dentista el martes a las 10',              '2026-09-01', '10:00', 'obligaciones','Dentista'],
  ['añade al calendario reunión con el cliente mañana a las 9', '2026-08-29','09:00','trabajo','Reunión con el cliente'],
  ['mañana por la mañana gimnasio',                     '2026-08-29', '',      'ocio',        'Gimnasio'],
  ['pasado mañana comida familiar a las dos',           '2026-08-30', '14:00', 'ocio',        'Comida familiar'],
  ['hoy a las 15:30 llamada con el jefe',               '2026-08-28', '15:30', 'trabajo',     'Llamada con el jefe'],
  ['el 5 de septiembre boda de Marta',                  '2026-09-05', '',      'ocio',        'Boda de Marta'],
  ['renovar el DNI el día 15',                          '2026-09-15', '',      'obligaciones','Renovar el DNI'],
  ['recuérdame pagar el alquiler el 1 de octubre',      '2026-10-01', '',      'obligaciones','Pagar el alquiler'],
  ['tengo que llamar al banco esta tarde',              '2026-08-28', '',      'obligaciones','Llamar al banco'],
  ['cine esta noche a las ocho',                        '2026-08-28', '20:00', 'ocio',        'Cine'],
  ['entrega del proyecto dentro de tres días',          '2026-08-31', '',      'trabajo',     'Entrega del proyecto'],
  ['la semana que viene revisión del coche',            '2026-09-04', '',      'obligaciones','Revisión del coche'],
  ['padel el sábado a las 19h',                         '2026-08-29', '19:00', 'ocio',        'Padel'],
  ['reunión de trabajo el lunes a las diez menos cuarto','2026-08-31','09:45', 'trabajo',     'Reunión'],
  ['comprar pan',                                        '2026-08-28','',      'otros',       'Comprar pan'],
  ['concierto el 12/09 a las 22:00',                    '2026-09-12', '22:00', 'ocio',        'Concierto'],
  ['médico el jueves a las cuatro y cuarto de la tarde','2026-09-03', '16:15', 'obligaciones','Médico'],
  ['oye Claude apunta cena de trabajo el miércoles',    '2026-09-02', '',      'trabajo',     'Cena'],
  ['desayuno con Ana a las nueve',                      '2026-08-28', '09:00', 'otros',       'Desayuno con Ana'],
  ['recoger paquete de correos mañana',                 '2026-08-29', '',      'obligaciones','Recoger paquete de correos'],
  ['este viernes entrenamiento por la tarde',           '2026-08-28', '',      'ocio',        'Entrenamiento'],
  ['gimnasio a las siete',                              '2026-08-28', '19:00', 'ocio',        'Gimnasio'],
  ['presentación al cliente el 3 de septiembre a las 11:30','2026-09-03','11:30','trabajo',   'Presentación al cliente'],
  ['ponme el domingo comida con los abuelos a las 2 de la tarde','2026-08-30','14:00','ocio','Comida con los abuelos'],
];

let fallos = 0;
for (const [frase, f, h, c, t] of casos) {
  const r = interpretar(frase, HOY);
  const mal = [];
  if (r.fecha !== f) mal.push(`fecha ${r.fecha} ≠ ${f}`);
  if (r.hora !== h) mal.push(`hora "${r.hora}" ≠ "${h}"`);
  if (r.categoria !== c) mal.push(`cat ${r.categoria} ≠ ${c}`);
  if (r.titulo !== t) mal.push(`título "${r.titulo}" ≠ "${t}"`);
  if (mal.length) { fallos++; console.log(`✗ ${frase}\n    ${mal.join(' | ')}`); }
  else console.log(`✓ ${frase}  →  ${r.fecha} ${r.hora || '--:--'} ${r.categoria} · ${r.titulo}`);
}
console.log(`\n${casos.length - fallos}/${casos.length} correctos`);
