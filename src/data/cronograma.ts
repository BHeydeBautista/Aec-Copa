import type { JornadaCronograma, PestanaCronograma } from "@/types";

export const pestanasCronograma: PestanaCronograma[] = [
	{
		id: "clinica",
		label: "Clínica Meolans",
		descripcion: "Clínica de natación con José Meolans en el natatorio del AEC.",
	},
	{
		id: "copa",
		label: "Copa Challenger",
		descripcion: "Sexta fecha de la Copa Challenger Alfredo Bourdillon.",
	},
];

export const cronograma: JornadaCronograma[] = [
	{
		id: "recepcion",
		categoria: "clinica",
		fecha: "2026-12-04",
		titulo: "Recepción y conferencia de prensa",
		lugar: "Sede Atlético Echagüe Club",
		actividades: [
			{ id: "r1", hora: "19:30", titulo: "Recepción", descripcion: "Autoridades, sponsors, prensa y socios." },
			{ id: "r2", hora: "20:00", titulo: "Conferencia de prensa", descripcion: "Presentación de José Meolans y de la clínica.", destacado: true },
			{ id: "r3", hora: "20:40", titulo: "Preguntas y fotos", descripcion: "Ronda de prensa y fotos institucionales." },
			{ id: "r4", hora: "21:00", titulo: "Brindis", descripcion: "Encuentro de la organización e invitados." },
		],
	},
	{
		id: "clinica",
		categoria: "clinica",
		fecha: "2026-12-05",
		titulo: "Clínica con José Meolans",
		lugar: "Natatorio Atlético Echagüe Club",
		actividades: [
			{ id: "c1", hora: "09:15", titulo: "Acreditación y apertura", descripcion: "Ingreso de participantes y ubicación del público." },
			{ id: "c2", hora: "10:00", titulo: "Clínica de natación", descripcion: "Técnica, flotación, posición hidrodinámica, largadas, vueltas y corrección de estilos.", destacado: true },
			{ id: "c3", hora: "12:00", titulo: "Cierre de la actividad", descripcion: "Palabras finales de José Meolans." },
			{ id: "c4", hora: "12:15", titulo: "Fotos y certificados", descripcion: "Entrega de certificados, autógrafos y fotos con los participantes." },
		],
	},
	{
		id: "copa-dia",
		categoria: "copa",
		fecha: "2026-12-05",
		titulo: "Sexta fecha · Copa Challenger",
		lugar: "Natatorio Atlético Echagüe Club",
		actividades: [
			{ id: "p1", hora: "16:00", titulo: "Ablande", descripcion: "Entrada en calor en el natatorio." },
			{ id: "p2", hora: "17:00", titulo: "Inicio de competencia", descripcion: "Pruebas de la sexta fecha.", destacado: true },
			{ id: "p3", hora: "19:30", titulo: "Speediest Race", descripcion: "Final de los 50 metros libre." },
			{ id: "p4", hora: "20:15", titulo: "Premiación", descripcion: "Premiación de la Copa Challenger." },
			{ id: "p5", hora: "20:30", titulo: "Tercer tiempo y cierre", descripcion: "Fiesta de fin de campeonato 2026." },
		],
	},
];
