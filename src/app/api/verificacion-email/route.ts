import { z } from "zod";
import { gestionarVerificacionEmail } from "@/lib/server/inscripciones.repository";

const solicitudSchema = z.discriminatedUnion("accion", [
	z.object({ accion: z.literal("solicitar"), email: z.email() }),
	z.object({ accion: z.literal("confirmar"), email: z.email(), codigo: z.string().regex(/^\d{6}$/) }),
]);

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
	}

	const validacion = solicitudSchema.safeParse(body);
	if (!validacion.success) {
		return Response.json({ ok: false, error: "Revisá el email y el código ingresados." }, { status: 422 });
	}

	try {
		const { accion, email } = validacion.data;
		const token = await gestionarVerificacionEmail(
			accion,
			email.trim().toLowerCase(),
			accion === "confirmar" ? validacion.data.codigo : undefined,
		);
		return Response.json({ ok: true, token });
	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "Error desconocido";
		console.error("[verificacion-email] Error al procesar", mensaje);
		const status = mensaje.includes("GOOGLE_SCRIPT_URL")
			? 503
			: /Esperá|límite diario/i.test(mensaje)
				? 429
				: /código|email|venc|intentos|coincide|solicitá/i.test(mensaje)
					? 422
					: 502;
		const errorUsuario =
			status === 503
				? "La verificación por email todavía no está configurada. Contactá a la organización."
				: status === 502
					? "No pudimos enviar el código. Intentá nuevamente más tarde."
					: mensaje;
		return Response.json({ ok: false, error: errorUsuario }, { status });
	}
}
