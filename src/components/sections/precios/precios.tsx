"use client";

import { useMemo, useRef, type KeyboardEvent } from "react";
import { tiposEntrada } from "@/data/entradas";
import { useCupo } from "@/hooks/use-cupo";
import { useImpresionTickets } from "@/hooks/use-impresion-tickets";
import { formatearPrecio } from "@/lib/format";
import { armarTicket } from "@/lib/ticket";
import { cn } from "@/lib/utils";
import type { ZonaEntrada } from "@/types";
import { TicketPrecio } from "./ticket-precio";

const ZONAS: { id: ZonaEntrada; label: string; detalle: string }[] = [
	{ id: "pileta", label: "Pileta", detalle: "Adentro del agua con Meolans" },
	{ id: "tribuna", label: "Tribuna", detalle: "Mirando desde las gradas" },
];

/** Precios impresos como tickets térmicos. El selector Pileta/Tribuna "arranca" y reimprime los tickets. */
export default function Precios() {
	const raizRef = useRef<HTMLElement>(null);
	const botones = useRef<(HTMLButtonElement | null)[]>([]);
	const { cupo } = useCupo();
	const { seleccion: zona, cambiar: setZona, impreso, fase, imprimirMs, arrancarMs, escalonMs } = useImpresionTickets<ZonaEntrada>(
		"pileta",
		raizRef,
		{ cantidad: 2 },
	);

	const tickets = useMemo(() => {
		const deZona = tiposEntrada.filter((t) => t.zona === impreso);
		const general = deZona.reduce((a, b) => (b.precio > a.precio ? b : a));
		return deZona.map((t) => armarTicket(t, general, cupo, formatearPrecio));
	}, [impreso, cupo]);

	const onTecla = (e: KeyboardEvent<HTMLButtonElement>) => {
		const i = ZONAS.findIndex((z) => z.id === zona);
		let j = i;
		if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % ZONAS.length;
		else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i + ZONAS.length - 1) % ZONAS.length;
		else return;
		e.preventDefault();
		setZona(ZONAS[j].id);
		botones.current[j]?.focus();
	};

	return (
		<section ref={raizRef} id="precios" className="relative scroll-mt-20 py-24 sm:py-32">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<div className="mx-auto max-w-xl text-center">
					<p className="font-marcador text-lg font-semibold tracking-[0.18em] text-brand uppercase">Entradas · Clínica Meolans</p>
					<h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">¿Al agua o a la tribuna?</h2>
					<p className="mt-3 text-muted-foreground">
						Elegí dónde vivir la clínica. Nadadores de la Copa Challenger y socios del club tienen precio especial.
					</p>
				</div>

				<div
					role="radiogroup"
					aria-label="Zona"
					className="mx-auto mt-8 flex w-fit items-center rounded-md border border-border bg-surface p-1"
				>
					{ZONAS.map((z, i) => {
						const activa = zona === z.id;
						return (
							<button
								key={z.id}
								ref={(n) => {
									botones.current[i] = n;
								}}
								type="button"
								role="radio"
								aria-checked={activa}
								tabIndex={activa ? 0 : -1}
								onClick={() => z.id !== zona && setZona(z.id)}
								onKeyDown={onTecla}
								className={cn(
									"rounded-sm px-5 py-2 text-left transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-7",
									activa ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
								)}
							>
								<span className="block font-marcador text-xl leading-none font-extrabold tracking-wide uppercase">{z.label}</span>
								<span className={cn("mt-1 block text-[11px]", activa ? "text-background/70" : "text-muted-foreground")}>{z.detalle}</span>
							</button>
						);
					})}
				</div>

				<div className="mt-10 grid grid-cols-1 items-start justify-items-center gap-8 sm:grid-cols-2">
					{tickets.map((t, i) => (
						<TicketPrecio
							key={t.tipo.id}
							ticket={t}
							fase={fase}
							delay={escalonMs * i}
							indice={i}
							formatear={formatearPrecio}
							imprimirMs={imprimirMs}
							arrancarMs={arrancarMs}
						/>
					))}
				</div>

				{impreso === "pileta" && cupo?.agotado && (
					<p className="mx-auto mt-8 max-w-2xl rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive" role="status">
						Los cupos de pileta están cerrados por el momento.
					</p>
				)}

				<p className="sr-only" aria-live="polite">
					{tickets.map((t) => `${t.tipo.nombre} ${formatearPrecio(t.total)}`).join(", ")}
				</p>

				<p className="mx-auto mt-10 max-w-lg text-center text-sm text-muted-foreground">
					Pagás por transferencia y subís el comprobante en el formulario. Tu lugar queda confirmado cuando la organización revisa el pago.
				</p>
			</div>
		</section>
	);
}
