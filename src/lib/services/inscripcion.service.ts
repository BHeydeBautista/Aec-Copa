import type { EstadoCupo, InscripcionRespuesta } from "@/types";
import type { InscripcionFormValues } from "@/lib/validations/inscripcion.schema";

export interface RespuestaVerificacionEmail {
	ok: boolean;
	error?: string;
	token?: string;
}

async function solicitarVerificacionEmail(
	accion: "solicitar" | "confirmar",
	email: string,
	codigo?: string,
): Promise<RespuestaVerificacionEmail> {
	try {
		const res = await fetch("/api/verificacion-email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accion, email, codigo }),
		});
		const respuesta = (await res.json()) as RespuestaVerificacionEmail;
		if (!res.ok && respuesta.ok) {
			return { ok: false, error: "No pudimos verificar el email. Intentá nuevamente." };
		}
		return respuesta;
	} catch {
		return { ok: false, error: "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo." };
	}
}

export function enviarCodigoEmail(email: string): Promise<RespuestaVerificacionEmail> {
	return solicitarVerificacionEmail("solicitar", email);
}

export function confirmarCodigoEmail(email: string, codigo: string): Promise<RespuestaVerificacionEmail> {
	return solicitarVerificacionEmail("confirmar", email, codigo);
}

/** Cliente: envía la inscripción + comprobante al route handler. */
export async function enviarInscripcion(valores: InscripcionFormValues, tokenEmail: string): Promise<InscripcionRespuesta> {
	const body = new FormData();
	for (const [clave, valor] of Object.entries(valores)) {
		if (valor === undefined || valor === null) continue;
		body.append(clave, valor instanceof File ? valor : String(valor));
	}
	body.append("emailVerificationToken", tokenEmail);

	try {
		const res = await fetch("/api/inscripcion", { method: "POST", body });
		if (res.status === 413) {
			return { ok: false, error: "El comprobante supera el límite de subida. Reducilo a 4 MB o menos e intentá de nuevo." };
		}
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
