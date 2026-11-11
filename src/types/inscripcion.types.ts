import type { TipoEntradaId } from "./entrada.types";
import type { MetodoPagoId } from "./pago.types";

export interface DatosPersonales {
	nombre: string;
	apellido: string;
	dni: string;
	email: string;
	telefono: string;
	club?: string;
}

/** Lo que se guarda (en Google Sheets o en el archivo local de desarrollo). */
export interface InscripcionRegistro extends DatosPersonales {
	id: string;
	creadoEn: string;
	tipoEntrada: TipoEntradaId;
	cantidad: number;
	numeroSocio?: string;
	metodoPago: MetodoPagoId;
	precioUnitario: number;
	total: number;
	observaciones?: string;
	comprobante: {
		nombre: string;
		tipo: string;
		tamano: number;
		url?: string;
	};
	estado: "pendiente" | "aprobado" | "rechazado";
}

export interface InscripcionRespuestaOk {
	ok: true;
	id: string;
	total: number;
}

export interface InscripcionRespuestaError {
	ok: false;
	error: string;
	campos?: Record<string, string>;
}

export type InscripcionRespuesta = InscripcionRespuestaOk | InscripcionRespuestaError;

export interface EntradaVerificada {
	id: string;
	nombre: string;
	apellido: string;
	tipoEntrada: TipoEntradaId;
	cantidad: number;
	total: number;
	urlSitio: string;
}

export interface PasoFormulario {
	id: "datos" | "entrada" | "verificacion" | "pago" | "comprobante";
	titulo: string;
	descripcion: string;
}
