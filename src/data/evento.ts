import type { Evento } from "@/types";

/**
 * ⚠️ COMPLETAR: fechas, sede y contacto son valores de ejemplo.
 * Todo el sitio (hero, cuenta regresiva, cronograma, footer) lee de acá.
 */
export const evento: Evento = {
	nombre: "Copa Challenger",
	edicion: "2026",
	organizador: "Atlético Echagüe Club",
	organizadorCorto: "AEC",
	descripcion:
		"Torneo de natación master y clínica con José Meolans, organizado por la subcomisión de natación del Atlético Echagüe Club.",
	sede: {
		nombre: "Natatorio Atlético Echagüe Club",
		ciudad: "Paraná, Entre Ríos",
		mapsUrl: "https://maps.google.com/?q=Atletico+Echague+Club+Parana",
	},
	fechaClinica: "2026-11-28T09:00:00-03:00", // TODO: confirmar
	fechaCopa: "2026-11-29T08:30:00-03:00", // TODO: confirmar
	contacto: {
		email: undefined, // TODO: completar
		whatsapp: undefined, // TODO: completar, formato 5493430000000
		instagram: undefined, // TODO: completar, sin @
	},
};

/** Año fijo para el footer (evita `new Date()` en server components con cacheComponents). */
export const ANIO_SITIO = 2026;
export const VERSION_SITIO = "1.0";
