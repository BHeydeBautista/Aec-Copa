import type { ConfiguracionPago } from "@/types";

/**
 * ⚠️ COMPLETAR con los datos reales de la cuenta del club antes de publicar.
 * Mientras alias/CBU digan "COMPLETAR", el paso de pago muestra un aviso.
 */
export const configuracionPago: ConfiguracionPago = {
	transferencia: {
		titular: "COMPLETAR",
		banco: "COMPLETAR",
		alias: "COMPLETAR",
		cbu: "COMPLETAR",
		cuit: undefined,
	},
	linkMercadoPago: null,
	metodos: [
		{
			id: "transferencia",
			nombre: "Transferencia",
			descripcion: "Transferí al alias del club y subí el comprobante.",
			habilitado: true,
		},
		{
			id: "mercadopago",
			nombre: "Mercado Pago",
			descripcion: "Pagá con el link y subí el comprobante.",
			habilitado: false, // se habilita al cargar linkMercadoPago
		},
	],
	comprobanteMaxMb: 5,
	comprobanteFormatos: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

export const pagoConfigurado = configuracionPago.transferencia.alias !== "COMPLETAR";

export const metodosHabilitados = configuracionPago.metodos.filter(
	(m) => m.habilitado || (m.id === "mercadopago" && configuracionPago.linkMercadoPago),
);
