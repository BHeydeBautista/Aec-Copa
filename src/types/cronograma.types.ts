export type CategoriaCronograma = "copa" | "clinica";

export interface ActividadCronograma {
	id: string;
	/** "08:30" */
	hora: string;
	titulo: string;
	descripcion?: string;
	destacado?: boolean;
}

export interface JornadaCronograma {
	id: string;
	categoria: CategoriaCronograma;
	/** Fecha ISO sin hora: "2026-12-05" */
	fecha: string;
	titulo: string;
	lugar?: string;
	actividades: ActividadCronograma[];
}

/** Elemento ya aplanado para la línea de tiempo horizontal. */
export type ItemLineaTiempo =
	| {
			tipo: "dia";
			id: string;
			categoria: CategoriaCronograma;
			fecha: string;
			titulo: string;
			lugar?: string;
	  }
	| {
			tipo: "actividad";
			id: string;
			categoria: CategoriaCronograma;
			fecha: string;
			hora: string;
			titulo: string;
			descripcion?: string;
			destacado?: boolean;
			/** Alterna arriba/abajo de la línea central. */
			posicion: "arriba" | "abajo";
	  };

export interface PestanaCronograma {
	id: CategoriaCronograma;
	label: string;
	descripcion: string;
}
