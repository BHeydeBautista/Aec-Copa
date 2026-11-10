import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
	id: string;
	label: string;
	error?: string;
	hint?: string;
	opcional?: boolean;
	className?: string;
	children: ReactNode;
}

/** Label + control + mensaje de error accesible. El control debe usar `id` y `aria-describedby={`${id}-msg`}`. */
export function Field({ id, label, error, hint, opcional, className, children }: FieldProps) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-foreground/90">
				{label}
				{opcional && <span className="text-xs font-normal text-muted-foreground">Opcional</span>}
			</label>
			{children}
			{(error || hint) && (
				<p
					id={`${id}-msg`}
					role={error ? "alert" : undefined}
					className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
				>
					{error ?? hint}
				</p>
			)}
		</div>
	);
}
