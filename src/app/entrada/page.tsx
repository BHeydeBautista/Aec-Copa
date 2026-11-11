import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { obtenerEntradaVerificada } from "@/lib/server/inscripciones.repository";
import { EntradaConfirmada } from "./ticket";

export const metadata: Metadata = {
	title: "Tu entrada | Copa Challenger AEC",
	description: "Entrada digital verificable para la Copa Challenger AEC.",
	robots: { index: false, follow: false },
};

interface EntradaPageProps {
	searchParams: Promise<{ id?: string | string[]; token?: string | string[]; verificar?: string | string[] }>;
}

export default function EntradaPage({ searchParams }: EntradaPageProps) {
	return (
		<Suspense fallback={<EstadoEntrada titulo="Cargando entrada" mensaje="Estamos verificando el estado del pago." />}>
			<EntradaContenido searchParams={searchParams} />
		</Suspense>
	);
}

async function EntradaContenido({ searchParams }: EntradaPageProps) {
	await connection();
	const params = await searchParams;
	const id = typeof params.id === "string" ? params.id : "";
	const token = typeof params.token === "string" ? params.token : "";

	if (!/^AEC-[A-Z0-9]{8}$/.test(id) || !/^[\da-f-]{72}$/i.test(token)) {
		return <EstadoEntrada titulo="Entrada no disponible" mensaje="El enlace no contiene los datos necesarios para verificarla." />;
	}

	let entrada: Awaited<ReturnType<typeof obtenerEntradaVerificada>> | undefined;
	let falloConsulta = false;
	try {
		entrada = await obtenerEntradaVerificada(id, token);
	} catch (error) {
		console.error("[entrada] No se pudo consultar la verificación", error);
		falloConsulta = true;
	}
	if (falloConsulta) {
		return (
			<EstadoEntrada
				titulo="No pudimos verificar la entrada"
				mensaje="El servicio de validación no está disponible en este momento. Volvé a intentar en unos minutos."
			/>
		);
	}
	if (!entrada) return <EstadoEntrada titulo="Entrada no válida" mensaje="No encontramos una entrada aprobada con este código." />;
	return <EntradaConfirmada entrada={entrada} token={token} verificada={params.verificar === "1"} />;
}

function EstadoEntrada({ titulo, mensaje }: { titulo: string; mensaje: string }) {
	return (
		<section className="relative px-4 pt-32 pb-16 sm:px-6">
			<div className="mx-auto max-w-xl rounded-3xl border border-border bg-surface/80 p-8 text-center sm:p-10">
				<p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">Copa Challenger AEC</p>
				<h1 className="mt-4 font-display text-3xl font-bold">{titulo}</h1>
				<p className="mt-3 leading-7 text-muted-foreground">{mensaje}</p>
			</div>
		</section>
	);
}
