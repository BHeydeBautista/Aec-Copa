"use client";

import { useEffect, useState } from "react";

export function useScrolled(umbral = 24): boolean {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > umbral);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [umbral]);

	return scrolled;
}
