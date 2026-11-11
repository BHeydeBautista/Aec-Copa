import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { evento } from "@/data/evento";
import { obtenerTipoEntrada } from "@/data/entradas";
import type { EntradaVerificada } from "@/types";
import { formatearFechaLarga, formatearPrecio } from "@/lib/format";
import { DescargarTicket } from "./descargar-ticket";

export function EntradaConfirmada({
	entrada,
	token,
	verificada,
}: {
	entrada: EntradaVerificada;
	token: string;
	verificada: boolean;
}) {
	const tipo = obtenerTipoEntrada(entrada.tipoEntrada);
	const urlVerificacion = new URL("/entrada", entrada.urlSitio);
	urlVerificacion.searchParams.set("id", entrada.id);
	urlVerificacion.searchParams.set("token", token);
	urlVerificacion.searchParams.set("verificar", "1");

	return (
		<section className="relative px-4 pt-32 pb-16 sm:px-6">
			<div className="mx-auto max-w-2xl">
				<header className="mb-8 text-center">
					<p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">Atlético Echagüe Club · Natación Máster</p>
					<h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
						{verificada ? "Entrada válida" : "Tu entrada está confirmada"}
					</h1>
					<p className="mt-3 text-muted-foreground">
						{verificada
							? "El pago figura aprobado en el registro oficial."
							: "Presentá este código QR en la acreditación. Se verifica en línea."}
					</p>
				</header>

				<article id="ticket-imprimible" className="mx-auto grid max-w-xl gap-7 rounded-3xl border border-slate-200 bg-[#fbfcfd] p-6 text-slate-900 shadow-2xl sm:grid-cols-[1fr_auto] sm:p-8">
					<div>
						<p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">Copa Challenger 2026</p>
						<p className="mt-3 font-mono text-sm font-semibold tracking-wider">{entrada.id}</p>
						<h2 className="mt-5 text-2xl font-bold">{entrada.nombre} {entrada.apellido}</h2>
						<p className="mt-2 text-sm text-slate-600">{tipo?.nombre ?? entrada.tipoEntrada}</p>
						{tipo?.observacion && (
							<p className="mt-3 rounded-lg border border-amber-700/30 bg-amber-100/70 px-3 py-2 text-sm leading-5 text-amber-950">
								{tipo.observacion}
							</p>
						)}

						<dl className="mt-6 space-y-3 border-t border-dashed border-slate-300 pt-5 text-sm">
							<div className="flex justify-between gap-4">
								<dt className="text-slate-500">Fecha</dt>
								<dd className="text-right font-medium">{formatearFechaLarga(evento.fechaClinica)}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-slate-500">Lugar</dt>
								<dd className="text-right font-medium">{evento.sede.nombre}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-slate-500">Cantidad</dt>
								<dd className="font-medium tabular-nums">{entrada.cantidad}</dd>
							</div>
							<div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
								<dt className="text-slate-500">Pago confirmado</dt>
								<dd className="font-semibold tabular-nums">{formatearPrecio(entrada.total)}</dd>
							</div>
						</dl>
					</div>

					<div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
						<QRCodeSVG
							value={urlVerificacion.toString()}
							size={176}
							level="H"
							title={`QR de verificación para ${entrada.id}`}
							className="h-auto max-w-full"
						/>
						<p className="mt-3 max-w-44 text-center text-xs leading-5 text-slate-600">
							Escaneá para comprobar que la entrada siga aprobada.
						</p>
					</div>
				</article>

				<div className="mt-6 flex flex-col items-center gap-5 text-center print:hidden">
					<DescargarTicket />
					<Link href="/#precios" className="text-sm font-medium text-brand underline-offset-4 hover:underline">
						Volver a los tickets del evento
					</Link>
				</div>
			</div>
		</section>
	);
}
