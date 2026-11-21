import { leerDatos } from './datos.js';

export const obtenerPunto = (leer = () => leerDatos('puntos.json')) => async (req, res, next) => {
  try {
    let puntos;
    try {
      puntos = await leer();
    } catch (e) {
      if (e?.code === 'ENOENT') puntos = [];
      else throw e;
    }
    if (!Array.isArray(puntos)) throw new Error('data/puntos.json debe ser una lista');
    const punto = puntos.find((p) => p?.id === req.params.id);
    if (punto) res.json(punto);
    else res.status(404).json({ error: `punto "${req.params.id}" no encontrado` });
  } catch (e) {
    next(e);
  }
};
