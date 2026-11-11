import type { Metadata } from "next";
import { Suspense } from "react";
import InscripcionForm from "@/components/inscripcion/inscripcion-form";
import InscripcionSkeleton from "@/components/inscripcion/inscripcion-skeleton";
import { evento } from "@/data/evento";
import { formatearFechaLarga } from "@/lib/format";

export const metadata: Metadata = {
	title: "Inscripción",
	description: "Elegí tu entrada para la Clínica Meolans, pagá y subí el comprobante.",
};

export default function InscripcionPage() {
	return (
		<section className="relative px-4 pt-32 pb-12 sm:px-6">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
				style={{ background: "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--brand-2) 16%, transparent), transparent 70%)" }}
			/>
			<div className="mx-auto max-w-6xl">
				<header className="mx-auto max-w-3xl text-center">
					<p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">Atlético Echagüe Club · Natación Máster</p>
					<h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">Inscripción a la clínica</h1>
					<p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
						Completá tus datos, elegí tu entrada y adjuntá el comprobante para reservar tu lugar.
					</p>
					<div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-border/80 py-3 text-sm text-muted-foreground">
						<span>{formatearFechaLarga(evento.fechaClinica)}</span>
						<span className="hidden size-1 rounded-full bg-brand/60 sm:block" aria-hidden />
						<span>{evento.sede.ciudad}</span>
					</div>
				</header>
				<div className="mt-10">
					<Suspense fallback={<InscripcionSkeleton />}>
						<InscripcionForm />
					</Suspense>
				</div>
			</div>
		</section>
	);
}
