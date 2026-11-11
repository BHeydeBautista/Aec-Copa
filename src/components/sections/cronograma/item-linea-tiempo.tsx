import type { CSSProperties } from "react";
import { formatearFechaCorta } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ItemLineaTiempo } from "@/types";

/** Rojo del borde de la pileta para la Copa, celeste de la tribuna para la Clínica. */
const ACENTO = { clinica: "#2a78b0", copa: "#cf3a44" } as const;
const ETIQUETA = { clinica: "Clínica", copa: "Copa" } as const;

/** Texto que "sube" desde abajo de su línea (lo anima GSAP con la clase tl-reveal). */
function Revelar({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<span className="block overflow-hidden">
			<span className={cn("tl-reveal block", className)}>{children}</span>
		</span>
	);
}

export function ItemLineaTiempoView({ item }: { item: ItemLineaTiempo }) {
	const estilo = { "--acento": ACENTO[item.categoria] } as CSSProperties;
	const { dia, mes } = formatearFechaCorta(item.fecha);

	if (item.tipo === "dia") {
		return (
			<article style={estilo} className="item-tl relative h-full w-[68vw] shrink-0 sm:w-[38vw] lg:w-[30vw]">
				{/* Placa del día sobre la línea, como el número de andarivel en la pared */}
				<div className="tl-dot absolute top-1/2 left-0 flex -translate-y-1/2 items-stretch overflow-hidden rounded-md bg-[var(--tl-tinta)] text-white">
					<span className="px-3 py-1.5 font-marcador text-5xl leading-none font-extrabold sm:text-6xl">{dia}</span>
					<span className="flex items-center bg-[var(--acento)] px-2.5 font-marcador text-lg font-semibold tracking-wider uppercase">{mes}</span>
				</div>
				<div className="absolute top-[8%] right-0 bottom-[56%] left-0 pr-6">
					<Revelar className="text-[11px] font-bold tracking-[0.22em] text-[var(--acento)] uppercase">{ETIQUETA[item.categoria]}</Revelar>
					<Revelar className="mt-2 line-clamp-2 font-display text-[clamp(1.75rem,3vw,3rem)] leading-[1.02] font-bold">{item.titulo}</Revelar>
					{item.lugar && <Revelar className="mt-2 text-sm text-[var(--tl-tenue)]">{item.lugar}</Revelar>}
				</div>
			</article>
		);
	}

	const arriba = item.posicion === "arriba";

	return (
		<article style={estilo} className="item-tl relative h-full w-[66vw] shrink-0 sm:w-[34vw] lg:w-[24vw]">
			<span
				aria-hidden
				className={cn(
					"tl-stem absolute left-0 w-0.5 bg-[var(--tl-tinta)]/70",
					arriba ? "top-[8%] bottom-1/2 origin-bottom" : "top-1/2 bottom-[8%] origin-top",
				)}
			/>
			<span
				aria-hidden
				className={cn(
					"tl-dot absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--tl-fondo)]",
					item.destacado ? "size-5 bg-[var(--acento)]" : "size-4 bg-[var(--tl-tinta)]",
				)}
			/>
			<div className={cn("absolute right-0 left-0 pr-6 pl-5", arriba ? "top-[8%]" : "bottom-[8%]")}>
				<Revelar className="text-[11px] font-bold tracking-[0.2em] text-[var(--acento)] uppercase">
					{ETIQUETA[item.categoria]} · {dia} {mes}
				</Revelar>
				<Revelar className="mt-1 font-marcador text-[15vw] leading-[0.9] font-extrabold tabular-nums sm:text-[6.5vw] lg:text-[4.8vw]">
					{item.hora}
				</Revelar>
				<Revelar className={cn("mt-1 text-lg leading-tight font-semibold sm:text-xl", item.destacado && "text-[var(--acento)]")}>
					{item.titulo}
				</Revelar>
				{item.descripcion && (
					<Revelar className="mt-1 text-[15px] leading-snug text-[var(--tl-tenue)] sm:text-base">{item.descripcion}</Revelar>
				)}
			</div>
		</article>
	);
}
