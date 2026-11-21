import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  anuncioSimulacion, estadosNuevos, estadoZona, etiquetaZona, frasePitch, ordenarObras, resumenPlano, ubicacionObra, zonasMejoradas,
} from './campus.js';
import { simular } from '../../../motor/simulador.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const ejemplos = leer('../../../docs/diseno/vistas/lote-8-campus/datos-ejemplo.json').ejemplos;
const grafo = leer('../../../data/campus.json');
const perfiles = leer('../../../data/perfiles.json');
const obrasData = leer('../../../data/obras.json');
const obraPorId = Object.fromEntries(obrasData.map((o) => [o.id, o]));

test('la frase del pitch coincide con cada ejemplo del diseño', () => {
  for (const [nombre, { respuesta, textos }] of Object.entries(ejemplos)) {
    assert.equal(frasePitch(respuesta.perfil, respuesta.hoy), textos.frase, nombre);
  }
});

test('el anuncio aria-live coincide con los ejemplos con obras simuladas', () => {
  const activas = {
    silla_rampa: ['rampa-patio-biblioteca'],
    silla_tres_obras: ['rampa-patio-biblioteca', 'piso-liso-camino-biblioteca', 'guia-tactil-entrada-casino'],
    silla_rampa_y_plataforma: ['rampa-patio-biblioteca', 'plataforma-patio-biblioteca'],
    vision_todas_las_obras: obrasData.map((o) => o.id),
  };
  for (const [nombre, ids] of Object.entries(activas)) {
    const { respuesta, textos } = ejemplos[nombre];
    const obras = ids.map((id) => obraPorId[id]);
    assert.equal(anuncioSimulacion(obras, respuesta.hoy, respuesta.con_obras, respuesta.perfil), textos.anuncio_aria_live, nombre);
  }
});

test('sin obras no hay anuncio', () => {
  const { respuesta } = ejemplos.silla_sin_obras;
  assert.equal(anuncioSimulacion([], respuesta.hoy, null, 'silla_ruedas'), '');
});

test('ordenar por trayectos deja al final las obras que no ayudan, por costo', () => {
  const { ayudan, noAyudan } = ordenarObras(ejemplos.movilidad_sin_obras.respuesta.obras, 'trayectos');
  assert.deepEqual(ayudan.map((o) => o.trayectos_sin_barrera), [16, 16, 2]);
  assert.ok(noAyudan.every((o) => o.trayectos_sin_barrera === 0));
  const rango = { bajo: 0, medio: 1, alto: 2 };
  const costos = noAyudan.map((o) => rango[o.costo_relativo]);
  assert.deepEqual(costos, [...costos].sort((a, b) => a - b));
});

test('ordenar por costo pone primero las baratas entre las que ayudan', () => {
  const { ayudan } = ordenarObras(ejemplos.vision_sin_obras.respuesta.obras, 'costo');
  assert.equal(ayudan[0].costo_relativo, 'bajo');
});

test('ordenar por minutos usa minutos_ahorrados_prom primero', () => {
  const obras = [
    { id: 'a', trayectos_sin_barrera: 5, minutos_ahorrados_prom: 0.1, costo_relativo: 'bajo' },
    { id: 'b', trayectos_sin_barrera: 1, minutos_ahorrados_prom: 2, costo_relativo: 'alto' },
  ];
  assert.deepEqual(ordenarObras(obras, 'minutos').ayudan.map((o) => o.id), ['b', 'a']);
  assert.deepEqual(ordenarObras(obras, 'trayectos').ayudan.map((o) => o.id), ['a', 'b']);
});

test('con la rampa del ejemplo, los 7 lugares cambian de estado ("Nuevo")', () => {
  const nuevos = estadosNuevos(ejemplos.silla_sin_obras.respuesta.zonas, ejemplos.silla_rampa.respuesta.zonas);
  assert.equal(nuevos.size, 7);
  assert.equal(estadosNuevos(null, ejemplos.silla_rampa.respuesta.zonas).size, 0);
});

test('estado y etiqueta de una zona siguen la regla del motor', () => {
  assert.equal(estadoZona({ trayectos_con_barrera: 3, minutos_extra: 0 }), 'con_barrera');
  assert.equal(estadoZona({ trayectos_con_barrera: 0, minutos_extra: 0.6 }), 'desvio');
  assert.equal(estadoZona({ trayectos_con_barrera: 0, minutos_extra: 0.5 }), 'accesible');
  assert.equal(etiquetaZona({ estado: 'con_barrera', trayectos_con_barrera: 5 }, 'silla_ruedas'), 'Sin ruta: 5 trayectos');
  assert.equal(etiquetaZona({ estado: 'con_barrera', trayectos_con_barrera: 1 }, 'baja_vision'), 'Sin guía: 1 trayecto');
  assert.equal(etiquetaZona({ estado: 'desvio', trayectos_con_barrera: 0, minutos_extra: 2.1 }, 'silla_ruedas'), 'Con desvío de 2 min');
  assert.equal(etiquetaZona({ estado: 'accesible', trayectos_con_barrera: 0, minutos_extra: 0.2 }, 'todos'), 'Accesible');
});

test('con el motor real: frase de silla de ruedas y lugares "Nuevo" al simular la rampa', () => {
  const hoy = simular(grafo, perfiles, obrasData, { perfil: 'silla_ruedas' });
  assert.match(frasePitch('silla_ruedas', hoy.hoy), /^Hoy, 1 de cada \d+ trayectos/);
  const con = simular(grafo, perfiles, obrasData, { perfil: 'silla_ruedas', ids: ['rampa-patio-biblioteca'] });
  assert.ok(con.con_obras.trayectos_con_barrera < hoy.hoy.trayectos_con_barrera);
  assert.ok(estadosNuevos(hoy.zonas, con.zonas).size > 0);
  for (const z of con.zonas) assert.equal(estadoZona(z), z.estado, z.nodo_id);
});

test('zonasMejoradas: solo marca los lugares que suben de estado', () => {
  const antes = [
    { nodo_id: 'a', estado: 'con_barrera' }, { nodo_id: 'b', estado: 'con_barrera' },
    { nodo_id: 'c', estado: 'accesible' }, { nodo_id: 'd', estado: 'desvio' },
  ];
  const ahora = [
    { nodo_id: 'a', estado: 'accesible' }, { nodo_id: 'b', estado: 'desvio' },
    { nodo_id: 'c', estado: 'con_barrera' }, { nodo_id: 'd', estado: 'desvio' },
  ];
  assert.deepEqual([...zonasMejoradas(antes, ahora)].sort(), ['a', 'b']);
  assert.equal(zonasMejoradas(null, ahora).size, 0);
});

test('ubicacionObra y resumenPlano', () => {
  assert.equal(ubicacionObra({ id: 'no-existe' }), null);
  assert.equal(ubicacionObra({ id: 'rampa-patio-biblioteca' }).length, 2);
  const zonas = [{ nodo_id: 'a', estado: 'con_barrera' }, { nodo_id: 'b', estado: 'accesible' }, { nodo_id: 'c', estado: 'accesible' }];
  assert.match(resumenPlano(zonas, 'silla_ruedas'), /3 lugares.*1 con barrera, 2 accesibles/);
});
