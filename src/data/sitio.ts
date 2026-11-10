import type { LogoInstitucion, NavLink, PreguntaFrecuente } from "@/types";

export const navegacion: NavLink[] = [
	{ href: "/#inicio", label: "Inicio", seccionId: "inicio" },
	{ href: "/#cronograma", label: "Cronograma", seccionId: "cronograma" },
	{ href: "/#precios", label: "Precios", seccionId: "precios" },
	{ href: "/#preguntas", label: "Preguntas", seccionId: "preguntas" },
];

/** Club y natación máster como principales; acompañan el Instituto de Ciencias del Deporte y SEM Emergencias. */
export const logos: LogoInstitucion[] = [
	{ id: "aec", nombre: "Atlético Echagüe Club", src: "/logos/aec.png", principal: true },
	{ id: "masters", nombre: "Echagüe Natación Máster", src: "/logos/echague-natacion-master.png", principal: true },
	{ id: "icd", nombre: "Instituto de Ciencias del Deporte", src: "/logos/instituto-ciencias-deporte.png", principal: false },
	{ id: "sem", nombre: "SEM Emergencias", src: "/logos/sem-emergencias.png", principal: false },
];

export const logosPrincipales = logos.filter((l) => l.principal);
export const logosSecundarios = logos.filter((l) => !l.principal);

export const preguntasFrecuentes: PreguntaFrecuente[] = [
	{
		id: "como-pago",
		pregunta: "¿Cómo pago mi entrada?",
		respuesta:
			"Elegí tu entrada, completá tus datos y transferí el total al alias del club. Después subí el comprobante en el último paso del formulario.",
	},
	{
		id: "confirmacion",
		pregunta: "¿Cuándo queda confirmada mi inscripción?",
		respuesta:
			"Cuando la organización revisa el comprobante. Vas a recibir el código de inscripción al enviar el formulario; guardalo para la acreditación.",
	},
	{
		id: "cupo",
		pregunta: "¿Qué pasa si se completa el cupo de Pileta Challenger?",
		respuesta:
			"Pileta Challenger tiene cupo limitado a precio preferencial. Una vez completo, las inscripciones siguientes se cobran al precio de Pileta General.",
	},
	{
		id: "socios",
		pregunta: "¿Cómo acredito que soy socio AEC o nadador Challenger?",
		respuesta:
			"En el formulario te pedimos tu número de socio o el club con el que nadás la Copa. La organización lo verifica al revisar el pago.",
	},
	{
		id: "comprobante",
		pregunta: "¿Qué formato tiene que tener el comprobante?",
		respuesta: "Imagen (JPG, PNG, WEBP) o PDF de hasta 5 MB. Una captura de pantalla de la transferencia sirve.",
	},
];
