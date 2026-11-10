"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard(duracionMs = 1800) {
	const [copiado, setCopiado] = useState<string | null>(null);
	const timeout = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timeout.current), []);

	const copiar = useCallback(
		async (texto: string, clave = texto) => {
			try {
				await navigator.clipboard.writeText(texto);
				setCopiado(clave);
				window.clearTimeout(timeout.current);
				timeout.current = window.setTimeout(() => setCopiado(null), duracionMs);
				return true;
			} catch {
				return false;
			}
		},
		[duracionMs],
	);

	return { copiado, copiar };
}
