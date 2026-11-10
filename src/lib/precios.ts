import type { EstadoCupo, TipoEntrada } from "@/types";

/**
 * Precio unitario vigente para un tipo de entrada.
 * Si el tipo tiene cupo y está agotado, se cobra `precioSobreCupo`.
 */
export function calcularPrecioUnitario(tipo: TipoEntrada, cupo?: EstadoCupo | null): number {
	if (tipo.cupo && cupo?.tipo === tipo.id && cupo.agotado) {
		return tipo.cupo.precioSobreCupo;
	}
	return tipo.precio;
}

export function calcularTotal(tipo: TipoEntrada, cantidad: number, cupo?: EstadoCupo | null): number {
	return calcularPrecioUnitario(tipo, cupo) * Math.max(1, cantidad);
}
