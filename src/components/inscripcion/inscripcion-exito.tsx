"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatearPrecio } from "@/lib/format";
import type { InscripcionRespuestaOk } from "@/types";
import { CopyField } from "./copy-field";

interface InscripcionExitoProps {
	resultado: InscripcionRespuestaOk;
	onNueva: () => void;
}

export function InscripcionExito({ resultado, onNueva }: InscripcionExitoProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: "spring", stiffness: 200, damping: 22 }}
			className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-success/30 bg-surface/80 p-8 text-center backdrop-blur sm:p-10"
		>
			<motion.span
				initial={{ scale: 0, rotate: -30 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
				className="grid size-20 place-items-center rounded-full bg-success/15 text-success shadow-[0_0_60px_-10px_var(--success)]"
			>
				<CircleCheck className="size-10" />
			</motion.span>
			<h2 className="mt-6 font-display text-3xl font-bold">¡Inscripción enviada!</h2>
			<p className="mt-3 text-muted-foreground">
				Recibimos tus datos y el comprobante por {formatearPrecio(resultado.total)}. La organización va a revisar el pago y confirmar tu lugar.
			</p>
			<div className="mt-6 w-full text-left">
				<CopyField label="Código de inscripción" valor={resultado.id} destacado />
			</div>
			<p className="mt-3 text-xs text-muted-foreground">Guardalo: te lo pueden pedir en la acreditación.</p>
			<div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
				<Button variant="outline" className="flex-1" onClick={onNueva}>
					Inscribir a otra persona
				</Button>
				<Link href="/" className={buttonVariants({ className: "flex-1" })}>
					Volver al inicio
				</Link>
			</div>
		</motion.div>
	);
}
