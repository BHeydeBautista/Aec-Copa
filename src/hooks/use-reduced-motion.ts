"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function suscribir(cb: () => void) {
	const mql = window.matchMedia(QUERY);
	mql.addEventListener("change", cb);
	return () => mql.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
	return useSyncExternalStore(
		suscribir,
		() => window.matchMedia(QUERY).matches,
		() => false,
	);
}
