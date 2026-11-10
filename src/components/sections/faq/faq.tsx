import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { preguntasFrecuentes } from "@/data/sitio";

/** Acordeón nativo (<details>): accesible y sin JS. */
export default function Faq() {
	return (
		<section id="preguntas" className="scroll-mt-20 py-24 sm:py-32">
			<div className="mx-auto max-w-3xl px-4 sm:px-6">
				<Reveal>
					<SectionHeading eyebrow="Preguntas frecuentes" titulo="Antes de inscribirte" />
				</Reveal>
				<div className="mt-12 flex flex-col gap-3">
					{preguntasFrecuentes.map((p, i) => (
						<Reveal key={p.id} delay={i * 0.05}>
							<details className="group rounded-2xl border border-border bg-surface/70 px-5 transition-colors open:border-brand/40 open:bg-surface">
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
									{p.pregunta}
									<ChevronDown className="size-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-180" />
								</summary>
								<p className="pb-5 leading-7 text-muted-foreground">{p.respuesta}</p>
							</details>
						</Reveal>
					))}
				</div>
			</div>
		</section>
	);
}
