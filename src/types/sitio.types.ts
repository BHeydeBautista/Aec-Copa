export interface NavLink {
	href: string;
	label: string;
	/** id de la sección para resaltar el link activo al hacer scroll */
	seccionId?: string;
}

export interface LogoInstitucion {
	id: string;
	nombre: string;
	src: string;
	href?: string;
	/** Los principales (club + masters) se muestran grandes en navbar y hero. */
	principal: boolean;
}

export interface SlideHero {
	id: string;
	eyebrow: string;
	/** Cada elemento es una línea del título. */
	titulo: string[];
	lineas: string[];
}

export interface PreguntaFrecuente {
	id: string;
	pregunta: string;
	respuesta: string;
}
