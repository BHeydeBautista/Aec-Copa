"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Registro único de plugins. Importar gsap/ScrollTrigger/useGSAP siempre desde acá. */
if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger, useGSAP);
	// En mobile la barra de direcciones cambia el alto al scrollear: no recalcular por eso.
	ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
