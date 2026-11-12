import Link from "next/link";
import type { CSSProperties } from "react";
import { evento } from "@/data/evento";
import { formatearFechaCorta } from "@/lib/format";
import { barras, type Ticket } from "@/lib/ticket";
import { cn } from "@/lib/utils";

export type FaseImpresion = "quieto" | "arrancar" | "oculto" | "imprimir";

const ENTRADA = "cubic-bezier(0.22, 1, 0.36, 1)";
const SALIDA = "cubic-bezier(0.4, 0, 1, 1)";

// Bordes dentados arriba y abajo con una máscara CSS (nítida a cualquier tamaño).
const MASCARA = [
	"linear-gradient(135deg, transparent 50%, black 0)",
	"linear-gradient(-135deg, transparent 50%, black 0)",
	"linear-gradient(black, black)",
	"linear-gradient(135deg, black 50%, transparent 0)",
	"linear-gradient(-135deg, black 50%, transparent 0)",
].join(", ");
const MASCARA_TAM = "12px 12px, 12px 12px, 100% calc(100% - 12px), 12px 12px, 12px 12px";
const MASCARA_POS = "0 0, 0 0, 0 6px, 0 100%, 0 100%";
const MASCARA_REP = "repeat-x, repeat-x, no-repeat, repeat-x, repeat-x";

/**
 * Ticket "gastado" (quedan pocos cupos): papel amarillento, tinta que se va borrando en manchas,
 * dobleces y bordes sucios, como un ticket térmico que pasó de mano en mano.
 */
const PAPEL_GASTADO = "#efe5c9";
const DESGASTE = [
	// Dobleces
	"linear-gradient(96deg, transparent 49.5%, rgb(110 88 44 / 0.28) 50%, rgb(255 250 235 / 0.5) 50.4%, transparent 51%)",
	"linear-gradient(183deg, transparent 37.6%, rgb(110 88 44 / 0.22) 38%, rgb(255 250 235 / 0.45) 38.4%, transparent 38.9%)",
	// Tinta borrada (manchas del color del papel sobre el texto)
	"radial-gradient(60% 13% at 18% 27%, rgb(239 229 201 / 0.82), transparent 70%)",
	"radial-gradient(45% 10% at 82% 49%, rgb(239 229 201 / 0.78), transparent 70%)",
	"radial-gradient(55% 9% at 34% 66%, rgb(239 229 201 / 0.7), transparent 70%)",
	"radial-gradient(40% 8% at 70% 16%, rgb(239 229 201 / 0.65), transparent 70%)",
	// Bordes sucios
	"radial-gradient(120% 90% at 50% 50%, transparent 62%, rgb(120 92 40 / 0.22) 100%)",
].join(", ");

function estiloFase(fase: FaseImpresion, delay: number, imprimirMs: number, arrancarMs: number): CSSProperties {
	switch (fase) {
		case "arrancar":
			return {
				clipPath: "inset(0 0 0 0)",
				transform: "translateY(28px) rotate(0.5deg)",
				opacity: 0,
				transition: `transform ${arrancarMs}ms ${SALIDA} ${delay}ms, opacity ${arrancarMs}ms linear ${delay}ms`,
			};
		case "oculto":
			return { clipPath: "inset(0 0 100% 0)", transform: "none", opacity: 1, transition: "none" };
		case "imprimir":
			return { clipPath: "inset(0 0 0 0)", transform: "none", opacity: 1, transition: `clip-path ${imprimirMs}ms ${ENTRADA} ${delay}ms` };
		default:
			return { clipPath: "inset(0 0 0 0)", transform: "none", opacity: 1 };
	}
}

function Regla({ className }: { className?: string }) {
	return <div aria-hidden className={cn("border-t border-dashed border-current/30", className)} />;
}

interface TicketPrecioProps {
	ticket: Ticket;
	fase: FaseImpresion;
	delay: number;
	indice: number;
	formatear: (n: number) => string;
	imprimirMs: number;
	arrancarMs: number;
}

