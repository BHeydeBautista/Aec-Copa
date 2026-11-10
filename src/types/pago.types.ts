export type MetodoPagoId = "transferencia" | "mercadopago";

export interface DatosTransferencia {
	titular: string;
	banco: string;
	alias: string;
	cbu: string;
	cuit?: string;
}

export interface MetodoPago {
	id: MetodoPagoId;
	nombre: string;
	descripcion: string;
	habilitado: boolean;
}

export interface ConfiguracionPago {
	transferencia: DatosTransferencia;
	/** Link de pago de Mercado Pago. null = método deshabilitado. */
	linkMercadoPago: string | null;
	metodos: MetodoPago[];
	/** Tamaño máximo del comprobante en MB. */
	comprobanteMaxMb: number;
	comprobanteFormatos: string[];
}
