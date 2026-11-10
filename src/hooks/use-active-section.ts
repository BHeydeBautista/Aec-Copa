"use client";

import { useEffect, useState } from "react";

/** Devuelve el id de la sección visible para resaltar el link del navbar. */
export function useActiveSection(ids: string[]): string | null {
	const [activa, setActiva] = useState<string | null>(null);
	const clave = ids.join("|");

	useEffect(() => {
		const elementos = clave
			.split("|")
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);
		if (elementos.length === 0) return;

		const observer = new IntersectionObserver(
			(entradas) => {
				const visible = entradas
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
				if (visible) setActiva(visible.target.id);
			},
			{ rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
		);
		elementos.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [clave]);

	return activa;
}
