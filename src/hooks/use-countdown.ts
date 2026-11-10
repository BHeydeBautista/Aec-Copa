"use client";

import { useEffect, useState } from "react";

export interface TiempoRestante {
	dias: number;
	horas: number;
	minutos: number;
	segundos: number;
	terminado: boolean;
}

function calcular(objetivo: number): TiempoRestante {
	const diff = Math.max(0, objetivo - Date.now());
	return {
		dias: Math.floor(diff / 86_400_000),
		horas: Math.floor((diff / 3_600_000) % 24),
		minutos: Math.floor((diff / 60_000) % 60),
		segundos: Math.floor((diff / 1000) % 60),
		terminado: diff === 0,
	};
}

/** Devuelve null hasta montar en el cliente (evita diferencias de hidratación). */
export function useCountdown(fechaIso: string): TiempoRestante | null {
	const [restante, setRestante] = useState<TiempoRestante | null>(null);

	useEffect(() => {
		const objetivo = new Date(fechaIso).getTime();
		const tick = () => setRestante(calcular(objetivo));
		tick();
		const id = window.setInterval(tick, 1000);
		return () => window.clearInterval(id);
	}, [fechaIso]);

	return restante;
}
