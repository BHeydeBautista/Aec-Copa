"use client";

import { useCallback, useEffect, useState } from "react";
import { obtenerEstadoCupo } from "@/lib/services/inscripcion.service";
import type { EstadoCupo } from "@/types";

interface UseCupoResultado {
	cupo: EstadoCupo | null;
	cargando: boolean;
	error: boolean;
	recargar: () => void;
}

/** Estado en vivo del cupo de Pileta Challenger. */
export function useCupo(): UseCupoResultado {
	const [cupo, setCupo] = useState<EstadoCupo | null>(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(false);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		let cancelado = false;
		obtenerEstadoCupo()
			.then((data) => {
				if (cancelado) return;
				setCupo(data);
				setError(false);
			})
			.catch(() => !cancelado && setError(true))
			.finally(() => !cancelado && setCargando(false));
		return () => {
			cancelado = true;
		};
	}, [version]);

	const recargar = useCallback(() => setVersion((v) => v + 1), []);

	return { cupo, cargando, error, recargar };
}
