"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface CountdownProps {
	fechaIso: string;
	etiqueta: string;
	className?: string;
}

const UNIDADES = [
	{ clave: "dias", label: "días" },
	{ clave: "horas", label: "horas" },
	{ clave: "minutos", label: "min" },
	{ clave: "segundos", label: "seg" },
] as const;

export function Countdown({ fechaIso, etiqueta, className }: CountdownProps) {
	const restante = useCountdown(fechaIso);

	if (restante?.terminado) {
		return (
			<p className={cn("rounded-full border border-brand-2/30 bg-brand-2/10 px-4 py-2 text-sm font-medium text-brand-2", className)}>
				¡{etiqueta} ya comenzó!
			</p>
		);
	}

	return (
		<div className={cn("flex flex-col items-center gap-3", className)}>
			<p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{etiqueta} en</p>
			<div className="flex gap-2 sm:gap-3" role="timer" aria-live="off">
				{UNIDADES.map(({ clave, label }) => (
					<div
						key={clave}
						className="flex w-16 flex-col items-center rounded-2xl border border-foreground/10 bg-background/40 py-2.5 backdrop-blur-md sm:w-20 bajo:w-14 bajo:py-1.5"
					>
						<span className="font-display text-2xl font-bold tabular-nums sm:text-3xl bajo:text-xl">
							{restante ? String(restante[clave]).padStart(2, "0") : "--"}
						</span>
						<span className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</span>
					</div>
				))}
			</div>
		</div>
	);
}
