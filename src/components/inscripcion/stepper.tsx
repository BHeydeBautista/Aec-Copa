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
				<div aria-hidden className="absolute top-[18px] right-[12.5%] left-[12.5%] h-px bg-foreground/15">
					<motion.div
						className="h-full bg-brand"
						animate={{ width: `${progreso}%` }}
						transition={{ type: "spring", stiffness: 120, damping: 20 }}
					/>
				</div>
				{pasos.map((paso, i) => (
					<li key={paso.id} className="relative flex flex-col items-center">
						<button
							type="button"
							disabled={deshabilitado || i > indiceActual}
							onClick={() => onIrA(i)}
							aria-current={paso.estado === "actual" ? "step" : undefined}
							className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed"
						>
							<span
								className={cn(
									"grid size-9 place-items-center rounded-full border text-xs font-semibold transition-colors duration-200",
									paso.estado === "completo" && "border-brand bg-brand text-brand-foreground",
									paso.estado === "actual" && "border-brand bg-background text-brand",
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
