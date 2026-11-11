"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DescargarTicket() {
	return (
		<div className="print:hidden">
			<Button type="button" variant="outline" onClick={() => window.print()}>
				<Download />
				Guardar ticket como PDF
			</Button>
			<p className="mt-2 text-center text-xs text-muted-foreground">
				En la ventana de impresión, elegí «Guardar como PDF».
			</p>
		</div>
	);
}
