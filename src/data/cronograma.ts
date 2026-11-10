import type { JornadaCronograma, PestanaCronograma } from "@/types";

export const pestanasCronograma: PestanaCronograma[] = [
	{
		id: "clinica",
		label: "Clínica Meolans",
		descripcion: "Una jornada de técnica y entrenamiento con José Meolans.",
	},
	{
		id: "copa",
		label: "Copa Challenger",
		descripcion: "Pruebas, series y premiación del torneo master.",
	},
];

/**
 * ⚠️ COMPLETAR: horarios y pruebas de ejemplo. Agregá o quitá jornadas/actividades
 * y la sección se ajusta sola.
 */
export const cronograma: JornadaCronograma[] = [
	{
		id: "clinica-dia-1",
		categoria: "clinica",
		fecha: "2026-11-28",
		titulo: "Clínica con José Meolans",
		lugar: "Natatorio AEC",
		actividades: [
			{ id: "c1", hora: "09:00", titulo: "Acreditación", descripcion: "Retiro de pulsera y kit." },
			{ id: "c2", hora: "09:30", titulo: "Charla técnica", descripcion: "Fundamentos de crol y virajes." },
			{ id: "c3", hora: "10:30", titulo: "Trabajo en pileta", descripcion: "Grupos por nivel con corrección individual.", destacado: true },
			{ id: "c4", hora: "12:30", titulo: "Preguntas y fotos", descripcion: "Cierre con Meolans." },
		],
	},
	{
		id: "copa-dia-1",
		categoria: "copa",
		fecha: "2026-11-29",
		titulo: "Copa Challenger · Jornada 1",
		lugar: "Natatorio AEC",
		actividades: [
			{ id: "p1", hora: "08:30", titulo: "Entrada en calor", descripcion: "Pileta habilitada para todos los nadadores." },
			{ id: "p2", hora: "09:15", titulo: "Inicio de pruebas", descripcion: "50 libre · 100 espalda · 50 pecho." },
			{ id: "p3", hora: "11:00", titulo: "Relevos", descripcion: "4x50 libre mixto.", destacado: true },
			{ id: "p4", hora: "12:30", titulo: "Premiación", descripcion: "Entrega de medallas por categoría." },
		],
	},
];
