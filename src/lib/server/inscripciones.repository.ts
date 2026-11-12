import { randomInt } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CUPO_PILETA_TOTAL } from "@/data/entradas";
import type { EntradaVerificada, EstadoCupo, InscripcionRegistro } from "@/types";

/**
 * Persistencia de inscripciones.
 *
 * - Producción: si existe GOOGLE_SCRIPT_URL, se envía todo a un Google Apps Script
 *   que guarda la fila en un Google Sheet y el comprobante en Drive (ver docs/google-apps-script.gs).
 * - Desarrollo: sin esa variable, se guarda en `.data/` dentro del proyecto.
 *   (No sirve en Vercel: su filesystem es de solo lectura.)
 */
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const SCRIPT_SECRET = process.env.GOOGLE_SCRIPT_SECRET ?? "";

const DIR_DATOS = path.join(process.cwd(), ".data");
const ARCHIVO_DB = path.join(DIR_DATOS, "inscripciones.json");
const DIR_COMPROBANTES = path.join(DIR_DATOS, "comprobantes");

const TIPOS_CUPO_PILETA = ["pileta-general", "pileta-challenger"] as const;
const CUPO_TIPO = "pileta" as const;

export function generarIdInscripcion(): string {
	const tiempo = Date.now().toString(36).slice(-4).toUpperCase();
	const azar = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
	return `AEC-${tiempo}${azar}`;
}

export async function guardarInscripcion(
	registro: InscripcionRegistro,
	archivo: File,
	tokenEmail: string,
	urlSitio: string,
): Promise<void> {
	if (SCRIPT_URL) {
		await guardarEnGoogle(registro, archivo, tokenEmail, urlSitio);
		return;
	}
	await guardarLocal(registro, archivo);
}

export async function obtenerEntradaVerificada(id: string, token: string): Promise<EntradaVerificada | undefined> {
	if (!SCRIPT_URL) throw new Error("Falta configurar Google Apps Script.");

	const url = new URL(SCRIPT_URL);
	url.searchParams.set("action", "ticket");
	url.searchParams.set("id", id);
	url.searchParams.set("token", token);
	url.searchParams.set("secret", SCRIPT_SECRET);

	const response = await fetch(url, { cache: "no-store" });
	const data = (await response.json().catch(() => null)) as
		| { ok?: boolean; ticket?: EntradaVerificada }
		| null;
	if (!response.ok || !data) throw new Error(`Apps Script respondió ${response.status}`);
	return data.ok ? data.ticket : undefined;
}

export async function gestionarVerificacionEmail(
	accion: "solicitar" | "confirmar",
	email: string,
	codigo?: string,
): Promise<string | undefined> {
	if (!SCRIPT_URL) throw new Error("Falta configurar GOOGLE_SCRIPT_URL para verificar emails.");
	const payload = {
		secret: SCRIPT_SECRET,
		action: accion === "solicitar" ? "solicitar-codigo-email" : "confirmar-codigo-email",
		email,
		...(accion === "solicitar" ? { codigo: randomInt(100000, 1000000).toString() } : { codigo }),
	};
	const response = await fetch(SCRIPT_URL, {
		method: "POST",
		headers: { "Content-Type": "text/plain;charset=utf-8" },
		body: JSON.stringify(payload),
		cache: "no-store",
	});
	const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; token?: string } | null;
	if (!response.ok || !data?.ok) {
		throw new Error(data?.error ?? `Apps Script respondió ${response.status}`);
	}
	return data.token;
}

export async function obtenerCupo(): Promise<EstadoCupo> {
	// Los pagos pendientes reservan lugar igual que los aprobados; al rechazar un pendiente, se libera.
	// Solo en desarrollo: CUPO_SIMULAR_APROBADOS simula lugares reservados para probar disponibilidad.
	const simulados = process.env.NODE_ENV !== "production" ? process.env.CUPO_SIMULAR_APROBADOS : undefined;
	const ocupados = simulados ? Number(simulados) : SCRIPT_URL ? await contarEnGoogle() : await contarLocal();
	return {
		tipo: CUPO_TIPO,
		agotado: ocupados >= CUPO_PILETA_TOTAL,
	};
}

