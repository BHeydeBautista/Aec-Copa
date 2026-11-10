export const TIPOS_ENTRADA_IDS = [
	"pileta-general",
	"pileta-challenger",
	"tribuna-general",
	"tribuna-challenger",
] as const;

export type TipoEntradaId = (typeof TIPOS_ENTRADA_IDS)[number];

export type ZonaEntrada = "pileta" | "tribuna";

export interface CupoEntrada {
	total: number;
	/** Precio que se cobra una vez superado el cupo. */
	precioSobreCupo: number;
}

export interface TipoEntrada {
	id: TipoEntradaId;
	zona: ZonaEntrada;
	nombre: string;
	descripcion: string;
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

export interface EstadoCupo {
	tipo: TipoEntradaId;
	total: number;
	ocupados: number;
	disponibles: number;
	agotado: boolean;
}
