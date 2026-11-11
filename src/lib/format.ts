const formatoPesos = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS",
	maximumFractionDigits: 0,
});

export function formatearPrecio(valor: number): string {
	return formatoPesos.format(valor);
}

const formatoFechaLarga = new Intl.DateTimeFormat("es-AR", {
	weekday: "long",
	day: "numeric",
	month: "long",
	timeZone: "America/Argentina/Buenos_Aires",
});

const formatoFechaCorta = new Intl.DateTimeFormat("es-AR", {
	day: "2-digit",
	month: "short",
	timeZone: "America/Argentina/Buenos_Aires",
});

/** Acepta una fecha ISO o una fecha ISO completa. Las fechas sin hora se toman a mediodía AR para evitar corrimientos. */
function aFecha(fecha: string): Date {
	return new Date(fecha.length === 10 ? `${fecha}T12:00:00-03:00` : fecha);
}

export function formatearFechaLarga(fecha: string): string {
	const texto = formatoFechaLarga.format(aFecha(fecha));
	return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatearFechaCorta(fecha: string): { dia: string; mes: string } {
	const partes = formatoFechaCorta.formatToParts(aFecha(fecha));
	return {
		dia: partes.find((p) => p.type === "day")?.value ?? "",
		mes: (partes.find((p) => p.type === "month")?.value ?? "").replace(".", ""),
	};
}

export function formatearTamanoArchivo(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
