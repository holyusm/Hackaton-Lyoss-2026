// Convierte el resultado del motor (calcularRuta) en lo que muestra /mapa: pasos legibles, un id estable
// y las coordenadas de la línea. Función pura: sin React ni red, se prueba con node:test.
//
// Los textos no llevan flechas, puntos medios ni guiones largos: se leen tal cual en pantalla y en voz alta.
import { conArticulo } from '../../../motor/ruta.js';

const redondear = (m) => Math.round(m);
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function detalleDe(tramo) {
  const pend = {
    nula: tramo.rampa ? 'Rampa plana' : 'Plano',
    baja: tramo.rampa ? 'Rampa suave' : 'Pendiente suave',
    media: tramo.rampa ? 'Rampa de pendiente media' : 'Pendiente media',
    alta: tramo.rampa ? 'Rampa empinada' : 'Pendiente alta',
  }[tramo.pendiente];
  const superficie = { lisa: 'piso liso', irregular: 'piso irregular', adoquin: 'adoquín' }[tramo.superficie];
  const partes = [pend, superficie, tramo.techado ? 'techado' : 'al aire libre'];
  if (tramo.guia_tactil) partes.push('con guía táctil');
  return partes.filter(Boolean).join(', ');
}

// Un paso por tramo. `de` y `a` son los nodos en el orden real del recorrido.
function pasoDe(tramo, de, a, nodos, esUltimo) {
  const m = redondear(tramo.metros);
  const destino = conArticulo(a);
  const cambioDePiso = a.piso !== de.piso;
  const sube = a.piso > de.piso;
  let instruccion, tipo, icono, detalle = detalleDe(tramo);

  if (tramo.ascensor_id) {
    const ascensor = nodos.get(tramo.ascensor_id);
    tipo = 'ascensor';
    icono = 'Elevator';
    instruccion = cambioDePiso ? `${sube ? 'Sube' : 'Baja'} al piso ${a.piso}.` : `Usa ${conArticulo(ascensor)}.`;
    detalle = ascensor.nombre;
  } else if (tramo.escalones > 0) {
    tipo = 'escalera';
    icono = 'Stairs';
    const n = tramo.escalones;
    const escalones = `${n} ${n === 1 ? 'escalón' : 'escalones'}`;
    instruccion = cambioDePiso ? `${sube ? 'Sube' : 'Baja'} ${escalones} hasta ${destino}.` : `Pasa ${escalones} hasta ${destino}.`;
    detalle = `${mayuscula(escalones)}, ${detalle.charAt(0).toLowerCase()}${detalle.slice(1)}`;
  } else if (tramo.rampa) {
    tipo = 'rampa';
    icono = 'TrendUp';
    const por = tramo.nombre || 'la rampa';
    instruccion = cambioDePiso ? `${sube ? 'Sube' : 'Baja'} por ${por} al piso ${a.piso}.` : `Avanza ${m} m por ${por} hasta ${destino}.`;
  } else if (tramo.techado) {
    tipo = 'techado';
    icono = 'Umbrella';
    instruccion = `Cruza ${m} m por ${tramo.nombre || 'el pasillo techado'} hasta ${destino}.`;
  } else {
    tipo = 'camino';
    icono = 'PersonSimpleWalk';
    instruccion = `Avanza ${m} m por ${tramo.nombre || 'el camino'} hasta ${destino}.`;
  }

  // El último tramo se dice desde el destino, salvo que sea un ascensor o cambie de piso (ahí lo importante es subir o bajar).
  if (esUltimo && !tramo.ascensor_id && tramo.escalones === 0 && !cambioDePiso) {
    instruccion = `${mayuscula(destino)} está a ${m} m.`;
    tipo = 'destino';
    icono = a.tipo === 'sala' ? 'Door' : 'PersonSimpleWalk';
  }
  return { instruccion, detalle, tramo: tipo, icono, metros: m, nodo: a.id };
}

/**
 * @param grafo       data/campus.json
 * @param resultado   salida de calcularRuta (con ok: true)
 * @param opciones    { posicion(nodo) -> [lat, lng] } (ver posicion.js), o bien { aLatLng(x, y) } de
 *                    web/src/plano/plano.js. Sin ninguna (o sin x,y en los nodos con aLatLng), `coordenadas`
 *                    y `punto` quedan vacíos.
 * @returns { id, pasos, coordenadas }  `id` es tramos.join('-'): cambia solo cuando cambia la ruta.
 */
export function armarRuta(grafo, resultado, { aLatLng, posicion: posicionDe } = {}) {
  if (!resultado || !resultado.ok) return { id: '', pasos: [], coordenadas: [] };
  const nodos = new Map(grafo.nodos.map((n) => [n.id, n]));
  const tramos = new Map(grafo.tramos.map((t) => [t.id, t]));
  const pos = posicionDe
    || ((n) => (aLatLng && Number.isFinite(n.x) && Number.isFinite(n.y) ? aLatLng(n.x, n.y) : null));
  const valido = (p) => Array.isArray(p) && p.every(Number.isFinite);

  // Línea de un tramo en el sentido del recorrido: desde el nodo `de`, por el trazado (si lo tiene) hasta `a`.
  const lineaDe = (tramo, de, a) => {
    // Sin posición de los nodos (modo aLatLng sin x,y) tampoco hay línea.
    if (!valido(pos(de)) || !valido(pos(a))) return [];
    const medio = (tramo.trazado ?? []).filter(valido);
    const orden = tramo.desde === de.id ? medio : [...medio].reverse();
    return [pos(de), ...orden, pos(a)].filter(valido);
  };
  // Punto a la mitad del largo de la línea (ahí va el número del paso).
  const puntoMedio = (linea) => {
    if (linea.length < 2) return null;
    const largos = linea.slice(1).map((p, i) => Math.hypot(p[0] - linea[i][0], p[1] - linea[i][1]));
    let resto = largos.reduce((x, y) => x + y, 0) / 2;
    for (let i = 0; i < largos.length; i++) {
      if (resto <= largos[i] || i === largos.length - 1) {
        const f = largos[i] ? resto / largos[i] : 0;
        return [linea[i][0] + (linea[i + 1][0] - linea[i][0]) * f, linea[i][1] + (linea[i + 1][1] - linea[i][1]) * f];
      }
      resto -= largos[i];
    }
    return null;
  };

  const coordenadas = [];
  const pasos = resultado.tramos.map((id, i) => {
    const de = nodos.get(resultado.nodos[i]);
    const a = nodos.get(resultado.nodos[i + 1]);
    const tramo = tramos.get(id);
    const paso = pasoDe(tramo, de, a, nodos, i === resultado.tramos.length - 1);
    const linea = lineaDe(tramo, de, a);
    paso.punto = puntoMedio(linea);
    coordenadas.push(...(i === 0 ? linea : linea.slice(1)));
    return paso;
  });

  return { id: resultado.tramos.join('-'), pasos, coordenadas };
}
