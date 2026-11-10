"use client";

import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

interface CopyFieldProps {
	label: string;
	valor: string;
	destacado?: boolean;
}

export function CopyField({ label, valor, destacado }: CopyFieldProps) {
	const { copiado, copiar } = useCopyToClipboard();
	const ok = copiado === valor;

	return (
		<div className={cn("flex items-center justify-between gap-3 rounded-xl border px-4 py-3", destacado ? "border-brand/40 bg-brand/[0.07]" : "border-border bg-surface-2/40")}>
			<div className="min-w-0">
				<p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
				<p className={cn("truncate font-mono", destacado ? "text-lg font-bold" : "text-sm")}>{valor}</p>
			</div>
			<button
				type="button"
				onClick={() => copiar(valor)}
				aria-label={`Copiar ${label}`}
				className={cn(
					"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
					ok ? "border-success/50 bg-success/15 text-success" : "border-border hover:border-brand/50 hover:text-brand",
				)}
			>
				{ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
				{ok ? "Copiado" : "Copiar"}
			</button>
		</div>
	);
}
