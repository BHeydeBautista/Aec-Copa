import { obtenerTipoEntrada } from "@/data/entradas";
import { calcularPrecioUnitario, entradaCerrada } from "@/lib/precios";
import { generarIdInscripcion, guardarInscripcion, obtenerCupo } from "@/lib/server/inscripciones.repository";
import { inscripcionSchema } from "@/lib/validations/inscripcion.schema";
import type { InscripcionRegistro, InscripcionRespuesta } from "@/types";

export async function POST(request: Request) {
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return responder({ ok: false, error: "Formulario inválido" }, 400);
	}

	const texto = (clave: string) => {
		const v = formData.get(clave);
		return typeof v === "string" ? v : undefined;
	};
	const emailVerificationToken = texto("emailVerificationToken");
	if (!emailVerificationToken) {
		return responder({ ok: false, error: "Verificá tu email antes de enviar la inscripción." }, 422);
	}

	const resultado = inscripcionSchema.safeParse({
		tipoEntrada: texto("tipoEntrada"),
		cantidad: Number(texto("cantidad")),
		numeroSocio: texto("numeroSocio"),
		nombre: texto("nombre"),
		apellido: texto("apellido"),
		dni: texto("dni"),
		email: texto("email"),
		telefono: texto("telefono"),
		club: texto("club"),
		metodoPago: texto("metodoPago"),
		comprobante: formData.get("comprobante"),
		observaciones: texto("observaciones"),
		aceptaTerminos: texto("aceptaTerminos") === "true",
	});

	if (!resultado.success) {
		const campos: Record<string, string> = {};
		for (const issue of resultado.error.issues) {
			const clave = String(issue.path[0] ?? "formulario");
			campos[clave] ??= issue.message;
		}
		return responder({ ok: false, error: "Revisá los datos del formulario", campos }, 422);
	}

	const datos = resultado.data;
	const tipo = obtenerTipoEntrada(datos.tipoEntrada)!;

	try {
		// El precio se recalcula en el servidor: nunca se confía en el total del cliente.
		const cupo = tipo.cupo ? await obtenerCupo() : null;
		if (entradaCerrada(tipo, cupo)) {
			return responder(
				{ ok: false, error: `Se agotó el cupo de ${tipo.nombre}. Elegí otra entrada.`, campos: { tipoEntrada: "Cupo agotado" } },
				409,
			);
		}
		const precioUnitario = calcularPrecioUnitario(tipo);
		const id = generarIdInscripcion();

		const registro: InscripcionRegistro = {
			id,
			creadoEn: new Date().toISOString(),
			tipoEntrada: datos.tipoEntrada,
			cantidad: datos.cantidad,
			numeroSocio: datos.numeroSocio,
			nombre: datos.nombre,
			apellido: datos.apellido,
			dni: datos.dni,
			email: datos.email,
			telefono: datos.telefono,
			club: datos.club,
			metodoPago: datos.metodoPago,
			precioUnitario,
			total: precioUnitario * datos.cantidad,
			observaciones: datos.observaciones,
			comprobante: {
				nombre: datos.comprobante.name,
				tipo: datos.comprobante.type,
				tamano: datos.comprobante.size,
			},
			estado: "pendiente",
		};

		const origenSitio = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || new URL(request.url).origin;
		const urlSitio = new URL(origenSitio);
		if (urlSitio.protocol !== "https:" && urlSitio.hostname !== "localhost" && urlSitio.hostname !== "127.0.0.1") {
			throw new Error("La URL del sitio debe usar HTTPS.");
		}
		await guardarInscripcion(registro, datos.comprobante, emailVerificationToken, urlSitio.origin);
		return responder({ ok: true, id, total: registro.total }, 201);
	} catch (error) {
		if (error instanceof Error && error.message === "CUPO_COMPLETO") {
			return responder(
				{ ok: false, error: `Se completó el cupo de ${tipo.nombre}. Elegí otra entrada.`, campos: { tipoEntrada: "Cupo agotado" } },
				409,
			);
		}
		console.error("[inscripcion] Error al guardar", error);
		return responder(
			{ ok: false, error: "No pudimos registrar tu inscripción. Intentá de nuevo en unos minutos." },
			500,
		);
	}
}

function responder(body: InscripcionRespuesta, status: number) {
	return Response.json(body, { status });
}
