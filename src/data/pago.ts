import type { ConfiguracionPago } from "@/types";

/** Cuenta de la Subcomisión de Natación Máster AEC para el pago de la clínica. */
export const configuracionPago: ConfiguracionPago = {
	transferencia: {
		titular: "Hugo Ariel Gieco",
		banco: "Naranja X",
		alias: "NatacionMaster.AEC",
		cbu: "4530000800019055475088",
		cuenta: "1905547508",
		cuil: "20312775213",
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
	comprobanteMaxMb: 4,
	comprobanteFormatos: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

export const pagoConfigurado = configuracionPago.transferencia.alias !== "COMPLETAR";

export const metodosHabilitados = configuracionPago.metodos.filter(
	(m) => m.habilitado || (m.id === "mercadopago" && configuracionPago.linkMercadoPago),
);
