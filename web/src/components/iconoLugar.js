import { Books, Buildings, Door, Elevator, ForkKnife, MapPin, Toilet } from '@phosphor-icons/react';

// Ícono de un lugar (docs/diseno/vistas/lote-0-sistema/iconos.md). Primero por id conocido, después por tipo.
const POR_ID = { biblioteca: Books, casino: ForkKnife };
const POR_TIPO = { sala: Door, bano: Toilet, ascensor: Elevator, edificio: Buildings, entrada: MapPin, punto: MapPin };

export const iconoLugar = (lugar) => POR_ID[lugar?.id] ?? POR_TIPO[lugar?.tipo] ?? MapPin;

// Segunda línea de cada lugar en la lista ("Edificio A, piso 2").
export const metaLugar = (l) =>
  l.edificio ? `Edificio ${l.edificio}${l.piso > 0 ? `, piso ${l.piso}` : ''}` : (l.descripcion ?? '');
