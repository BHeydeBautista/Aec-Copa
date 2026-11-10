import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { obtenerTipoEntrada } from "@/data/entradas";
import type { EstadoCupo, InscripcionRegistro } from "@/types";

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

const CUPO_TIPO = "pileta-challenger" as const;

export function generarIdInscripcion(): string {
	const tiempo = Date.now().toString(36).slice(-4).toUpperCase();
	const azar = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
	return `AEC-${tiempo}${azar}`;
}

export async function guardarInscripcion(registro: InscripcionRegistro, archivo: File): Promise<void> {
	if (SCRIPT_URL) {
		await guardarEnGoogle(registro, archivo);
		return;
	}
	await guardarLocal(registro, archivo);
}

export async function obtenerCupo(): Promise<EstadoCupo> {
	const total = obtenerTipoEntrada(CUPO_TIPO)?.cupo?.total ?? 0;
	const ocupados = SCRIPT_URL ? await contarEnGoogle() : await contarLocal();
	// Las cantidades quedan del lado del servidor: al sitio solo le llega si hay o no lugar.
	return { tipo: CUPO_TIPO, agotado: total - ocupados <= 0 };
}

// ─── Google Apps Script ─────────────────────────────────────────────────────────

async function guardarEnGoogle(registro: InscripcionRegistro, archivo: File) {
	const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
	const res = await fetch(SCRIPT_URL!, {
		method: "POST",
		headers: { "Content-Type": "text/plain;charset=utf-8" },
		body: JSON.stringify({
			action: "inscripcion",
			secret: SCRIPT_SECRET,
			registro,
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
	const data = (await res.json()) as { ocupados?: number };
	return Number(data.ocupados ?? 0);
}

// ─── Local (desarrollo) ─────────────────────────────────────────────────────────

async function leerLocal(): Promise<InscripcionRegistro[]> {
	try {
		return JSON.parse(await readFile(ARCHIVO_DB, "utf8")) as InscripcionRegistro[];
	} catch {
		return [];
	}
}

async function guardarLocal(registro: InscripcionRegistro, archivo: File) {
	await mkdir(DIR_COMPROBANTES, { recursive: true });
	const extension = path.extname(archivo.name) || ".bin";
	const nombreArchivo = `${registro.id}${extension}`;
	await writeFile(path.join(DIR_COMPROBANTES, nombreArchivo), Buffer.from(await archivo.arrayBuffer()));

	const registros = await leerLocal();
	registros.push({ ...registro, comprobante: { ...registro.comprobante, url: `.data/comprobantes/${nombreArchivo}` } });
	await writeFile(ARCHIVO_DB, JSON.stringify(registros, null, 2), "utf8");
}

async function contarLocal(): Promise<number> {
	const registros = await leerLocal();
	return registros.filter((r) => r.tipoEntrada === CUPO_TIPO && r.estado !== "rechazado").length;
}