// ─── Google Apps Script ─────────────────────────────────────────────────────────

async function guardarEnGoogle(registro: InscripcionRegistro, archivo: File, tokenEmail: string, urlSitio: string) {
	const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
	const res = await fetch(SCRIPT_URL!, {
		method: "POST",
		headers: { "Content-Type": "text/plain;charset=utf-8" },
		body: JSON.stringify({
			action: "inscripcion",
			secret: SCRIPT_SECRET,
			registro,
			emailVerificationToken: tokenEmail,
			urlSitio,
			archivo: { nombre: archivo.name, tipo: archivo.type, base64 },
		}),
		cache: "no-store",
	});
	const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
	if (!res.ok || !data?.ok) {
		throw new Error(data?.error ?? `Apps Script respondió ${res.status}`);
	}
}

async function contarEnGoogle(): Promise<number> {
	const url = new URL(SCRIPT_URL!);
	url.searchParams.set("action", "cupos");
	url.searchParams.set("tipo", CUPO_TIPO);
	url.searchParams.set("secret", SCRIPT_SECRET);
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error(`Apps Script respondió ${res.status} al consultar el cupo.`);
	const data = (await res.json()) as { tipo?: unknown; ocupados?: unknown; pendientes?: unknown; error?: string };
	const aprobados = data.ocupados;
	const pendientes = data.pendientes;
	if (
		data.tipo !== CUPO_TIPO ||
		typeof aprobados !== "number" ||
		typeof pendientes !== "number" ||
		!Number.isFinite(aprobados) ||
		!Number.isFinite(pendientes) ||
		aprobados < 0 ||
		pendientes < 0
	) {
		throw new Error(data.error ?? "Apps Script no informa aprobados y pendientes. Actualizá su implementación.");
	}
	return aprobados + pendientes;
}

// ─── Local (desarrollo) ─────────────────────────────────────────────────────────

async function leerLocal(): Promise<InscripcionRegistro[]> {
	let contenido: string;
	try {
		contenido = await readFile(ARCHIVO_DB, "utf8");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
		throw error;
	}
	return JSON.parse(contenido) as InscripcionRegistro[];
}

async function guardarLocal(registro: InscripcionRegistro, archivo: File) {
	const anterior = colaGuardadoLocal;
	let liberar: () => void = () => {};
	colaGuardadoLocal = new Promise<void>((resolve) => {
		liberar = resolve;
	});
	await anterior;
	try {
		const registros = await leerLocal();
		if (esTipoCupoPileta(registro.tipoEntrada) && contarReservasLocales(registros) + registro.cantidad > CUPO_PILETA_TOTAL) {
			throw new Error("CUPO_COMPLETO");
		}

		await mkdir(DIR_COMPROBANTES, { recursive: true });
		const extension = path.extname(archivo.name) || ".bin";
		const nombreArchivo = `${registro.id}${extension}`;
		await writeFile(path.join(DIR_COMPROBANTES, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));
		registros.push({ ...registro, comprobante: { ...registro.comprobante, url: `.data/comprobantes/${nombreArchivo}` } });
		await writeFile(ARCHIVO_DB, JSON.stringify(registros, null, 2), "utf8");
	} finally {
		liberar();
	}
}

async function contarLocal(): Promise<number> {
	return contarReservasLocales(await leerLocal());
}

let colaGuardadoLocal: Promise<void> = Promise.resolve();

function contarReservasLocales(registros: InscripcionRegistro[]): number {
	return registros
		.filter(
			(registro) =>
				esTipoCupoPileta(registro.tipoEntrada) && (registro.estado === "pendiente" || registro.estado === "aprobado"),
		)
		.reduce((cantidad, registro) => cantidad + Math.max(1, Number(registro.cantidad) || 1), 0);
}

function esTipoCupoPileta(tipo: InscripcionRegistro["tipoEntrada"]): boolean {
	return TIPOS_CUPO_PILETA.some((tipoCupo) => tipoCupo === tipo);
}
