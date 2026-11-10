import type { SlideHero } from "@/types";

/**
 * Textos del hero. Al scrollear, la cámara avanza sobre la pileta y se pasa de un slide al otro.
 * Cada string de `titulo` es una línea (se anima letra por letra).
 */
export const slidesHero: SlideHero[] = [
	{
		id: "copa",
		eyebrow: "Atlético Echagüe Club · Natación Master",
		titulo: ["Copa", "Challenger"],
		lineas: ["Torneo de natación master en el natatorio del club.", "Y la clínica con José Meolans, el mismo fin de semana."],
	},
	{
		id: "clinica",
		eyebrow: "Con José Meolans",
		titulo: ["Clínica", "Meolans"],
		lineas: ["Técnica, virajes y entrenamiento", "con un campeón mundial."],
	},
];
