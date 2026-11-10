"use client";

import { useEffect, useRef, type RefObject } from "react";
import { VUELO } from "./vuelo-config";

interface VueloDronProps {
	/** Progreso de scroll del hero (0 → 1). Lo escribe ScrollTrigger en hero.tsx. */
	progresoRef: RefObject<{ progreso: number }>;
	activo: boolean;
	reducirMovimiento: boolean;
	/** Se llama cuando el primer cuadro ya está dibujado (para el fade-in). */
	onListo?: () => void;
}

/**
 * Vuelo de dron sobre el natatorio: una secuencia de cuadros (video generado con IA a partir de fotos
 * reales del club) dibujada en un <canvas> y sincronizada con el scroll.
 * Carga primero un cuadro de cada 8 para poder scrubear enseguida y después completa el resto.
 */
export default function VueloDron({ progresoRef, activo, reducirMovimiento, onListo }: VueloDronProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const activoRef = useRef(activo);

	useEffect(() => {
		activoRef.current = activo;
	}, [activo]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const vertical = window.innerHeight > window.innerWidth;
		const set = vertical ? VUELO.vertical : VUELO.horizontal;
		const total = set.cuadros;
		const imagenes: (HTMLImageElement | undefined)[] = new Array(total);
		let cancelado = false;
		let avisado = false;

		const cargar = (i: number) =>
			new Promise<void>((resolve) => {
				if (imagenes[i] || cancelado) return resolve();
				const img = new Image();
				img.decoding = "async";
				img.onload = () => {
					imagenes[i] = img;
					resolve();
				};
				img.onerror = () => resolve();
				img.src = `${set.carpeta}/f_${String(i).padStart(3, "0")}.webp`;
			});

		// Orden de carga: primero uno de cada 8, luego de cada 4, de cada 2 y el resto.
		const orden: number[] = [];
		const visto = new Set<number>();
		for (const paso of [8, 4, 2, 1]) {
			for (let i = 0; i < total; i += paso) {
				if (!visto.has(i)) {
					visto.add(i);
					orden.push(i);
				}
			}
		}
		(async () => {
			const LOTE = 6;
			for (let k = 0; k < orden.length && !cancelado; k += LOTE) {
				await Promise.all(orden.slice(k, k + LOTE).map(cargar));
			}
		})();

		const ajustar = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(canvas.clientWidth * dpr);
			canvas.height = Math.round(canvas.clientHeight * dpr);
			ultimo = -1;
		};

		/** Cuadro cargado más cercano al pedido (mientras termina de bajar el resto). */
		const masCercano = (i: number) => {
			for (let d = 0; d < total; d++) {
				if (imagenes[i - d]) return i - d;
				if (imagenes[i + d]) return i + d;
			}
			return -1;
		};

		let actual = 0; // progreso suavizado
		let ultimo = -1;
		let raf = 0;
		const dibujar = () => {
			raf = requestAnimationFrame(dibujar);
			if (!activoRef.current) return;
			const objetivo = Math.min(1, Math.max(0, progresoRef.current.progreso));
			actual += (objetivo - actual) * (reducirMovimiento ? 1 : 0.14);
			const indice = masCercano(Math.round(actual * (total - 1)));
			if (indice < 0 || indice === ultimo) return;
			const img = imagenes[indice]!;
			// object-fit: cover
			const escala = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
			const w = img.naturalWidth * escala;
			const h = img.naturalHeight * escala;
			ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
			ultimo = indice;
			if (!avisado) {
				avisado = true;
				onListo?.();
			}
		};

		ajustar();
		window.addEventListener("resize", ajustar);
		raf = requestAnimationFrame(dibujar);
		return () => {
			cancelado = true;
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", ajustar);
		};
	}, [progresoRef, reducirMovimiento, onListo]);

	return <canvas ref={canvasRef} className="size-full" aria-hidden />;
}
