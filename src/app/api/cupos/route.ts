import { connection } from "next/server";
import { obtenerCupo } from "@/lib/server/inscripciones.repository";

export async function GET() {
	// Siempre en tiempo real: el cupo cambia con cada inscripción.
	await connection();
	try {
		return Response.json(await obtenerCupo(), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		console.error("[cupos] Error al consultar", error);
		return Response.json({ error: "No se pudo consultar el cupo" }, { status: 502 });
	}
}
