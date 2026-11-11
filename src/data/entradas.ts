import type { TipoEntrada, TipoEntradaId } from "@/types";

export const tiposEntrada: TipoEntrada[] = [
	{
		id: "pileta-general",
		zona: "pileta",
		nombre: "Pileta General",
		descripcion: "Participación en la clínica dentro del agua.",
		precio: 20000,
		beneficios: ["Clínica completa en pileta", "Corrección técnica", "Acceso a tribuna"],
		maxCantidad: 1,
	},
	{
		id: "pileta-challenger",
		zona: "pileta",
		nombre: "Pileta Challenger",
		descripcion: "Precio especial para nadadores inscriptos en la Copa Challenger.",
		observacion: "Nadador de la Copa Challenger: queda a observación de la organización.",
		precio: 15000,
		etiqueta: "Cupo limitado",
		destacado: true,
		beneficios: ["Clínica completa en pileta", "Precio preferencial", "Acceso a tribuna"],
		cupo: {
			total: 60,
			// ⚠️ COMPLETAR: precio una vez superado el cupo de 60. Por defecto, el de Pileta General.
			precioSobreCupo: 20000,
		},
		maxCantidad: 1,
	},
	{
		id: "tribuna-general",
		zona: "tribuna",
		nombre: "Tribuna General",
		descripcion: "Mirá la clínica desde la tribuna.",
		precio: 7000,
		beneficios: ["Acceso a tribuna", "Charla técnica"],
		maxCantidad: 10,
	},
	{
		id: "tribuna-challenger",
		zona: "tribuna",
		nombre: "Tribuna Challenger / Socios AEC",
		descripcion: "Para nadadores de la Copa Challenger y socios del club.",
		precio: 5000,
		etiqueta: "Socios",
		beneficios: ["Acceso a tribuna", "Charla técnica", "Precio socio"],
		maxCantidad: 10,
		requiereAcreditacion: true,
	},
];

export function obtenerTipoEntrada(id: string | null | undefined): TipoEntrada | undefined {
	return tiposEntrada.find((t) => t.id === id);
}

export function esTipoEntradaId(id: string | null | undefined): id is TipoEntradaId {
	return tiposEntrada.some((t) => t.id === id);
}
