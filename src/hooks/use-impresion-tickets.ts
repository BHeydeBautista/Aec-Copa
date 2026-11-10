"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { FaseImpresion } from "@/components/sections/precios/ticket-precio";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Opciones {
	cantidad: number;
	imprimirMs?: number;
	arrancarMs?: number;
	escalonMs?: number;
}

/**
 * Selección + secuencia de "impresión" de tickets. `cambiar()` arranca los tickets viejos y
 * imprime los nuevos línea a línea. También imprime la primera vez que la sección entra en pantalla.
 */
export function useImpresionTickets<T>(
	inicial: T,
	raizRef: RefObject<HTMLElement | null>,
	{ cantidad, imprimirMs = 520, arrancarMs = 200, escalonMs = 90 }: Opciones,
) {
	const reducir = useReducedMotion();
	const [seleccion, setSeleccion] = useState<T>(inicial);
	const [impreso, setImpreso] = useState<T>(inicial);
	const [fase, setFase] = useState<FaseImpresion>("quieto");
	const timers = useRef<number[]>([]);
	const extra = escalonMs * (Math.max(cantidad, 1) - 1);

	const limpiar = () => {
		timers.current.forEach((t) => window.clearTimeout(t));
		timers.current = [];
	};
	useEffect(() => limpiar, []);

	const cambiar = useCallback(
		(nuevo: T) => {
			setSeleccion(nuevo);
			limpiar();
			if (reducir) {
				setImpreso(nuevo);
				setFase("quieto");
				return;
			}
			const finArranque = arrancarMs + extra;
			setFase("arrancar");
			timers.current.push(
				window.setTimeout(() => {
					setImpreso(nuevo);
					setFase("oculto");
				}, finArranque),
				window.setTimeout(() => setFase("imprimir"), finArranque + 32),
				window.setTimeout(() => setFase("quieto"), finArranque + 32 + imprimirMs + extra),
			);
		},
		[reducir, arrancarMs, imprimirMs, extra],
	);

	// Primera impresión al entrar en pantalla (el SSR muestra el ticket completo).
	useLayoutEffect(() => {
		const raiz = raizRef.current;
		if (!raiz || reducir) return;
		const r = raiz.getBoundingClientRect();
		if (r.top < window.innerHeight * 0.9 && r.bottom > 0) return;
		const io = new IntersectionObserver(
			(entradas) => {
				if (!entradas.some((e) => e.isIntersecting)) return;
				io.disconnect();
				setFase("oculto");
				timers.current.push(
					window.setTimeout(() => setFase("imprimir"), 32),
					window.setTimeout(() => setFase("quieto"), 32 + imprimirMs + extra),
				);
			},
			{ threshold: 0.15 },
		);
		io.observe(raiz);
		return () => io.disconnect();
		// Solo al montar.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { seleccion, cambiar, impreso, fase, imprimirMs, arrancarMs, escalonMs };
}
