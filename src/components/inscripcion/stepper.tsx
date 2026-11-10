"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { PasoFormulario } from "@/types";

type EstadoPaso = "completo" | "actual" | "pendiente";

interface StepperProps {
	pasos: (PasoFormulario & { estado: EstadoPaso })[];
	indiceActual: number;
	onIrA: (indice: number) => void;
	deshabilitado?: boolean;
}

export function Stepper({ pasos, indiceActual, onIrA, deshabilitado }: StepperProps) {
	const progreso = (indiceActual / (pasos.length - 1)) * 100;

	return (
		<nav aria-label="Pasos de la inscripción">
			<ol className="relative grid grid-cols-4">
				<div aria-hidden className="absolute top-5 right-[12.5%] left-[12.5%] h-0.5 rounded-full bg-foreground/10">
					<motion.div
						className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
						animate={{ width: `${progreso}%` }}
						transition={{ type: "spring", stiffness: 120, damping: 20 }}
					/>
				</div>
				{pasos.map((paso, i) => (
					<li key={paso.id} className="relative flex flex-col items-center">
						<button
							type="button"
							disabled={deshabilitado}
							onClick={() => onIrA(i)}
							aria-current={paso.estado === "actual" ? "step" : undefined}
							className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed"
						>
							<span
								className={cn(
									"grid size-10 place-items-center rounded-full border-2 text-sm font-bold transition-all duration-300",
									paso.estado === "completo" && "border-brand bg-brand text-brand-foreground",
									paso.estado === "actual" && "border-brand-2 bg-background text-brand-2 shadow-[0_0_0_6px_color-mix(in_srgb,var(--brand-2)_15%,transparent)]",
									paso.estado === "pendiente" && "border-foreground/15 bg-background text-muted-foreground group-hover:border-foreground/30",
								)}
							>
								{paso.estado === "completo" ? <Check className="size-4" strokeWidth={3} /> : i + 1}
							</span>
							<span
								className={cn(
									"text-center text-xs font-medium sm:text-sm",
									paso.estado === "pendiente" ? "text-muted-foreground" : "text-foreground",
								)}
							>
								{paso.titulo}
							</span>
						</button>
					</li>
				))}
			</ol>
		</nav>
	);
}
