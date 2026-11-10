import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { evento } from "@/data/evento";

export default function CtaInscripcion() {
	return (
		<section className="px-4 sm:px-6">
			<Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-brand/30 p-10 text-center sm:p-16">
				<div
					aria-hidden
					className="absolute inset-0 -z-10"
					style={{
						background:
							"radial-gradient(70% 90% at 50% 0%, color-mix(in srgb, var(--brand-2) 30%, transparent), transparent 70%), linear-gradient(135deg, #0d1a33, #071022)",
					}}
				/>
				<h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">
					Los lugares de pileta son limitados
				</h2>
				<p className="mx-auto mt-4 max-w-xl text-foreground/75">
					Asegurá tu lugar en la clínica con José Meolans en la {evento.nombre} {evento.edicion}.
				</p>
				<Link href="/inscripcion" className={buttonVariants({ variant: "water", size: "lg", className: "mt-8" })}>
					Inscribirme ahora <ArrowRight />
				</Link>
			</Reveal>
		</section>
	);
}
