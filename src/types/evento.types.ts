export interface Sede {
	nombre: string;
	ciudad: string;
	direccion?: string;
	mapsUrl?: string;
}

export interface Evento {
	nombre: string;
	edicion: string;
	organizador: string;
	organizadorCorto: string;
	descripcion: string;
	sede: Sede;
	/** Fecha ISO con offset (-03:00). Se usa para la cuenta regresiva del hero. */
	fechaClinica: string;
	/** Fecha ISO con offset (-03:00) del primer día de la Copa. */
	fechaCopa: string;
	contacto: {
		email?: string;
		whatsapp?: string;
		instagram?: string;
	};
}
