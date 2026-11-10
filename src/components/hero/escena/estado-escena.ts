import * as THREE from "three";

/**
 * Medidas del natatorio en metros (1 unidad = 1 m): pileta semiolímpica de 25 m y 6 andariveles.
 * Tienen que coincidir con LARGO / ANCHO / ANDARIVELES de blender/scripts/natatorio.py.
 */
export const PILETA = {
	largo: 25,
	ancho: 16,
	medioLargo: 12.5,
	medioAncho: 8,
	andarivel: 2.5,
	andariveles: 6,
} as const;

/** Centro (x) de cada andarivel: -8.75 … 8.75 */
export const CENTROS_ANDARIVEL = Array.from(
	{ length: PILETA.andariveles },
	(_, i) => -PILETA.medioAncho + 0.5 + PILETA.andarivel * (i + 0.5),
);

export const MAX_ONDAS = 8;
export const MAX_NADADORES = 3;

/** Paleta tomada de la foto aérea del natatorio. */
export const COLORES = {
	agua: "#14b3d8",
	aguaProfunda: "#0a6c9c",
	lineaFondo: "#16305e",
	borde: "#d8434c",
	solarium: "#cdbb9a",
	gradas: "#8cc4e4",
	pasto: "#3d6b3c",
	palmera: "#2c5a33",
	edificio: "#273049",
	niebla: "#b9c9d8",
} as const;

export const DENSIDAD_NIEBLA = 0.0032;

/**
 * Estado mutable compartido por toda la escena. Vive en un ref (fuera del ciclo de render de React)
 * y lo actualizan el mouse, el scroll y el loop de animación.
 */
export interface EstadoEscena {
	/** Progreso de scroll del hero (0 → 1). Lo escribe ScrollTrigger. */
	progreso: number;
	mouse: THREE.Vector2;
	mouseObjetivo: THREE.Vector2;
	mouseAmt: number;
	mouseAmtObjetivo: number;
	/** [x, z, inicio] × MAX_ONDAS */
	ondas: Float32Array;
	siguienteOnda: number;
	proximaAuto: number;
	/** [x, z, dirección] × MAX_NADADORES (los escribe Nadadores, los lee el agua). */
	nadadores: Float32Array;
	tiempo: number;
}

export function crearEstado(): EstadoEscena {
	const ondas = new Float32Array(MAX_ONDAS * 3);
	for (let i = 0; i < MAX_ONDAS; i++) ondas[i * 3 + 2] = -100;
	return {
		progreso: 0,
		mouse: new THREE.Vector2(0, -100),
		mouseObjetivo: new THREE.Vector2(0, -100),
		mouseAmt: 0,
		mouseAmtObjetivo: 0,
		ondas,
		siguienteOnda: 0,
		proximaAuto: 1,
		nadadores: new Float32Array(MAX_NADADORES * 3).fill(-100),
		tiempo: 0,
	};
}

export function agregarOnda(estado: EstadoEscena, x: number, z: number, t: number) {
	const i = estado.siguienteOnda;
	estado.ondas[i * 3] = x;
	estado.ondas[i * 3 + 1] = z;
	estado.ondas[i * 3 + 2] = t;
	estado.siguienteOnda = (i + 1) % MAX_ONDAS;
}

/** Calidad según dispositivo: en celular menos geometría y partículas. */
export interface CalidadEscena {
	segmentosAgua: number;
	estrellas: number;
	bloom: boolean;
	dprMax: number;
	mobile: boolean;
}

export function detectarCalidad(): CalidadEscena {
	const mobile = window.matchMedia("(max-width: 768px)").matches;
	const pocosNucleos = (navigator.hardwareConcurrency ?? 8) <= 4;
	if (mobile || pocosNucleos) {
		return { segmentosAgua: 140, estrellas: 900, bloom: true, dprMax: 1.5, mobile };
	}
	return { segmentosAgua: 260, estrellas: 2200, bloom: true, dprMax: 1.75, mobile };
}
