import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
	"flex h-11 w-full rounded-xl border border-input bg-surface-2/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors outline-none hover:border-brand/30 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
	return <input className={cn(inputClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
	return <textarea className={cn(inputClassName, "h-auto min-h-24 py-3", className)} {...props} />;
}
