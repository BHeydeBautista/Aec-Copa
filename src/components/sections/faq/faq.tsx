import { ChevronDown } from "lucide-react";
import { preguntasFrecuentes } from "@/data/sitio";

/** Acordeón nativo (<details>): accesible y sin JS. */
export default function Faq() {
	return (
		<section id="preguntas" className="scroll-mt-20 py-24 sm:py-32">
			<div className="mx-auto max-w-3xl px-4 sm:px-6">
				<header>
					<p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">Información para tu inscripción</p>
					<h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">Preguntas frecuentes</h2>
				</header>
				<div className="mt-10">
					{preguntasFrecuentes.map((p, i) => (
						<details key={p.id} className="group border-b border-border/80 first:border-t">
							<summary className="grid cursor-pointer list-none grid-cols-[2rem_1fr_auto] items-center gap-3 py-5 font-medium transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
								<span aria-hidden className="font-mono text-xs tabular-nums text-muted-foreground">
									{String(i + 1).padStart(2, "0")}
								</span>
								<span className="text-base">{p.pregunta}</span>
								<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:text-brand" />
							</summary>
							<p className="max-w-2xl pb-5 pl-11 text-sm leading-7 text-muted-foreground">{p.respuesta}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
