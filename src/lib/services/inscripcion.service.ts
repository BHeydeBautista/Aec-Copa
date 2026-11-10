import type { EstadoCupo, InscripcionRespuesta } from "@/types";
import type { InscripcionFormValues } from "@/lib/validations/inscripcion.schema";

/** Cliente: envía la inscripción + comprobante al route handler. */
export async function enviarInscripcion(valores: InscripcionFormValues): Promise<InscripcionRespuesta> {
	const body = new FormData();
	for (const [clave, valor] of Object.entries(valores)) {
		if (valor === undefined || valor === null) continue;
		body.append(clave, valor instanceof File ? valor : String(valor));
	}

	try {
		const res = await fetch("/api/inscripcion", { method: "POST", body });
		return (await res.json()) as InscripcionRespuesta;
	} catch {
		return { ok: false, error: "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo." };
	}
}

export async function obtenerEstadoCupo(): Promise<EstadoCupo> {
	const res = await fetch("/api/cupos", { cache: "no-store" });
	if (!res.ok) throw new Error("No se pudo consultar el cupo");
	return (await res.json()) as EstadoCupo;
}
