"use client";

import { ArrowLeft, ArrowRight, LoaderCircle, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { esTipoEntradaId } from "@/data/entradas";
import { useInscripcionForm, type InscripcionFormController } from "@/hooks/use-inscripcion-form";
import { InscripcionExito } from "./inscripcion-exito";
import { PasoComprobante } from "./pasos/paso-comprobante";
import { PasoDatos } from "./pasos/paso-datos";
import { PasoEntrada } from "./pasos/paso-entrada";
import { PasoPago } from "./pasos/paso-pago";
import { PasoVerificacionEmail } from "./pasos/paso-verificacion-email";
import { ResumenPedido } from "./resumen-pedido";
import { Stepper } from "./stepper";

const PASOS: Record<InscripcionFormController["pasoId"], (ctrl: InscripcionFormController) => ReactNode> = {
	entrada: (ctrl) => <PasoEntrada ctrl={ctrl} />,
	datos: (ctrl) => <PasoDatos ctrl={ctrl} />,
	verificacion: (ctrl) => <PasoVerificacionEmail ctrl={ctrl} />,
	pago: (ctrl) => <PasoPago ctrl={ctrl} />,
	comprobante: (ctrl) => <PasoComprobante ctrl={ctrl} />,
};

/** Lee `?tipo=` de la URL (viene de las cards de precios). Debe ir dentro de <Suspense>. */
export default function InscripcionForm() {
	const params = useSearchParams();
	const tipoParam = params.get("tipo");
	return <InscripcionFormInterno key={tipoParam ?? "sin-tipo"} tipoInicial={esTipoEntradaId(tipoParam) ? tipoParam : undefined} />;
}

function InscripcionFormInterno({ tipoInicial }: { tipoInicial?: Parameters<typeof useInscripcionForm>[0] }) {
	const ctrl = useInscripcionForm(tipoInicial);
	const {
		paso,
		pasoId,
		indicePaso,
		estadoPasos,
		esUltimoPaso,
		siguiente,
		anterior,
		irAPaso,
		enviar,
		enviando,
		procesandoPaso,
		resultado,
		reiniciar,
	} = ctrl;
	const formRef = useRef<HTMLFormElement>(null);
	const pasoPrevio = useRef(indicePaso);

	// Al cambiar de paso, llevar el inicio del formulario a la vista (importante en mobile).
	useEffect(() => {
		if (pasoPrevio.current === indicePaso) return;
		pasoPrevio.current = indicePaso;
		const form = formRef.current;
		if (form && form.getBoundingClientRect().top < 80) {
			form.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [indicePaso]);

	if (resultado) return <InscripcionExito resultado={resultado} onNueva={reiniciar} />;

	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (esUltimoPaso) void enviar(e);
		else void siguiente();
	};

	return (
		<div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
			<form
				ref={formRef}
				onSubmit={onSubmit}
				noValidate
				className="scroll-mt-28 rounded-2xl border border-border/90 bg-surface/70 p-5 sm:p-8"
			>
				<Stepper pasos={estadoPasos} indiceActual={indicePaso} onIrA={irAPaso} deshabilitado={enviando || procesandoPaso} />

				<div className="mt-10">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={pasoId}
							initial={{ opacity: 0, x: 24 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -24 }}
							transition={{ duration: 0.25 }}
						>
							<h2 className="font-display text-2xl font-semibold tracking-tight">{paso.titulo}</h2>
							<p className="mt-1 mb-6 text-sm leading-6 text-muted-foreground">{paso.descripcion}</p>
							{PASOS[pasoId](ctrl)}
						</motion.div>
					</AnimatePresence>
				</div>

				<div className="mt-10 flex items-center justify-between gap-3 border-t border-border/80 pt-6">
					<Button variant="ghost" onClick={anterior} disabled={indicePaso === 0 || enviando || procesandoPaso} className={indicePaso === 0 ? "invisible" : undefined}>
						<ArrowLeft /> Atrás
					</Button>
					<Button
						type="submit"
						variant={esUltimoPaso ? "water" : "default"}
						disabled={enviando || procesandoPaso}
						className="min-w-40 rounded-lg shadow-none hover:translate-y-0 hover:shadow-none"
					>
						{enviando ? (
							<>
								<LoaderCircle className="animate-spin" /> Enviando…
							</>
						) : procesandoPaso ? (
							<>
								<LoaderCircle className="animate-spin" />
								{pasoId === "datos" ? "Enviando código…" : pasoId === "verificacion" ? "Verificando…" : "Continuando…"}
							</>
						) : esUltimoPaso ? (
							<>
								Enviar inscripción <Send />
							</>
						) : (
							<>
								Continuar <ArrowRight />
							</>
						)}
					</Button>
				</div>
			</form>

			<ResumenPedido ctrl={ctrl} />
		</div>
	);
}
