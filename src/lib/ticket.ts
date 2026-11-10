import { calcularPrecioUnitario } from "@/lib/precios";
import type { EstadoCupo, TipoEntrada } from "@/types";

/** FNV-1a: estable entre server y cliente, alcanza para número de orden y código de barras. */
export function hash(semilla: string): number {
	let h = 2166136261;
	for (let i = 0; i < semilla.length; i++) {
		h ^= semilla.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** Anchos de barras (px) derivados de la semilla: el mismo ticket imprime siempre el mismo código. */
export function barras(semilla: string, cantidad: number): number[] {
	let h = hash(semilla);
	const out: number[] = [];
	for (let i = 0; i < cantidad; i++) {
		h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
		out.push((h % 3) + 1);
	}
	return out;
}

export interface FilaTicket {
	label: string;
	valor: string;
}

export interface Ticket {
	tipo: TipoEntrada;
	orden: string;
	codigo: string;
	filas: FilaTicket[];
	subtotal: number;
	descuento: number;
	total: number;
	/** Texto del sello (ej: "Ahorrás $5.000"); null = sin sello. */
	sello: string | null;
	destacado: boolean;
}

/**
 * Arma el contenido de un ticket. El "subtotal" es el precio general de la misma zona,
 * así la entrada Challenger/Socios muestra su descuento como una línea más del ticket.
 */
export function armarTicket(
	tipo: TipoEntrada,
	general: TipoEntrada,
	cupo: EstadoCupo | null,
	formatear: (n: number) => string,
): Ticket {
	const cupoPropio = tipo.cupo && cupo?.tipo === tipo.id ? cupo : null;
	const total = calcularPrecioUnitario(tipo, cupoPropio);
	const subtotal = Math.max(general.precio, total);
	const descuento = subtotal - total;
	const orden = `AEC-${(hash(tipo.id) % 90000) + 10000}`;

	const filas: FilaTicket[] = [
		{ label: "Zona", valor: tipo.zona === "pileta" ? "Pileta" : "Tribuna" },
		...tipo.beneficios.map((b) => ({ label: b, valor: "Incl." })),
	];
	if (tipo.cupo) {
		filas.push({
			label: "Cupo",
			valor: cupoPropio ? (cupoPropio.agotado ? "Completo" : `Quedan ${cupoPropio.disponibles}`) : String(tipo.cupo.total),
		});
	}
	if (tipo.requiereAcreditacion) filas.push({ label: "Acredita", valor: "N° socio" });

	return {
		tipo,
		orden,
		codigo: `${orden}-${tipo.zona === "pileta" ? "PI" : "TR"}`,
		filas,
		subtotal,
		descuento,
		total,
		sello: descuento > 0 ? `Ahorrás ${formatear(descuento)}` : cupoPropio?.agotado ? "Cupo completo" : null,
		destacado: Boolean(tipo.destacado || tipo.requiereAcreditacion),
	};
}
