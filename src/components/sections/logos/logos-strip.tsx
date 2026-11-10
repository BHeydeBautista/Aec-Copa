import { LogoImage } from "@/components/ui/logo-image";
import { logos } from "@/data/sitio";
import { cn } from "@/lib/utils";

/** Franja con los 4 logos; club y masters más grandes. */
export default function LogosStrip() {
	return (
		<section aria-label="Organizan y acompañan" className="border-y border-border bg-surface/40 py-10">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 sm:px-6">
				<p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">Organizan y acompañan</p>
				<ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
					{logos.map((logo) => (
						<li key={logo.id} className="group flex flex-col items-center gap-2">
							<LogoImage
								logo={logo}
								sizes="96px"
								className={cn(
									"transition duration-300 group-hover:scale-105",
									logo.principal ? "size-20 sm:size-24" : "h-14 w-24 sm:h-16 sm:w-28",
								)}
							/>
							<span className="text-[11px] text-muted-foreground">{logo.nombre}</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
