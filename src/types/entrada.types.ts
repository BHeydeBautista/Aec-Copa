export const TIPOS_ENTRADA_IDS = [
	"pileta-general",
	"pileta-challenger",
	"tribuna-general",
	"tribuna-challenger",
] as const;

export type TipoEntradaId = (typeof TIPOS_ENTRADA_IDS)[number];

export type ZonaEntrada = "pileta" | "tribuna";

export interface CupoEntrada {
	/** Límite compartido de la zona pileta, contando inscripciones pendientes y aprobadas. */
	total: number;
}

export interface TipoEntrada {
	id: TipoEntradaId;
	zona: ZonaEntrada;
	nombre: string;
	descripcion: string;
	observacion?: string;
	precio: number;
	beneficios: string[];
	destacado?: boolean;
	etiqueta?: string;
	cupo?: CupoEntrada;
	/** Máximo de entradas por inscripción (pileta = 1 nadador por formulario). */
	maxCantidad: number;
	/** Si requiere número de socio AEC u otro dato que lo acredite. */
	requiereAcreditacion?: boolean;
}

/** Estado público del cupo compartido, sin exponer la cantidad de lugares disponibles. */
export interface EstadoCupo {
	tipo: ZonaEntrada;
	agotado: boolean;
}