/** Una entrada impresa como ticket térmico. */
export function TicketPrecio({ ticket, fase, delay, indice, formatear, imprimirMs, arrancarMs }: TicketPrecioProps) {
	const { tipo } = ticket;
	const { dia, mes } = formatearFechaCorta(evento.fechaClinica);

	const papel: CSSProperties = {
		maskImage: MASCARA,
		maskSize: MASCARA_TAM,
		maskPosition: MASCARA_POS,
		maskRepeat: MASCARA_REP,
		WebkitMaskImage: MASCARA,
		WebkitMaskSize: MASCARA_TAM,
		WebkitMaskPosition: MASCARA_POS,
		WebkitMaskRepeat: MASCARA_REP,
		// Líneas de escaneo del papel térmico.
		backgroundImage: "repeating-linear-gradient(180deg, rgb(24 30 46 / 0.04) 0 1px, transparent 1px 4px)",
		...(ticket.pocosDisponibles ? { backgroundColor: PAPEL_GASTADO } : null),
		...estiloFase(fase, delay, imprimirMs, arrancarMs),
	};

	return (
		<div
			className={cn(
				"w-full max-w-[20rem] transition-transform duration-200 ease-out",
				ticket.agotado ? "opacity-70 grayscale" : "hover:-translate-y-1",
				ticket.pocosDisponibles && "-rotate-[1.2deg] hover:rotate-0",
			)}
			style={{ filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.25)) drop-shadow(0 14px 18px rgb(0 0 0 / 0.35))" }}
		>
			<article
				aria-label={`Entrada ${tipo.nombre}`}
				className={cn(
					"relative overflow-hidden bg-[#fbfcfd] px-6 pt-8 pb-7 font-mono text-[#1b2233]",
				)}
				style={papel}
			>
				<header className="text-center">
					<p className="text-[13px] font-semibold tracking-[0.3em] uppercase">Atl. Echagüe Club</p>
					<p className="mt-1.5 text-[11px] tracking-[0.14em] text-[#1b2233]/60 uppercase">Clínica Meolans · {evento.sede.ciudad.split(",")[0]}</p>
				</header>

				<Regla className="mt-5" />

				<dl className="mt-3 space-y-1 text-[11px] tracking-[0.1em] text-[#1b2233]/60 uppercase">
					<div className="flex justify-between gap-3">
						<dt>Orden</dt>
						<dd className="text-[#1b2233] tabular-nums">{ticket.orden}</dd>
					</div>
					<div className="flex justify-between gap-3">
						<dt>Fecha</dt>
						<dd className="text-[#1b2233]">
							{dia} {mes}
						</dd>
					</div>
				</dl>

				<Regla className="mt-3" />

				<div className="mt-4 text-center">
					<h3 className="text-lg leading-tight font-semibold tracking-[0.12em] uppercase">{tipo.nombre}</h3>
					<p className="mt-1 text-[11px] tracking-[0.06em] text-[#1b2233]/60 uppercase">{tipo.descripcion}</p>
					{tipo.observacion && (
						<p className="mt-2 border border-amber-700/35 bg-amber-100/60 px-2 py-1 text-[10px] font-semibold leading-4 text-amber-900 uppercase">
							{tipo.observacion}
						</p>
					)}
					{tipo.etiqueta && (
						<p className="mt-2 text-[11px] font-semibold tracking-[0.22em] text-[#cf3a44] uppercase">
							<span aria-hidden>*** </span>
							{tipo.etiqueta}
							<span aria-hidden> ***</span>
						</p>
					)}
				</div>

				<Regla className="mt-4" />

				<ul className="mt-4 space-y-1.5 text-xs tracking-[0.04em] uppercase">
					{ticket.filas.map((f) => (
						<li key={f.label} className="flex items-baseline gap-1.5">
							<span className="shrink-0">{f.label}</span>
							<span aria-hidden className="min-w-3 flex-1 -translate-y-[0.28em] border-b border-dotted border-current/35" />
							<span className={cn("shrink-0 tabular-nums", (ticket.pocosDisponibles || ticket.agotado) && f.label === "Cupo" && "font-semibold text-[#cf3a44]")}>
								{f.valor}
							</span>
						</li>
					))}
				</ul>

				<Regla className="mt-4" />

				<dl className="mt-4 space-y-1.5 text-xs tracking-[0.06em] uppercase">
					<div className="flex items-baseline justify-between gap-3">
						<dt>Subtotal</dt>
						<dd className="tabular-nums">{formatear(ticket.subtotal)}</dd>
					</div>
					{ticket.descuento > 0 && (
						<div className="flex items-baseline justify-between gap-3 text-[#cf3a44]">
							<dt>{tipo.zona === "pileta" ? "Desc. Challenger" : "Desc. socio"}</dt>
							<dd className="tabular-nums">-{formatear(ticket.descuento)}</dd>
						</div>
					)}
				</dl>

				<div className="mt-3 border-t-[3px] border-double border-current/40 pt-3">
					<div className="flex items-baseline justify-between gap-3">
						<p className="text-xs font-semibold tracking-[0.1em] uppercase">Total</p>
						<p className="font-marcador text-4xl leading-none font-extrabold tabular-nums">{formatear(ticket.total)}</p>
					</div>
					<p className="mt-1.5 text-[11px] tracking-[0.08em] text-[#1b2233]/60 uppercase">Por persona · pago por transferencia</p>
				</div>

				{ticket.sello && (
					<p
						className="mx-auto mt-4 w-fit border-2 border-[#cf3a44]/60 px-2.5 py-1 text-[11px] font-semibold tracking-[0.2em] text-[#cf3a44] uppercase"
						style={{ transform: `rotate(${-3 + (indice % 3) * 1.4}deg)` }}
					>
						{ticket.sello}
					</p>
				)}

				{ticket.pocosDisponibles && (
					<p className="relative z-10 mt-4 border-y-2 border-dashed border-[#cf3a44]/70 py-1.5 text-center text-[11px] font-bold tracking-[0.14em] text-[#cf3a44] uppercase">
						¡Se están por acabar los cupos!
					</p>
				)}

				{ticket.agotado ? (
					<p className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md border border-dashed border-current/40 text-xs font-semibold tracking-[0.16em] uppercase">
						Cupos cerrados por el momento
					</p>
				) : (
				<Link
					href={`/inscripcion?tipo=${tipo.id}`}
					className={cn(
						"relative z-10 mt-5 inline-flex h-11 w-full items-center justify-center rounded-md text-xs font-semibold tracking-[0.16em] uppercase transition-[background-color,transform] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-[#2a78b0]/50 active:scale-[0.98]",
						ticket.destacado ? "bg-[#14284d] text-white hover:bg-[#1d3866]" : "border border-current/30 hover:bg-[#1b2233]/5",
					)}
				>
					Elegir esta entrada
				</Link>
				)}

				<div className="mt-6" aria-hidden>
					<div className="mx-auto flex h-9 w-fit items-stretch">
						{barras(ticket.codigo, 46).map((w, b) => (
							<span key={b} className={b % 2 === 0 ? "bg-current" : ""} style={{ width: `${w}px` }} />
						))}
					</div>
					<p className="mt-1.5 text-center text-[11px] tracking-[0.24em] text-[#1b2233]/60 uppercase">{ticket.codigo}</p>
				</div>

				{ticket.pocosDisponibles && (
					<div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: DESGASTE }} />
				)}
				{ticket.agotado && (
					<div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
						<span className="-rotate-[18deg] border-4 border-[#cf3a44] px-4 py-1 font-marcador text-5xl font-extrabold tracking-[0.12em] text-[#cf3a44] uppercase opacity-80">
							Cerrado
						</span>
					</div>
				)}
			</article>
		</div>
	);
}
