/**
 * Secuencias de cuadros del vuelo de dron (public/vuelo). Se generan con:
 *   blender --background --python blender/scripts/extraer-cuadros.py -- <video> public/vuelo/h 1280 720 2 70
 *   blender --background --python blender/scripts/extraer-cuadros.py -- <video> public/vuelo/v 540 960 2 70
 * Si cambia la cantidad de cuadros, actualizar `cuadros`.
 */
export const VUELO = {
	horizontal: { carpeta: "/vuelo/h", cuadros: 96 },
	vertical: { carpeta: "/vuelo/v", cuadros: 96 },
} as const;
