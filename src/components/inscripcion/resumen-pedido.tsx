"use client";

import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { evento } from "@/data/evento";
import type { InscripcionFormController } from "@/hooks/use-inscripcion-form";
import { formatearFechaLarga, formatearPrecio } from "@/lib/format";

export function ResumenPedido({ ctrl }: { ctrl: InscripcionFormController }) {
	const { tipo, cantidad, precioUnitario, total, cupoAgotado } = ctrl;

	return (
		<aside className="rounded-2xl border border-border/80 bg-surface/45 p-5 lg:sticky lg:top-28 sm:p-6">
			<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Tu reserva</p>

			{tipo ? (
				<>
					<div className="mt-4 flex items-start gap-3">
						<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
							<Ticket className="size-5" />
						</span>
						<div>
							<p className="font-semibold">{tipo.nombre}</p>
							<p className="text-sm text-muted-foreground">
								{cantidad} × {formatearPrecio(precioUnitario)}
							</p>
							{tipo.observacion && <p className="mt-2 text-xs leading-5 text-amber-200">{tipo.observacion}</p>}
						</div>
					</div>
					<div className="mt-5 flex items-baseline justify-between border-t border-border/80 pt-5">
						<span className="text-sm text-muted-foreground">Total</span>
						<span className="font-display text-3xl font-extrabold tabular-nums">{formatearPrecio(total)}</span>
					</div>
				</>
			) : cupoAgotado ? (
				<p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
					Se agotó el cupo de la entrada que habías elegido. Elegí otra para continuar.
				</p>
			) : (
				<p className="mt-4 text-sm text-muted-foreground">Elegí una entrada para ver el total.</p>
			)}

			<ul className="mt-6 space-y-3 border-t border-border/80 pt-5 text-sm leading-6 text-muted-foreground">
				<li className="flex items-center gap-2">
					<CalendarDays className="size-4 text-brand-2" /> Clínica: {formatearFechaLarga(evento.fechaClinica)}
				</li>
				<li className="flex items-center gap-2">
					<MapPin className="size-4 text-brand-2" /> {evento.sede.nombre}
				</li>
			</ul>
		</aside>
	);
}
