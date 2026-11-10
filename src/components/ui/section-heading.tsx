import { cn } from "@/lib/utils";

interface SectionHeadingProps {
	eyebrow: string;
	titulo: string;
	descripcion?: string;
	align?: "left" | "center";
	className?: string;
}

export function SectionHeading({ eyebrow, titulo, descripcion, align = "center", className }: SectionHeadingProps) {
	return (
		<div className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
			<span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
				<span className="size-1.5 rounded-full bg-brand-2 shadow-[0_0_10px_var(--brand-2)]" />
				{eyebrow}
			</span>
			<h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">{titulo}</h2>
			{descripcion && (
				<p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg">{descripcion}</p>
			)}
		</div>
	);
}
