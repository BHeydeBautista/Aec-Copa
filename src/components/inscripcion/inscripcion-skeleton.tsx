export default function InscripcionSkeleton() {
	return (
		<div className="grid animate-pulse gap-8 lg:grid-cols-[1fr_340px]" aria-busy="true" aria-label="Cargando formulario">
			<div className="h-[520px] rounded-3xl border border-border bg-surface/60" />
			<div className="h-64 rounded-3xl border border-border bg-surface/60" />
		</div>
	);
}
