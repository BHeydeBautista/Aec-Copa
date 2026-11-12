import type { EstadoCupo, TipoEntrada } from "@/types";

/** ¿Esta entrada dejó de venderse porque se completó su cupo? */
export function entradaCerrada(tipo: TipoEntrada, cupo?: EstadoCupo | null): boolean {
	return Boolean(tipo.cupo && tipo.zona === cupo?.tipo && cupo.agotado);
}

/** Precio unitario de una entrada. (Con el cupo completo la entrada se cierra: no cambia de precio.) */
export function calcularPrecioUnitario(tipo: TipoEntrada): number {
	return tipo.precio;
}

export function calcularTotal(tipo: TipoEntrada, cantidad: number): number {
	return calcularPrecioUnitario(tipo) * Math.max(1, cantidad);
}
