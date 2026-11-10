import type { Metadata } from "next";
import { Suspense } from "react";
import InscripcionForm from "@/components/inscripcion/inscripcion-form";
import InscripcionSkeleton from "@/components/inscripcion/inscripcion-skeleton";
import { SectionHeading } from "@/components/ui/section-heading";

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
				<SectionHeading
					eyebrow="Inscripción"
					titulo="Asegurá tu lugar"
					descripcion="Cuatro pasos: elegís la entrada, cargás tus datos, pagás y subís el comprobante."
				/>
				<div className="mt-12">
					<Suspense fallback={<InscripcionSkeleton />}>
						<InscripcionForm />
					</Suspense>
				</div>
			</div>
		</section>
	);
}
