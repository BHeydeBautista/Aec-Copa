"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
	return (
		<Sonner
			theme="dark"
			position="top-center"
			richColors
			toastOptions={{ style: { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" } }}
		/>
	);
}
